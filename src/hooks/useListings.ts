import { useEffect, useState } from 'react';
import { listingService } from '../services/listings';
import type { Listing, ListingFilters } from '../types';

export const useListings = (filters?: ListingFilters) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listingService.getListings(filters);
        setListings(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch listings';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filters?.category, filters?.searchQuery, filters?.minPrice, filters?.maxPrice]);

  return {
    listings,
    loading,
    error,
    refetch: async () => {
      const data = await listingService.getListings(filters);
      setListings(data);
    },
  };
};

export const useListing = (listingId: string) => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listingService.getListing(listingId);
        setListing(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch listing';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  return {
    listing,
    loading,
    error,
    refetch: async () => {
      const data = await listingService.getListing(listingId);
      setListing(data);
    },
  };
};

export const useUserListings = (userId: string) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listingService.getUserListings(userId);
        setListings(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch user listings';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [userId]);

  return {
    listings,
    loading,
    error,
    refetch: async () => {
      const data = await listingService.getUserListings(userId);
      setListings(data);
    },
  };
};
