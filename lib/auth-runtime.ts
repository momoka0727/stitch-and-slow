import { env } from "cloudflare:workers";
import type { SmtpConfig } from "./email/smtp";

export function readRuntimeString(name: keyof Cloudflare.Env): string {
  const value = env[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required runtime binding: ${String(name)}`);
  }
  return value.trim();
}

export function getCanonicalAuthUrl() {
  const url = new URL(readRuntimeString("BETTER_AUTH_URL"));
  return url;
}

export function assertSameOrigin(request: Request) {
  const expectedOrigin = getCanonicalAuthUrl().origin;
  const origin = request.headers.get("origin");
  if (origin !== expectedOrigin) {
    return Response.json({ error: "请求来源无效" }, { status: 403 });
  }
  return null;
}

export function getSmtpConfig(): SmtpConfig {
  const port = Number(readRuntimeString("SMTP_PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65_535 || port === 25) {
    throw new Error("SMTP_PORT must be a valid submission port other than 25");
  }
  const tlsMode = readRuntimeString("SMTP_TLS_MODE");
  if (tlsMode !== "starttls" && tlsMode !== "tls") {
    throw new Error("SMTP_TLS_MODE must be either starttls or tls");
  }
  if (port === 465 && tlsMode !== "tls") {
    throw new Error("SMTP_TLS_MODE must be tls when SMTP_PORT is 465");
  }
  if (port === 587 && tlsMode !== "starttls") {
    throw new Error("SMTP_TLS_MODE must be starttls when SMTP_PORT is 587");
  }
  const fromEmail = readRuntimeString("SMTP_FROM");
  if (!/^[^\s@\r\n]+@[^\s@\r\n]+$/.test(fromEmail)) {
    throw new Error("SMTP_FROM must be an email address without a display name");
  }
  const host = readRuntimeString("SMTP_HOST");
  if (!/^[A-Za-z0-9.-]+$/.test(host)) throw new Error("SMTP_HOST must be a hostname");
  return {
    host,
    port,
    tlsMode,
    username: readRuntimeString("SMTP_USERNAME"),
    password: readRuntimeString("SMTP_PASSWORD"),
    fromEmail,
    fromName: "针迹小屋",
    heloHostname: getCanonicalAuthUrl().hostname,
  };
}
