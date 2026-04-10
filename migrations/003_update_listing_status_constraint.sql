-- Migration: Update listing status constraint to only allow 'available' or 'sold'
-- This migration safely updates the CHECK constraint on the listings table

-- Drop the old constraint
ALTER TABLE listings
DROP CONSTRAINT "listings_status_check";

-- Add new constraint with only allowed values
ALTER TABLE listings
ADD CONSTRAINT status_check CHECK (status IN ('available', 'sold'));

-- Update any existing 'pending' status values to 'available' for data migration
UPDATE listings
SET status = 'available'
WHERE status = 'pending';
