import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  dbHost: required("DB_HOST"),
  dbPort: Number(process.env.DB_PORT || 5432),
  dbName: required("DB_NAME"),
  dbUser: required("DB_USER"),
  dbPassword: process.env.DB_PASSWORD || "",
  heliusApiKey: required("HELIUS_API_KEY"),
};
