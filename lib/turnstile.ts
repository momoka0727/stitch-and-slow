type TurnstileResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
};

export async function verifyTurnstile(input: {
  token: string;
  secretKey: string;
  expectedAction: string;
  expectedHostname: string;
  remoteIp?: string;
}) {
  if (!input.token || input.token.length > 2048) return false;
  const body = new FormData();
  body.set("secret", input.secretKey);
  body.set("response", input.token);
  body.set("idempotency_key", crypto.randomUUID());
  if (input.remoteIp) body.set("remoteip", input.remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return false;
  const result = (await response.json()) as TurnstileResponse;
  return (
    result.success === true &&
    result.action === input.expectedAction &&
    result.hostname === input.expectedHostname
  );
}
