import { Pool } from "pg";
import { env } from "../config/env";

export const db = new Pool({
  host: env.dbHost,
  port: env.dbPort,
  database: env.dbName,
  user: env.dbUser,
  password: env.dbPassword,
});
