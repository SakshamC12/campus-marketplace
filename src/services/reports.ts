import { supabase } from './supabase';
import type { Report } from '../types';

export const reportService = {
  // Create a report
  async createReport(
    listingId: string,
    reportedByUserId: string,
    reason: string,
    description?: string
  ) {
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          listing_id: listingId,
          reported_by_user_id: reportedByUserId,
          reason,
          description,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Get all reports (admin view)
  async getAllReports(status?: string) {
    let query = supabase
      .from('reports')
      .select(
        `
        *,
        listing:listings(id, title, user_id),
        reported_by_user:users!reported_by_user_id(id, full_name, email)
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

  // Get user's reports
  async getUserReports(userId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reported_by_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reports:', error);
      return [];
    }

    return data || [];
  },

  // Update report status
  async updateReportStatus(reportId: string, status: string) {
    const { data, error } = await supabase
      .from('reports')
      .update({
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Get reports for a listing
  async getListingReports(listingId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listing reports:', error);
      return [];
    }

    return data || [];
  },

  // Check if user has already reported this listing
  async hasUserReportedListing(listingId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('reports')
      .select('id')
      .eq('listing_id', listingId)
      .eq('reported_by_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking report:', error);
    }

    return !!data;
  },
};
