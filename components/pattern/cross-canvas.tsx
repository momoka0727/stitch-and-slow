import { useEffect, useRef } from "react";
import { STITCH_CANVAS } from "../../constants/stitch";
import { THREADS } from "../../constants/threads";
import type { Pattern } from "../../lib/validation/stitch";

export function CrossCanvas({
  pattern,
  compact = false,
  stitched,
  selectedColor,
  animatedIndex,
  animationNonce,
  highlightFlash = false,
  onStitch,
}: {
  pattern: Pattern;
  compact?: boolean;
  stitched?: Set<number>;
  selectedColor?: number;
  animatedIndex?: number | null;
  animationNonce?: number;
  highlightFlash?: boolean;
  onStitch?: (index: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const display = compact ? STITCH_CANVAS.compactSize : STITCH_CANVAS.studioSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = display * ratio;
    canvas.height = display * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cell = display / pattern.size;
    const threadSet = pattern.colors || THREADS;
    const chartPalette = Array.from(new Set(pattern.grid.filter((value) => value >= 0)));

    const shade = (hex: string, amount: number) => {
      const parts = hex.match(/\w\w/g)?.map((part) => parseInt(part, 16)) || [80, 80, 80];
      return `rgb(${parts.map((part) => Math.max(0, Math.min(255, part + amount))).join(",")})`;
    };

    const drawThread = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      hex: string,
      fraction = 1,
    ) => {
      const endX = x1 + (x2 - x1) * fraction;
      const endY = y1 + (y2 - y1) * fraction;
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(45, 27, 15, .28)";
      ctx.shadowBlur = Math.max(1.2, cell * 0.11);
      ctx.shadowOffsetX = cell * 0.045;
      ctx.shadowOffsetY = cell * 0.075;
      ctx.strokeStyle = shade(hex, -28);
      ctx.lineWidth = Math.max(2.7, cell * 0.34);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.shadowColor = "transparent";
      const body = ctx.createLinearGradient(x1, y1, endX, endY);
      body.addColorStop(0, shade(hex, -8));
      body.addColorStop(0.38, shade(hex, 8));
      body.addColorStop(0.62, hex);
      body.addColorStop(1, shade(hex, -12));
      ctx.strokeStyle = body;
      ctx.lineWidth = Math.max(2.2, cell * 0.27);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.12)";
      ctx.lineWidth = Math.max(0.7, cell * 0.055);
      ctx.beginPath();
      ctx.moveTo(x1 + cell * 0.025, y1 - cell * 0.025);
      ctx.lineTo(endX + cell * 0.025, endY - cell * 0.025);
      ctx.stroke();
      ctx.restore();
      return { x: endX, y: endY };
    };

    const drawNeedle = (x: number, y: number, angle: number, hex: string) => {
      const length = cell * 1.12;
      const tailX = x + Math.cos(angle) * length;
      const tailY = y + Math.sin(angle) * length;
      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(36, 38, 36, .4)";
      ctx.shadowBlur = cell * 0.12;
      ctx.shadowOffsetY = cell * 0.08;
      const metal = ctx.createLinearGradient(x, y, tailX, tailY);
      metal.addColorStop(0, "#5e6869");
      metal.addColorStop(0.35, "#ffffff");
      metal.addColorStop(0.62, "#aeb8b8");
      metal.addColorStop(1, "#f9ffff");
      ctx.strokeStyle = metal;
      ctx.lineWidth = Math.max(2, cell * 0.18);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#5d6667";
      ctx.lineWidth = Math.max(1, cell * 0.055);
      ctx.beginPath();
      ctx.ellipse(tailX, tailY, cell * 0.11, cell * 0.055, angle, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = shade(hex, -18);
      ctx.lineWidth = Math.max(1.5, cell * 0.12);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.quadraticCurveTo(
        tailX + cell * 0.7,
        tailY + cell * 0.25,
        tailX + cell * 0.9,
        tailY + cell * 0.78,
      );
      ctx.stroke();
      ctx.restore();
    };

    const drawFrame = (animationProgress: number) => {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, display, display);
      ctx.fillStyle = compact ? "#F7F1E6" : "#FBF8F0";
      ctx.fillRect(0, 0, display, display);
      if (!compact) {
        ctx.strokeStyle = "rgba(88,73,53,.12)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= pattern.size; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * cell, 0);
          ctx.lineTo(i * cell, display);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * cell);
          ctx.lineTo(display, i * cell);
          ctx.stroke();
        }
      }
      pattern.grid.forEach((colorIndex, index) => {
        if (colorIndex < 0) return;
        const x = (index % pattern.size) * cell;
        const y = Math.floor(index / pattern.size) * cell;
        const isDone = compact || !stitched || stitched.has(index);
        const color = threadSet[colorIndex];
        if (!isDone) {
          if (!compact) {
            const chartNumber = pattern.colors
              ? colorIndex + 1
              : chartPalette.indexOf(colorIndex) + 1;
            const isCurrentColor = selectedColor === colorIndex;
            if (isCurrentColor) {
              ctx.fillStyle = `${color.hex}${highlightFlash ? "52" : "1F"}`;
              ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
              ctx.strokeStyle = highlightFlash ? "#B9533F" : `${color.hex}66`;
              ctx.lineWidth = highlightFlash ? 2.1 : 1.2;
              ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
            }
            ctx.fillStyle = isCurrentColor ? shade(color.hex, -28) : "rgba(78, 83, 77, .26)";
            const chartLabel = String(chartNumber);
            const labelScale = chartLabel.length > 1 ? 0.48 : 0.58;
            const labelSize = Math.max(5.2, Math.min(12, cell * labelScale));
            ctx.font = `${isCurrentColor ? 700 : 600} ${labelSize}px ui-monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(chartLabel, x + cell / 2, y + cell / 2, cell * 0.84);
          }
          return;
        }
        const pad = cell * 0.22;
        const a = { x: x + pad, y: y + pad };
        const b = { x: x + cell - pad, y: y + cell - pad };
        const c = { x: x + cell - pad, y: y + pad };
        const d = { x: x + pad, y: y + cell - pad };
        const isAnimating = !compact && index === animatedIndex && animationProgress < 1;
        if (!isAnimating) {
          drawThread(a.x, a.y, b.x, b.y, color.hex);
          drawThread(c.x, c.y, d.x, d.y, color.hex);
          return;
        }
        if (animationProgress <= 0.48) {
          const fraction = Math.min(1, animationProgress / 0.48);
          const endpoint = drawThread(a.x, a.y, b.x, b.y, color.hex, fraction);
          drawNeedle(endpoint.x, endpoint.y, -0.72, color.hex);
        } else {
          drawThread(a.x, a.y, b.x, b.y, color.hex);
          const fraction = Math.min(1, (animationProgress - 0.48) / 0.52);
          const endpoint = drawThread(c.x, c.y, d.x, d.y, color.hex, fraction);
          drawNeedle(endpoint.x, endpoint.y, -0.72, color.hex);
        }
      });
      if (!compact && selectedColor !== undefined) {
        ctx.strokeStyle = threadSet[selectedColor]?.hex || "#416453";
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, display - 3, display - 3);
      }
    };

    if (compact || animatedIndex == null) {
      drawFrame(1);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 1 : 640;
    const animate = (time: number) => {
      const raw = Math.min(1, (time - start) / duration);
      const eased = 1 - (1 - raw) ** 3;
      drawFrame(eased);
      if (raw < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [
    pattern,
    compact,
    stitched,
    selectedColor,
    animatedIndex,
    animationNonce,
    highlightFlash,
    display,
  ]);

  const handlePointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onStitch) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * pattern.size);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * pattern.size);
    if (x < 0 || y < 0 || x >= pattern.size || y >= pattern.size) return;
    onStitch(y * pattern.size + x);
  };

  return (
    <canvas
      ref={canvasRef}
      className={compact ? "preview-canvas" : "stitch-canvas"}
      style={{ aspectRatio: "1 / 1" }}
      onPointerDown={handlePointer}
      aria-label={`${pattern.name}十字绣图纸`}
    />
  );
}
