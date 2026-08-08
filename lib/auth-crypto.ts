const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashEmail(email: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(normalizeEmail(email)));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function createCodeDigest(input: {
  pepper: string;
  email: string;
  challengeId: string;
  code: string;
}) {
  const value = `${normalizeEmail(input.email)}\0signup\0${input.challengeId}\0${input.code}`;
  return bytesToBase64Url(await hmac(input.pepper, value));
}

export async function createSignupProof(secret: string, email: string, now = Date.now()) {
  const timestamp = Math.floor(now / 1000);
  const payload = `${timestamp}.${normalizeEmail(email)}`;
  return `${timestamp}.${bytesToBase64Url(await hmac(secret, payload))}`;
}

export async function verifySignupProof(
  proof: string | null,
  secret: string,
  email: string,
  now = Date.now(),
) {
  if (!proof) return false;
  const separator = proof.indexOf(".");
  if (separator < 1) return false;
  const timestamp = Number(proof.slice(0, separator));
  if (!Number.isInteger(timestamp) || Math.abs(Math.floor(now / 1000) - timestamp) > 30)
    return false;
  const expected = await createSignupProof(secret, email, timestamp * 1000);
  return timingSafeEqual(proof, expected);
}

export function timingSafeEqual(actual: string, expected: string) {
  const actualBytes = encoder.encode(actual);
  const expectedBytes = encoder.encode(expected);
  if (actualBytes.length !== expectedBytes.length) return false;
  let difference = 0;
  for (let index = 0; index < actualBytes.length; index += 1) {
    difference |= actualBytes[index] ^ expectedBytes[index];
  }
  return difference === 0;
}

export function generateEmailCode() {
  const bytes = new Uint32Array(1);
  const range = 0x1_0000_0000;
  const limit = range - (range % 1_000_000);
  do crypto.getRandomValues(bytes);
  while (bytes[0] >= limit);
  return String(bytes[0] % 1_000_000).padStart(6, "0");
}
