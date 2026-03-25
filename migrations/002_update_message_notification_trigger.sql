-- Migration: Update message notification trigger to avoid duplicates
-- Purpose: Prevent spam by only creating one unread notification per conversation
-- Date: Applied to improve notification experience

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_chat_message_created ON chat_messages;
DROP FUNCTION IF EXISTS public.create_message_notification();

-- Create updated function to handle message notifications
-- Creates a notification for the receiver when a message is sent
-- Only creates if no unread message notification exists for this conversation
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger AS $$
DECLARE
  listing_title VARCHAR;
  sender_name VARCHAR;
  existing_count INTEGER;
BEGIN
  -- Check if there's already an unread message notification for this conversation
  SELECT COUNT(*) INTO existing_count
  FROM notifications
  WHERE user_id = NEW.receiver_id
    AND type = 'message'
    AND related_listing_id = NEW.listing_id
    AND related_user_id = NEW.sender_id
    AND is_read = FALSE;

  -- Only create notification if none exists
  IF existing_count = 0 THEN
    -- Get listing title
    SELECT title INTO listing_title FROM listings WHERE id = NEW.listing_id;

    -- Get sender's full name
    SELECT full_name INTO sender_name FROM users WHERE id = NEW.sender_id;

    -- Create notification for receiver
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_listing_id,
      related_user_id,
      is_read
    ) VALUES (
      NEW.receiver_id,
      'message',
      'New message',
      'A buyer has messaged you about ' || COALESCE(listing_title, 'a listing'),
      NEW.listing_id,
      NEW.sender_id,
      FALSE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.create_message_notification();