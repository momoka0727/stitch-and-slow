import { env } from "cloudflare:workers";
import {
  createCodeDigest,
  createSignupProof,
  hashEmail,
  normalizeEmail,
  timingSafeEqual,
} from "../../../../../lib/auth-crypto";
import { getAuth } from "../../../../../lib/auth";
import { clearAuthRateLimit, consumeAuthRateLimit } from "../../../../../lib/auth-rate-limit";
import {
  assertSameOrigin,
  getCanonicalAuthUrl,
  readRuntimeString,
} from "../../../../../lib/auth-runtime";
import { verifyTurnstile } from "../../../../../lib/turnstile";
import { registerWithEmailSchema } from "../../../../../lib/validation/auth";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "请求内容无效" }, { status: 400 });
    }
    const parsed = registerWithEmailSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "请求内容无效" },
        { status: 400 },
      );
    }
    const captchaToken = request.headers.get("x-captcha-response") || "";
    const authUrl = getCanonicalAuthUrl();
    const human = await verifyTurnstile({
      token: captchaToken,
      secretKey: readRuntimeString("TURNSTILE_SECRET_KEY"),
      expectedAction: "email-signup",
      expectedHostname: authUrl.hostname,
      remoteIp: request.headers.get("cf-connecting-ip") || undefined,
    });
    if (!human) return Response.json({ error: "人机验证失败，请重试" }, { status: 400 });

    const email = normalizeEmail(parsed.data.email);
    const emailHash = await hashEmail(email);
    const codeKey = `email-code:challenge:${emailHash}:${parsed.data.challengeId}`;
    const attemptKey = `email-code:attempt:${parsed.data.challengeId}`;
    const storedValue = await env.EMAIL_VERIFICATION_CODES.get(codeKey);
    if (!storedValue) {
      return Response.json({ error: "验证码无效或已过期，请重新获取" }, { status: 400 });
    }
    const attemptAllowed = await consumeAuthRateLimit({
      database: env.DB,
      key: attemptKey,
      windowSeconds: 600,
      max: 5,
    });
    if (!attemptAllowed) {
      await env.EMAIL_VERIFICATION_CODES.delete(codeKey);
      return Response.json({ error: "验证码无效或尝试次数过多，请重新获取" }, { status: 429 });
    }
    const stored = JSON.parse(storedValue) as { digest?: string; purpose?: string };
    const digest = await createCodeDigest({
      pepper: readRuntimeString("EMAIL_CODE_PEPPER"),
      email,
      challengeId: parsed.data.challengeId,
      code: parsed.data.code,
    });
    if (
      stored.purpose !== "signup" ||
      typeof stored.digest !== "string" ||
      !timingSafeEqual(stored.digest, digest)
    ) {
      return Response.json({ error: "验证码不正确" }, { status: 400 });
    }

    const proof = await createSignupProof(readRuntimeString("BETTER_AUTH_SECRET"), email);
    const headers = new Headers(request.headers);
    headers.set("content-type", "application/json");
    headers.set("x-stitch-signup-proof", proof);
    headers.delete("content-length");
    const signUpRequest = new Request(new URL("/api/auth/sign-up/email", authUrl), {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: parsed.data.name,
        email,
        password: parsed.data.password,
      }),
    });
    const response = await getAuth().handler(signUpRequest);
    if (response.ok) {
      const cleanup = await Promise.allSettled([
        env.EMAIL_VERIFICATION_CODES.delete(codeKey),
        clearAuthRateLimit(env.DB, attemptKey),
      ]);
      if (cleanup.some((result) => result.status === "rejected")) {
        console.error("Email signup cleanup was incomplete");
      }
      return response;
    }
    if (response.status === 422 || response.status === 400) {
      return Response.json({ error: "该邮箱无法注册，请尝试登录或更换邮箱" }, { status: 400 });
    }
    return Response.json({ error: "注册暂时无法完成，请稍后再试" }, { status: response.status });
  } catch (error) {
    console.error("Email registration failed", error);
    return Response.json({ error: "注册暂时无法完成，请稍后再试" }, { status: 500 });
  }
}
