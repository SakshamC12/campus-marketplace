import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { useAuthContext } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { reportService } from '../services/reports';
import { favoriteService } from '../services/favorites';
import { listingService, RENDEZVOUS_LOCATIONS } from '../services/listings';
import { ChatUI } from '../components/chat/ChatUI';
import '../components/styles/listings.css';

export const ListingDetailPage: React.FC = () => {
  const { id: listingId } = useParams<{ id: string }>();
  const { listing, loading, error, refetch } = useListing(listingId || '');
  const { user } = useAuthContext();
  const { addAlert } = useAlert();
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentListing, setCurrentListing] = useState(listing);

  React.useEffect(() => {
    if (listingId && user) {
      favoriteService.isFavorited(user.id, listingId).then(setIsFavorited);
    }
  }, [listingId, user]);

  React.useEffect(() => {
    if (listing) {
      setCurrentListing(listing);
    }
  }, [listing]);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading listing...</div>;
  }

  if (error || !currentListing) {
    return <div style={{ padding: '20px', color: 'red' }}>Failed to load listing</div>;
  }

  const isOwner = user?.id === currentListing.user_id;

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportReason) {
      addAlert('Please fill in all fields', 'error');
      return;
    }

    setSubmittingReport(true);
    try {
      await reportService.createReport(
        listingId || '',
        user.id,
        reportReason,
        reportDescription
      );
      addAlert('Report submitted successfully', 'success');
      setShowReportForm(false);
      setReportReason('');
      setReportDescription('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit report';
      addAlert(message, 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return;

    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(user.id, listingId || '');
        setIsFavorited(false);
        addAlert('Removed from favorites', 'success');
      } else {
        await favoriteService.addFavorite(user.id, listingId || '');
        setIsFavorited(true);
        addAlert('Added to favorites', 'success');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update favorite';
      addAlert(message, 'error');
    }
  };

  const handleStatusChange = async (newStatus: 'available' | 'sold') => {
    if (!listingId) return;

    setUpdatingStatus(true);
    try {
      const updatedListing = newStatus === 'sold'
        ? await listingService.markAsSold(listingId)
        : await listingService.markAsAvailable(listingId);

      setCurrentListing(updatedListing);
      addAlert(
        `Listing marked as ${newStatus}`,
        'success'
      );

      // Refetch to ensure consistency
      if (refetch) {
        await refetch();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update listing status';
      addAlert(message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>
        ← Back to Listings
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div>
          {currentListing.image_url && (
            <img
              src={currentListing.image_url}
              alt={currentListing.title}
              style={{
                width: '100%',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            />
          )}
        </div>

        <div>
          <h1>{currentListing.title}</h1>
          <p style={{ fontSize: '14px', color: '#999' }}>{currentListing.category}</p>
          <h2 style={{ color: '#667eea', marginBottom: '20px' }}>₹{currentListing.price}</h2>

          <div style={{ marginBottom: '20px' }}>
            <p>
              <strong>Status:</strong>{' '}
              <span
                style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: currentListing.status === 'available' ? '#22c55e' : '#ef4444',
                  backgroundColor: currentListing.status === 'available' ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${currentListing.status === 'available' ? '#dcfce7' : '#fee2e2'}`,
                }}
              >
                {currentListing.status.charAt(0).toUpperCase() + currentListing.status.slice(1)}
              </span>
            </p>
            <p>
              <strong>Location:</strong>{' '}
              {currentListing.rendezvous_location ? (
                RENDEZVOUS_LOCATIONS[currentListing.rendezvous_location as keyof typeof RENDEZVOUS_LOCATIONS] ? (
                  <a
                    href={RENDEZVOUS_LOCATIONS[currentListing.rendezvous_location as keyof typeof RENDEZVOUS_LOCATIONS]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#667eea', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {currentListing.rendezvous_location}
                  </a>
                ) : (
                  currentListing.rendezvous_location
                )
              ) : (
                'Not specified'
              )}
            </p>
            {currentListing.user && (
              <p>
                <strong>Seller:</strong> {currentListing.user.full_name}
              </p>
            )}
          </div>

          <p style={{ marginBottom: '20px' }}>{currentListing.description}</p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {!isOwner && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowChat(!showChat)}
                >
                  {showChat ? 'Hide Chat' : 'Contact Seller'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleToggleFavorite}
                >
                  {isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
                </button>
              </>
            )}

            {isOwner && currentListing.status === 'available' && (
              <button
                className="btn btn-primary"
                onClick={() => handleStatusChange('sold')}
                disabled={updatingStatus}
              >
                {updatingStatus ? 'Updating...' : '✓ Mark as Sold'}
              </button>
            )}

            {isOwner && currentListing.status === 'sold' && (
              <button
                className="btn btn-secondary"
                onClick={() => handleStatusChange('available')}
                disabled={updatingStatus}
                style={{ backgroundColor: '#22c55e' }}
              >
                {updatingStatus ? 'Updating...' : '↻ Mark as Available'}
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => setShowReportForm(!showReportForm)}
            >
              {showReportForm ? 'Cancel Report' : '🚩 Report'}
            </button>
          </div>

          {showReportForm && (
            <form
              onSubmit={handleReport}
              style={{
                padding: '20px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="reason">
                  <strong>Report Reason</strong>
                </label>
                <select
                  id="reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '5px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                >
                  <option value="">Select a reason</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="fake_listing">Fake Listing</option>
                  <option value="spam">Spam</option>
                  <option value="scam">Scam/Fraud</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="description">
                  <strong>Description (Optional)</strong>
                </label>
                <textarea
                  id="description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide additional details..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginTop: '5px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingReport}
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          )}
        </div>
      </div>

      {showChat && !isOwner && currentListing.user && (
        <div style={{ marginTop: '40px' }}>
          <ChatUI
            listingId={listingId || ''}
            currentUserId={user?.id || ''}
            otherUserId={currentListing.user_id}
            otherUserName={currentListing.user.full_name}
          />
        </div>
      )}
    </div>
  );
};
