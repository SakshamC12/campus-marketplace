import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '0', height: '100vh', background: '#f5f5f5', overflow: 'hidden' }}>
      {/* Sidebar - Conversations & Users */}
      <div style={{ 
        background: 'white', 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid #e0e0e0',
        minHeight: '0'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>Messages</h2>
          <button
            type="button"
            onClick={() => setShowUsersList(!showUsersList)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {showUsersList ? 'View Conversations' : 'Message Users'}
          </button>
        </div>

        {/* Scrollable list */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: '0'
        }}>
          {showUsersList ? (
            <div style={{ padding: '12px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '10px', marginTop: '0', color: '#666' }}>All Users</h3>
              {loading ? (
                <p style={{ color: '#999', fontSize: '14px' }}>Loading users...</p>
              ) : allUsers.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px' }}>No users available</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {allUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      style={{
                        padding: '12px',
                        background: selectedConversation?.type === 'direct' && (selectedConversation as DirectConversation)?.userId === u.id ? '#e3f2fd' : '#f9f9f9',
                        borderLeft: selectedConversation?.type === 'direct' && (selectedConversation as DirectConversation)?.userId === u.id ? '3px solid #007bff' : '3px solid transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <strong style={{ fontSize: '14px', display: 'block' }}>{u.full_name || 'Unknown User'}</strong>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{u.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '12px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '10px', marginTop: '0', color: '#666' }}>Conversations</h3>
              {loading ? (
                <p style={{ color: '#999', fontSize: '14px' }}>Loading conversations...</p>
              ) : conversations.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px' }}>No conversations yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {conversations.map((conv) => (
                    <div
                      key={conv.type === 'direct' ? (conv as DirectConversation).userId : (conv as ListingConversation).listing_id}
                      onClick={() => setSelectedConversation(conv)}
                      style={{
                        padding: '12px',
                        background: selectedConversation === conv ? '#e3f2fd' : '#f9f9f9',
                        borderLeft: selectedConversation === conv ? '3px solid #007bff' : '3px solid transparent',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <strong style={{ fontSize: '14px', display: 'block' }}>
                        {conv.type === 'direct' ? (conv as DirectConversation).userName : (conv as ListingConversation).listing?.title || 'Listing'}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'white',
        minHeight: '0',
        margin: '12px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {selectedConversation && user ? (
          selectedConversation.type === 'direct' ? (
            <DirectMessageChat
              currentUserId={user.id}
              otherUserId={(selectedConversation as DirectConversation).userId}
              otherUserName={(selectedConversation as DirectConversation).userName}
            />
          ) : (selectedConversation as ListingConversation).listing ? (
            <ListingMessageChat
              listingId={(selectedConversation as ListingConversation).listing_id}
              listingTitle={(selectedConversation as ListingConversation).listing?.title || 'Untitled Listing'}
              currentUserId={user.id}
              otherUserId={(selectedConversation as ListingConversation).otherUserId}
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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

  // Load messages once on component mount or when conversation changes
  useEffect(() => {
    loadMessages();
  }, [otherUserId, currentUserId, loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Subscribe to real-time direct messages
  useEffect(() => {
    console.log('Setting up direct message subscription for', { currentUserId, otherUserId });
    const subscription = chatService.subscribeToDirectMessages(
      currentUserId,
      otherUserId,
      (newMsg: ChatMessage) => {
        console.log('Received new direct message:', newMsg);
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    );

    return () => {
      subscription.unsubscribe().catch(() => {
        // Ignore errors on unsubscribe
      });
    };
  }, [currentUserId, otherUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const sentMessage = await chatService.sendDirectMessage(currentUserId, otherUserId, newMessage);
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
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0' }}>
      {/* Header */}
      <div style={{ 
        background: '#007bff',
        color: 'white',
        padding: '16px 20px',
        minHeight: '50px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{otherUserName || 'User'}</h3>
      </div>

      {/* Messages Container */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: '0',
        padding: '12px 16px 8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
            No messages yet
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.sender_id === currentUserId ? 'flex-end' : 'flex-start',
                marginBottom: '4px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  background: msg.sender_id === currentUserId ? '#007bff' : '#e9ecef',
                  color: msg.sender_id === currentUserId ? 'white' : 'black',
                  borderRadius: '12px',
                  wordWrap: 'break-word',
                }}
              >
                <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{msg.message_text}</p>
                <small style={{ opacity: 0.7, fontSize: '12px' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          ))
        )}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} style={{ 
        display: 'flex', 
        gap: '10px',
        padding: '12px 16px 16px 16px',
        borderTop: '1px solid #eee',
        minHeight: 'auto',
        flexShrink: 0
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ 
            flex: 1, 
            padding: '10px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none'
          }}
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
            fontSize: '14px',
            fontWeight: '500',
            flexShrink: 0
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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

  // Load messages once on component mount or when conversation changes
  useEffect(() => {
    loadMessages();
  }, [listingId, otherUserId, currentUserId, loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Subscribe to real-time listing messages
  useEffect(() => {
    console.log('Setting up listing message subscription for', { listingId, currentUserId, otherUserId });
    const subscription = chatService.subscribeToMessages(
      listingId,
      currentUserId,
      otherUserId,
      (newMsg: ChatMessage) => {
        console.log('Received new listing message:', newMsg);
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    );

    return () => {
      subscription.unsubscribe().catch(() => {
        // Ignore errors on unsubscribe
      });
    };
  }, [listingId, currentUserId, otherUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const sentMessage = await chatService.sendMessage(listingId, currentUserId, otherUserId, newMessage);
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
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0' }}>
      {/* Header */}
      <div style={{ 
        background: '#007bff',
        color: 'white',
        padding: '16px 20px',
        minHeight: '50px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{listingTitle}</h3>
      </div>

      {/* Messages Container */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: '0',
        padding: '12px 16px 8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
            No messages yet
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.sender_id === currentUserId ? 'flex-end' : 'flex-start',
                marginBottom: '4px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  background: msg.sender_id === currentUserId ? '#007bff' : '#e9ecef',
                  color: msg.sender_id === currentUserId ? 'white' : 'black',
                  borderRadius: '12px',
                  wordWrap: 'break-word',
                }}
              >
                <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{msg.message_text}</p>
                <small style={{ opacity: 0.7, fontSize: '12px' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          ))
        )}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} style={{ 
        display: 'flex', 
        gap: '10px',
        padding: '12px 16px 16px 16px',
        borderTop: '1px solid #eee',
        minHeight: 'auto',
        flexShrink: 0
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ 
            flex: 1, 
            padding: '10px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none'
          }}
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
            fontSize: '14px',
            fontWeight: '500',
            flexShrink: 0
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};
