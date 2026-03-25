import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { notificationService } from '../services/notifications';
import type { Notification } from '../types';

export const useNotifications = (userId: string | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // Calculate unread count from the fetched notifications
        const unread = data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
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
          if (!newNotification.is_read) {
            setUnreadCount((prev) => prev + 1);
          }
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
          setNotifications((prev) => {
            const updated = prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n));
            // Recalculate unread count
            const newUnreadCount = updated.filter(n => !n.is_read).length;
            setUnreadCount(newUnreadCount);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe();
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) => {
      const updated = prev.map((n) => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      // Recalculate unread count
      const newUnreadCount = updated.filter(n => !n.is_read).length;
      setUnreadCount(newUnreadCount);
      return updated;
    });

    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert optimistic update on failure
      setNotifications((prev) => {
        const reverted = prev.map((n) => 
          n.id === notificationId ? { ...n, is_read: false } : n
        );
        const newUnreadCount = reverted.filter(n => !n.is_read).length;
        setUnreadCount(newUnreadCount);
        return reverted;
      });
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    
    // Optimistic update
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, is_read: true }));
      setUnreadCount(0);
      return updated;
    });

    try {
      await notificationService.markAllNotificationsAsRead(userId);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Revert optimistic update on failure
      setNotifications((prev) => {
        const reverted = prev.map((n) => ({ ...n, is_read: false }));
        const newUnreadCount = reverted.filter(n => !n.is_read).length;
        setUnreadCount(newUnreadCount);
        return reverted;
      });
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
