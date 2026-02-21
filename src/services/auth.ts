import { supabase } from './supabase';
import type { AuthUser, User } from '../types';

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, fullName: string) {
    // Validate email domain
    if (!email.endsWith('@srmist.edu.in')) {
      throw new Error('Only SRM IST students with @srmist.edu.in emails are allowed');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw error;
    }

    // Create user profile - wrap in try-catch as this may fail due to RLS policies
    if (data.user) {
      try {
        await this.createUserProfile(data.user.id, email, fullName);
      } catch (profileError) {
        console.warn('Profile creation delayed: will retry on next login', profileError);
        // Don't throw here - signup should succeed even if profile creation is delayed
      }
    }

    return data;
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Ensure user profile exists
    if (data.user) {
      try {
        const existingProfile = await this.getUserProfile(data.user.id);
        if (!existingProfile) {
          await this.createUserProfile(
            data.user.id,
            data.user.email || email,
            data.user.user_metadata?.full_name || ''
          );
        }
      } catch (error) {
        console.warn('Error ensuring user profile exists:', error);
        // Continue anyway - profile will be created on next attempt
      }
    }

    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }

    // Ensure profile exists for this user
    try {
      const existingProfile = await this.getUserProfile(data.user.id);
      if (!existingProfile) {
        await this.createUserProfile(
          data.user.id,
          data.user.email || '',
          data.user.user_metadata?.full_name || ''
        );
      }
    } catch (error) {
      console.warn('Could not ensure user profile exists:', error);
      // Continue anyway
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
    };
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  // Create or update user profile
  async createUserProfile(userId: string, email: string, fullName: string) {
    const { error } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Set up auth state listener
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const unsubscribe = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        callback(null);
      }
    });

    return unsubscribe.data.subscription;
  },

  // Password reset
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw error;
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  },
};