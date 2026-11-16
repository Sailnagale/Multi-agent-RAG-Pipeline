import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  History, 
  Settings, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Cpu, 
  User, 
  Sparkles,
  LogOut,
  LogIn
} from 'lucide-react';

export default function Navbar({ 
  activePage, 
  setActivePage, 
  theme, 
  toggleTheme, 
  user, 
  onOpenAuth, 
  onLogout 
}) {
  const [ollamaStatus, setOllamaStatus] = useState({ connected: false, checking: true });

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setOllamaStatus({ connected: data.ollama_connected, checking: false });
      })
      .catch(() => {
        setOllamaStatus({ connected: false, checking: false });
      });
  }, []);

  const navItems = [
    { id: 'landing', label: 'Overview', icon: Sparkles },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'analysis', label: 'Company Analysis', icon: TrendingUp },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      backdropFilter: 'blur(12px)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Brand Logo */}
      <div 
        onClick={() => setActivePage('landing')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
        }}>
          FR
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            FinRAG <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-blue)' }}>5-AGENT</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Financial Report Intelligence</div>
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--bg-subtle)' : 'transparent',
                color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Right Actions: Ollama pill, theme toggle, Auth/User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Ollama Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: ollamaStatus.connected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          color: ollamaStatus.connected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
          border: `1px solid ${ollamaStatus.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: ollamaStatus.connected ? '#10b981' : '#f59e0b',
            boxShadow: ollamaStatus.connected ? '0 0 8px #10b981' : 'none'
          }} />
          <Cpu size={13} />
          {ollamaStatus.checking ? 'Connecting...' : ollamaStatus.connected ? 'Ollama: qwen2.5' : 'Ollama Offline'}
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            padding: '0.45rem',
            borderRadius: '8px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
        </button>

        {/* User / Auth */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div 
              onClick={() => setActivePage('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                background: 'var(--bg-subtle)',
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {user.name.charAt(0)}
              </div>
              <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.4rem'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActivePage('login')}
            className="btn btn-primary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
          >
            <LogIn size={15} />
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
