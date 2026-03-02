import React, { useState, useEffect, useCallback } from 'react';
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

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const msgs = await chatService.getMessages(listingId, otherUserId, currentUserId);
      setMessages(msgs);
      await chatService.markMessagesAsRead(listingId, currentUserId, otherUserId);
    } catch (error) {
      console.error('Failed to load messages:', error);
      addAlert('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  }, [listingId, otherUserId, currentUserId, addAlert]);

  useEffect(() => {
    loadMessages();

    // Subscribe to real-time messages
    const subscription = chatService.subscribeToMessages(
      listingId,
      currentUserId,
      otherUserId,
      (message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    );

    // Polling fallback - reload messages every 5 seconds
    const pollInterval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => {
      subscription.unsubscribe().catch(() => {
        // Ignore errors on unsubscribe
      });
      clearInterval(pollInterval);
    };
  }, [listingId, currentUserId, otherUserId, loadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      const sentMessage = await chatService.sendMessage(
        listingId,
        currentUserId,
        otherUserId,
        newMessage
      );
      if (sentMessage) {
        // Immediately add the message to the state
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMessage.id)) {
            return prev;
          }
          return [...prev, sentMessage];
        });
      }
      setNewMessage('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
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
