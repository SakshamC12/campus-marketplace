import React, { useState } from 'react';
import { listingService } from '../../services/listings';
import { useAlert } from '../../contexts/AlertContext';
import type { Listing } from '../../types';
import '../styles/listings.css';

interface ListingFormProps {
  userId: string;
  onSuccess?: (listing: Listing) => void;
  onCancel?: () => void;
}

export const ListingForm: React.FC<ListingFormProps> = ({ userId, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { addAlert } = useAlert();

  const categories = listingService.getCategories();
  const campusLocations = listingService.getCampusLocations();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create listing
      let imageUrl = '';
      const listing = await listingService.createListing(userId, {
        title,
        description,
        category,
        price: parseFloat(price),
        rendezvous_location: location,
        image_url: imageUrl,
        status: 'available',
        user_id: userId,
      });

      // Upload image if provided
      if (image) {
        imageUrl = await listingService.uploadListingImage(listing.id, image);
        await listingService.updateListing(listing.id, { image_url: imageUrl });
      }

      addAlert('Listing created successfully!', 'success');
      if (onSuccess) {
        onSuccess(listing);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setPrice('');
      setLocation('');
      setImage(null);
      setImagePreview('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create listing';
      addAlert(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="listing-form">
      <h3>Create New Listing</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Item title"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your item"
            rows={4}
            required
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (₹)</label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Rendezvous Location</label>
          <select
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a location</option>
            {campusLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="image">Image</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
