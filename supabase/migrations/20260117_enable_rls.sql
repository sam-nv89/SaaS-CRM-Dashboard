-- Enable RLS and Add user_id to all tables

-- 1. Add user_id column with default auth.uid()
-- This ensures that new rows automatically get the current user's ID
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE services ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 3. Create Security Policies (CRUD)

-- CLIENTS
CREATE POLICY "Users can view their own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- SERVICES
CREATE POLICY "Users can view their own services" ON services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own services" ON services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own services" ON services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own services" ON services FOR DELETE USING (auth.uid() = user_id);

-- APPOINTMENTS
CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own appointments" ON appointments FOR DELETE USING (auth.uid() = user_id);

-- SETTINGS
CREATE POLICY "Users can view their own settings" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON settings FOR DELETE USING (auth.uid() = user_id);

-- 4. Temporary: Allow null user_id access? 
-- No, strict security first. User must migrate data.

-- MIGRATION HELP (Run this manually after checking your User ID)
-- UPDATE clients SET user_id = 'YOUR_UUID' WHERE user_id IS NULL;
-- UPDATE services SET user_id = 'YOUR_UUID' WHERE user_id IS NULL;
-- UPDATE appointments SET user_id = 'YOUR_UUID' WHERE user_id IS NULL;
-- UPDATE settings SET user_id = 'YOUR_UUID' WHERE user_id IS NULL;
