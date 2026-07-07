import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Test } from '../services/api';
import { useTest } from '../contexts/TestContext';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  FileText,
  AlertCircle,
  X
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { startNewTest, loadTest } = useTest();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'draft'>('all');
  
  // Delete confirm modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Success toast/message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getTests();
      if (response.success && response.data) {
        setTests(response.data);
      } else {
        setError('Failed to fetch tests.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleCreateNew = () => {
    startNewTest();
    navigate('/test/new');
  };

  const handleEdit = (id: string) => {
    loadTest(id);
    navigate(`/test/${id}/edit`);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const response = await api.deleteTest(deleteId);
      if (response.success) {
        setToastMessage('Test deleted successfully!');
        setToastType('success');
        setTests(tests.filter(t => t.id !== deleteId));
      } else {
        throw new Error(response.message || 'Failed to delete test');
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage(err.message || 'Error deleting test.');
      setToastType('error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
      // Auto-hide toast
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Filter and search calculations
  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (test.subject && test.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'live' && test.status === 'live') ||
                          (statusFilter === 'draft' && (test.status === 'draft' || !test.status));
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header and Create Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Test Creation</span>
            <span>/</span>
            <span>Dashboard</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-dark)' }}>Dashboard</h1>
        </div>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          <Plus size={18} />
          Create New Test
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Search Input */}
        <div style={{
          position: 'relative',
          maxWidth: '360px',
          width: '100%'
        }}>
          <Search size={18} color="var(--text-light)" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)'
          }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search test name or subject..."
            style={{ paddingLeft: '38px', height: '42px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Tab buttons */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f1f5f9',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          gap: '4px'
        }}>
          {(['all', 'live', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: statusFilter === status ? '#ffffff' : 'transparent',
                color: statusFilter === status ? 'var(--text-dark)' : 'var(--text-muted)',
                boxShadow: statusFilter === status ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / Grid Content */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          <div style={{
            border: '3px solid #f3f3f3',
            borderTop: '3px solid var(--primary)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            animation: 'spin 1s linear infinite',
            marginBottom: '12px'
          }} />
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading tests...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div style={{
          padding: '24px',
          backgroundColor: 'var(--danger-light)',
          color: 'var(--danger)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={24} />
          <div>
            <div style={{ fontWeight: '600' }}>Error loading tests</div>
            <div style={{ fontSize: '13px' }}>{error}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchTests} style={{ marginLeft: 'auto' }}>
            Retry
          </button>
        </div>
      ) : filteredTests.length === 0 ? (
        /* Empty State */
        <div className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            color: 'var(--primary)'
          }}>
            <FileText size={40} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>
            No tests found
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '380px', marginBottom: '24px' }}>
            {searchTerm || statusFilter !== 'all' 
              ? "We couldn't find any tests matching your filters. Try adjusting your query."
              : "Get started by creating your first test! You can edit details, add MCQ questions, and publish."}
          </p>
          {(searchTerm || statusFilter !== 'all') ? (
            <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
              Reset Filters
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleCreateNew}>
              Create New Test
            </button>
          )}
        </div>
      ) : (
        /* Table Layout */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Test Name</th>
                  <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Subject</th>
                  <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Created Date</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test) => {
                  const isLive = test.status === 'live';
                  return (
                    <tr 
                      key={test.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.2s'
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '18px 24px', fontWeight: '600', color: 'var(--text-dark)', fontSize: '14px' }}>
                        {test.name}
                      </td>
                      <td style={{ padding: '18px 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                        {test.subject || 'N/A'}
                      </td>
                      <td style={{ padding: '18px 16px' }}>
                        <span className={`badge ${isLive ? 'badge-live' : 'badge-draft'}`}>
                          {isLive ? 'Live' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {test.created_at ? new Date(test.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(test.id!)}
                            className="btn btn-outline btn-sm"
                            title="Edit details/questions"
                            style={{ padding: '6px' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              loadTest(test.id!);
                              navigate(`/test/${test.id}/preview`);
                            }}
                            className="btn btn-outline btn-sm"
                            title="Preview Test"
                            style={{ padding: '6px' }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(test.id!)}
                            className="btn btn-danger btn-sm"
                            title="Delete Test"
                            style={{ padding: '6px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <span className="modal-title">Delete Test</span>
              <button className="modal-close" onClick={() => setDeleteId(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{
                color: 'var(--danger)',
                backgroundColor: 'var(--danger-light)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Trash2 size={28} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>
                Are you absolutely sure?
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                This will permanently delete the test and all of its associated questions. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '16px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{ flex: 1, backgroundColor: 'var(--danger)', color: 'white' }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className={`toast ${toastType === 'success' ? 'toast-success' : 'toast-error'}`}>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover {
          background-color: #f8fafc;
        }
      `}</style>

    </div>
  );
};
