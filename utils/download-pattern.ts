import { STITCH_CANVAS, STITCH_EXPORT } from "../constants/stitch";
import type { Pattern, ThreadColor } from "../lib/validation/stitch";

export type ExportBackground = "transparent" | "white";

export function downloadPatternImage(
  pattern: Pattern,
  stitched: Set<number>,
  threads: ThreadColor[],
  background: ExportBackground,
  onComplete: () => void,
) {
  const cell = STITCH_CANVAS.exportCellSize;
  const canvas = document.createElement("canvas");
  canvas.width = pattern.size * cell;
  canvas.height = pattern.size * cell;
  const context = canvas.getContext("2d");
  if (!context) return;

  if (background === "white") {
    context.fillStyle = STITCH_EXPORT.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  const shade = (hex: string) => {
    const rgb = hex.match(/\w\w/g)?.map((part) => parseInt(part, 16)) ?? [60, 60, 60];
    return `rgb(${rgb.map((value) => Math.max(0, value - STITCH_EXPORT.threadShadeOffset)).join(",")})`;
  };

  pattern.grid.forEach((colorIndex, index) => {
    if (colorIndex < 0 || !stitched.has(index)) return;
    const x = (index % pattern.size) * cell;
    const y = Math.floor(index / pattern.size) * cell;
    const color = threads[colorIndex]?.hex ?? STITCH_EXPORT.fallbackThreadColor;
    const { cellInset, cellFarInset } = STITCH_EXPORT;
    const lines = [
      [x + cellInset, y + cellInset, x + cellFarInset, y + cellFarInset],
      [x + cellFarInset, y + cellInset, x + cellInset, y + cellFarInset],
    ];
    lines.forEach(([x1, y1, x2, y2]) => {
      context.save();
      context.lineCap = "round";
      context.shadowColor = STITCH_EXPORT.shadowColor;
      context.shadowBlur = STITCH_EXPORT.shadowBlur;
      context.shadowOffsetY = STITCH_EXPORT.shadowOffsetY;
      context.strokeStyle = shade(color);
      context.lineWidth = STITCH_EXPORT.shadowLineWidth;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
      context.shadowColor = "transparent";
      context.strokeStyle = color;
      context.lineWidth = STITCH_EXPORT.threadLineWidth;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
      context.strokeStyle = STITCH_EXPORT.highlightColor;
      context.lineWidth = STITCH_EXPORT.highlightLineWidth;
      context.beginPath();
      context.moveTo(x1 + STITCH_EXPORT.highlightOffset, y1 - STITCH_EXPORT.highlightOffset);
      context.lineTo(x2 + STITCH_EXPORT.highlightOffset, y2 - STITCH_EXPORT.highlightOffset);
      context.stroke();
      context.restore();
    });
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pattern.name || "十字绣"}-${background === "white" ? "白底" : "透明底"}.png`;
    link.click();
    URL.revokeObjectURL(url);
    onComplete();
  }, "image/png");
}
