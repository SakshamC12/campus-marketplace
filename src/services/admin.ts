import { supabase } from './supabase';

export const adminService = {
  // Get all reports with listing and user details
  async getAllReports(status?: string) {
    let query = supabase
      .from('reports')
      .select(
        `
        *,
        listing:listings(id, title, user_id, price),
        reported_by_user:users!reported_by_user_id(id, full_name, email),
        seller:listings(user_id)
      `
      )
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return [];
    }

    return data || [];
  },

  // Get report count by status
  async getReportStats() {
    const { data: pending } = await supabase
      .from('reports')
      .select('id', { count: 'exact' })
      .eq('status', 'pending');

    const { data: reviewed } = await supabase
      .from('reports')
      .select('id', { count: 'exact' })
      .eq('status', 'reviewed');

    return {
      pending: pending?.length || 0,
      reviewed: reviewed?.length || 0,
    };
  },

  // Delete a listing (admin only) - includes cascading cleanup
  async deleteListingAsAdmin(listingId: string) {
    try {
      // Get listing details to find images
      const { error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError) {
        throw listingError;
      }

      // Get all listing images
      const { data: images, error: imagesError } = await supabase
        .from('listing_images')
        .select('id, image_url')
        .eq('listing_id', listingId);

      if (imagesError) {
        console.warn('Error fetching listing images:', imagesError);
      }

      // Delete images from DB (S3 cleanup can be done separately)
      if (images && images.length > 0) {
        const { error: deleteImagesError } = await supabase
          .from('listing_images')
          .delete()
          .eq('listing_id', listingId);

        if (deleteImagesError) {
          console.warn('Error deleting listing images from database:', deleteImagesError);
        }
      }

      // Delete the listing (RLS policies handle cascading for reports/chat_messages)
      const { error: deleteError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (deleteError) {
        throw deleteError;
      }

      return { success: true, deletedImages: images?.length || 0 };
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },

  // Update report status
  async updateReportStatus(reportId: string, status: string) {
    const { data, error } = await supabase
      .from('reports')
      .update({
        status,
        resolved_at: ['resolved', 'dismissed'].includes(status) ? new Date().toISOString() : null,
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Get count of reports for a listing
  async getListingReportCount(listingId: string) {
    const { error, count } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('listing_id', listingId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error counting reports:', error);
      return 0;
    }

    return count || 0;
  },
};
