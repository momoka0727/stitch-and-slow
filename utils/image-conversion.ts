import { IMAGE_CONVERSION, STITCH_LIMITS } from "../constants/stitch";
import type { Pattern, ThreadColor } from "../lib/validation/stitch";
import { boostStitchColor, colorDistance, createAdaptivePalette, toHex, type Rgb } from "./color";

export function convertImageToPattern(source: string, fileName: string): Promise<Pattern> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const gridSize = STITCH_LIMITS.uploadGridSize;
      const sourceScale = Math.min(
        1,
        STITCH_LIMITS.uploadSourceEdge / Math.max(image.width, image.height),
      );
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
      const sourceStep = Math.max(
        1,
        Math.ceil(Math.sqrt((sourceWidth * sourceHeight) / STITCH_LIMITS.uploadSamplePixels)),
      );
      for (let y = 0; y < sourceHeight; y += sourceStep) {
        for (let x = 0; x < sourceWidth; x += sourceStep) {
          const index = y * sourceWidth + x;
          if (sourcePixels[index * 4 + 3] > IMAGE_CONVERSION.alphaThreshold) {
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
      const centers = createAdaptivePalette(samples, STITCH_LIMITS.uploadPaletteSize);
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
            Math.floor(
              Math.max(sourceX1 - sourceX0, sourceY1 - sourceY0) /
                IMAGE_CONVERSION.pixelsPerSampleBlock,
            ),
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
              if (sourcePixels[sourceIndex * 4 + 3] < IMAGE_CONVERSION.transparentPixelThreshold)
                continue;
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
        name: fileName.replace(/\.[^.]+$/, "") || "我的图纸",
        subtitle: `${gridSize} × ${gridSize} 针 · 原图主色优化 ${usedColors} 色`,
        difficulty: "进阶",
        size: gridSize,
        minutes: Math.round(nextGrid.filter((v) => v >= 0).length / 7),
        grid: nextGrid,
        colors: customColors,
      };
      resolve(uploaded);
    };
    image.src = source;
    image.onerror = () => reject(new Error("Image could not be decoded"));
  });
}
