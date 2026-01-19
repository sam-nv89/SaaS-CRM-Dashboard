-- Create stylists table
CREATE TABLE IF NOT EXISTS stylists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stylists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for stylists" ON stylists FOR ALL USING (true);

-- Insert default stylists
INSERT INTO stylists (name, color) VALUES 
  ('Emma', 'bg-chart-1'),
  ('Sophia', 'bg-chart-2'),
  ('Olivia', 'bg-chart-3');

-- Add stylist_id to appointments
ALTER TABLE appointments 
ADD COLUMN stylist_id UUID REFERENCES stylists(id);
