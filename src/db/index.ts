import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

const getConnectionString = () => {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or POSTGRES_URL must be set to use the Neon database.");
  }
  return connectionString;
};

export const getDb = () => {
  if (!dbInstance) {
    const sql = neon(getConnectionString());
    dbInstance = drizzle(sql, { schema });
  }

  return dbInstance;
};
