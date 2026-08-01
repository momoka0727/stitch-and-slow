import type { ZodType } from "zod";

export async function readJson<T>(response: Response, schema: ZodType<T>): Promise<T> {
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const result = schema.safeParse(await response.json());
  if (!result.success) throw new Error("Response payload failed validation");
  return result.data;
}

export function validationError(message: string, issues?: unknown) {
  return Response.json({ error: message, issues }, { status: 400 });
}
