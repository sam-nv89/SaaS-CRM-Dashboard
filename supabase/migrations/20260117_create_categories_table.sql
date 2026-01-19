-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid(),
  name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for categories" ON categories FOR ALL USING (true);

-- Insert default categories
INSERT INTO categories (name) VALUES 
  ('Hair'),
  ('Nail'),
  ('Skin'),
  ('Massage'),
  ('Makeup'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- Insert existing categories from services that are not in defaults
INSERT INTO categories (name)
SELECT DISTINCT category FROM services
WHERE category NOT IN ('Hair', 'Nail', 'Skin', 'Massage', 'Makeup', 'Other')
ON CONFLICT (name) DO NOTHING;

-- Add Foreign Key constraint to services table
-- First ensure all services have a valid category (should be covered by insert above, but good for safety)
-- Then alter table
ALTER TABLE services 
ADD CONSTRAINT fk_services_category 
FOREIGN KEY (category) 
REFERENCES categories(name) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;
