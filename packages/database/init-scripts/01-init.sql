-- Initial database setup for Summoner's Grid
-- This script runs automatically when the PostgreSQL container starts

-- Create the main database if it doesn't exist
SELECT 'CREATE DATABASE summoners_grid'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'summoners_grid')\gexec

-- Set up extensions that might be useful
\c summoners_grid;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions for digital provenance
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function for generating card signatures (example usage)
CREATE OR REPLACE FUNCTION generate_card_signature(card_data JSONB)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(card_data::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;