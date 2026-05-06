-- Migration: Add deal offers table and admin role to users
-- Purpose: Support deal confirmation system and admin moderation dashboard

-- Add role column to users table with default 'user'
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin'));

CREATE INDEX idx_users_role ON users(role);

-- Create deal_offers table
CREATE TABLE deal_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  offered_price DECIMAL(10, 2) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT price_non_negative CHECK (offered_price >= 0),
  CONSTRAINT different_sender_receiver CHECK (sender_id != receiver_id)
);

CREATE INDEX idx_deal_offers_sender_id ON deal_offers(sender_id);
CREATE INDEX idx_deal_offers_receiver_id ON deal_offers(receiver_id);
CREATE INDEX idx_deal_offers_listing_id ON deal_offers(listing_id);
CREATE INDEX idx_deal_offers_status ON deal_offers(status);
CREATE INDEX idx_deal_offers_created_at ON deal_offers(created_at);

-- Create function to update deal_offers.updated_at on status change
CREATE OR REPLACE FUNCTION public.update_deal_offer_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
DROP TRIGGER IF EXISTS update_deal_offer_timestamp ON deal_offers;
CREATE TRIGGER update_deal_offer_timestamp
  BEFORE UPDATE ON deal_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_deal_offer_timestamp();

-- Create function to create notification when deal is accepted
CREATE OR REPLACE FUNCTION public.create_deal_notification()
RETURNS trigger AS $$
DECLARE
  sender_name VARCHAR;
  listing_title VARCHAR;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Get sender name and listing title
    SELECT full_name INTO sender_name FROM users WHERE id = NEW.sender_id;
    SELECT title INTO listing_title FROM listings WHERE id = NEW.listing_id;
    
    -- Create notification for sender that deal was accepted
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_listing_id,
      related_user_id
    ) VALUES (
      NEW.sender_id,
      'deal_accepted',
      'Deal Accepted!',
      'Your offer for ' || listing_title || ' has been accepted!',
      NEW.listing_id,
      NEW.receiver_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deal notifications
DROP TRIGGER IF EXISTS on_deal_accepted ON deal_offers;
CREATE TRIGGER on_deal_accepted
  AFTER UPDATE ON deal_offers
  FOR EACH ROW EXECUTE FUNCTION public.create_deal_notification();
