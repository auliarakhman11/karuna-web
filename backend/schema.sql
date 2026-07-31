-- Karuna Web Database Schema

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: karuna_users
CREATE TABLE IF NOT EXISTS karuna_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: karuna_refresh_tokens
CREATE TABLE IF NOT EXISTS karuna_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES karuna_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: karuna_categories
CREATE TABLE IF NOT EXISTS karuna_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: karuna_items (Inventaris Toko Bangunan & Kayu)
CREATE TABLE IF NOT EXISTS karuna_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES karuna_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES karuna_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Categories for Building Material & Wood Store
INSERT INTO karuna_categories (name, slug) VALUES
  ('Kayu & Olahan', 'kayu-olahan'),
  ('Semen & Pasir', 'semen-pasir'),
  ('Besi & Logam', 'besi-logam'),
  ('Cat & Pelapis', 'cat-pelapis'),
  ('Pipa & Sanitari', 'pipa-sanitari'),
  ('Atap & Plafon', 'atap-plafon'),
  ('Perkakas & Alat Kerja', 'perkakas-alat-kerja')
ON CONFLICT (slug) DO NOTHING;
