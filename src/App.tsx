import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { HomePage } from './pages/HomePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyListingsPage } from './pages/MyListingsPage';
import { ChatPage } from './pages/ChatPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AlertContainer } from './components/notifications/AlertContainer';
import { NotificationBadge } from './components/notifications/NotificationUI';
import { useNotifications } from './hooks/useNotifications';
import './styles/global.css';
import './components/styles/listings.css';
import './components/styles/auth.css';
import './components/styles/notifications.css';

const AppContent: React.FC = () => {
  const { user, userProfile, logout } = useAuthContext();
  const { unreadCount } = useNotifications(user?.id || null);
  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="app-container">
      <header className="app-header">
        <nav className="header-nav">
          <Link to="/" className="header-logo">
            📚 SRMarketplace
          </Link>

          <div style={{ flex: 1 }} />

          <ul className="header-links">
            {user ? (
              <>
                <li>
                  <Link to="/">Browse</Link>
                </li>
                <li>
                  <Link to="/create-listing">Create Listing</Link>
                </li>
                <li>
                  <Link to="/notifications">
                    Notifications
                    {unreadCount > 0 && (
                      <NotificationBadge count={unreadCount} />
                    )}
                  </Link>
                </li>
                <li>
                  <Link to="/chat">Messages</Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/admin" style={{ color: '#ff9800', fontWeight: 'bold' }}>
                      🔧 Admin
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/profile">Profile</Link>
                </li>
                <li>
                  <button
                    onClick={logout}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#333',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/auth/login">Login</Link>
                </li>
                <li>
                  <Link to="/auth/signup">Sign Up</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route
            path="/listings/:id"
            element={
              <ProtectedRoute>
                <ListingDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-listing"
            element={
              <ProtectedRoute>
                <CreateListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-listings"
            element={
              <ProtectedRoute>
                <MyListingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <AlertContainer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AlertProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AlertProvider>
    </Router>
  );
};

export default App;
