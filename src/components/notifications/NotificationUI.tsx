import React from 'react';
import type { Notification } from '../../types';
import '../styles/notifications.css';

interface NotificationBadgeProps {
  count: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
  if (count === 0) return null;

  return <span className="notification-badge">{count > 99 ? '99+' : count}</span>;
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
  onClick,
}) => {
  // Extract listing and sender if included in the notification
  const listing = (notification as any).listing as { id: string; title: string } | null;
  const sender = (notification as any).sender as { id: string; full_name: string } | null;

  return (
    <div 
      className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'background 0.2s' }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.background = '#f0f0f0')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.background = 'transparent')}
    >
      <div className="notification-content">
        <h4>{notification.title}</h4>
        <p>{notification.message}</p>
        {listing && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            📄 Listing: <strong>{listing.title}</strong>
          </div>
        )}
        {sender && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            👤 From: <strong>{sender.full_name}</strong>
          </div>
        )}
        <small>{new Date(notification.created_at).toLocaleString()}</small>
      </div>

      <div className="notification-actions">
        {!notification.is_read && onMarkRead && (
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            title="Mark as read"
          >
            ✓
          </button>
        )}
        {onDelete && (
          <button
            className="btn-icon delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            title="Delete"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

interface NotificationCenterProps {
  notifications: Notification[];
  loading?: boolean;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  loading,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}) => {
  if (loading) {
    return <div className="notification-center-loading">Loading notifications...</div>;
  }

  return (
    <div className="notification-center">
      <div className="notification-center-header">
        <h3>Notifications</h3>
        {notifications.some((n) => !n.is_read) && onMarkAllRead && (
          <button className="btn-link" onClick={onMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="notification-center-empty">No notifications</div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
