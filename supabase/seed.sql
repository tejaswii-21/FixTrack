-- supabase/seed.sql
-- Development seed data. Safe to run after migrations 001 + 002.
-- No real user data or production credentials.

-- Extra categories (the default 6 from migration 001 should already exist)
INSERT INTO public.complaint_categories(name, description, default_priority)
VALUES
  ('Internet / Networking', 'WiFi, LAN, router, and connectivity issues', 'high'),
  ('HVAC',                  'Air conditioning, heating, and ventilation',  'high'),
  ('Furniture / Equipment', 'Broken furniture, lab equipment',             'medium'),
  ('Parking / Common Areas','Parking and shared-area problems',            'low')
ON CONFLICT(name) DO NOTHING;

-- NOTE: Complaints cannot be seeded here because they require a real auth.users
-- row for the submitted_by FK. Seed complaints via the app after signing up.

-- SLA defaults (idempotent – also inserted by migration 002)
INSERT INTO public.system_settings(key, value, setting_key, setting_value)
VALUES
  ('sla_critical_hours', '4',   'sla_critical_hours', '4'),
  ('sla_high_hours',     '24',  'sla_high_hours',     '24'),
  ('sla_medium_hours',   '72',  'sla_medium_hours',   '72'),
  ('sla_low_hours',      '168', 'sla_low_hours',      '168')
ON CONFLICT(key) DO UPDATE SET
  value         = EXCLUDED.value,
  setting_key   = EXCLUDED.setting_key,
  setting_value = EXCLUDED.setting_value;