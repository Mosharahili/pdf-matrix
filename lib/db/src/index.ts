import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getOrInit() {
  if (_db) return { pool: _pool!, db: _db };
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  _pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
