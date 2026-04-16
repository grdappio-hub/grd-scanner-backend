import { Pool } from "pg";
import { env } from "../config/env";

const hasDatabaseConfig =
  env.dbHost &&
  env.dbName &&
  env.dbUser &&
  env.dbPassword &&
  env.dbPort;

export const db = hasDatabaseConfig
  ? new Pool({
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      user: env.dbUser,
      password: env.dbPassword,
    })
  : null;