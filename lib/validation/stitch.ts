import { z } from "zod";
import { STITCH_LIMITS } from "../../constants/stitch";

export const emailSchema = z.string().trim().toLowerCase().email().max(STITCH_LIMITS.emailLength);
export const senderNameSchema = z.string().trim().min(1).max(STITCH_LIMITS.senderNameLength);
export const threadColorSchema = z.object({
  code: z.string().min(1).max(24),
  name: z.string().min(1).max(80),
  hex: z.string().regex(/^#[0-9A-F]{6}$/i),
});

const gridSchema = z
  .array(z.number().int().min(-1).max(255))
  .min(1)
  .max(STITCH_LIMITS.maxGridCells);

export const stitchedIndicesSchema = z
  .array(z.number().int().nonnegative())
  .max(STITCH_LIMITS.maxStitches);

export const patternSchema = z
  .object({
    id: z.string().min(1).max(STITCH_LIMITS.patternIdLength),
    name: z.string().min(1).max(STITCH_LIMITS.patternNameLength),
    subtitle: z.string().max(160),
    difficulty: z.enum(["入门", "轻松", "进阶"]),
    size: z.number().int().positive().max(STITCH_LIMITS.uploadGridSize),
    minutes: z
      .number()
      .int()
      .nonnegative()
      .max(24 * 60),
    grid: gridSchema,
    originalGrid: gridSchema.optional(),
    completed: z.boolean().optional(),
    completedStitches: stitchedIndicesSchema.optional(),
    colors: z.array(threadColorSchema).max(STITCH_LIMITS.uploadPaletteSize).optional(),
  })
  .superRefine((pattern, context) => {
    const expectedCells = pattern.size * pattern.size;
    if (pattern.grid.length !== expectedCells) {
      context.addIssue({ code: "custom", path: ["grid"], message: "图纸网格尺寸不匹配" });
    }
    if (pattern.originalGrid && pattern.originalGrid.length !== expectedCells) {
      context.addIssue({ code: "custom", path: ["originalGrid"], message: "原始网格尺寸不匹配" });
    }
    const colorCount = pattern.colors?.length ?? STITCH_LIMITS.defaultThreadCount;
    if (pattern.grid.some((value) => value >= colorCount)) {
      context.addIssue({ code: "custom", path: ["grid"], message: "图纸包含不存在的颜色编号" });
    }
    if (
      pattern.completedStitches?.some((index) => index >= expectedCells || pattern.grid[index] < 0)
    ) {
      context.addIssue({
        code: "custom",
        path: ["completedStitches"],
        message: "完成针脚包含无效位置",
      });
    }
  });

export const savedProjectRowSchema = z.object({
  id: z.string().min(1),
  patternId: z.string().min(1).max(STITCH_LIMITS.patternIdLength),
  patternJson: z.string().min(1).max(STITCH_LIMITS.storedPatternBytes),
  stitchedJson: z.string().min(1),
  updatedAt: z.number().int().nonnegative(),
});

export const progressQuerySchema = z
  .object({
    pattern: z.string().max(STITCH_LIMITS.patternIdLength).optional().default(""),
    all: z.enum(["0", "1"]).optional().default("0"),
  })
  .strict();

export const saveProgressRequestSchema = z
  .object({
    patternId: z.string().min(1).max(STITCH_LIMITS.patternIdLength),
    pattern: patternSchema,
    stitched: stitchedIndicesSchema,
  })
  .strict()
  .superRefine(({ pattern, stitched }, context) => {
    if (stitched.some((index) => index >= pattern.grid.length || pattern.grid[index] < 0)) {
      context.addIssue({ code: "custom", path: ["stitched"], message: "进度包含无效针脚" });
    }
  });

export const progressResponseSchema = z.object({
  progress: savedProjectRowSchema.nullable(),
});

export const progressesResponseSchema = z.object({
  progresses: z.array(savedProjectRowSchema).max(STITCH_LIMITS.maxProjects),
});

export const saveProgressResponseSchema = z.object({ savedAt: z.number().int().nonnegative() });

export const shareQuerySchema = z.object({
  id: z.string().min(1).max(STITCH_LIMITS.shareIdLength),
});

export const createShareRequestSchema = z.object({
  senderName: senderNameSchema,
  recipientEmail: emailSchema,
  pattern: patternSchema,
});

export const shareRowSchema = z.object({
  id: z.string().min(1),
  senderName: z.string().min(1),
  patternJson: z.string().min(1).max(STITCH_LIMITS.storedPatternBytes),
  createdAt: z.number().int().nonnegative(),
});

export const shareResponseSchema = z.object({ share: shareRowSchema.nullable() });
export const createShareResponseSchema = z.object({
  id: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
});

export type ThreadColor = z.infer<typeof threadColorSchema>;
export type Pattern = z.infer<typeof patternSchema>;
export type SavedProjectRow = z.infer<typeof savedProjectRowSchema>;

export function parseJson<T>(value: string, schema: z.ZodType<T>): T | null {
  try {
    const result = schema.safeParse(JSON.parse(value));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
