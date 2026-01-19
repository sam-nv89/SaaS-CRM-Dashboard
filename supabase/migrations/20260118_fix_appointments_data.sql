-- 1. Populate missing end_time based on time + duration (default 60 mins if missing)
UPDATE appointments 
SET end_time = to_char(
    (time::time + (COALESCE(NULLIF(duration, ''), '60')::numeric || ' minutes')::interval),
    'HH24:MI'
)
WHERE end_time IS NULL OR end_time = '';

-- 2. Ensure stylist_id is set null on delete (prevent foreign key errors)
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_stylist_id_fkey,
ADD CONSTRAINT appointments_stylist_id_fkey 
    FOREIGN KEY (stylist_id) 
    REFERENCES stylists(id) 
    ON DELETE SET NULL;
