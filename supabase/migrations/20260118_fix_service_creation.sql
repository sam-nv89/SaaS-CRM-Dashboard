-- Ensure user_id has default value for services
ALTER TABLE services ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Ensure categories policies are permissive and explicit
-- We drop existing policy to avoid conflict if we want to redefine (though usually we use IF NOT EXISTS or different name)
-- But "Allow all for categories" is the name I used. I'll drop and recreate to be sure.
DROP POLICY IF EXISTS "Allow all for categories" ON categories;
CREATE POLICY "Allow all for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
