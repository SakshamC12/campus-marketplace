-- Migration: Add RLS policies for deal_offers and admin features
-- Purpose: Ensure data security and admin-only access

-- Enable RLS on deal_offers table
ALTER TABLE deal_offers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view deal offers they sent or received
CREATE POLICY deal_offers_view_own ON deal_offers
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Policy: Users can create deal offers (as sender)
CREATE POLICY deal_offers_create ON deal_offers
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Policy: Only receiver can accept/reject deal offers
CREATE POLICY deal_offers_update_receiver ON deal_offers
  FOR UPDATE USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Policy: Allow deletion by either party (optional cleanup)
CREATE POLICY deal_offers_delete_owner ON deal_offers
  FOR DELETE USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Admin policies for reports
-- Allow admins to view all reports
CREATE POLICY reports_view_admin ON reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Allow admins to update report status
CREATE POLICY reports_update_admin ON reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Admin policies for listings - allow admins to delete any listing
CREATE POLICY listings_delete_admin ON listings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Users can still delete their own listings
CREATE POLICY listings_delete_own ON listings
  FOR DELETE USING (user_id = auth.uid());

-- Admins can view all listing_images to clean up when deleting listings
CREATE POLICY listing_images_view_admin ON listing_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.user_id = auth.uid()
    )
  );
