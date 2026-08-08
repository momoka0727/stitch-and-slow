export async function consumeAuthRateLimit(input: {
  database: D1Database;
  key: string;
  windowSeconds: number;
  max: number;
}) {
  const now = Date.now();
  const windowStart = now - input.windowSeconds * 1000;
  const row = await input.database
    .prepare(
      `INSERT INTO rate_limit (id, key, count, last_request)
       VALUES (?1, ?2, 1, ?3)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE
           WHEN rate_limit.last_request <= ?4 THEN 1
           ELSE rate_limit.count + 1
         END,
         last_request = CASE
           WHEN rate_limit.last_request <= ?4 THEN excluded.last_request
           ELSE rate_limit.last_request
         END
       RETURNING count`,
    )
    .bind(crypto.randomUUID(), input.key, now, windowStart)
    .first<{ count: number }>();
  return Boolean(row && row.count <= input.max);
}

export async function clearAuthRateLimit(database: D1Database, key: string) {
  await database.prepare("DELETE FROM rate_limit WHERE key = ?1").bind(key).run();
}
