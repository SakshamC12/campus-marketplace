import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notifications';
import { useAlert } from '../contexts/AlertContext';
import { NotificationItem } from '../components/notifications/NotificationUI';
import type { Notification } from '../types';
import '../components/styles/notifications.css';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications(
    user?.id || null
  );
  const { addAlert } = useAlert();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      addAlert('Notification deleted', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete notification';
      addAlert(message, 'error');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'message' || notification.type === 'interested') {
      const sender = (notification as any).sender;
      if (sender?.id && notification.related_listing_id) {
        navigate(`/chat?user=${sender.id}&listing=${notification.related_listing_id}`);
      }
    } else if (notification.type === 'listing_match') {
      const listing = (notification as any).listing;
      if (listing?.id) {
        navigate(`/listing/${listing.id}`);
      }
    }
  };

  const filteredNotifications = 
    filter === 'unread' 
      ? notifications.filter(n => !n.is_read)
      : notifications;

  return (
    <div className="notifications-page" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div className="notifications-header">
        <h1>Notifications</h1>

        <div className="notifications-toolbar">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({notifications.filter(n => !n.is_read).length})
            </button>
          </div>

          {notifications.length > 0 && (
            <button 
              className="btn-secondary"
              onClick={() => markAllAsRead()}
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <h3>No {filter === 'unread' ? 'unread ' : ''}notifications</h3>
          <p>Check back later for updates!</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={markAsRead}
              onDelete={handleDeleteNotification}
              onClick={() => handleNotificationClick(notification)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
