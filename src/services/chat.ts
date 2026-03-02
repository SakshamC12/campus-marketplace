import { supabase } from './supabase';
import type { ChatMessage, User } from '../types';

export const chatService = {
  // Get all users for direct messaging
  async getAllUsers(currentUserId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('id', currentUserId)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  },

  // Get messages for a listing between two users
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

  // Get direct messages between two users (no listing)
  async getDirectMessages(otherUserId: string, currentUserId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(
        `
        *,
        sender:users!sender_id(id, full_name, profile_image_url),
        receiver:users!receiver_id(id, full_name, profile_image_url)
      `
      )
      .is('listing_id', null)
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching direct messages:', error);
      return [];
    }

    return data || [];
  },

  // Send message
  async sendMessage(
    listingId: string,
    senderId: string,
    receiverId: string,
    messageText: string
  ) {
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

  // Send direct message (no listing required)
  async sendDirectMessage(
    senderId: string,
    receiverId: string,
    messageText: string
  ) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          listing_id: null,
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

  // Mark messages as read
  async markMessagesAsRead(listingId: string, currentUserId: string, otherUserId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('listing_id', listingId)
      .eq('sender_id', otherUserId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  // Get user's chat conversations
  async getUserConversations(userId: string) {
    // Get distinct conversations for the user
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
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    // Remove duplicates and group by other user
    const conversations = new Map();
    data?.forEach((msg: any) => {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          listing_id: msg.listing_id,
          listing: msg.listing,
          otherUserId,
          lastMessageTime: msg.created_at,
        });
      }
    });

    return Array.from(conversations.values());
  },

  // Subscribe to real-time messages
  subscribeToMessages(
    listingId: string,
    currentUserId: string,
    otherUserId: string,
    callback: (message: ChatMessage) => void
  ) {
    const subscription = supabase
      .channel(`messages:${listingId}:${currentUserId}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `listing_id=eq.${listingId}`,
        },
        (payload: any) => {
          const message = payload.new as ChatMessage;
          if (
            (message.sender_id === currentUserId && message.receiver_id === otherUserId) ||
            (message.sender_id === otherUserId && message.receiver_id === currentUserId)
          ) {
            callback(message);
          }
        }
      )
      .subscribe();

    return subscription;
  },

  // Unsubscribe from messages
  async unsubscribeFromMessages(channel: any) {
    await supabase.removeChannel(channel);
  },
};
