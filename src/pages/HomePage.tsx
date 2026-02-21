import React, { useState } from 'react';
import { useListings } from '../hooks/useListings';
import { listingService } from '../services/listings';
import { ListingGrid } from '../components/listings/ListingCard';
import type { ListingFilters } from '../types';
import '../components/styles/listings.css';

export const HomePage: React.FC = () => {
  const [filters, setFilters] = useState<ListingFilters>({});
  const { listings, loading } = useListings(filters);

  const categories = listingService.getCategories();

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      category: e.target.value || undefined,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: e.target.value || undefined,
    }));
  };

  const handlePriceRangeChange = (
    minOrMax: 'minPrice' | 'maxPrice',
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [minOrMax]: value ? parseFloat(value) : undefined,
    }));
  };

  return (
    <div>
      <h1>Browse Campus Marketplace</h1>

      <div className="search-filter-container">
        <form className="search-filter-form">
          <div className="filter-group">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search listings..."
              onChange={handleSearchChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select id="category" onChange={handleCategoryChange}>
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="minPrice">Min Price</label>
            <input
              id="minPrice"
              type="number"
              placeholder="₹0"
              onChange={(e) => handlePriceRangeChange('minPrice', e.target.value)}
              min="0"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="maxPrice">Max Price</label>
            <input
              id="maxPrice"
              type="number"
              placeholder="₹10000"
              onChange={(e) => handlePriceRangeChange('maxPrice', e.target.value)}
              min="0"
            />
          </div>
        </form>
      </div>

      <ListingGrid listings={listings} loading={loading} />
    </div>
  );
};
