import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useUserListings } from '../hooks/useListings';
import { ListingCard } from '../components/listings/ListingCard';
import '../components/styles/listings.css';

export const MyListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { listings, loading, error } = useUserListings(user?.id || '');
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all');

  if (!user) {
    return <div style={{ padding: '20px' }}>Please log in to view your listings</div>;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading your listings...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error loading listings: {error}</div>;
  }

  const filteredListings = listings.filter((listing) => {
    if (filter === 'available') return listing.status === 'available';
    if (filter === 'sold') return listing.status === 'sold';
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>My Listings ({listings.length})</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/create-listing')}
        >
          + Create New Listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}
        >
          <h2 style={{ color: '#666', marginBottom: '10px' }}>You have no listings yet</h2>
          <p style={{ color: '#999', marginBottom: '20px' }}>
            Start selling by creating your first listing!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/create-listing')}
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All ({listings.length})
            </button>
            <button
              className={`btn ${filter === 'available' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('available')}
            >
              Available ({listings.filter((l) => l.status === 'available').length})
            </button>
            <button
              className={`btn ${filter === 'sold' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('sold')}
            >
              Sold ({listings.filter((l) => l.status === 'sold').length})
            </button>
          </div>

          {filteredListings.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
              }}
            >
              <p style={{ color: '#666' }}>No {filter} listings to display</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px',
              }}
            >
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onViewDetails={(id) => navigate(`/listings/${id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
