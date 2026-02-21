import { useEffect, useState } from 'react';
import { authService } from '../services/auth';
import type { AuthUser, User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const profile = await authService.getUserProfile(currentUser.id);
          setUserProfile(profile);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize auth';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const subscription = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      if (authUser) {
        authService.getUserProfile(authUser.id).then(setUserProfile);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      setError(null);
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to logout';
      setError(message);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    try {
      setError(null);
      const updated = await authService.updateUserProfile(user.id, updates);
      setUserProfile(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    }
  };

  return {
    user,
    userProfile,
    loading,
    error,
    logout,
    updateProfile,
  };
};
