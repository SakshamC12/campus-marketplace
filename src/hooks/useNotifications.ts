import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { notificationService } from '../services/notifications';
import type { Notification } from '../types';

export const useNotifications = (userId: string | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive unread count from notifications array (single source of truth)
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await notificationService.getNotifications(userId);
        setNotifications(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to real-time notifications (INSERT and UPDATE)
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );
        }
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe();
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    // Optimistic update - update local state immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );

    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert optimistic update on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: false } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    
    // Optimistic update - update local state immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await notificationService.markAllNotificationsAsRead(userId);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Revert optimistic update on failure - fetch fresh data
      const data = await notificationService.getNotifications(userId);
      setNotifications(data);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  };
};
