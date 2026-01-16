-- Supabase SQL Schema for BeautyFlow CRM
-- Run this in Supabase SQL Editor

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'regular', 'vip')),
  total_visits INTEGER DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  master_name TEXT NOT NULL,
  master_color TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'canceled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business settings table (single row)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_name TEXT NOT NULL DEFAULT 'BeautyFlow Studio',
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  business_hours JSONB DEFAULT '[]'::jsonb,
  notifications JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies for public access (adjust for auth later)
CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for services" ON services FOR ALL USING (true);
CREATE POLICY "Allow all for appointments" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all for settings" ON settings FOR ALL USING (true);

-- Insert default settings row
INSERT INTO settings (salon_name, address, phone, business_hours, notifications)
VALUES (
  'BeautyFlow Studio',
  '123 Beauty Street, New York, NY',
  '+1 234-567-8900',
  '[
    {"day": "Monday", "open": "09:00", "close": "21:00", "is_open": true},
    {"day": "Tuesday", "open": "09:00", "close": "21:00", "is_open": true},
    {"day": "Wednesday", "open": "09:00", "close": "21:00", "is_open": true},
    {"day": "Thursday", "open": "09:00", "close": "21:00", "is_open": true},
    {"day": "Friday", "open": "09:00", "close": "21:00", "is_open": true},
    {"day": "Saturday", "open": "09:00", "close": "21:00", "is_open": true},
    {"day": "Sunday", "open": "", "close": "", "is_open": false}
  ]'::jsonb,
  '{
    "booking_confirmation": true,
    "reminder_before": true,
    "cancel_notification": true,
    "marketing_emails": false
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert sample services
INSERT INTO services (name, duration, price, category, active) VALUES
  ('Haircut', '45 min', 45, 'Hair', true),
  ('Hair Coloring', '2h', 120, 'Hair', true),
  ('Balayage', '2.5h', 180, 'Hair', true),
  ('Hair Treatment', '1h', 65, 'Hair', false),
  ('Manicure', '45 min', 35, 'Nails', true),
  ('Pedicure', '1h', 45, 'Nails', true),
  ('Gel Nails', '1.5h', 55, 'Nails', true),
  ('Facial', '1h', 80, 'Beauty', true),
  ('Eyebrow Shaping', '30 min', 25, 'Beauty', true),
  ('Lash Extensions', '2h', 150, 'Beauty', false),
  ('Mens Haircut', '30 min', 30, 'Mens Grooming', true),
  ('Beard Trim', '20 min', 20, 'Mens Grooming', true),
  ('Hot Towel Shave', '45 min', 40, 'Mens Grooming', true)
ON CONFLICT DO NOTHING;
