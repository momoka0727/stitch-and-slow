import { API_PATHS } from "../../constants/stitch";
import { readJson } from "../http";
import {
  createShareRequestSchema,
  createShareResponseSchema,
  progressesResponseSchema,
  progressResponseSchema,
  saveProgressRequestSchema,
  saveProgressResponseSchema,
  shareResponseSchema,
  type Pattern,
} from "../validation/stitch";

export async function getProgress(patternId?: string) {
  const query = new URLSearchParams();
  if (patternId) query.set("pattern", patternId);
  const response = await fetch(`${API_PATHS.progress}${query.size ? `?${query}` : ""}`);
  return (await readJson(response, progressResponseSchema)).progress;
}

export async function getProjects() {
  const query = new URLSearchParams({ all: "1" });
  const response = await fetch(`${API_PATHS.progress}?${query}`);
  return (await readJson(response, progressesResponseSchema)).progresses;
}

export async function saveProgress(input: {
  patternId: string;
  pattern: Pattern;
  stitched: number[];
}) {
  const payload = saveProgressRequestSchema.parse(input);
  const response = await fetch(API_PATHS.progress, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson(response, saveProgressResponseSchema);
}

export async function getShare(id: string) {
  const query = new URLSearchParams({ id });
  const response = await fetch(`${API_PATHS.share}?${query}`);
  return (await readJson(response, shareResponseSchema)).share;
}

export async function createShare(input: {
  senderName: string;
  recipientEmail: string;
  pattern: Pattern;
}) {
  const payload = createShareRequestSchema.parse(input);
  const response = await fetch(API_PATHS.share, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson(response, createShareResponseSchema);
}
