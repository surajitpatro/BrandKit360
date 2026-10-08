/**
 * Supabase Postgres connection — postgres-js driver through the pooler.
 *
 * `prepare: false` is REQUIRED for Supabase's transaction-mode pooler
 * (port 6543): prepared statements pin sessions to one backend and break
 * under pooling. Use the pooler URL, not the direct connection string.
 *
 * Inert until cutover — nothing in the running app imports this module.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let instance: Db | undefined;
let client: postgres.Sql | undefined;

export function getPgDb(): Db {
  if (!instance) {
    const url = process.env.SUPABASE_DB_URL;
    if (!url) {
      throw new Error("SUPABASE_DB_URL is not set (Supabase pooler URL, e.g. postgresql://postgres:[password]@aws-0-<region>.pooler.supabase.com:6543/postgres)");
    }
    client = postgres(url, { prepare: false, max: 10 });
    instance = drizzle(client, { schema });
  }
  return instance;
}

/** Test hook / graceful shutdown. */
export async function closePgDb(): Promise<void> {
  await client?.end();
  instance = undefined;
  client = undefined;
}
