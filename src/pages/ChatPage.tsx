import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext.tsx';
import { chatService } from '../services/chat.ts';
import { dealService } from '../services/deals.ts';
import { listingService } from '../services/listings.ts';
import { DealOfferCard } from '../components/chat/DealOfferCard.tsx';
import { OfferDealModal } from '../components/chat/OfferDealModal.tsx';
import { useAlert } from '../contexts/AlertContext.tsx';
import type { ChatMessage, DealOffer, Listing } from '../types/index.ts';
import '../components/styles/chat.css';

interface ListingConversation {
  listing_id: string;
  listing: { id: string; title: string } | null;
  otherUserId: string;
  type: 'listing';
  lastMessageTime: string;
}

export const ChatPage: React.FC = () => {
  const { user } = useAuthContext();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ListingConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ListingConversation | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const convs = await chatService.getUserConversations(user.id);
      setConversations(convs as ListingConversation[]);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Auto-select conversation based on URL params
  useEffect(() => {
    if (conversations.length > 0 && !loading) {
      const userParam = searchParams.get('user');
      const listingParam = searchParams.get('listing');
      
      if (userParam && listingParam) {
        const matchingConversation = conversations.find(
          conv => conv.otherUserId === userParam && conv.listing_id === listingParam
        );
        if (matchingConversation) {
          setSelectedConversation(matchingConversation);
        }
      }
    }
  }, [conversations, loading, searchParams]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '0', height: 'calc(100vh - 60px)', background: '#f5f5f5', overflow: 'hidden' }}>
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
          <h2 style={{ margin: '0', fontSize: '20px' }}>Active Conversations</h2>
        </div>

        {/* Scrollable conversations list */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: '0'
        }}>
          <div style={{ padding: '12px' }}>
            {loading ? (
              <p style={{ color: '#999', fontSize: '14px' }}>Loading conversations...</p>
            ) : conversations.length === 0 ? (
              <p style={{ color: '#999', fontSize: '14px' }}>
                No conversations yet. Click "Contact Seller" on a listing to start messaging.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {conversations.map((conv) => (
                  <div
                    key={`${conv.listing_id}-${conv.otherUserId}`}
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
                      {conv.listing?.title || '(Listing deleted)'}
                    </strong>
                    <small style={{ color: '#999', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {new Date(conv.lastMessageTime).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          selectedConversation.listing ? (
            <ListingMessageChat
              listingId={selectedConversation.listing_id}
              listingTitle={selectedConversation.listing.title}
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

const ListingMessageChat: React.FC<{
  listingId: string;
  listingTitle: string;
  currentUserId: string;
  otherUserId: string;
}> = ({ listingId, listingTitle, currentUserId, otherUserId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [deals, setDeals] = useState<DealOffer[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isDealProcessing, setIsDealProcessing] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dealsSubscriptionRef = useRef<any>(null);
  const { addAlert } = useAlert();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const msgs = await chatService.getMessages(listingId, otherUserId, currentUserId);
      const dealsData = await dealService.getDealOffers(listingId, currentUserId, otherUserId);
      const listingData = await listingService.getListing(listingId);
      setMessages(msgs);
      setDeals(dealsData);
      setListing(listingData);
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
  }, [messages, deals, scrollToBottom]);

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

  // Subscribe to deal offers
  useEffect(() => {
    if (dealsSubscriptionRef.current) {
      dealsSubscriptionRef.current.unsubscribe().catch((err: any) => {
        console.warn('Error unsubscribing from deals:', err);
      });
    }

    const dealsChannel = dealService.subscribeToDeals(
      listingId,
      currentUserId,
      otherUserId,
      (deal) => {
        console.log('Received deal from subscription:', deal);
        setDeals((prev) => {
          const existingIndex = prev.findIndex((d) => d.id === deal.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = deal;
            return updated;
          }
          return [...prev, deal];
        });
      }
    );

    dealsSubscriptionRef.current = dealsChannel;

    return () => {
      if (dealsSubscriptionRef.current) {
        dealsSubscriptionRef.current.unsubscribe().catch((err: any) => {
          console.warn('Error during deals subscription cleanup:', err);
        });
      }
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

  const handleCreateDealOffer = async (offeredPrice: number, message: string) => {
    try {
      setIsDealProcessing(true);
      const deal = await dealService.createDealOffer(
        listingId,
        currentUserId,
        otherUserId,
        offeredPrice,
        message
      );
      setDeals((prev) => [...prev, deal]);
      addAlert('Deal offer sent!', 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create offer';
      console.error('Error creating offer:', error);
      addAlert(msg, 'error');
      throw error;
    } finally {
      setIsDealProcessing(false);
    }
  };

  const handleAcceptDeal = async (dealId: string) => {
    try {
      setIsDealProcessing(true);
      const updatedDeal = await dealService.acceptDealOffer(dealId, currentUserId);
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? updatedDeal : d))
      );
      addAlert('Deal accepted! ✓', 'success');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to accept deal';
      console.error('Error accepting deal:', error);
      addAlert(msg, 'error');
    } finally {
      setIsDealProcessing(false);
    }
  };

  const handleRejectDeal = async (dealId: string) => {
    try {
      setIsDealProcessing(true);
      const updatedDeal = await dealService.rejectDealOffer(dealId, currentUserId);
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? updatedDeal : d))
      );
      addAlert('Deal rejected', 'info');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to reject deal';
      console.error('Error rejecting deal:', error);
      addAlert(msg, 'error');
    } finally {
      setIsDealProcessing(false);
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
        ) : (messages.length === 0 && deals.length === 0) ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
            No messages yet
          </div>
        ) : (
          (() => {
            const allItems = [
              ...messages.map((m) => ({ type: 'message' as const, data: m, time: m.created_at })),
              ...deals.map((d) => ({ type: 'deal' as const, data: d, time: d.created_at })),
            ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

            return allItems.map((item) => {
              if (item.type === 'message') {
                const msg = item.data as ChatMessage;
                return (
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
                );
              } else {
                const deal = item.data as DealOffer;
                return (
                  <div
                    key={deal.id}
                    style={{
                      display: 'flex',
                      justifyContent: deal.sender_id === currentUserId ? 'flex-end' : 'flex-start',
                      marginBottom: '8px',
                    }}
                  >
                    <DealOfferCard
                      deal={deal}
                      currentUserId={currentUserId}
                      onAccept={handleAcceptDeal}
                      onReject={handleRejectDeal}
                      isProcessing={isDealProcessing}
                    />
                  </div>
                );
              }
            });
          })()
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
        flexShrink: 0,
        flexWrap: 'wrap'
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
            outline: 'none',
            minWidth: '200px'
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
        {currentUserId !== listing?.user_id && listing?.price && (
          <button
            type="button"
            onClick={() => setIsOfferModalOpen(true)}
            style={{
              padding: '10px 16px',
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            💰 Offer Deal
          </button>
        )}
      </form>

      <OfferDealModal
        isOpen={isOfferModalOpen}
        originalPrice={listing?.price || 0}
        onSubmit={handleCreateDealOffer}
        onClose={() => setIsOfferModalOpen(false)}
      />
    </div>
  );
};
