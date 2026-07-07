import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TestProvider } from './contexts/TestContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateEditTest } from './pages/CreateEditTest';
import { AddQuestions } from './pages/AddQuestions';
import { PreviewPublish } from './pages/PreviewPublish';

// A simple tracking placeholder page to keep the UX highly polished
const TestTrackingPlaceholder: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          <span>Test Tracking</span>
          <span>/</span>
          <span>Overview</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-dark)' }}>Test Tracking</h1>
      </div>
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Test Statistics & Tracking</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '500px', margin: '0 auto 20px' }}>
          This page shows statistics for all active and completed tests, including candidate submissions, scores, and completion reports.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '40px'
        }}>
          <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Tests</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)', marginTop: '8px' }}>12</div>
          </div>
          <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Submissions</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)', marginTop: '8px' }}>1,842</div>
          </div>
          <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average Score</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--warning)', marginTop: '8px' }}>74.8%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <TestProvider>
        <Router>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                } 
              />
              <Route 
                path="/test/new" 
                element={
                  <Layout>
                    <CreateEditTest />
                  </Layout>
                } 
              />
              <Route 
                path="/test/:id/edit" 
                element={
                  <Layout>
                    <CreateEditTest />
                  </Layout>
                } 
              />
              <Route 
                path="/test/:id/questions" 
                element={
                  <Layout>
                    <AddQuestions />
                  </Layout>
                } 
              />
              <Route 
                path="/test/:id/preview" 
                element={
                  <Layout>
                    <PreviewPublish />
                  </Layout>
                } 
              />
              <Route 
                path="/test-tracking" 
                element={
                  <Layout>
                    <TestTrackingPlaceholder />
                  </Layout>
                } 
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </TestProvider>
    </AuthProvider>
  );
};

export default App;
