import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import {
  createCodeDigest,
  createSignupProof,
  generateEmailCode,
  hashEmail,
  normalizeEmail,
  verifySignupProof,
} from "../lib/auth-crypto";
import { registerWithEmailSchema, requestEmailCodeSchema } from "../lib/validation/auth";
import { verifyTurnstile } from "../lib/turnstile";

afterEach(() => vi.restoreAllMocks());

describe("email authentication validation", () => {
  test("normalizes email conservatively and hashes KV identifiers", async () => {
    expect(normalizeEmail(" Maker+Tag@Example.COM ")).toBe("maker+tag@example.com");
    const identifier = await hashEmail("maker@example.com");
    expect(identifier).not.toContain("maker@example.com");
    expect(identifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  test("binds code digests to the email and challenge", async () => {
    const input = {
      pepper: "an-independent-secret-with-enough-entropy",
      email: "maker@example.com",
      challengeId: "11052cce-d085-4cf7-8665-23e43c34f51e",
      code: "012345",
    };
    const digest = await createCodeDigest(input);
    expect(digest).not.toContain(input.code);
    await expect(createCodeDigest({ ...input, email: "other@example.com" })).resolves.not.toBe(
      digest,
    );
    await expect(
      createCodeDigest({ ...input, challengeId: "a89cb2f5-4a90-4383-9233-29545d3929b9" }),
    ).resolves.not.toBe(digest);
  });

  test("accepts only fresh signup proofs for the same email", async () => {
    const secret = "a-better-auth-secret-that-is-at-least-32-bytes";
    const now = 1_800_000_000_000;
    const proof = await createSignupProof(secret, "maker@example.com", now);
    await expect(verifySignupProof(proof, secret, "maker@example.com", now)).resolves.toBe(true);
    await expect(verifySignupProof(proof, secret, "other@example.com", now)).resolves.toBe(false);
    await expect(verifySignupProof(proof, secret, "maker@example.com", now + 31_000)).resolves.toBe(
      false,
    );
  });

  test("generates fixed-width numeric verification codes", () => {
    for (let index = 0; index < 100; index += 1) {
      expect(generateEmailCode()).toMatch(/^\d{6}$/);
    }
  });

  test("rejects weak or malformed registration input", () => {
    expect(requestEmailCodeSchema.safeParse({ email: "maker@example.com" }).success).toBe(true);
    expect(requestEmailCodeSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(
      registerWithEmailSchema.safeParse({
        name: "小林",
        email: "maker@example.com",
        password: "too-short",
        code: "12345x",
        challengeId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  test("requires the expected Turnstile hostname and action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ success: true, action: "email-signup", hostname: "app.example.com" }),
      ),
    );
    const input = {
      token: "turnstile-token",
      secretKey: "turnstile-secret",
      expectedAction: "email-signup",
      expectedHostname: "app.example.com",
    };
    await expect(verifyTurnstile(input)).resolves.toBe(true);
    await expect(verifyTurnstile({ ...input, expectedAction: "email-signup-send" })).resolves.toBe(
      false,
    );
    await expect(verifyTurnstile({ ...input, expectedHostname: "evil.example.com" })).resolves.toBe(
      false,
    );
  });
});
