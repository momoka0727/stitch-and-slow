export const STITCH_LIMITS = {
  emailLength: 320,
  patternIdLength: 120,
  patternNameLength: 80,
  senderNameLength: 60,
  shareIdLength: 80,
  storedPatternBytes: 500_000,
  maxGridCells: 80 * 80,
  maxStitches: 80 * 80,
  maxProjects: 50,
  uploadPaletteSize: 28,
  defaultThreadCount: 18,
  uploadGridSize: 80,
  uploadSourceEdge: 512,
  uploadSamplePixels: 120_000,
} as const;

export const STITCH_TIMINGS = {
  toastMs: 1_800,
  stitchAnimationMs: 680,
  threadHighlightMs: 1_250,
  previewMs: 3_000,
  autoSaveMs: 1_300,
  shareMailDelayMs: 1_500,
} as const;

export const STITCH_CANVAS = {
  compactSize: 240,
  studioSize: 660,
  exportCellSize: 18,
  emptyCell: -1,
  defaultPatternSize: 24,
} as const;

export const STITCH_EXPORT = {
  backgroundColor: "#ffffff",
  fallbackThreadColor: "#333333",
  shadowColor: "rgba(30,20,12,.38)",
  highlightColor: "rgba(255,255,255,.38)",
  threadShadeOffset: 46,
  cellInset: 4,
  cellFarInset: 14,
  shadowBlur: 2.2,
  shadowOffsetY: 1.5,
  shadowLineWidth: 6.2,
  threadLineWidth: 4.5,
  highlightLineWidth: 1,
  highlightOffset: 0.7,
} as const;

export const IMAGE_CONVERSION = {
  alphaThreshold: 80,
  transparentPixelThreshold: 48,
  pixelsPerSampleBlock: 8,
  backgroundReachabilityThreshold: 0.43,
  dominantShareThreshold: 0.78,
  lowSaturationThreshold: 0.09,
} as const;

export const API_PATHS = {
  progress: "/api/progress",
  share: "/api/share",
} as const;
