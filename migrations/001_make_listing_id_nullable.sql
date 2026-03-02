-- Migration: Make listing_id nullable in chat_messages table
-- Purpose: Allow direct messages between users without associating to a listing
-- Date: Applied to enable direct messaging feature

ALTER TABLE chat_messages ALTER COLUMN listing_id DROP NOT NULL;

-- Verify the change
-- SELECT column_name, is_nullable FROM information_schema.columns 
-- WHERE table_name='chat_messages' AND column_name='listing_id';
