import { STITCH_LIMITS } from "../constants/stitch";

export type Rgb = { r: number; g: number; b: number };

export const toHex = ({ r, g, b }: Rgb) =>
  `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

export const colorDistance = (a: Rgb, b: Rgb) =>
  (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;

export function createAdaptivePalette(samples: Rgb[], limit = STITCH_LIMITS.uploadPaletteSize) {
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

export function boostStitchColor(color: Rgb): Rgb {
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
