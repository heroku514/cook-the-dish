import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://app:app@localhost:5432/cookthedish",
  max: 10,
});

let initialized = false;

async function ensureTables() {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipe_cache (
      cache_key   TEXT PRIMARY KEY,
      recipe_data JSONB NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_match_cache (
      cache_key   TEXT PRIMARY KEY,
      match_data  JSONB NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      expires_at  TIMESTAMPTZ NOT NULL
    )
  `);

  initialized = true;
}

export async function getRecipeCache(key: string): Promise<unknown | null> {
  await ensureTables();
  const result = await pool.query(
    "SELECT recipe_data FROM recipe_cache WHERE cache_key = $1",
    [key]
  );
  return result.rows[0]?.recipe_data ?? null;
}

export async function setRecipeCache(
  key: string,
  data: unknown
): Promise<void> {
  await ensureTables();
  await pool.query(
    `INSERT INTO recipe_cache (cache_key, recipe_data)
     VALUES ($1, $2)
     ON CONFLICT (cache_key) DO UPDATE SET recipe_data = $2, created_at = NOW()`,
    [key, JSON.stringify(data)]
  );
}

export async function getProductMatchCache(
  key: string
): Promise<unknown | null> {
  await ensureTables();
  const result = await pool.query(
    "SELECT match_data FROM product_match_cache WHERE cache_key = $1 AND expires_at > NOW()",
    [key]
  );
  return result.rows[0]?.match_data ?? null;
}

export async function setProductMatchCache(
  key: string,
  data: unknown,
  ttlHours: number = 24
): Promise<void> {
  await ensureTables();
  await pool.query(
    `INSERT INTO product_match_cache (cache_key, match_data, expires_at)
     VALUES ($1, $2, NOW() + $3 * INTERVAL '1 hour')
     ON CONFLICT (cache_key) DO UPDATE
       SET match_data = $2, created_at = NOW(), expires_at = NOW() + $3 * INTERVAL '1 hour'`,
    [key, JSON.stringify(data), ttlHours]
  );
}
