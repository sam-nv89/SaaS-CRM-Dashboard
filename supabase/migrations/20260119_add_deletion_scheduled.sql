-- Add deletion_scheduled_at to profiles table for soft delete with grace period
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.deletion_scheduled_at IS 'When set, the account is scheduled for permanent deletion on this date. User can cancel before this date.';
