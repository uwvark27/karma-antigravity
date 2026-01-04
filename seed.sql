CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Matches Clerk User ID
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'member', -- 'admin' or 'member'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  access_level TEXT DEFAULT 'public', -- 'public' or 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Categories Seed
INSERT INTO categories (name, slug, access_level)
VALUES 
  ('General', 'general', 'public'),
  ('Admin Stuff', 'admin-stuff', 'admin')
ON CONFLICT (slug) DO NOTHING;
