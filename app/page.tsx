"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ThreadColor = {
  code: string;
  name: string;
  hex: string;
};

type Pattern = {
  id: string;
  name: string;
  subtitle: string;
  difficulty: "入门" | "轻松" | "进阶";
  size: number;
  minutes: number;
  grid: number[];
  originalGrid?: number[];
  completed?: boolean;
  completedStitches?: number[];
  colors?: ThreadColor[];
};

type SavedProjectRow = {
  id: string;
  patternId: string;
  patternJson: string;
  stitchedJson: string;
  updatedAt: number;
};

const THREADS: ThreadColor[] = [
  { code: "B5200", name: "雪白", hex: "#F8F5EA" },
  { code: "310", name: "墨黑", hex: "#252322" },
  { code: "3777", name: "陶土红", hex: "#973C35" },
  { code: "351", name: "珊瑚红", hex: "#E96B60" },
  { code: "741", name: "橘黄", hex: "#F2A33A" },
  { code: "726", name: "柠檬黄", hex: "#F3CE4B" },
  { code: "834", name: "橄榄绿", hex: "#7E7B3D" },
  { code: "3347", name: "森林绿", hex: "#516B49" },
  { code: "3813", name: "薄荷绿", hex: "#98C8B1" },
  { code: "3760", name: "湖水蓝", hex: "#3F91A6" },
  { code: "799", name: "牛仔蓝", hex: "#406F9F" },
  { code: "336", name: "深靛蓝", hex: "#263A66" },
  { code: "3834", name: "莓果紫", hex: "#743853" },
  { code: "211", name: "薰衣草", hex: "#C7A5C9" },
  { code: "761", name: "浅粉", hex: "#E9A6A2" },
  { code: "3865", name: "奶油白", hex: "#E9E2CE" },
  { code: "420", name: "榛果棕", hex: "#9A6B3D" },
  { code: "938", name: "深咖", hex: "#4A3428" },
];

const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  (x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2 <= 1;

function makeGrid(kind: string, size = 24) {
  const grid = Array(size * size).fill(-1);
  const put = (x: number, y: number, color: number) => {
    if (x >= 0 && x < size && y >= 0 && y < size) grid[y * size + x] = color;
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / (size - 1);
      const ny = y / (size - 1);
      let c = -1;
      if (kind === "bear") {
        if (ellipse(nx, ny, 0.5, 0.65, 0.27, 0.28)) c = 16;
        if (ellipse(nx, ny, 0.5, 0.4, 0.23, 0.22)) c = 16;
        if (ellipse(nx, ny, 0.34, 0.25, 0.09, 0.1) || ellipse(nx, ny, 0.66, 0.25, 0.09, 0.1))
          c = 17;
        if (ellipse(nx, ny, 0.5, 0.47, 0.12, 0.09)) c = 15;
        if (ellipse(nx, ny, 0.43, 0.38, 0.025, 0.03) || ellipse(nx, ny, 0.57, 0.38, 0.025, 0.03))
          c = 1;
        if (ellipse(nx, ny, 0.5, 0.45, 0.035, 0.03)) c = 17;
        if (ny > 0.72 && ny < 0.78 && nx > 0.31 && nx < 0.69) c = 3;
        if (ellipse(nx, ny, 0.72, 0.64, 0.1, 0.08)) c = 5;
      } else if (kind === "sunrise") {
        if (ny > 0.31 && ny < 0.62 && ellipse(nx, ny, 0.5, 0.58, 0.19, 0.21)) c = 5;
        if (ny > 0.48 && ny < 0.52 && nx > 0.2 && nx < 0.8) c = 4;
        if (ny > 0.53 && ny < 0.78 && Math.abs(nx - 0.3) < (0.78 - ny) * 1.25) c = 11;
        if (ny > 0.48 && ny < 0.8 && Math.abs(nx - 0.66) < (0.82 - ny) * 1.3) c = 10;
        if (ny > 0.7 && ny < 0.82) c = 7;
        if (ny > 0.8 && ny < 0.87) c = 8;
      } else if (kind === "tulip") {
        if (ny > 0.3 && ny < 0.72 && Math.abs(nx - 0.5) < 0.025) c = 7;
        if (ellipse(nx, ny, 0.43, 0.58, 0.14, 0.065) || ellipse(nx, ny, 0.57, 0.7, 0.14, 0.06))
          c = 8;
        if (ellipse(nx, ny, 0.5, 0.3, 0.18, 0.16)) c = 3;
        if (ellipse(nx, ny, 0.4, 0.25, 0.1, 0.13) || ellipse(nx, ny, 0.6, 0.25, 0.1, 0.13)) c = 2;
        if (ny < 0.21 && ellipse(nx, ny, 0.5, 0.28, 0.065, 0.14)) c = 14;
      } else if (kind === "bird") {
        if (ellipse(nx, ny, 0.49, 0.49, 0.24, 0.2)) c = 9;
        if (ellipse(nx, ny, 0.63, 0.33, 0.14, 0.14)) c = 10;
        if (ellipse(nx, ny, 0.48, 0.53, 0.12, 0.1)) c = 11;
        if (ny > 0.63 && ny < 0.67 && nx > 0.32 && nx < 0.72) c = 17;
        if (nx > 0.75 && nx < 0.86 && Math.abs(ny - 0.34) < (0.86 - nx) * 0.45) c = 4;
        if (ellipse(nx, ny, 0.67, 0.31, 0.022, 0.025)) c = 1;
        if (ny > 0.65 && ny < 0.86 && (Math.abs(nx - 0.43) < 0.02 || Math.abs(nx - 0.57) < 0.02))
          c = 16;
      } else if (kind === "cup") {
        if (nx > 0.28 && nx < 0.68 && ny > 0.42 && ny < 0.72) c = 15;
        if (ny > 0.68 && ny < 0.74 && nx > 0.25 && nx < 0.72) c = 9;
        if (ellipse(nx, ny, 0.71, 0.56, 0.13, 0.14) && !ellipse(nx, ny, 0.7, 0.56, 0.07, 0.08))
          c = 9;
        if (ellipse(nx, ny, 0.43, 0.33, 0.11, 0.12)) c = 2;
        if (ellipse(nx, ny, 0.54, 0.35, 0.1, 0.11)) c = 3;
        if (ny > 0.31 && ny < 0.48 && Math.abs(nx - 0.49) < 0.02) c = 7;
        if (ny > 0.19 && ny < 0.33 && (Math.abs(nx - 0.38) < 0.018 || Math.abs(nx - 0.55) < 0.018))
          c = 13;
      } else if (kind === "cabin") {
        if (ellipse(nx, ny, 0.25, 0.25, 0.12, 0.12)) c = 5;
        if (ny > 0.72 && ny < 0.83) c = 11;
        if (nx > 0.31 && nx < 0.71 && ny > 0.45 && ny < 0.73) c = 16;
        if (ny > 0.32 && ny < 0.5 && Math.abs(nx - 0.51) < (0.51 - ny) * 1.4) c = 17;
        if (nx > 0.48 && nx < 0.57 && ny > 0.58 && ny < 0.73) c = 2;
        if (nx > 0.6 && nx < 0.68 && ny > 0.52 && ny < 0.6) c = 5;
        if (
          ny > 0.48 &&
          ny < 0.76 &&
          (ellipse(nx, ny, 0.18, 0.63, 0.07, 0.22) || ellipse(nx, ny, 0.83, 0.6, 0.08, 0.25))
        )
          c = 7;
      } else if (kind === "cat") {
        if (ellipse(nx, ny, 0.5, 0.58, 0.23, 0.28)) c = 4;
        if (ellipse(nx, ny, 0.5, 0.35, 0.21, 0.19)) c = 4;
        if (
          (nx > 0.31 && nx < 0.43 && ny > 0.13 && ny < 0.34) ||
          (nx > 0.57 && nx < 0.69 && ny > 0.13 && ny < 0.34)
        )
          c = 2;
        if (ellipse(nx, ny, 0.43, 0.35, 0.025, 0.03) || ellipse(nx, ny, 0.57, 0.35, 0.025, 0.03))
          c = 7;
        if (ellipse(nx, ny, 0.5, 0.43, 0.03, 0.025)) c = 14;
        if (ny > 0.51 && ny < 0.8 && Math.abs(nx - 0.5) < 0.035) c = 15;
        if (ellipse(nx, ny, 0.69, 0.7, 0.2, 0.08)) c = 2;
      } else if (kind === "lemon") {
        if (Math.abs(ny - (0.72 - nx * 0.55)) < 0.025 && nx > 0.18 && nx < 0.82) c = 7;
        if (ellipse(nx, ny, 0.34, 0.55, 0.14, 0.1) || ellipse(nx, ny, 0.66, 0.35, 0.14, 0.1)) c = 8;
        if (ellipse(nx, ny, 0.47, 0.61, 0.13, 0.16) || ellipse(nx, ny, 0.63, 0.55, 0.12, 0.15))
          c = 5;
        if (ellipse(nx, ny, 0.43, 0.55, 0.07, 0.11) || ellipse(nx, ny, 0.59, 0.5, 0.065, 0.1))
          c = 6;
      } else if (kind === "mushroom") {
        if (nx > 0.43 && nx < 0.58 && ny > 0.47 && ny < 0.78) c = 15;
        if (ellipse(nx, ny, 0.5, 0.43, 0.28, 0.2) && ny > 0.34) c = 2;
        if (
          ellipse(nx, ny, 0.39, 0.4, 0.035, 0.04) ||
          ellipse(nx, ny, 0.53, 0.36, 0.04, 0.045) ||
          ellipse(nx, ny, 0.64, 0.44, 0.035, 0.04)
        )
          c = 0;
        if (ny > 0.76 && ny < 0.82 && nx > 0.25 && nx < 0.75) c = 7;
        if (ellipse(nx, ny, 0.32, 0.71, 0.06, 0.13) || ellipse(nx, ny, 0.7, 0.7, 0.05, 0.15)) c = 8;
      } else if (kind === "whale") {
        if (ellipse(nx, ny, 0.47, 0.53, 0.29, 0.17)) c = 10;
        if (nx > 0.68 && nx < 0.84 && Math.abs(ny - 0.52) < (0.84 - nx) * 0.65) c = 9;
        if (ellipse(nx, ny, 0.39, 0.59, 0.17, 0.08)) c = 0;
        if (ellipse(nx, ny, 0.35, 0.49, 0.022, 0.025)) c = 1;
        if (
          ellipse(nx, ny, 0.64, 0.23, 0.035, 0.04) ||
          ellipse(nx, ny, 0.73, 0.16, 0.025, 0.03) ||
          ellipse(nx, ny, 0.78, 0.29, 0.02, 0.025)
        )
          c = 9;
        if (nx > 0.32 && nx < 0.58 && ny > 0.66 && ny < 0.7) c = 11;
      }
      if (c >= 0) put(x, y, c);
    }
  }
  return grid;
}

const PATTERNS: Pattern[] = [
  {
    id: "bear",
    name: "栗子小熊",
    subtitle: "一杯茶的温柔时间",
    difficulty: "入门",
    size: 24,
    minutes: 35,
    grid: makeGrid("bear"),
  },
  {
    id: "sunrise",
    name: "山野日出",
    subtitle: "把清晨缝进布里",
    difficulty: "轻松",
    size: 24,
    minutes: 42,
    grid: makeGrid("sunrise"),
  },
  {
    id: "tulip",
    name: "粉色郁金香",
    subtitle: "春天的一小束",
    difficulty: "入门",
    size: 24,
    minutes: 28,
    grid: makeGrid("tulip"),
  },
  {
    id: "bird",
    name: "蓝羽小鸟",
    subtitle: "窗边停留的朋友",
    difficulty: "轻松",
    size: 24,
    minutes: 38,
    grid: makeGrid("bird"),
  },
  {
    id: "cup",
    name: "草莓茶杯",
    subtitle: "甜点时间",
    difficulty: "进阶",
    size: 24,
    minutes: 48,
    grid: makeGrid("cup"),
  },
  {
    id: "cabin",
    name: "月夜小屋",
    subtitle: "森林深处有灯光",
    difficulty: "进阶",
    size: 24,
    minutes: 52,
    grid: makeGrid("cabin"),
  },
  {
    id: "cat",
    name: "橘猫伸懒腰",
    subtitle: "慢吞吞的午后",
    difficulty: "轻松",
    size: 24,
    minutes: 40,
    grid: makeGrid("cat"),
  },
  {
    id: "lemon",
    name: "柠檬枝",
    subtitle: "明亮又清新的夏日",
    difficulty: "入门",
    size: 24,
    minutes: 30,
    grid: makeGrid("lemon"),
  },
  {
    id: "mushroom",
    name: "红帽蘑菇",
    subtitle: "雨后森林来信",
    difficulty: "轻松",
    size: 24,
    minutes: 36,
    grid: makeGrid("mushroom"),
  },
  {
    id: "whale",
    name: "深海小鲸",
    subtitle: "带着气泡去旅行",
    difficulty: "进阶",
    size: 24,
    minutes: 45,
    grid: makeGrid("whale"),
  },
];

type Rgb = { r: number; g: number; b: number };

const toHex = ({ r, g, b }: Rgb) =>
  `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

const colorDistance = (a: Rgb, b: Rgb) => (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;

function createAdaptivePalette(samples: Rgb[], limit = 28) {
  const buckets = new Map<number, { r: number; g: number; b: number; count: number }>();
  samples.forEach(({ r, g, b }) => {
    const key = (r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3);
    const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.count += 1;
    buckets.set(key, bucket);
  });
  const points = Array.from(buckets.values()).map((bucket) => ({
    r: bucket.r / bucket.count,
    g: bucket.g / bucket.count,
    b: bucket.b / bucket.count,
    count: bucket.count,
  }));
  points.sort((a, b) => b.count - a.count);
  if (!points.length) return [{ r: 255, g: 255, b: 255 }];
  const population = points.reduce((sum, point) => sum + point.count, 0);
  const filteredPoints = points
    .filter((point) => point.count >= Math.max(2, population * 0.00012))
    .slice(0, 240);
  const meaningfulPoints = filteredPoints.length ? filteredPoints : points.slice(0, 240);

  const target = Math.min(limit, meaningfulPoints.length);
  const centers: Rgb[] = [
    { r: meaningfulPoints[0].r, g: meaningfulPoints[0].g, b: meaningfulPoints[0].b },
  ];
  while (centers.length < target) {
    let best = meaningfulPoints[0];
    let bestScore = -1;
    meaningfulPoints.forEach((point) => {
      const nearest = Math.min(...centers.map((center) => colorDistance(point, center)));
      const score = nearest * Math.sqrt(point.count);
      if (score > bestScore) {
        bestScore = score;
        best = point;
      }
    });
    centers.push({ r: best.r, g: best.g, b: best.b });
  }

  for (let iteration = 0; iteration < 9; iteration += 1) {
    const groups = centers.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    meaningfulPoints.forEach((point) => {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      centers.forEach((center, index) => {
        const distance = colorDistance(point, center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      const group = groups[nearestIndex];
      group.r += point.r * point.count;
      group.g += point.g * point.count;
      group.b += point.b * point.count;
      group.count += point.count;
    });
    groups.forEach((group, index) => {
      if (group.count) {
        centers[index] = {
          r: group.r / group.count,
          g: group.g / group.count,
          b: group.b / group.count,
        };
      }
    });
  }

  return centers.filter(
    (center, index) => centers.findIndex((other) => colorDistance(center, other) < 36) === index,
  );
}

function boostStitchColor(color: Rgb): Rgb {
  const max = Math.max(color.r, color.g, color.b);
  const min = Math.min(color.r, color.g, color.b);
  const luminance = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
  if (luminance < 110 && max - min < 46) {
    const scale = luminance < 70 ? 0.25 : 0.55;
    return { r: color.r * scale, g: color.g * scale, b: color.b * scale };
  }
  const average = (color.r + color.g + color.b) / 3;
  const saturationFactor = max - min < 18 ? 1 : 1.65;
  const saturate = (value: number) => average + (value - average) * saturationFactor;
  const contrast = (value: number) => 128 + (value - 128) * 1.06;
  const lift = luminance < 80 ? 0 : luminance < 155 ? 5 : luminance < 225 ? 10 : 0;
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  return {
    r: clamp(contrast(saturate(color.r)) + lift),
    g: clamp(contrast(saturate(color.g)) + lift),
    b: clamp(contrast(saturate(color.b)) + lift),
  };
}

function CrossCanvas({
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
  const display = compact ? 240 : 660;

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

function AuthModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (email: string) => void;
}) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");
    if (!email.includes("@") || password.length < 6) {
      setError("请输入有效邮箱，密码至少 6 位。");
      return;
    }
    localStorage.setItem("stitch-user", email);
    onSuccess(email);
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label="账号登录"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <div className="mini-hoop">
          <span>×</span>
        </div>
        <p className="eyebrow">WELCOME TO</p>
        <h2>针迹小屋</h2>
        <p className="modal-copy">保存你的图纸、配线清单与每一针进度。</p>
        <div className="auth-tabs">
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            注册
          </button>
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            登录
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            邮箱
            <input name="email" type="email" placeholder="you@example.com" autoFocus />
          </label>
          <label>
            密码
            <input name="password" type="password" placeholder="至少 6 位" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary wide" type="submit">
            {mode === "register" ? "创建账号并开始" : "登录并继续"} <span>→</span>
          </button>
        </form>
        <p className="privacy-note">不会上传密码；作品进度会与此邮箱关联并安全保存。</p>
      </section>
    </div>
  );
}

function ShareModal({
  patternName,
  phase,
  onClose,
  onSend,
}: {
  patternName: string;
  phase: "form" | "sending" | "sent";
  onClose: () => void;
  onSend: (senderName: string, recipientEmail: string) => void;
}) {
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const senderName = String(data.get("senderName") || "").trim();
    const recipientEmail = String(data.get("recipientEmail") || "").trim();
    if (!senderName || !recipientEmail.includes("@")) {
      setError("请填写你的姓名和朋友的有效邮箱。");
      return;
    }
    onSend(senderName, recipientEmail);
  };

  return (
    <div
      className="modal-backdrop share-backdrop"
      role="presentation"
      onMouseDown={phase === "form" ? onClose : undefined}
    >
      <section
        className="share-modal"
        role="dialog"
        aria-modal="true"
        aria-label="分享完成作品"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {phase === "form" ? (
          <>
            <button className="modal-close" onClick={onClose} aria-label="关闭">
              ×
            </button>
            <p className="eyebrow">SEND A STITCHED LETTER</p>
            <h2>把作品寄给朋友</h2>
            <p>发送后会打开你的邮件应用，并自动填好收件人、标题与作品链接。</p>
            <form onSubmit={submit}>
              <label>
                朋友的邮箱
                <input
                  type="email"
                  name="recipientEmail"
                  placeholder="friend@example.com"
                  autoFocus
                />
              </label>
              <label>
                你的姓名
                <input
                  type="text"
                  name="senderName"
                  placeholder="邮件会显示“来自你的姓名的邮件”"
                  maxLength={60}
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="primary wide" type="submit">
                放进信封并发送 <span>→</span>
              </button>
            </form>
          </>
        ) : (
          <div className={`envelope-scene ${phase}`}>
            <p className="eyebrow">
              {phase === "sending" ? "PACKING YOUR STITCHES" : "READY TO SEND"}
            </p>
            <h2>{phase === "sending" ? "正在把作品放进信封…" : "信封已经准备好"}</h2>
            <div className="letter-stack">
              <div className="stitched-letter">
                <span>× × ×</span>
                <b>{patternName}</b>
              </div>
              <div className="envelope">
                <i />
                <b>✦</b>
              </div>
            </div>
            {phase === "sent" && (
              <button className="secondary" onClick={onClose}>
                完成
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"upload" | "gallery" | "studio" | "projects">(
    "projects",
  );
  const [view, setView] = useState<"home" | "gallery" | "upload" | "studio" | "projects">("home");
  const [pattern, setPattern] = useState<Pattern>(PATTERNS[0]);
  const [selectedColor, setSelectedColor] = useState(16);
  const [stitched, setStitched] = useState<Set<number>>(() => new Set());
  const [animatedIndex, setAnimatedIndex] = useState<number | null>(null);
  const [animationNonce, setAnimationNonce] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(
    "idle",
  );
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [projects, setProjects] = useState<SavedProjectRow[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePhase, setSharePhase] = useState<"form" | "sending" | "sent">("form");
  const [highlightFlash, setHighlightFlash] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sharedFrom, setSharedFrom] = useState("");
  const [toast, setToast] = useState("");
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("stitch-user");
    if (saved) setUser(saved);
    const shareId = new URLSearchParams(window.location.search).get("share");
    if (shareId) {
      void fetch(`/api/share?id=${encodeURIComponent(shareId)}`)
        .then(
          async (response) =>
            (await response.json()) as {
              share?: { senderName: string; patternJson: string } | null;
            },
        )
        .then((data) => {
          if (!data.share) return;
          const sharedPattern = JSON.parse(data.share.patternJson) as Pattern;
          setPattern(sharedPattern);
          setSelectedColor(
            Array.from(new Set(sharedPattern.grid.filter((value) => value >= 0)))[0] || 0,
          );
          const sharedStitches =
            sharedPattern.completedStitches?.filter(
              (index) => Number.isInteger(index) && index >= 0 && index < sharedPattern.grid.length,
            ) ||
            sharedPattern.grid
              .map((value, index) => (value >= 0 ? index : -1))
              .filter((index) => index >= 0);
          setStitched(new Set(sharedStitches));
          setSharedFrom(data.share.senderName);
          setSaveStatus("saved");
          setView("studio");
        })
        .catch(() => setToast("这个分享链接暂时无法打开"));
    }
  }, []);

  const patternCells = useMemo(
    () => pattern.grid.map((v, i) => (v >= 0 ? i : -1)).filter((v) => v >= 0),
    [pattern],
  );
  const progress = patternCells.length
    ? Math.round((stitched.size / patternCells.length) * 100)
    : 0;
  const palette = useMemo(() => {
    const used = Array.from(new Set(pattern.grid.filter((v) => v >= 0)));
    return pattern.colors ? used.sort((a, b) => a - b) : used;
  }, [pattern]);
  const activeThreads = pattern.colors || THREADS;
  const filteredPatterns = PATTERNS.filter((item) =>
    `${item.name}${item.subtitle}`.includes(search),
  );

  const applySavedProgress = (
    row: { patternJson: string; stitchedJson: string; updatedAt: number } | null,
    fallback?: Pattern,
  ) => {
    if (!row) {
      if (fallback) {
        setPattern(fallback);
        setSelectedColor(Array.from(new Set(fallback.grid.filter((v) => v >= 0)))[0] || 0);
      }
      setStitched(new Set());
      setSaveStatus("idle");
      setLastSavedAt(null);
      return false;
    }
    try {
      const savedPattern = JSON.parse(row.patternJson) as Pattern;
      const builtInOriginal = PATTERNS.find((item) => item.id === savedPattern.id)?.grid;
      // Keep the exact saved grid so user-selected replacement colors survive reopening.
      const restoredPattern = {
        ...savedPattern,
        completed: Boolean(savedPattern.completed),
        originalGrid:
          savedPattern.originalGrid?.length === savedPattern.grid.length
            ? [...savedPattern.originalGrid]
            : builtInOriginal?.length === savedPattern.grid.length
              ? [...builtInOriginal]
              : [...savedPattern.grid],
      };
      const restoredStitches = (JSON.parse(row.stitchedJson) as number[]).filter(
        (index) => Number.isInteger(index) && index >= 0 && index < restoredPattern.grid.length,
      );
      setPattern(restoredPattern);
      setSelectedColor(Array.from(new Set(restoredPattern.grid.filter((v) => v >= 0)))[0] || 0);
      setStitched(new Set(restoredStitches));
      setSaveStatus("saved");
      setLastSavedAt(row.updatedAt);
      return true;
    } catch {
      return false;
    }
  };

  const loadSavedProgress = async (next: Pattern) => {
    if (!user) return;
    try {
      const params = new URLSearchParams({ user, pattern: next.id });
      const response = await fetch(`/api/progress?${params}`);
      if (!response.ok) return;
      const data = (await response.json()) as {
        progress: { patternJson: string; stitchedJson: string; updatedAt: number } | null;
      };
      applySavedProgress(data.progress, next);
    } catch {
      // The selected pattern remains usable even if cloud progress is unavailable.
    }
  };

  const resumeLatest = async (email = user) => {
    setView("studio");
    if (!email) return;
    try {
      const params = new URLSearchParams({ user: email });
      const response = await fetch(`/api/progress?${params}`);
      if (!response.ok) return;
      const data = (await response.json()) as {
        progress: { patternJson: string; stitchedJson: string; updatedAt: number } | null;
      };
      if (applySavedProgress(data.progress)) showToast("已载入上次保存的进度");
    } catch {
      // Start with the current pattern if no saved project can be loaded.
    }
  };

  const loadProjects = async (email = user) => {
    if (!email) return;
    setProjectsLoading(true);
    try {
      const params = new URLSearchParams({ user: email, all: "1" });
      const response = await fetch(`/api/progress?${params}`);
      if (!response.ok) throw new Error("load failed");
      const data = (await response.json()) as { progresses: SavedProjectRow[] };
      setProjects(data.progresses);
    } catch {
      showToast("作品库暂时无法载入");
    } finally {
      setProjectsLoading(false);
    }
  };

  const openSavedProject = (row: SavedProjectRow) => {
    if (applySavedProgress(row)) {
      setSharedFrom("");
      setView("studio");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const requireUser = (action: "upload" | "gallery" | "studio" | "projects") => {
    if (user) {
      if (action === "studio") void resumeLatest();
      else if (action === "projects") {
        setView("projects");
        void loadProjects();
      } else setView(action);
    } else {
      setPendingAction(action);
      setAuthOpen(true);
    }
  };

  const openPattern = (next: Pattern) => {
    const preparedPattern = {
      ...next,
      grid: [...next.grid],
      originalGrid:
        next.originalGrid?.length === next.grid.length ? [...next.originalGrid] : [...next.grid],
      completed: false,
      completedStitches: undefined,
    };
    setPattern(preparedPattern);
    setSelectedColor(Array.from(new Set(next.grid.filter((v) => v >= 0)))[0] || 0);
    setStitched(new Set());
    setSaveStatus("idle");
    setLastSavedAt(null);
    setSharedFrom("");
    setPreviewing(false);
    setView("studio");
    void loadSavedProgress(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const stitchCell = (index: number) => {
    if (sharedFrom || !activeThreads[selectedColor]) return;
    if (stitched.has(index)) {
      setPattern((current) => {
        const original = current.originalGrid?.[index];
        if (original === undefined || current.grid[index] === original) {
          return { ...current, completed: false, completedStitches: undefined };
        }
        const grid = [...current.grid];
        grid[index] = original;
        return { ...current, grid, completed: false, completedStitches: undefined };
      });
      setStitched((current) => {
        const next = new Set(current);
        next.delete(index);
        return next;
      });
      setAnimatedIndex(null);
      setSaveStatus("dirty");
      return;
    }
    setPattern((current) => {
      const originalGrid =
        current.originalGrid?.length === current.grid.length
          ? current.originalGrid
          : [...current.grid];
      if (current.grid[index] === selectedColor && current.originalGrid) {
        return { ...current, completed: false, completedStitches: undefined };
      }
      const grid = [...current.grid];
      grid[index] = selectedColor;
      return { ...current, grid, originalGrid, completed: false, completedStitches: undefined };
    });
    setStitched((current) => new Set(current).add(index));
    setSaveStatus("dirty");
    setAnimatedIndex(index);
    setAnimationNonce((current) => current + 1);
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    animationTimerRef.current = setTimeout(() => setAnimatedIndex(null), 680);
  };

  const selectThread = (colorIndex: number) => {
    setSelectedColor(colorIndex);
    setHighlightFlash(false);
    window.requestAnimationFrame(() => setHighlightFlash(true));
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightFlash(false), 1250);
  };

  const previewFinishedPattern = () => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    setAnimatedIndex(null);
    setPreviewing(true);
    previewTimerRef.current = setTimeout(() => setPreviewing(false), 3000);
  };

  const undo = () => {
    const values = Array.from(stitched);
    if (!values.length) return;
    const index = values.pop();
    if (index !== undefined) {
      setPattern((current) => {
        const original = current.originalGrid?.[index];
        if (original === undefined || current.grid[index] === original) {
          return { ...current, completed: false, completedStitches: undefined };
        }
        const grid = [...current.grid];
        grid[index] = original;
        return { ...current, grid, completed: false, completedStitches: undefined };
      });
    }
    setStitched(new Set(values));
    setSaveStatus("dirty");
  };

  const resetProgress = () => {
    setPattern((current) =>
      current.originalGrid?.length === current.grid.length
        ? {
            ...current,
            grid: [...current.originalGrid],
            completed: false,
            completedStitches: undefined,
          }
        : { ...current, completed: false, completedStitches: undefined },
    );
    setStitched(new Set());
    setSaveStatus("dirty");
    setAnimatedIndex(null);
  };

  const persistProgress = async (
    silent = false,
    patternToSave = pattern,
    stitchesToSave = stitched,
    successMessage = "当前进度已保存",
  ) => {
    if (!user || saveStatus === "saving" || sharedFrom) return false;
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userEmail: user,
          patternId: patternToSave.id,
          pattern: patternToSave,
          stitched: Array.from(stitchesToSave),
        }),
      });
      if (!response.ok) throw new Error("save failed");
      const result = (await response.json()) as { savedAt: number };
      setLastSavedAt(result.savedAt);
      setSaveStatus("saved");
      if (!silent) showToast(successMessage);
      return true;
    } catch {
      setSaveStatus("error");
      if (!silent) showToast("保存失败，请稍后再试");
      return false;
    }
  };

  const saveProgress = () => void persistProgress(false);

  const finishPattern = () => {
    const completedPattern = {
      ...pattern,
      originalGrid: [...pattern.grid],
      completed: true,
      completedStitches: Array.from(stitched),
    };
    setPattern(completedPattern);
    void persistProgress(false, completedPattern, stitched, "作品已完成，图纸标记已保存");
  };

  useEffect(() => {
    if (saveStatus !== "dirty" || !user || view !== "studio" || sharedFrom) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => void persistProgress(true), 1300);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [saveStatus, stitched, pattern, user, view, sharedFrom]);

  const renamePattern = (name: string) => {
    setPattern((current) => ({ ...current, name: name.slice(0, 80) }));
    setSaveStatus("dirty");
  };

  const downloadFinished = (background: "transparent" | "white") => {
    if (!pattern.completed && !sharedFrom) {
      showToast("请先将作品标记为完成");
      return;
    }
    const cell = 18;
    const canvas = document.createElement("canvas");
    canvas.width = pattern.size * cell;
    canvas.height = pattern.size * cell;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (background === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const shade = (hex: string) => {
      const rgb = hex.match(/\w\w/g)?.map((part) => parseInt(part, 16)) || [60, 60, 60];
      return `rgb(${rgb.map((value) => Math.max(0, value - 46)).join(",")})`;
    };
    pattern.grid.forEach((colorIndex, index) => {
      if (colorIndex < 0 || !stitched.has(index)) return;
      const x = (index % pattern.size) * cell;
      const y = Math.floor(index / pattern.size) * cell;
      const color = activeThreads[colorIndex]?.hex || "#333333";
      const lines = [
        [x + 4, y + 4, x + 14, y + 14],
        [x + 14, y + 4, x + 4, y + 14],
      ];
      lines.forEach(([x1, y1, x2, y2]) => {
        ctx.save();
        ctx.lineCap = "round";
        ctx.shadowColor = "rgba(30,20,12,.38)";
        ctx.shadowBlur = 2.2;
        ctx.shadowOffsetY = 1.5;
        ctx.strokeStyle = shade(color);
        ctx.lineWidth = 6.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = color;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.38)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1 + 0.7, y1 - 0.7);
        ctx.lineTo(x2 + 0.7, y2 - 0.7);
        ctx.stroke();
        ctx.restore();
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
      showToast(`已保存${background === "white" ? "白底" : "透明底"}成品图`);
    }, "image/png");
  };

  const openShare = () => {
    if (!pattern.completed && !sharedFrom) {
      showToast("请先将作品标记为完成");
      return;
    }
    setSharePhase("form");
    setShareOpen(true);
  };

  const sendShare = async (senderName: string, recipientEmail: string) => {
    setSharePhase("sending");
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ senderName, recipientEmail, pattern }),
      });
      if (!response.ok) throw new Error("share failed");
      const result = (await response.json()) as { id: string };
      const shareUrl = `${window.location.origin}/?share=${encodeURIComponent(result.id)}`;
      const subject = `来自${senderName}的邮件`;
      const body = `${senderName}送给你一幅已经完成的十字绣《${pattern.name}》。\n\n打开作品：${shareUrl}`;
      window.setTimeout(() => {
        setSharePhase("sent");
        window.location.href = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }, 1500);
    } catch {
      setSharePhase("form");
      showToast("分享链接创建失败，请稍后再试");
    }
  };

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("请选择 JPG、PNG 或 WEBP 图片");
      return;
    }
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const convertUpload = () => {
    if (!uploadPreview) {
      fileRef.current?.click();
      return;
    }
    const image = new Image();
    image.onload = () => {
      const gridSize = 80;
      const sourceScale = Math.min(1, 512 / Math.max(image.width, image.height));
      const sourceWidth = Math.max(1, Math.round(image.width * sourceScale));
      const sourceHeight = Math.max(1, Math.round(image.height * sourceScale));
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = sourceWidth;
      sourceCanvas.height = sourceHeight;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return;
      sourceContext.imageSmoothingEnabled = true;
      sourceContext.imageSmoothingQuality = "high";
      sourceContext.drawImage(image, 0, 0, sourceWidth, sourceHeight);
      const sourcePixels = sourceContext.getImageData(0, 0, sourceWidth, sourceHeight).data;

      const samples: Rgb[] = [];
      const sourceStep = Math.max(1, Math.ceil(Math.sqrt((sourceWidth * sourceHeight) / 120000)));
      for (let y = 0; y < sourceHeight; y += sourceStep) {
        for (let x = 0; x < sourceWidth; x += sourceStep) {
          const index = y * sourceWidth + x;
          if (sourcePixels[index * 4 + 3] > 80) {
            samples.push(
              boostStitchColor({
                r: sourcePixels[index * 4],
                g: sourcePixels[index * 4 + 1],
                b: sourcePixels[index * 4 + 2],
              }),
            );
          }
        }
      }
      const centers = createAdaptivePalette(samples, 28);
      const nearestCenter = (color: Rgb) => {
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        centers.forEach((center, centerIndex) => {
          const distance = colorDistance(color, center);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = centerIndex;
          }
        });
        return nearestIndex;
      };
      const luminance = (color: Rgb) => color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
      const saturation = (color: Rgb) =>
        (Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b)) / 255;

      const gridScale = Math.min(gridSize / image.width, gridSize / image.height);
      const width = image.width * gridScale;
      const height = image.height * gridScale;
      const offsetX = (gridSize - width) / 2;
      const offsetY = (gridSize - height) / 2;
      const gridChoice = new Int16Array(gridSize * gridSize);
      gridChoice.fill(-1);

      for (let gridY = 0; gridY < gridSize; gridY += 1) {
        for (let gridX = 0; gridX < gridSize; gridX += 1) {
          if (
            gridX + 1 <= offsetX ||
            gridX >= offsetX + width ||
            gridY + 1 <= offsetY ||
            gridY >= offsetY + height
          )
            continue;

          const sourceX0 = Math.max(0, Math.floor(((gridX - offsetX) / width) * sourceWidth));
          const sourceX1 = Math.min(
            sourceWidth,
            Math.max(sourceX0 + 1, Math.ceil(((gridX + 1 - offsetX) / width) * sourceWidth)),
          );
          const sourceY0 = Math.max(0, Math.floor(((gridY - offsetY) / height) * sourceHeight));
          const sourceY1 = Math.min(
            sourceHeight,
            Math.max(sourceY0 + 1, Math.ceil(((gridY + 1 - offsetY) / height) * sourceHeight)),
          );
          const sampleStep = Math.max(
            1,
            Math.floor(Math.max(sourceX1 - sourceX0, sourceY1 - sourceY0) / 8),
          );
          const counts = new Float32Array(centers.length);
          let total = 0;
          const sourceCenterX = (sourceX0 + sourceX1 - 1) / 2;
          const sourceCenterY = (sourceY0 + sourceY1 - 1) / 2;
          const halfWidth = Math.max(1, (sourceX1 - sourceX0) / 2);
          const halfHeight = Math.max(1, (sourceY1 - sourceY0) / 2);

          for (let sourceY = sourceY0; sourceY < sourceY1; sourceY += sampleStep) {
            for (let sourceX = sourceX0; sourceX < sourceX1; sourceX += sampleStep) {
              const sourceIndex = sourceY * sourceWidth + sourceX;
              if (sourcePixels[sourceIndex * 4 + 3] < 48) continue;
              const centerIndex = nearestCenter(
                boostStitchColor({
                  r: sourcePixels[sourceIndex * 4],
                  g: sourcePixels[sourceIndex * 4 + 1],
                  b: sourcePixels[sourceIndex * 4 + 2],
                }),
              );
              const distanceX = Math.abs(sourceX - sourceCenterX) / halfWidth;
              const distanceY = Math.abs(sourceY - sourceCenterY) / halfHeight;
              const weight =
                distanceX < 0.3 && distanceY < 0.3
                  ? 4
                  : distanceX < 0.58 && distanceY < 0.58
                    ? 2
                    : 1;
              counts[centerIndex] += weight;
              total += weight;
            }
          }
          if (!total) continue;

          let chosen = 0;
          counts.forEach((count, index) => {
            if (count > counts[chosen]) chosen = index;
          });
          const dominantLuminance = luminance(centers[chosen]);
          const centerPixelX = Math.max(0, Math.min(sourceWidth - 1, Math.round(sourceCenterX)));
          const centerPixelY = Math.max(0, Math.min(sourceHeight - 1, Math.round(sourceCenterY)));
          const centerPixelIndex = centerPixelY * sourceWidth + centerPixelX;
          const centerChoice = nearestCenter(
            boostStitchColor({
              r: sourcePixels[centerPixelIndex * 4],
              g: sourcePixels[centerPixelIndex * 4 + 1],
              b: sourcePixels[centerPixelIndex * 4 + 2],
            }),
          );
          const centerTone = luminance(centers[centerChoice]);
          const centerChroma = saturation(centers[centerChoice]);
          const centerShare = counts[centerChoice] / total;
          const protectedWhiteHighlight =
            centerTone > 236 &&
            centerShare >= 0.1 &&
            centers.some((color, index) => counts[index] / total >= 0.12 && luminance(color) < 100);

          // Protect a bright center surrounded by dark ink, such as an eye highlight
          // or the white stripe on a shoe.
          if (protectedWhiteHighlight) {
            chosen = centerChoice;
          } else if (centerTone < 105 && centerShare >= 0.055) {
            // A dark line crossing the center of the stitch belongs to this cell.
            chosen = centerChoice;
          }

          // Keep dark outlines, but only when they occupy a meaningful part of the
          // weighted cell. This avoids swallowing nearby white details.
          let darkestCandidate = -1;
          let darkestScore = -1;
          counts.forEach((count, index) => {
            const share = count / total;
            const tone = luminance(centers[index]);
            if (
              !protectedWhiteHighlight &&
              share >= 0.18 &&
              tone < 92 &&
              dominantLuminance - tone > 42
            ) {
              const score = share * 2 + (92 - tone) / 120;
              if (score > darkestScore) {
                darkestScore = score;
                darkestCandidate = index;
              }
            }
          });
          if (darkestCandidate >= 0) {
            chosen = darkestCandidate;
          } else if (centerShare >= 0.08 && centerTone < 229 && dominantLuminance > 220) {
            // Preserve fine neutral or colored marks on white clothing.
            chosen = centerChoice;
          } else if (centerShare >= 0.07 && centerTone < 224 && centerChroma > 0.15) {
            // Centered colored details should not be averaged into their fill.
            chosen = centerChoice;
          } else if (dominantLuminance > 205) {
            // Preserve small saturated details such as a pink mouth on a white face.
            let accentCandidate = -1;
            let accentScore = -1;
            counts.forEach((count, index) => {
              const share = count / total;
              const tone = luminance(centers[index]);
              const chroma = saturation(centers[index]);
              if (share >= 0.13 && tone < 215 && chroma > 0.14) {
                const score = share * 2 + chroma * 0.7 + (210 - tone) / 420;
                if (score > accentScore) {
                  accentScore = score;
                  accentCandidate = index;
                }
              }
            });
            if (accentCandidate >= 0) chosen = accentCandidate;
          }
          gridChoice[gridY * gridSize + gridX] = chosen;
        }
      }

      const customColors: ThreadColor[] = centers.map((center, index) => {
        const hex = toHex(center);
        return {
          code: `IMG${String(index + 1).padStart(2, "0")}`,
          name: `原图色 ${hex}`,
          hex,
        };
      });
      const nextGrid = Array.from(gridChoice);
      const usedColors = new Set(nextGrid.filter((value) => value >= 0)).size;
      const uploaded: Pattern = {
        id: `upload-${Date.now()}`,
        name: uploadFileName.replace(/\.[^.]+$/, "") || "我的图纸",
        subtitle: `${gridSize} × ${gridSize} 针 · 原图主色优化 ${usedColors} 色`,
        difficulty: "进阶",
        size: gridSize,
        minutes: Math.round(nextGrid.filter((v) => v >= 0).length / 7),
        grid: nextGrid,
        colors: customColors,
      };
      openPattern(uploaded);
    };
    image.src = uploadPreview;
  };

  const signOut = () => {
    localStorage.removeItem("stitch-user");
    setUser("");
    setView("home");
  };

  return (
    <main>
      <header className="site-header">
        <button className="brand" onClick={() => setView("home")} aria-label="回到首页">
          <span className="brand-mark">
            <i>×</i>
            <i>×</i>
            <i>×</i>
            <i>×</i>
          </span>
          <span>
            <b>针迹小屋</b>
            <small>STITCH &amp; SLOW</small>
          </span>
        </button>
        <nav aria-label="主导航">
          <button
            className={view === "gallery" ? "active" : ""}
            onClick={() => requireUser("gallery")}
          >
            图纸库
          </button>
          <button
            className={view === "upload" ? "active" : ""}
            onClick={() => requireUser("upload")}
          >
            图片转图纸
          </button>
          <button
            className={view === "projects" || view === "studio" ? "active" : ""}
            onClick={() => requireUser("projects")}
          >
            我的绣框
          </button>
        </nav>
        {user ? (
          <div className="user-menu">
            <span>{user.slice(0, 1).toUpperCase()}</span>
            <button onClick={signOut}>退出</button>
          </div>
        ) : (
          <button className="header-login" onClick={() => setAuthOpen(true)}>
            登录 / 注册
          </button>
        )}
      </header>

      {view === "home" && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">DIGITAL CROSS STITCH STUDIO</p>
              <h1>
                把喜欢的画面，
                <br />
                一针一针<span>留下来。</span>
              </h1>
              <p className="hero-lead">
                上传一张照片，自动变成高清十字绣图纸。图片转换会直接提取原图颜色、保留轮廓内的白色；现成图纸则继续提供准确的
                DMC 线号。
              </p>
              <div className="hero-actions">
                <button className="primary" onClick={() => requireUser("upload")}>
                  上传图片制作 <span>→</span>
                </button>
                <button className="secondary" onClick={() => requireUser("gallery")}>
                  浏览现成图纸
                </button>
              </div>
              <div className="trust-row">
                <span>
                  <b>10</b> 款原创图纸
                </span>
                <i />
                <span>
                  <b>主色</b> 智能提取
                </span>
                <i />
                <span>
                  <b>0</b> 基础也能开始
                </span>
              </div>
            </div>
            <div className="hero-art">
              <div className="thread-thread" />
              <div className="hoop">
                <CrossCanvas pattern={PATTERNS[0]} compact />
              </div>
              <div className="floating-note note-one">
                <span>●</span>
                <b>DMC 420</b>
                <small>榛果棕 · 84 针</small>
              </div>
              <div className="floating-note note-two">
                <b>已匹配线色</b>
                <span>✓</span>
              </div>
              <span className="loose-x x-one">×</span>
              <span className="loose-x x-two">×</span>
              <span className="loose-x x-three">×</span>
            </div>
          </section>

          <section className="how">
            <div className="section-heading">
              <p className="eyebrow">HOW IT WORKS</p>
              <h2>三步，开始你的第一幅作品</h2>
            </div>
            <div className="steps">
              <article>
                <span>01</span>
                <i>↑</i>
                <h3>选择一张图片</h3>
                <p>上传自己的照片，或从原创图纸库里挑一张。</p>
              </article>
              <article>
                <span>02</span>
                <i>▦</i>
                <h3>生成图纸与配线</h3>
                <p>用高清网格提取原图颜色，并智能识别背景与内部白色。</p>
              </article>
              <article>
                <span>03</span>
                <i>×</i>
                <h3>按自己的方式落针</h3>
                <p>选择喜欢的线色逐格完成，也可以随时改色和撤销。</p>
              </article>
            </div>
          </section>

          <section className="collection-tease">
            <div className="section-heading left">
              <p className="eyebrow">CURATED PATTERNS</p>
              <h2>从一幅小图开始</h2>
              <p>参考传统动物、花卉与自然主题图纸，重新绘制成适合屏幕练习的原创小作品。</p>
            </div>
            <div className="tease-grid">
              {PATTERNS.slice(1, 5).map((item) => (
                <button key={item.id} onClick={() => requireUser("gallery")}>
                  <CrossCanvas pattern={item} compact />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {view === "gallery" && (
        <section className="page-shell gallery-page">
          <div className="gallery-title">
            <div>
              <p className="eyebrow">PATTERN LIBRARY</p>
              <h1>挑一幅，慢慢绣</h1>
              <p>10 款原创像素图纸，每幅都配好对应的 DMC 线号与用线量。</p>
            </div>
            <label className="search">
              ⌕
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索图纸名称"
              />
            </label>
          </div>
          <div className="filter-row">
            <button className="active">全部 10</button>
            <button>动物</button>
            <button>花与植物</button>
            <button>自然风景</button>
            <button>生活小物</button>
          </div>
          <div className="pattern-grid">
            {filteredPatterns.map((item, index) => {
              const colors = Array.from(new Set(item.grid.filter((v) => v >= 0)));
              return (
                <article className="pattern-card" key={item.id}>
                  <button className="pattern-image" onClick={() => openPattern(item)}>
                    <CrossCanvas pattern={item} compact />
                    <span className={`difficulty d-${item.difficulty}`}>{item.difficulty}</span>
                  </button>
                  <div className="pattern-info">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.subtitle}</p>
                    </div>
                    <button className="round-arrow" onClick={() => openPattern(item)}>
                      →
                    </button>
                  </div>
                  <div className="pattern-meta">
                    <span>
                      {item.size} × {item.size} 针
                    </span>
                    <span>约 {item.minutes} 分钟</span>
                    <span className="mini-swatches">
                      {colors.slice(0, 5).map((c) => (
                        <i key={c} style={{ background: THREADS[c].hex }} />
                      ))}
                      <b>{colors.length} 色</b>
                    </span>
                  </div>
                  {index === 0 && <span className="staff-pick">小屋推荐</span>}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {view === "upload" && (
        <section className="page-shell upload-page">
          <div className="upload-heading">
            <p className="eyebrow">PHOTO TO PATTERN</p>
            <h1>让照片变成针脚</h1>
            <p>图片只在你的浏览器中处理，不会上传到服务器。</p>
          </div>
          <div className="upload-workbench">
            <div
              className={`drop-zone ${uploadPreview ? "has-image" : ""}`}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={chooseFile}
              />
              {uploadPreview ? (
                <img src={uploadPreview} alt="待转换图片预览" />
              ) : (
                <>
                  <span className="upload-icon">↑</span>
                  <h2>把图片拖到这里</h2>
                  <p>或点击选择 JPG、PNG、WEBP</p>
                  <small>建议使用主体清晰、颜色对比明显的图片</small>
                </>
              )}
              {uploadPreview && <span className="replace-image">更换图片</span>}
            </div>
            <aside className="conversion-settings">
              <div className="fidelity-card">
                <p className="eyebrow">FULL IMAGE CONVERSION</p>
                <h2>完整转换，直接开始</h2>
                <p>
                  系统会用 80 × 80
                  高清网格完整转换图片，不自动删除白色区域。转换完成后会直接进入图纸，可以马上开始绣。
                </p>
              </div>
              <div className="conversion-feature">
                <span>▦</span>
                <p>
                  <b>原图自适应配色</b>
                  <small>直接从图片提取主色、阴影和轮廓色。</small>
                </p>
              </div>
              <div className="conversion-feature">
                <span>○</span>
                <p>
                  <b>保留所有浅色</b>
                  <small>白色、米白和浅色背景都会转换为对应针脚。</small>
                </p>
              </div>
              <div className="conversion-feature">
                <span>→</span>
                <p>
                  <b>无需校对</b>
                  <small>生成后直接进入图纸，不增加额外编辑步骤。</small>
                </p>
              </div>
              <button className="primary wide" onClick={convertUpload}>
                {uploadPreview ? "生成十字绣图纸" : "先选择一张图片"} <span>→</span>
              </button>
            </aside>
          </div>
          <div className="upload-tips">
            <span>✦</span>
            <p>
              <b>小提示</b>{" "}
              图片会完整转换，包括白色背景。上传前可以先裁剪图片，只保留真正想绣的范围。
            </p>
          </div>
        </section>
      )}

      {view === "projects" && (
        <section className="page-shell projects-page">
          <div className="projects-heading">
            <div>
              <p className="eyebrow">MY STITCHING SHELF</p>
              <h1>我的绣框</h1>
              <p>开始落下第一针后，作品会自动保存在这里。</p>
            </div>
            <div>
              <button className="secondary" onClick={() => setView("gallery")}>
                挑选新图纸
              </button>
              <button className="primary" onClick={() => setView("upload")}>
                上传图片 <span>→</span>
              </button>
            </div>
          </div>
          {projectsLoading ? (
            <div className="projects-empty">
              <span>⌛</span>
              <h2>正在整理你的作品…</h2>
            </div>
          ) : projects.length ? (
            <div className="projects-grid">
              {projects.map((row) => {
                try {
                  const savedPattern = JSON.parse(row.patternJson) as Pattern;
                  const savedStitches = JSON.parse(row.stitchedJson) as number[];
                  const total = savedPattern.grid.filter((value) => value >= 0).length;
                  const percent = total ? Math.round((savedStitches.length / total) * 100) : 0;
                  const isComplete = Boolean(savedPattern.completed);
                  return (
                    <article className="project-card" key={row.id}>
                      <button className="project-preview" onClick={() => openSavedProject(row)}>
                        <CrossCanvas pattern={savedPattern} compact />
                        <span className={isComplete ? "complete" : ""}>
                          {isComplete ? "已完成" : `${percent}%`}
                        </span>
                      </button>
                      <div className="project-card-copy">
                        <h2>{savedPattern.name}</h2>
                        <p>
                          {savedPattern.size} × {savedPattern.size} 针 ·{" "}
                          {
                            Array.from(new Set(savedPattern.grid.filter((value) => value >= 0)))
                              .length
                          }{" "}
                          色
                        </p>
                        <div className="project-progress">
                          <i style={{ width: `${percent}%` }} />
                        </div>
                        <small>
                          上次保存 {new Date(row.updatedAt).toLocaleDateString("zh-CN")}
                        </small>
                        <button onClick={() => openSavedProject(row)}>
                          {isComplete ? "查看成品" : "继续绣"} →
                        </button>
                      </div>
                    </article>
                  );
                } catch {
                  return null;
                }
              })}
            </div>
          ) : (
            <div className="projects-empty">
              <span>×</span>
              <h2>这里还没有作品</h2>
              <p>从图纸库选择一幅，或上传自己的图片，落下第一针后就会自动保存。</p>
              <button className="primary" onClick={() => setView("gallery")}>
                开始第一幅作品 <span>→</span>
              </button>
            </div>
          )}
        </section>
      )}

      {view === "studio" && (
        <section className="studio-page">
          <div className="studio-topbar">
            <button
              className="back-link"
              onClick={() => (user ? requireUser("projects") : setView("home"))}
            >
              ← 返回我的绣框
            </button>
            <div className="title-editor">
              <label>
                <input
                  value={pattern.name}
                  onChange={(event) => renamePattern(event.target.value)}
                  disabled={Boolean(sharedFrom)}
                  aria-label="作品名称"
                />
                {!sharedFrom && <i>✎</i>}
              </label>
              <span>
                {sharedFrom
                  ? `来自 ${sharedFrom} 的完成作品`
                  : `${pattern.completed ? "已完成" : "进行中"} · 点击名称即可修改`}{" "}
                · {pattern.size} × {pattern.size} 针 · {palette.length} 色
              </span>
            </div>
            <div className="studio-actions">
              {!sharedFrom && (
                <span className={`save-state state-${saveStatus}`}>
                  {saveStatus === "saving" && "正在保存…"}
                  {saveStatus === "dirty" && "有未保存的进度"}
                  {saveStatus === "saved" &&
                    `已保存${lastSavedAt ? ` · ${new Date(lastSavedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}` : ""}`}
                  {saveStatus === "error" && "保存失败"}
                </span>
              )}
              {!sharedFrom && <button onClick={undo}>↶ 撤销</button>}
              {!sharedFrom && <button onClick={resetProgress}>重置</button>}
              {!sharedFrom && (
                <button
                  className="finish-pattern"
                  onClick={finishPattern}
                  disabled={saveStatus === "saving" || pattern.completed}
                >
                  ✓ {pattern.completed ? "已完成" : "完成"}
                </button>
              )}
              {(pattern.completed || sharedFrom) && (
                <button onClick={() => downloadFinished("transparent")}>保存透明图</button>
              )}
              {(pattern.completed || sharedFrom) && (
                <button onClick={() => downloadFinished("white")}>保存白底图</button>
              )}
              {(pattern.completed || sharedFrom) && (
                <button className="share-button" onClick={openShare}>
                  ✉ 分享
                </button>
              )}
              <button className="preview-button" onClick={previewFinishedPattern}>
                ◉ {previewing ? "预览中…" : "预览成品"}
              </button>
              {!sharedFrom && (
                <button
                  className="save-progress"
                  onClick={saveProgress}
                  disabled={saveStatus === "saving"}
                >
                  ▣ 保存进度
                </button>
              )}
            </div>
          </div>
          <div className="studio-layout">
            <aside className="tool-rail">
              <button className="active" title="单针模式">
                ⌁<span>单针</span>
              </button>
              <button title="放大图纸">
                ＋<span>放大</span>
              </button>
            </aside>
            <div className="canvas-stage">
              <div className="canvas-paper">
                <CrossCanvas
                  pattern={pattern}
                  stitched={previewing ? undefined : stitched}
                  selectedColor={selectedColor}
                  animatedIndex={animatedIndex}
                  animationNonce={animationNonce}
                  highlightFlash={highlightFlash}
                  onStitch={previewing ? undefined : stitchCell}
                />
                {previewing && (
                  <div className="preview-notice">
                    <span>◉</span>
                    <b>完整成品预览</b>
                    <small>3 秒后自动返回当前进度</small>
                  </div>
                )}
              </div>
              <div className="progress-card">
                <div>
                  <span>今日针迹</span>
                  <b>
                    {stitched.size} / {patternCells.length}
                  </b>
                </div>
                <div className="progress-track">
                  <i style={{ width: `${progress}%` }} />
                </div>
                <strong>{progress}%</strong>
              </div>
            </div>
            <aside className="thread-panel">
              <div className="thread-heading">
                <div>
                  <p className="eyebrow">THREAD BOARD</p>
                  <h2>配线板</h2>
                </div>
                <span>{palette.length} 色</span>
              </div>
              <p className="thread-guide">
                先在配线板选择颜色，再点击任意格子落针；无需遵循原图纸编号。拆针或撤销后会恢复该格原来的图纸标记。
              </p>
              <div className="match-tip" aria-label="自由配色提示">
                <span>
                  当前线色{" "}
                  <b>{pattern.colors ? selectedColor + 1 : palette.indexOf(selectedColor) + 1}</b>
                </span>
                <i>→</i>
                <span>
                  任意格子 <b>✓</b>
                </span>
              </div>
              <div className="thread-list">
                {palette.map((colorIndex, paletteIndex) => {
                  const total = pattern.grid.filter((c) => c === colorIndex).length;
                  const done = pattern.grid.filter(
                    (c, index) => c === colorIndex && stitched.has(index),
                  ).length;
                  const displayNumber = pattern.colors ? colorIndex + 1 : paletteIndex + 1;
                  return (
                    <button
                      key={colorIndex}
                      className={selectedColor === colorIndex ? "selected" : ""}
                      onClick={() => selectThread(colorIndex)}
                    >
                      <span
                        className="floss-bundle"
                        style={{ "--floss": activeThreads[colorIndex].hex } as React.CSSProperties}
                      >
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <em>{displayNumber}</em>
                        <strong />
                      </span>
                      <span className="thread-copy">
                        <b>
                          {pattern.colors
                            ? `图色 ${displayNumber}`
                            : `DMC ${activeThreads[colorIndex].code}`}
                        </b>
                        <small>
                          图纸编号 {displayNumber} · {activeThreads[colorIndex].name}
                        </small>
                      </span>
                      <span className="remaining">
                        {done === total ? "完成" : `余 ${total - done}`}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="shopping-note">
                <span>✓</span>
                <p>
                  <b>{pattern.colors ? "原图配色已提取" : "配线已核对"}</b>
                  <small>
                    {pattern.colors
                      ? "本图不受 DMC 色库限制，请按屏幕色卡挑选最接近的线。"
                      : "以上线号与图纸一一对应，购买时按 DMC 编号选择即可。"}
                  </small>
                </p>
              </div>
            </aside>
          </div>
        </section>
      )}

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark">
            <i>×</i>
            <i>×</i>
            <i>×</i>
            <i>×</i>
          </span>
          <span>
            <b>针迹小屋</b>
            <small>STITCH &amp; SLOW</small>
          </span>
        </div>
        <p>把快生活，绣得慢一点。</p>
        <span>高清图片转换 · 原创练习图纸</span>
      </footer>

      {shareOpen && (
        <ShareModal
          patternName={pattern.name}
          phase={sharePhase}
          onClose={() => setShareOpen(false)}
          onSend={sendShare}
        />
      )}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={(email) => {
            setUser(email);
            setAuthOpen(false);
            if (pendingAction === "studio") void resumeLatest(email);
            else if (pendingAction === "projects") {
              setView("projects");
              void loadProjects(email);
            } else setView(pendingAction);
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
