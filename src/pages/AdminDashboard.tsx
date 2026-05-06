import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { adminService } from '../services/admin';
import { useAlert } from '../contexts/AlertContext';
import type { Report } from '../types';
import '../components/styles/notifications.css';

export const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuthContext();
  const { addAlert } = useAlert();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const data = await adminService.getAllReports(status);
      setReports(data as unknown as Report[]);
    } catch (error) {
      console.error('Failed to load reports:', error);
      addAlert('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, addAlert]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Check if user is admin
  if (!userProfile?.role || userProfile.role !== 'admin') {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#f44336' }}>
        <h2>Access Denied</h2>
        <p>You do not have admin privileges to access this page.</p>
      </div>
    );
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingListingId(listingId);
      await adminService.deleteListingAsAdmin(listingId);
      setReports((prev) => prev.filter((r) => r.listing_id !== listingId));
      addAlert('Listing deleted successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete listing';
      console.error('Error deleting listing:', error);
      addAlert(message, 'error');
    } finally {
      setDeletingListingId(null);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: string) => {
    try {
      const updated = await adminService.updateReportStatus(reportId, status);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? updated : r))
      );
      addAlert(`Report marked as ${status}`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update report';
      console.error('Error updating report:', error);
      addAlert(message, 'error');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '8px 16px',
              background: filter === 'pending' ? '#ff9800' : '#f0f0f0',
              color: filter === 'pending' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Pending ({reports.filter((r) => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            style={{
              padding: '8px 16px',
              background: filter === 'reviewed' ? '#4caf50' : '#f0f0f0',
              color: filter === 'reviewed' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Reviewed ({reports.filter((r) => r.status === 'reviewed').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              background: filter === 'all' ? '#2196f3' : '#f0f0f0',
              color: filter === 'all' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            All Reports ({reports.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#999' }}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: '#f5f5f5',
            borderRadius: '8px',
            color: '#999',
          }}
        >
          <p>No reports found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports.map((report) => (
            <div
              key={report.id}
              style={{
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>
                  {(report as any).listing?.title || '(Listing deleted)'}
                </h3>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                  Reported {new Date(report.created_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <strong style={{ fontSize: '12px', color: '#666' }}>Reason:</strong>
                  <p style={{ margin: '4px 0', fontSize: '13px' }}>{report.reason}</p>
                </div>
                <div>
                  <strong style={{ fontSize: '12px', color: '#666' }}>Reporter:</strong>
                  <p style={{ margin: '4px 0', fontSize: '13px' }}>
                    {(report as any).reported_by_user?.full_name || 'Unknown'}
                  </p>
                </div>
              </div>

              {report.description && (
                <div style={{ marginBottom: '12px', padding: '8px', background: '#f9f9f9', borderRadius: '4px' }}>
                  <strong style={{ fontSize: '12px', color: '#666' }}>Details:</strong>
                  <p style={{ margin: '4px 0', fontSize: '13px' }}>{report.description}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {report.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                      style={{
                        padding: '8px 12px',
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                      style={{
                        padding: '8px 12px',
                        background: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      Dismiss
                    </button>
                  </>
                )}

                {(report as any).listing && (
                  <button
                    onClick={() => handleDeleteListing((report as any).listing.id)}
                    disabled={deletingListingId === (report as any).listing.id}
                    style={{
                      padding: '8px 12px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: deletingListingId === (report as any).listing.id ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      opacity: deletingListingId === (report as any).listing.id ? 0.6 : 1,
                    }}
                  >
                    {deletingListingId === (report as any).listing.id ? 'Deleting...' : 'Delete Listing'}
                  </button>
                )}

                <span
                  style={{
                    padding: '8px 12px',
                    background: report.status === 'pending' ? '#fff3cd' : '#d4edda',
                    color: report.status === 'pending' ? '#856404' : '#155724',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginLeft: 'auto',
                  }}
                >
                  {report.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
