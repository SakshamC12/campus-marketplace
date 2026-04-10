import { supabase } from './supabase';
import type { Listing, ListingFilters, ListingImage } from '../types';

export const RENDEZVOUS_LOCATIONS = {
  'Arch Gate': 'https://maps.app.goo.gl/iRPoR2phEgMhNUwW7',
  'Tech Park 1': 'https://maps.app.goo.gl/zasf7M9fjJbrJaiL9',
  'Boys Hostel Gate 1': 'https://maps.app.goo.gl/4VaF9to8Q5hJaoF76',
  'Slice of Life Cafe': 'https://maps.app.goo.gl/8wCYzn3E6g8PgfDUA',
  'M Block Girls Hostel': 'https://maps.app.goo.gl/FwbyX86RazNoUQYBA',
} as const;

export const listingService = {
  // Get all listings with filters
  async getListings(filters?: ListingFilters) {
    let query = supabase
      .from('listings')
      .select(
        `
        *,
        user:users(id, full_name, profile_image_url, email)
      `
      )
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return [];
    }

    return data || [];
  },

  // Get single listing
  async getListing(listingId: string): Promise<Listing | null> {
    const { data, error } = await supabase
      .from('listings')
      .select(
        `
        *,
        user:users(id, full_name, profile_image_url, email)
      `
      )
      .eq('id', listingId)
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
      return null;
    }

    return data;
  },

  // Get user's listings
  async getUserListings(userId: string) {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user listings:', error);
      return [];
    }

    return data || [];
  },

  // Create listing
  async createListing(
    userId: string,
    listing: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'user'>
  ) {
    const { data, error } = await supabase
      .from('listings')
      .insert([
        {
          user_id: userId,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          price: listing.price,
          image_url: listing.image_url,
          status: 'available',
          rendezvous_location: listing.rendezvous_location,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Update listing
  async updateListing(listingId: string, updates: Partial<Listing>) {
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Delete listing
  async deleteListing(listingId: string) {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      throw error;
    }
  },

  // Upload listing image
  async uploadListingImage(listingId: string, file: File) {
    const fileName = `${listingId}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from('listing-images')
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('listing-images')
      .getPublicUrl(fileName);

    // Save to listing_images table
    const { error: dbError } = await supabase
      .from('listing_images')
      .insert([
        {
          listing_id: listingId,
          image_url: publicData.publicUrl,
        },
      ]);

    if (dbError) {
      throw dbError;
    }

    return publicData.publicUrl;
  },

  // Get listing images
  async getListingImages(listingId: string): Promise<ListingImage[]> {
    const { data, error } = await supabase
      .from('listing_images')
      .select('*')
      .eq('listing_id', listingId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching listing images:', error);
      return [];
    }

    return data || [];
  },

  // Delete listing image
  async deleteListingImage(imageId: string, imageUrl: string) {
    // Delete from storage
    const filePath = imageUrl.split('/').pop();
    if (filePath) {
      await supabase.storage
        .from('listing-images')
        .remove([filePath]);
    }

    // Delete from database
    const { error } = await supabase
      .from('listing_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      throw error;
    }
  },

  // Get categories (mock data - can be replaced with DB query)
  getCategories() {
    return [
      'Books',
      'Electronics',
      'Furniture',
      'Clothing',
      'Sports Equipment',
      'Academic Materials',
      'Miscellaneous',
    ];
  },

  // Get campus locations (predefined rendezvous locations)
  getCampusLocations() {
    return Object.keys(RENDEZVOUS_LOCATIONS);
  },

  // Mark listing as sold (only works if user owns the listing)
  async markAsSold(listingId: string): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .update({ status: 'sold' })
      .eq('id', listingId)
      .select(`
        *,
        user:users(id, full_name, profile_image_url, email)
      `)
      .single();

    if (error) {
      console.error('Error marking listing as sold:', error);
      throw error;
    }

    return data;
  },

  // Mark listing as available (only works if user owns the listing)
  async markAsAvailable(listingId: string): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .update({ status: 'available' })
      .eq('id', listingId)
      .select(`
        *,
        user:users(id, full_name, profile_image_url, email)
      `)
      .single();

    if (error) {
      console.error('Error marking listing as available:', error);
      throw error;
    }

    return data;
  },
};
