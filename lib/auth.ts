import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { captcha } from "better-auth/plugins";
import { getDb } from "../db";
import * as schema from "../db/schema";
import { verifySignupProof } from "./auth-crypto";

const SESSION_SECONDS = 60 * 60 * 24 * 30;

type AuthInstance = ReturnType<typeof createAuth>;

let cachedAuth: AuthInstance | undefined;
let cachedKey = "";

function readBinding(name: string): string {
  const value = (env as unknown as Record<string, unknown>)[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required authentication binding: ${name}`);
  }
  const normalized = value.trim();
  if (name === "BETTER_AUTH_SECRET" && normalized.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
  }
  return normalized;
}

function createAuth(
  baseURL: string,
  secret: string,
  clientId: string,
  clientSecret: string,
  turnstileSecretKey: string,
) {
  const authURL = new URL(baseURL);
  const origin = authURL.origin;
  if (origin !== baseURL.replace(/\/$/, "")) {
    throw new Error("BETTER_AUTH_URL must be an origin without a path");
  }
  const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(authURL.hostname);
  if (authURL.protocol !== "https:" && !(authURL.protocol === "http:" && isLocalhost)) {
    throw new Error("BETTER_AUTH_URL must use HTTPS outside local development");
  }

  return betterAuth({
    appName: "针迹小屋",
    baseURL: origin,
    secret,
    trustedOrigins: [origin],
    database: drizzleAdapter(getDb(), {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    socialProviders: {
      google: {
        clientId,
        clientSecret,
      },
    },
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        disableImplicitLinking: false,
        requireLocalEmailVerified: true,
        trustedProviders: ["google"],
        allowDifferentEmails: false,
      },
    },
    session: {
      expiresIn: SESSION_SECONDS,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 30,
    },
    hooks: {
      before: createAuthMiddleware(async (context) => {
        if (context.path !== "/sign-up/email") return;
        const email = typeof context.body?.email === "string" ? context.body.email : "";
        const proof =
          context.request?.headers.get("x-stitch-signup-proof") ??
          context.headers?.get("x-stitch-signup-proof") ??
          null;
        if (!(await verifySignupProof(proof, secret, email))) {
          throw new APIError("FORBIDDEN", { message: "请先完成邮箱验证" });
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user, context) => {
            const proof =
              context?.request?.headers.get("x-stitch-signup-proof") ??
              context?.headers?.get("x-stitch-signup-proof") ??
              null;
            if (await verifySignupProof(proof, secret, user.email)) {
              return { data: { ...user, emailVerified: true } };
            }
          },
        },
      },
    },
    plugins: [
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: turnstileSecretKey,
        endpoints: ["/sign-in/email"],
        expectedAction: "email-login",
        allowedHostnames: [authURL.hostname],
      }),
    ],
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
      cookiePrefix: "stitch-and-slow",
      useSecureCookies: origin.startsWith("https://"),
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: origin.startsWith("https://"),
        path: "/",
      },
    },
  });
}

export function getAuth() {
  const baseURL = readBinding("BETTER_AUTH_URL");
  const secret = readBinding("BETTER_AUTH_SECRET");
  const clientId = readBinding("GOOGLE_CLIENT_ID");
  const clientSecret = readBinding("GOOGLE_CLIENT_SECRET");
  const turnstileSecretKey = readBinding("TURNSTILE_SECRET_KEY");
  const key = `${baseURL}\0${secret}\0${clientId}\0${clientSecret}\0${turnstileSecretKey}`;

  if (!cachedAuth || cachedKey !== key) {
    cachedAuth = createAuth(baseURL, secret, clientId, clientSecret, turnstileSecretKey);
    cachedKey = key;
  }
  return cachedAuth;
}

export async function getAuthenticatedUser(request: Request) {
  const authSession = await getAuth().api.getSession({ headers: request.headers });
  return authSession?.user ?? null;
}

export function unauthorized() {
  return Response.json({ error: "请先登录" }, { status: 401 });
}
