-- Remove the "Allow all" policies that bypass user_id security
-- These policies allow any user to see all data, which breaks data isolation

DROP POLICY IF EXISTS "Allow all for appointments" ON appointments;
DROP POLICY IF EXISTS "Allow all for clients" ON clients;
DROP POLICY IF EXISTS "Allow all for services" ON services;
DROP POLICY IF EXISTS "Allow all for settings" ON settings;
DROP POLICY IF EXISTS "Allow all for stylists" ON stylists;
DROP POLICY IF EXISTS "Allow all for categories" ON categories;

-- For stylists: Add proper user_id column and policies if not exists
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE stylists ENABLE ROW LEVEL SECURITY;

-- Create proper policies for stylists
DROP POLICY IF EXISTS "Users can view their own stylists" ON stylists;
DROP POLICY IF EXISTS "Users can insert their own stylists" ON stylists;
DROP POLICY IF EXISTS "Users can update their own stylists" ON stylists;
DROP POLICY IF EXISTS "Users can delete their own stylists" ON stylists;

CREATE POLICY "Users can view their own stylists" ON stylists FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert their own stylists" ON stylists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stylists" ON stylists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stylists" ON stylists FOR DELETE USING (auth.uid() = user_id);

-- For categories: Add user_id and proper policies
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

CREATE POLICY "Users can view their own categories" ON categories FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert their own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Update services policy to not allow legacy viewing
DROP POLICY IF EXISTS "Users can view own or legacy services" ON services;
