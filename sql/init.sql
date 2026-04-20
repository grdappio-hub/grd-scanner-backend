CREATE TABLE IF NOT EXISTS chains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  rpc_provider VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  chain_id INT REFERENCES chains(id),
  address VARCHAR(255) NOT NULL,
  symbol VARCHAR(20),
  name VARCHAR(100),
  decimals INT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chain_id, address)
);

CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  token_id INT REFERENCES tokens(id),
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  risk_score INT,
  risk_level VARCHAR(10),
  confidence INT,
  raw_data JSONB
);

CREATE TABLE IF NOT EXISTS scan_results (
  id SERIAL PRIMARY KEY,
  scan_id INT REFERENCES scans(id),

  holder_concentration NUMERIC,
  largest_holder_amount NUMERIC,
  largest_holder_percent NUMERIC,

  liquidity_score VARCHAR(20),
  liquidity_usd NUMERIC,
  liquidity_pool_count INT,
  primary_pair_address VARCHAR(255),
  primary_pair_dex VARCHAR(50),
  primary_pair_quote_symbol VARCHAR(20),
  liquidity_lock_status VARCHAR(20),

  whale_activity BOOLEAN,
  verification_status VARCHAR(20),
  risk_level VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_alerts (
  id SERIAL PRIMARY KEY,
  scan_id INT REFERENCES scans(id),
  message TEXT,
  severity VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_access (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  tier VARCHAR(20),
  grd_balance NUMERIC,
  last_checked TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scan_cache (
  id SERIAL PRIMARY KEY,
  token_id INT REFERENCES tokens(id),
  cached_result JSONB,
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scan_liquidity_pools (
  id SERIAL PRIMARY KEY,
  scan_id INT REFERENCES scans(id),
  pair_address VARCHAR(255),
  dex_id VARCHAR(50),
  base_symbol VARCHAR(20),
  quote_symbol VARCHAR(20),
  liquidity_usd NUMERIC,
  volume_24h_usd NUMERIC,
  is_primary BOOLEAN DEFAULT FALSE,
  pool_share_percent NUMERIC,
  lock_status VARCHAR(20),
  lock_detail JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
