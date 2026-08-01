import { describe, expect, test } from "vite-plus/test";
import { PATTERNS } from "../constants/patterns";
import {
  createShareRequestSchema,
  parseJson,
  patternSchema,
  progressQuerySchema,
  saveProgressRequestSchema,
} from "../lib/validation/stitch";

describe("stitch validation contracts", () => {
  test("accepts every bundled pattern", () => {
    for (const pattern of PATTERNS) {
      expect(patternSchema.safeParse(pattern).success).toBe(true);
    }
  });

  test("rejects mismatched grids and out-of-range thread colors", () => {
    const pattern = PATTERNS[0];
    expect(patternSchema.safeParse({ ...pattern, grid: pattern.grid.slice(1) }).success).toBe(
      false,
    );

    const invalidGrid = [...pattern.grid];
    invalidGrid[0] = 99;
    expect(patternSchema.safeParse({ ...pattern, grid: invalidGrid }).success).toBe(false);
  });

  test("rejects stitches outside active pattern cells", () => {
    const pattern = PATTERNS[0];
    const backgroundIndex = pattern.grid.findIndex((value) => value < 0);
    const result = saveProgressRequestSchema.safeParse({
      userEmail: "stitcher@example.com",
      patternId: pattern.id,
      pattern,
      stitched: [backgroundIndex],
    });
    expect(result.success).toBe(false);
  });

  test("normalizes valid query emails and rejects malformed addresses", () => {
    const valid = progressQuerySchema.parse({ user: "  MAKER@Example.com " });
    expect(valid.user).toBe("maker@example.com");
    expect(progressQuerySchema.safeParse({ user: "not-an-email" }).success).toBe(false);
  });

  test("validates share payloads and untrusted stored JSON", () => {
    expect(
      createShareRequestSchema.safeParse({
        senderName: "小林",
        recipientEmail: "friend@example.com",
        pattern: PATTERNS[0],
      }).success,
    ).toBe(true);
    expect(parseJson("{broken", patternSchema)).toBeNull();
  });
});
