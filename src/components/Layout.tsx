import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileEdit, 
  Bell, 
  LogOut, 
  ChevronDown, 
  Menu,
  GraduationCap,
  ClipboardList
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Test Creation', path: '/test/new', icon: FileEdit },
    { name: 'Test Tracking', path: '/test-tracking', icon: ClipboardList }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPath = location.pathname;

  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`} style={{
        width: sidebarOpen ? '250px' : '70px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50,
        position: 'relative'
      }}>
        {/* Sidebar Header */}
        <div style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          overflow: 'hidden'
        }}>
          {sidebarOpen ? (
            <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
              <span className="logo-text">Prep<span style={{ color: '#0f172a' }}>Route</span></span>
              <div style={{
                position: 'absolute',
                bottom: '15px',
                left: '20px',
                height: '3px',
                width: '90px',
                background: 'var(--primary)',
                borderRadius: '2px'
              }} />
            </div>
          ) : (
            <GraduationCap size={28} color="var(--primary)" />
          )}
        </div>

        {/* Navigation Menu */}
        <nav style={{ padding: '24px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const isActive = currentPath === item.path || (item.path === '/test/new' && currentPath.startsWith('/test/'));
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '14px',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center'
                }}
              >
                <Icon size={20} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--danger)',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              textAlign: 'left',
              transition: 'all 0.2s',
              justifyContent: sidebarOpen ? 'flex-start' : 'center'
            }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: '70px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 40
        }}>
          {/* Collapse sidebar button */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
          >
            <Menu size={24} />
          </button>

          {/* Right Section (User details, notifications) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Notification bell */}
            <button style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Bell size={20} />
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--success)',
                border: '1.5px solid white'
              }} />
            </button>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <img 
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name || 'Alex'}`} 
                  alt="Avatar"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#ffe4e6',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>
                    {user?.name || 'Alex Wando'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {user?.role || 'Admin'}
                  </span>
                </div>
                <ChevronDown size={16} color="var(--text-muted)" />
              </button>

              {profileDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border)',
                  padding: '6px',
                  width: '160px',
                  zIndex: 100
                }}>
                  <button 
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      textAlign: 'left'
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Panel */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
