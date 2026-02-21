import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Listing } from '../../types';
import '../styles/listings.css';

interface ListingCardProps {
  listing: Listing;
  onViewDetails?: (id: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onViewDetails }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onViewDetails) {
      onViewDetails(listing.id);
    } else {
      navigate(`/listings/${listing.id}`);
    }
  };

  return (
    <div className="listing-card" onClick={handleClick}>
      {listing.image_url && (
        <div className="listing-image">
          <img src={listing.image_url} alt={listing.title} />
        </div>
      )}

      <div className="listing-content">
        <div className="listing-header">
          <h3>{listing.title}</h3>
          <span className={`status-badge status-${listing.status}`}>{listing.status}</span>
        </div>

        <p className="listing-category">{listing.category}</p>
        <p className="listing-description">{listing.description.substring(0, 100)}...</p>

        <div className="listing-footer">
          <span className="listing-price">₹{listing.price}</span>
          {listing.rendezvous_location && (
            <span className="listing-location">{listing.rendezvous_location}</span>
          )}
        </div>

        {listing.user && (
          <div className="listing-seller">
            <span>by {listing.user.full_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface ListingGridProps {
  listings: Listing[];
  loading?: boolean;
  onViewDetails?: (id: string) => void;
}

export const ListingGrid: React.FC<ListingGridProps> = ({
  listings,
  loading,
  onViewDetails,
}) => {
  if (loading) {
    return <div className="loading">Loading listings...</div>;
  }

  if (listings.length === 0) {
    return <div className="no-listings">No listings found</div>;
  }

  return (
    <div className="listing-grid">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};
