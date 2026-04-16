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

export const env = {
  dbHost: optional("DB_HOST"),
  dbPort: optional("DB_PORT"),
  dbName: optional("DB_NAME"),
  dbUser: optional("DB_USER"),
  dbPassword: optional("DB_PASSWORD"),
  heliusApiKey: required("HELIUS_API_KEY"),
  port: optional("PORT", "3001"),
};