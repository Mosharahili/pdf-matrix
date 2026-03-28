import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getOrInit() {
  if (_db) return { pool: _pool!, db: _db };
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error(
      "No database URL found. Set DATABASE_URL, POSTGRES_URL, or POSTGRES_URL_NON_POOLING.",
    );
  }
  const ssl = connectionString.includes("sslmode=disable")
    ? false
    : { rejectUnauthorized: false };
  _pool = new Pool({
    connectionString,
    ssl,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 1,
  });
  _db = drizzle(_pool, { schema });
  return { pool: _pool, db: _db };
}

export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_, prop) {
    return (getOrInit().pool as any)[prop as string];
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return (getOrInit().db as any)[prop as string];
  },
});

export * from "./schema";
