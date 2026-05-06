import { supabase } from './supabase';
import type { DealOffer } from '../types';

export const dealService = {
  // Create a deal offer
  async createDealOffer(
    listingId: string,
    senderId: string,
    receiverId: string,
    offeredPrice: number,
    message?: string
  ) {
    const { data, error } = await supabase
      .from('deal_offers')
      .insert([
        {
          listing_id: listingId,
          sender_id: senderId,
          receiver_id: receiverId,
          offered_price: offeredPrice,
          message,
          status: 'pending',
        },
      ])
      .select(
        `
        *,
        sender:users!sender_id(id, full_name, profile_image_url),
        receiver:users!receiver_id(id, full_name, profile_image_url),
        listing:listings(id, title, price)
      `
      )
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Get deal offers for a listing conversation
  async getDealOffers(listingId: string, currentUserId: string, otherUserId: string) {
    const { data, error } = await supabase
      .from('deal_offers')
      .select(
        `
        *,
        sender:users!sender_id(id, full_name, profile_image_url),
        receiver:users!receiver_id(id, full_name, profile_image_url),
        listing:listings(id, title, price)
      `
      )
      .eq('listing_id', listingId)
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching deal offers:', error);
      return [];
    }

    return data || [];
  },

  // Accept a deal offer (receiver only)
  async acceptDealOffer(dealOfferId: string, receiverId: string) {
    const { data, error } = await supabase
      .from('deal_offers')
      .update({ status: 'accepted' })
      .eq('id', dealOfferId)
      .eq('receiver_id', receiverId)
      .select(
        `
        *,
        sender:users!sender_id(id, full_name, profile_image_url),
        receiver:users!receiver_id(id, full_name, profile_image_url),
        listing:listings(id, title, price)
      `
      )
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Reject a deal offer (receiver only)
  async rejectDealOffer(dealOfferId: string, receiverId: string) {
    const { data, error } = await supabase
      .from('deal_offers')
      .update({ status: 'rejected' })
      .eq('id', dealOfferId)
      .eq('receiver_id', receiverId)
      .select(
        `
        *,
        sender:users!sender_id(id, full_name, profile_image_url),
        receiver:users!receiver_id(id, full_name, profile_image_url),
        listing:listings(id, title, price)
      `
      )
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Get pending deal offers for a user (as receiver)
  async getPendingDealOffers(userId: string) {
    const { data, error } = await supabase
      .from('deal_offers')
      .select(
        `
        *,
        sender:users!sender_id(id, full_name, profile_image_url),
        receiver:users!receiver_id(id, full_name, profile_image_url),
        listing:listings(id, title, price)
      `
      )
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending deal offers:', error);
      return [];
    }

    return data || [];
  },

  // Subscribe to deal offers in a conversation
  subscribeToDeals(
    listingId: string,
    currentUserId: string,
    otherUserId: string,
    callback: (deal: DealOffer) => void
  ) {
    const channel = supabase
      .channel(`deals-${listingId}-${currentUserId}-${otherUserId}`, {
        config: { broadcast: { self: true } },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deal_offers',
          filter: `listing_id=eq.${listingId}`,
        },
        async (payload: any) => {
          const newDeal = payload.new;
          if (
            newDeal.listing_id === listingId &&
            ((newDeal.sender_id === currentUserId && newDeal.receiver_id === otherUserId) ||
              (newDeal.sender_id === otherUserId && newDeal.receiver_id === currentUserId))
          ) {
            // Fetch full deal with user details
            const { data: enrichedDeal, error } = await supabase
              .from('deal_offers')
              .select(
                `
                *,
                sender:users!sender_id(id, full_name, profile_image_url),
                receiver:users!receiver_id(id, full_name, profile_image_url),
                listing:listings(id, title, price)
              `
              )
              .eq('id', newDeal.id)
              .single();

            if (!error && enrichedDeal) {
              callback(enrichedDeal as DealOffer);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deal_offers',
          filter: `listing_id=eq.${listingId}`,
        },
        async (payload: any) => {
          const updatedDeal = payload.new;
          if (
            updatedDeal.listing_id === listingId &&
            ((updatedDeal.sender_id === currentUserId && updatedDeal.receiver_id === otherUserId) ||
              (updatedDeal.sender_id === otherUserId && updatedDeal.receiver_id === currentUserId))
          ) {
            // Fetch full deal with user details
            const { data: enrichedDeal, error } = await supabase
              .from('deal_offers')
              .select(
                `
                *,
                sender:users!sender_id(id, full_name, profile_image_url),
                receiver:users!receiver_id(id, full_name, profile_image_url),
                listing:listings(id, title, price)
              `
              )
              .eq('id', updatedDeal.id)
              .single();

            if (!error && enrichedDeal) {
              callback(enrichedDeal as DealOffer);
            }
          }
        }
      )
      .subscribe();

    return channel;
  },
};
