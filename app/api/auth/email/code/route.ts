import { env } from "cloudflare:workers";
import {
  createCodeDigest,
  generateEmailCode,
  hashEmail,
  normalizeEmail,
} from "../../../../../lib/auth-crypto";
import {
  assertSameOrigin,
  getCanonicalAuthUrl,
  getSmtpConfig,
  readRuntimeString,
} from "../../../../../lib/auth-runtime";
import { consumeAuthRateLimit } from "../../../../../lib/auth-rate-limit";
import { sendSmtpMail } from "../../../../../lib/email/smtp";
import { verifyTurnstile } from "../../../../../lib/turnstile";
import { requestEmailCodeSchema } from "../../../../../lib/validation/auth";

const CODE_TTL_SECONDS = 600;
const COOLDOWN_SECONDS = 60;

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
    const parsed = requestEmailCodeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "请求内容无效" },
        { status: 400 },
      );
    }
    const captchaToken = request.headers.get("x-captcha-response") || "";
    const authUrl = getCanonicalAuthUrl();
    const remoteIp = request.headers.get("cf-connecting-ip") || undefined;
    const human = await verifyTurnstile({
      token: captchaToken,
      secretKey: readRuntimeString("TURNSTILE_SECRET_KEY"),
      expectedAction: "email-signup-send",
      expectedHostname: authUrl.hostname,
      remoteIp,
    });
    if (!human) return Response.json({ error: "人机验证失败，请重试" }, { status: 400 });

    const email = normalizeEmail(parsed.data.email);
    const emailHash = await hashEmail(email);
    const cooldownKeys = [`email-code:send:email:${emailHash}`];
    if (remoteIp) cooldownKeys.push(`email-code:send:ip:${await hashEmail(remoteIp)}`);
    const allowed = await Promise.all(
      cooldownKeys.map((key) =>
        consumeAuthRateLimit({
          database: env.DB,
          key,
          windowSeconds: COOLDOWN_SECONDS,
          max: 1,
        }),
      ),
    );
    if (allowed.some((value) => !value)) {
      return Response.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const challengeId = crypto.randomUUID();
    const code = generateEmailCode();
    const digest = await createCodeDigest({
      pepper: readRuntimeString("EMAIL_CODE_PEPPER"),
      email,
      challengeId,
      code,
    });
    const codeKey = `email-code:challenge:${emailHash}:${challengeId}`;
    await env.EMAIL_VERIFICATION_CODES.put(
      codeKey,
      JSON.stringify({ digest, createdAt: Date.now(), purpose: "signup" }),
      { expirationTtl: CODE_TTL_SECONDS },
    );

    try {
      await sendSmtpMail(getSmtpConfig(), {
        to: email,
        subject: "针迹小屋注册验证码",
        text: `你的注册验证码是：${code}\n\n验证码将在 10 分钟后失效。若非本人操作，请忽略此邮件。`,
        html: `<p>你的针迹小屋注册验证码是：</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>验证码将在 10 分钟后失效。若非本人操作，请忽略此邮件。</p>`,
      });
    } catch (error) {
      await env.EMAIL_VERIFICATION_CODES.delete(codeKey);
      throw error;
    }

    return Response.json({ success: true, challengeId, expiresIn: CODE_TTL_SECONDS });
  } catch (error) {
    console.error("Email verification code request failed", error);
    return Response.json({ error: "验证码暂时无法发送，请稍后再试" }, { status: 503 });
  }
}
