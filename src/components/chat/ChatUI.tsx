import React, { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../../services/chat';
import { useAlert } from '../../contexts/AlertContext';
import type { ChatMessage } from '../../types';
import '../styles/chat.css';

interface ChatUIProps {
  listingId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName?: string;
}

export const ChatUI: React.FC<ChatUIProps> = ({
  listingId,
  currentUserId,
  otherUserId,
  otherUserName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { addAlert } = useAlert();
  const subscriptionRef = useRef<any>(null);

  const loadMessages = useCallback(async () => {
    try {
      console.log('[ChatUI] Loading messages for listing:', listingId, 'users:', currentUserId, otherUserId);
      setLoading(true);
      const msgs = await chatService.getMessages(listingId, otherUserId, currentUserId);
      console.log('[ChatUI] Messages loaded:', msgs.length);
      setMessages(msgs);
      await chatService.markMessagesAsRead(listingId, currentUserId, otherUserId);
    } catch (error) {
      console.error('[ChatUI] Failed to load messages:', error);
      addAlert('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  }, [listingId, otherUserId, currentUserId, addAlert]);

  // Load messages once on mount or when conversation changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to real-time messages - keep stable subscription
  useEffect(() => {
    // Clean up previous subscription
    if (subscriptionRef.current) {
      console.log('[ChatUI] Cleaning up previous subscription');
      subscriptionRef.current.unsubscribe().catch((err: any) => {
        console.warn('[ChatUI] Error during unsubscribe:', err);
      });
    }

    console.log('[ChatUI] Setting up new subscription');
    const subscription = chatService.subscribeToMessages(
      listingId,
      currentUserId,
      otherUserId,
      (message) => {
        console.log('[ChatUI] Received message from subscription:', message);
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((m) => m.id === message.id);
          if (exists) {
            console.log('[ChatUI] Message already exists, skipping duplicate');
            return prev;
          }
          console.log('[ChatUI] Adding new message to state, total count:', prev.length + 1);
          return [...prev, message];
        });
      }
    );

    subscriptionRef.current = subscription;

    // Cleanup on unmount or when dependencies change
    return () => {
      if (subscriptionRef.current) {
        console.log('[ChatUI] Cleaning up subscription on unmount/dependency change');
        subscriptionRef.current.unsubscribe().catch((err: any) => {
          console.warn('[ChatUI] Error during cleanup unsubscribe:', err);
        });
      }
    };
  }, [listingId, currentUserId, otherUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      console.log('[ChatUI] Sending message');
      const sentMessage = await chatService.sendMessage(
        listingId,
        currentUserId,
        otherUserId,
        newMessage
      );
      
      if (sentMessage) {
        console.log('[ChatUI] Message sent successfully:', sentMessage.id);
        // Immediately add the message to the state
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMessage.id)) {
            console.log('[ChatUI] Sent message already in state, skipping');
            return prev;
          }
          console.log('[ChatUI] Adding sent message to state');
          return [...prev, sentMessage];
        });
      }
      setNewMessage('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      console.error('[ChatUI] Error sending message:', error);
      addAlert(message, 'error');
    }
  };

  if (loading) {
    return <div className="chat-loading">Loading messages...</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat with {otherUserName || 'User'}</h3>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet. Start a conversation!</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${
                msg.sender_id === currentUserId ? 'sent' : 'received'
              }`}
            >
              <p>{msg.message_text}</p>
              <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  );
};
