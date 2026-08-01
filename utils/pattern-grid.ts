import { STITCH_CANVAS } from "../constants/stitch";

const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  (x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2 <= 1;

export function makeGrid(kind: string, size = STITCH_CANVAS.defaultPatternSize) {
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
