import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notifications';
import { useAlert } from '../contexts/AlertContext';
import { NotificationCenter } from '../components/notifications/NotificationUI';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications(
    user?.id || null
  );
  const { addAlert } = useAlert();

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      addAlert('Notification deleted', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete notification';
      addAlert(message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Notifications</h1>
      <NotificationCenter
        notifications={notifications}
        loading={loading}
        onMarkRead={markAsRead}
        onMarkAllRead={markAllAsRead}
        onDelete={handleDeleteNotification}
      />
    </div>
  );
};
