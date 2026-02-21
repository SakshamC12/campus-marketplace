import { supabase } from './supabase';

export const favoriteService = {
  // Add to favorites
  async addFavorite(userId: string, listingId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .insert([
        {
          user_id: userId,
          listing_id: listingId,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Remove from favorites
  async removeFavorite(userId: string, listingId: string) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    if (error) {
      throw error;
    }
  },

  // Get user's favorites
  async getUserFavorites(userId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select(
        `
        *,
        listing:listings(*, user:users(id, full_name, profile_image_url))
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    return data || [];
  },

  // Check if listing is favorited
  async isFavorited(userId: string, listingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking favorite:', error);
    }

    return !!data;
  },

  // Get favorite count for a listing
  async getFavoriteCount(listingId: string): Promise<number> {
    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    if (error) {
      console.error('Error getting favorite count:', error);
      return 0;
    }

    return count || 0;
  },
};
