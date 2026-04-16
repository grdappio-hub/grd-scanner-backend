const required = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const optional = (name: string, fallback = "") => {
  return process.env[name] || fallback;
};

const optionalNumber = (name: string, fallback: number) => {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  dbHost: optional("DB_HOST"),
  dbPort: optionalNumber("DB_PORT", 5432),
  dbName: optional("DB_NAME"),
  dbUser: optional("DB_USER"),
  dbPassword: optional("DB_PASSWORD"),
  heliusApiKey: required("HELIUS_API_KEY"),
  port: optionalNumber("PORT", 3001),
};