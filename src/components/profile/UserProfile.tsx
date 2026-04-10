import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useUserListings } from '../../hooks/useListings';
import { useAlert } from '../../contexts/AlertContext';
import '../styles/profile.css';

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, updateProfile, logout } = useAuthContext();
  const { listings } = useUserListings(user?.id || '');
  const { addAlert } = useAlert();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    bio: userProfile?.bio || '',
    phone: userProfile?.phone || '',
    campus_location: userProfile?.campus_location || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
      addAlert('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      addAlert(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      addAlert('Logged out successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to logout';
      addAlert(message, 'error');
    }
  };

  if (!userProfile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-info">
          <h2>{userProfile.full_name}</h2>
          <p className="profile-email">{userProfile.email}</p>

          {isEditing ? (
            <div className="profile-edit-form">
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="campus_location">Campus Location</label>
                <input
                  id="campus_location"
                  name="campus_location"
                  type="text"
                  value={formData.campus_location}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-details">
                {userProfile.bio && <p><strong>Bio:</strong> {userProfile.bio}</p>}
                {userProfile.phone && <p><strong>Phone:</strong> {userProfile.phone}</p>}
                {userProfile.campus_location && (
                  <p><strong>Campus Location:</strong> {userProfile.campus_location}</p>
                )}
              </div>

              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-listings">
        <h3>My Listings ({listings.length})</h3>
        {listings.length === 0 ? (
          <p>You haven't created any listings yet.</p>
        ) : (
          <div
            className="listings-summary"
            onClick={() => navigate('/my-listings')}
            style={{
              cursor: 'pointer',
              padding: '20px',
              backgroundColor: '#f0f4ff',
              borderRadius: '8px',
              border: '2px solid #667eea',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e3ebff';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f4ff';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#667eea' }}>
              You have {listings.length} active listing(s) →
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#666' }}>
              Click to view and manage all your listings
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
