import React, { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../../services/chat';
import { dealService } from '../../services/deals';
import { useAlert } from '../../contexts/AlertContext';
import type { ChatMessage, DealOffer } from '../../types';
import { DealOfferCard } from './DealOfferCard';
import { OfferDealModal } from './OfferDealModal';
import '../styles/chat.css';

interface ChatUIProps {
  listingId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName?: string;
  listingPrice?: number;
  listingSellerId?: string;
}

export const ChatUI: React.FC<ChatUIProps> = ({
  listingId,
  currentUserId,
  otherUserId,
  otherUserName,
  listingPrice = 0,
  listingSellerId = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [deals, setDeals] = useState<DealOffer[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isDealProcessing, setIsDealProcessing] = useState(false);
  const { addAlert } = useAlert();
  const subscriptionRef = useRef<any>(null);
  const dealsSubscriptionRef = useRef<any>(null);

  const loadMessages = useCallback(async () => {
    try {
      console.log('[ChatUI] Loading messages for listing:', listingId, 'users:', currentUserId, otherUserId);
      setLoading(true);
      const msgs = await chatService.getMessages(listingId, otherUserId, currentUserId);
      const dealsData = await dealService.getDealOffers(listingId, currentUserId, otherUserId);
      console.log('[ChatUI] Messages loaded:', msgs.length, 'Deals loaded:', dealsData.length);
      setMessages(msgs);
      setDeals(dealsData);
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

  // Subscribe to deal offers
  useEffect(() => {
    if (dealsSubscriptionRef.current) {
      dealsSubscriptionRef.current.unsubscribe().catch((err: any) => {
        console.warn('[ChatUI] Error unsubscribing from deals:', err);
      });
    }

    const dealsChannel = dealService.subscribeToDeals(
      listingId,
      currentUserId,
      otherUserId,
      (deal) => {
        console.log('[ChatUI] Received deal from subscription:', deal);
        setDeals((prev) => {
          const existingIndex = prev.findIndex((d) => d.id === deal.id);
          if (existingIndex >= 0) {
            // Update existing deal
            const updated = [...prev];
            updated[existingIndex] = deal;
            return updated;
          }
          // Add new deal
          return [...prev, deal];
        });
      }
    );

    dealsSubscriptionRef.current = dealsChannel;

    return () => {
      if (dealsSubscriptionRef.current) {
        dealsSubscriptionRef.current.unsubscribe().catch((err: any) => {
          console.warn('[ChatUI] Error during deals subscription cleanup:', err);
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
      const message = error instanceof Error ? error.message : 'Failed to create offer';
      console.error('[ChatUI] Error creating offer:', error);
      addAlert(message, 'error');
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
      const message = error instanceof Error ? error.message : 'Failed to accept deal';
      console.error('[ChatUI] Error accepting deal:', error);
      addAlert(message, 'error');
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
      const message = error instanceof Error ? error.message : 'Failed to reject deal';
      console.error('[ChatUI] Error rejecting deal:', error);
      addAlert(message, 'error');
    } finally {
      setIsDealProcessing(false);
    }
  };

  if (loading) {
    return <div className="chat-loading">Loading messages...</div>;
  }

  // Combine messages and deals sorted by time
  const allItems = [
    ...messages.map((m) => ({ type: 'message' as const, data: m, time: m.created_at })),
    ...deals.map((d) => ({ type: 'deal' as const, data: d, time: d.created_at })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const isBuyer = currentUserId !== listingSellerId;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat with {otherUserName || 'User'}</h3>
      </div>

      <div className="chat-messages">
        {allItems.length === 0 ? (
          <div className="no-messages">No messages yet. Start a conversation!</div>
        ) : (
          allItems.map((item) => {
            if (item.type === 'message') {
              const msg = item.data as ChatMessage;
              return (
                <div
                  key={msg.id}
                  className={`chat-message ${
                    msg.sender_id === currentUserId ? 'sent' : 'received'
                  }`}
                >
                  <p>{msg.message_text}</p>
                  <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
                </div>
              );
            } else {
              const deal = item.data as DealOffer;
              return (
                <div
                  key={deal.id}
                  className={`chat-message ${
                    deal.sender_id === currentUserId ? 'sent' : 'received'
                  }`}
                  style={{ padding: '0', background: 'transparent', marginLeft: '0', marginRight: '0' }}
                >
                  <div style={{ display: 'flex', justifyContent: deal.sender_id === currentUserId ? 'flex-end' : 'flex-start' }}>
                    <DealOfferCard
                      deal={deal}
                      currentUserId={currentUserId}
                      onAccept={handleAcceptDeal}
                      onReject={handleRejectDeal}
                      isProcessing={isDealProcessing}
                    />
                  </div>
                </div>
              );
            }
          })
        )}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #ddd', display: 'flex', gap: '8px' }}>
        <form onSubmit={handleSendMessage} className="chat-input-form" style={{ flex: 1 }}>
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

        {isBuyer && listingPrice > 0 && (
          <button
            onClick={() => setIsOfferModalOpen(true)}
            style={{
              padding: '8px 16px',
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            💰 Offer Deal
          </button>
        )}
      </div>

      <OfferDealModal
        isOpen={isOfferModalOpen}
        originalPrice={listingPrice}
        onSubmit={handleCreateDealOffer}
        onClose={() => setIsOfferModalOpen(false)}
      />
    </div>
  );
};
