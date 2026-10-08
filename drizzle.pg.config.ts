import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle config for the Supabase (Postgres) schema.
 * The MySQL config lives in drizzle.config.ts — both coexist until cutover.
 *
 * `generate` / `migrate` need SUPABASE_DB_URL; `generate` only needs a
 * well-formed placeholder, `migrate` connects for real.
 */
export default defineConfig({
  schema: "./db/pg/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.SUPABASE_DB_URL ??
      "postgres://postgres:postgres@localhost:5432/postgres",
  },
});
