import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { chatService } from '../services/chat';
import '../components/styles/chat.css';

interface Conversation {
  listing_id: string;
  listing: { id: string; title: string };
  otherUserId: string;
  lastMessageTime: string;
}

export const ChatPage: React.FC = () => {
  const { user } = useAuthContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const convs = await chatService.getUserConversations(user.id);
      setConversations(convs as any);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
      <div style={{ background: 'white', borderRadius: '8px', padding: '20px' }}>
        <h2>Conversations</h2>
        {loading ? (
          <p>Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p style={{ color: '#999' }}>No conversations yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {conversations.map((conv) => (
              <div
                key={conv.listing_id}
                onClick={() => setSelectedConversation(conv.listing_id)}
                style={{
                  padding: '10px',
                  backgroundColor:
                    selectedConversation === conv.listing_id ? '#f0f4ff' : '#f9f9f9',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                <strong>{conv.listing.title}</strong>
                <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
                  {new Date(conv.lastMessageTime).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '8px', padding: '20px' }}>
        {selectedConversation ? (
          <p>Chat UI for conversation {selectedConversation} would appear here</p>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', paddingTop: '50px' }}>
            Select a conversation to start messaging
          </p>
        )}
      </div>
    </div>
  );
};
