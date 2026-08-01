import type { ComponentType } from "react";
import type { Pattern } from "../../lib/validation/stitch";

export type WorkspaceView = "home" | "gallery" | "upload" | "studio" | "projects";
export type WorkspaceAction = Exclude<WorkspaceView, "home">;
export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export type PatternCanvasComponent = ComponentType<{
  pattern: Pattern;
  compact?: boolean;
  stitched?: Set<number>;
  selectedColor?: number;
  animatedIndex?: number | null;
  animationNonce?: number;
  highlightFlash?: boolean;
  onStitch?: (index: number) => void;
}>;
