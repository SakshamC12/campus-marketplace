import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext.tsx';
import { chatService } from '../services/chat.ts';
import type { User, ChatMessage } from '../types/index.ts';
import '../components/styles/chat.css';

interface DirectConversation {
  userId: string;
  userName?: string;
  type: 'direct';
}

interface ListingConversation {
  listing_id: string;
  listing: { id: string; title: string };
  otherUserId: string;
  type: 'listing';
  lastMessageTime: string;
}

type Conversation = DirectConversation | ListingConversation;

export const ChatPage: React.FC = () => {
  const { user } = useAuthContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUsersList, setShowUsersList] = useState(true);

  const loadAllUsers = useCallback(async () => {
    if (!user) return;
    try {
      const users = await chatService.getAllUsers(user.id);
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [user]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const convs = await chatService.getUserConversations(user.id);
      setConversations(convs as Conversation[]);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadAllUsers();
    }
  }, [user, loadConversations, loadAllUsers]);

  const handleSelectUser = (selectedUser: User) => {
    const directConv: DirectConversation = {
      userId: selectedUser.id,
      userName: selectedUser.full_name,
      type: 'direct',
    };
    setSelectedConversation(directConv);
    setShowUsersList(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', height: '100vh' }}>
      <div style={{ background: 'white', borderRadius: '8px', padding: '20px', overflowY: 'auto' }}>
        <h2>Messages</h2>
        
        <button
          type="button"
          onClick={() => setShowUsersList(!showUsersList)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '15px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showUsersList ? 'View Conversations' : 'Message Users'}
        </button>

        {showUsersList ? (
          <div>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>All Users</h3>
            {loading ? (
              <p>Loading users...</p>
            ) : allUsers.length === 0 ? (
              <p style={{ color: '#999' }}>No users available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {allUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    style={{
                      padding: '10px',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      borderLeft: selectedConversation?.type === 'direct' && selectedConversation?.userId === u.id ? '3px solid #007bff' : '3px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <strong>{u.full_name || 'Unknown User'}</strong>
                    <div style={{ fontSize: '12px', color: '#999' }}>{u.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Conversations</h3>
            {loading ? (
              <p>Loading conversations...</p>
            ) : conversations.length === 0 ? (
              <p style={{ color: '#999' }}>No conversations yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {conversations.map((conv) => (
                  <div
                    key={conv.type === 'direct' ? conv.userId : conv.listing_id}
                    onClick={() => setSelectedConversation(conv)}
                    style={{
                      padding: '10px',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      borderLeft: selectedConversation === conv ? '3px solid #007bff' : '3px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <strong>
                      {conv.type === 'direct' ? conv.userName : conv.listing?.title || 'Listing (deleted)'}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '8px', padding: '20px' }}>
        {selectedConversation && user ? (
          selectedConversation.type === 'direct' ? (
            <DirectMessageChat
              currentUserId={user.id}
              otherUserId={selectedConversation.userId}
              otherUserName={selectedConversation.userName}
            />
          ) : selectedConversation.listing ? (
            <ListingMessageChat
              listingId={selectedConversation.listing_id}
              listingTitle={selectedConversation.listing.title || 'Untitled Listing'}
              currentUserId={user.id}
              otherUserId={selectedConversation.otherUserId}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
              This listing has been deleted
            </div>
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

const DirectMessageChat: React.FC<{
  currentUserId: string;
  otherUserId: string;
  otherUserName?: string;
}> = ({ currentUserId, otherUserId, otherUserName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const msgs = await chatService.getDirectMessages(otherUserId, currentUserId);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [otherUserId, currentUserId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to real-time direct messages
  useEffect(() => {
    const subscription = chatService.subscribeToDirectMessages(
      currentUserId,
      otherUserId,
      (newMsg: ChatMessage) => {
        setMessages((prev) => [...prev, newMsg]);
      }
    );

    return () => {
      chatService.unsubscribeFromMessages(subscription);
    };
  }, [currentUserId, otherUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await chatService.sendDirectMessage(currentUserId, otherUserId, newMessage);
      setNewMessage('');
      // The subscription will handle displaying the new message in real-time
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
        <h3>{otherUserName || 'User'}</h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
        {messages.length === 0 ? (
          <div style={{ color: '#999' }}>No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: '10px',
                display: 'flex',
                justifyContent: msg.sender_id === currentUserId ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '60%',
                  padding: '10px 15px',
                  background: msg.sender_id === currentUserId ? '#007bff' : '#e9ecef',
                  color: msg.sender_id === currentUserId ? 'white' : 'black',
                  borderRadius: '8px',
                }}
              >
                <p style={{ margin: 0 }}>{msg.message_text}</p>
                <small style={{ opacity: 0.7 }}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

const ListingMessageChat: React.FC<{
  listingId: string;
  listingTitle: string;
  currentUserId: string;
  otherUserId: string;
}> = ({ listingId, listingTitle, currentUserId, otherUserId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const msgs = await chatService.getMessages(listingId, otherUserId, currentUserId);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [listingId, otherUserId, currentUserId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to real-time listing messages
  useEffect(() => {
    const subscription = chatService.subscribeToMessages(
      listingId,
      currentUserId,
      otherUserId,
      (newMsg: ChatMessage) => {
        setMessages((prev) => [...prev, newMsg]);
      }
    );

    return () => {
      chatService.unsubscribeFromMessages(subscription);
    };
  }, [listingId, currentUserId, otherUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await chatService.sendMessage(listingId, currentUserId, otherUserId, newMessage);
      setNewMessage('');
      // The subscription will handle displaying the new message in real-time
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
        <h3>{listingTitle}</h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
        {messages.length === 0 ? (
          <div style={{ color: '#999' }}>No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: '10px',
                display: 'flex',
                justifyContent: msg.sender_id === currentUserId ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '60%',
                  padding: '10px 15px',
                  background: msg.sender_id === currentUserId ? '#007bff' : '#e9ecef',
                  color: msg.sender_id === currentUserId ? 'white' : 'black',
                  borderRadius: '8px',
                }}
              >
                <p style={{ margin: 0 }}>{msg.message_text}</p>
                <small style={{ opacity: 0.7 }}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};
