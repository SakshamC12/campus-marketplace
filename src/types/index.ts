// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  profile_image_url?: string;
  bio?: string;
  phone?: string;
  campus_location?: string;
  role?: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

// Listing types
export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  image_url?: string;
  status: 'available' | 'sold' | 'pending';
  rendezvous_location?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  image_url: string;
  uploaded_at: string;
}

// Report types
export interface Report {
  id: string;
  listing_id: string;
  reported_by_user_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
}

// Deal Offer types
export interface DealOffer {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  offered_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender?: User;
  receiver?: User;
  listing?: Listing;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_listing_id?: string;
  related_user_id?: string;
  is_read: boolean;
  created_at: string;
  expires_at: string;
}

// Favorite types
export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
}

// Filter types
export interface ListingFilters {
  category?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: 'available' | 'sold' | 'pending';
}

