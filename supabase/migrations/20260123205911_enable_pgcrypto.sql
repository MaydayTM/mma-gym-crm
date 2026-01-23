-- Enable pgcrypto extension for gen_random_bytes (used by create_claim_token)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
