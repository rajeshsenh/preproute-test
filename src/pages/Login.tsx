import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { login, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!userId.trim()) {
      setValidationError('User ID is required');
      return;
    }
    if (!password.trim()) {
      setValidationError('Password is required');
      return;
    }

    setLoading(true);
    try {
      await login(userId, password);
      navigate('/dashboard');
    } catch (err: any) {
      // Handled in Context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left side with Mascot Illustration */}
      <div className="login-left">
        <div className="mascot-container">
          <svg className="mascot-svg" viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background elements */}
            <circle cx="292" cy="134" r="5" fill="#64748B" stroke="#64748B" strokeWidth="1"/>
            <path d="M72 153.5L80 145.5M80 153.5L72 145.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M358 188.5L364 182.5M364 188.5L358 182.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round"/>
            
            {/* Desk Table */}
            <rect x="42" y="206" width="324" height="6" rx="3" fill="#64748B" />
            <line x1="90" y1="212" x2="90" y2="340" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="168" y1="212" x2="168" y2="340" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="324" y1="212" x2="324" y2="340" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="402" y1="212" x2="402" y2="340" stroke="#94A3B8" strokeWidth="1.5" />
            
            {/* Mascot Character Body */}
            {/* Feet */}
            <path d="M198 335H246" stroke="#4A72E6" strokeWidth="6" strokeLinecap="round"/>
            <path d="M202 328V335" stroke="#4A72E6" strokeWidth="3"/>
            <path d="M242 328V335" stroke="#4A72E6" strokeWidth="3"/>
            <rect x="194" y="322" width="56" height="6" rx="3" fill="#A5C2FF" />

            {/* Core Cylinder Body */}
            <rect x="202" y="142" width="38" height="180" rx="4" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5"/>
            {/* Belly crease line */}
            <line x1="202" y1="282" x2="240" y2="282" stroke="#E2E8F0" strokeWidth="1.5"/>
            <line x1="202" y1="230" x2="240" y2="230" stroke="#E2E8F0" strokeWidth="1.5"/>

            {/* Graduation Cap */}
            <rect x="186" y="130" width="70" height="12" rx="2" fill="#A5C2FF" stroke="#4A72E6" strokeWidth="1.5"/>
            <path d="M192 130L221 112L250 130L221 148L192 130Z" fill="#FFFFFF" stroke="#4A72E6" strokeWidth="1.5"/>
            <line x1="221" y1="130" x2="221" y2="142" stroke="#4A72E6" strokeWidth="1.5"/>

            {/* Eyes and Smile */}
            <circle cx="212" cy="180" r="2.5" fill="#0F172A" />
            <circle cx="230" cy="180" r="2.5" fill="#0F172A" />
            <path d="M218 185C218 187.5 224 187.5 224 185" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round"/>

            {/* Hands & Arms */}
            {/* Left Arm and laptop interaction */}
            <path d="M202 210C170 215 170 240 206 250" stroke="#1E293B" strokeWidth="1.5" fill="none"/>
            {/* Right Arm */}
            <path d="M240 210C270 212 284 228 266 244C256 252 248 248 244 246" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <circle cx="248" cy="245" r="3.5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5"/>
            
            {/* Laptop */}
            <path d="M152 245L208 245" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round"/>
            <path d="M152 245L110 206" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round"/>
            <path d="M152 245L110 206" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
            
          </svg>
        </div>
      </div>

      {/* Right side with Login Form */}
      <div className="login-right">
        <div className="login-form-box">
          
          {/* Logo with Curve details */}
          <div style={{ marginBottom: '40px' }}>
            <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
              <span className="logo-text" style={{ fontSize: '28px', color: '#4A72E6' }}>Prep<span style={{ color: '#0f172a' }}>Route</span></span>
              {/* Snake / S-curve line details representing the logo style */}
              <svg width="60" height="15" viewBox="0 0 60 15" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
                position: 'absolute',
                top: '-8px',
                left: '2px',
                zIndex: 1
              }}>
                <path d="M2 10C8 4 14 4 20 10C26 16 32 16 38 10C44 4 50 4 56 10" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 3"/>
              </svg>
            </div>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>Login</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' }}>
            Use your company provided Login credentials
          </p>

          <form onSubmit={handleSubmit}>
            {validationError && (
              <div style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '16px'
              }}>
                {validationError}
              </div>
            )}
            
            {authError && (
              <div style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '16px'
              }}>
                {authError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">User ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '30px' }}>
              <a href="#forgot" style={{ fontSize: '13px', fontWeight: '500' }}>Forgot password?</a>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Quick fills for developer review */}
          <div style={{
            marginTop: '32px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border)',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}>
            <strong>Testing Credentials:</strong><br />
            User ID: <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>vedant-admin</code><br />
            Password: <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>vedant123.</code>
          </div>

        </div>
      </div>
    </div>
  );
};
