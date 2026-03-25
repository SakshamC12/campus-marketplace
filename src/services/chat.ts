import { supabase } from './supabase';
import type { ChatMessage } from '../types';

/**
 * Chat service - All messages are scoped to listings
 * Conversations are uniquely identified by (listing_id, sender_id, receiver_id)
 * 
 * When a message is sent, a notification is automatically created for the receiver
 * using a Supabase trigger (see DATABASE_SCHEMA.txt for trigger details)
 */
export const chatService = {
  /**
   * Get all messages for a specific listing between two users
   * Messages must have a valid listing_id and involve the current user
   */
  async getMessages(listingId: string, otherUserId: string, currentUserId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(
        `
        *,
        sender:users!sender_id(id, full_name, profile_image_url),
        receiver:users!receiver_id(id, full_name, profile_image_url)
      `
      )
      .eq('listing_id', listingId)
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Send a message for a listing conversation
   * listing_id is REQUIRED for all messages
   */
  async sendMessage(
    listingId: string,
    senderId: string,
    receiverId: string,
    messageText: string
  ) {
    if (!listingId || !messageText.trim()) {
      throw new Error('Listing ID and message text are required');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          listing_id: listingId,
          sender_id: senderId,
          receiver_id: receiverId,
          message_text: messageText,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Mark messages as read for a listing conversation
   * Also marks related notifications as read
   */
  async markMessagesAsRead(listingId: string, currentUserId: string, otherUserId: string) {
    // Mark messages as read
    const { error: messageError } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('listing_id', listingId)
      .eq('sender_id', otherUserId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);

    if (messageError) {
      console.error('Error marking messages as read:', messageError);
    }

    // Mark related notifications as read (done separately via notifications service)
    // This is imported dynamically to avoid circular dependencies
    try {
      const { notificationService } = await import('./notifications');
      await notificationService.markMessageNotificationsAsRead(currentUserId, listingId);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  },

  /**
   * Get user's listing-based conversations
   * Groups messages by (listing_id, otherUserId) to show unique conversations
   */
  async getUserConversations(userId: string) {
    // Get distinct conversations for the user (only listing-based messages)
    const { data, error } = await supabase
      .from('chat_messages')
      .select(
        `
        listing_id,
        listing:listings(id, title),
        sender_id,
        receiver_id,
        created_at
      `
      )
      .not('listing_id', 'is', null)  // Only get messages with a valid listing_id
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    // Group by (listing_id, otherUserId) to show unique conversations
    const conversations = new Map<string, any>();
    data?.forEach((msg: any) => {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const conversationKey = `${msg.listing_id}:${otherUserId}`;
      
      if (!conversations.has(conversationKey)) {
        conversations.set(conversationKey, {
          listing_id: msg.listing_id,
          listing: msg.listing,
          otherUserId,
          lastMessageTime: msg.created_at,
          type: 'listing' as const,
        });
      }
    });

    return Array.from(conversations.values());
  },

  // Subscribe to listing-based messages
  subscribeToMessages(
    listingId: string,
    currentUserId: string,
    otherUserId: string,
    callback: (message: ChatMessage) => void
  ) {
    const channel = supabase
      .channel(`messages-${listingId}-${currentUserId}-${otherUserId}`, {
        config: { broadcast: { self: true } },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload: any) => {
          const message = payload.new as ChatMessage;
          if (
            message.listing_id === listingId &&
            ((message.sender_id === currentUserId && message.receiver_id === otherUserId) ||
              (message.sender_id === otherUserId && message.receiver_id === currentUserId))
          ) {
            callback(message);
          }
        }
      )
      .subscribe();

    return channel;
  },
};
