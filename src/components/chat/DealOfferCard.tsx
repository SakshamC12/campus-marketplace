import React from 'react';
import type { DealOffer } from '../../types';

interface DealOfferCardProps {
  deal: DealOffer;
  currentUserId: string;
  onAccept: (dealId: string) => void;
  onReject: (dealId: string) => void;
  isProcessing: boolean;
}

export const DealOfferCard: React.FC<DealOfferCardProps> = ({
  deal,
  currentUserId,
  onAccept,
  onReject,
  isProcessing,
}) => {
  const isReceiver = deal.receiver_id === currentUserId;
  const isPending = deal.status === 'pending';
  const isAccepted = deal.status === 'accepted';
  const isRejected = deal.status === 'rejected';

  const statusColor = isAccepted ? '#4caf50' : isRejected ? '#f44336' : '#ff9800';
  const statusText = isAccepted ? 'Accepted' : isRejected ? 'Rejected' : 'Pending';

  return (
    <div
      style={{
        background: '#f9f9f9',
        border: `2px solid ${statusColor}`,
        borderRadius: '8px',
        padding: '12px',
        margin: '8px 0',
        maxWidth: '400px',
      }}
    >
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
        <strong>{deal.sender?.full_name}</strong> offered a deal
      </div>

      <div
        style={{
          background: 'white',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px',
        }}
      >
        <div style={{ fontSize: '14px', marginBottom: '6px' }}>
          <strong>💰 ₹{deal.offered_price.toFixed(2)}</strong>
          {deal.listing?.price && deal.offered_price !== deal.listing.price && (
            <span style={{ color: '#666', marginLeft: '8px', fontSize: '12px' }}>
              (Original: ₹{deal.listing.price.toFixed(2)})
            </span>
          )}
        </div>

        {deal.message && (
          <div style={{ fontSize: '13px', color: '#333', fontStyle: 'italic' }}>
            "{deal.message}"
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: '12px',
          color: statusColor,
          fontWeight: 'bold',
          marginBottom: '10px',
        }}
      >
        Status: {statusText}
      </div>

      {isReceiver && isPending && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onAccept(deal.id)}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              opacity: isProcessing ? 0.6 : 1,
            }}
          >
            {isProcessing ? 'Processing...' : 'Accept'}
          </button>
          <button
            onClick={() => onReject(deal.id)}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              opacity: isProcessing ? 0.6 : 1,
            }}
          >
            {isProcessing ? 'Processing...' : 'Reject'}
          </button>
        </div>
      )}
    </div>
  );
};
