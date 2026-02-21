import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { ListingForm } from '../components/listings/ListingForm';

export const CreateListingPage: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  if (!user) {
    return <div>Please log in to create a listing</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Create New Listing</h1>
      <ListingForm
        userId={user.id}
        onSuccess={() => navigate('/')}
        onCancel={() => navigate('/')}
      />
    </div>
  );
};
