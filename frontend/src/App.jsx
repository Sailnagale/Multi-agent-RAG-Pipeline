import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';
import AnalysisPage from './components/AnalysisPage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import AuthModal from './components/AuthModal';

export default function App() {
  const [activePage, setActivePage] = useState('landing');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Theme management (default to dark)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('finrag_theme') || 'dark';
  });

  // User auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finrag_user');
    return saved ? JSON.parse(saved) : {
      name: 'Dr. Michael Chen',
      email: 'm.chen@apex-capital.com',
      organization: 'Apex Institutional Capital',
      role: 'Principal Investment Officer'
    };
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finrag_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('finrag_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('finrag_user');
  };

  const handleUpdateUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem('finrag_user', JSON.stringify(updatedData));
  };

  // If user navigated to full-page login
  if (activePage === 'login') {
    return (
      <LoginPage
        onLogin={(userData) => {
          handleLogin(userData);
          setActivePage('dashboard');
        }}
        onBack={() => setActivePage('dashboard')}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={(page) => {
          if (page !== 'analysis') setSelectedAnalysisId(null);
          setActivePage(page);
        }}
        theme={theme}
        toggleTheme={toggleTheme}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Pages */}
      <main style={{ flex: 1 }}>
        {activePage === 'landing' && (
          <LandingPage
            setActivePage={setActivePage}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activePage === 'dashboard' && (
          <DashboardPage
            setActivePage={setActivePage}
            setSelectedAnalysisId={setSelectedAnalysisId}
            onOpenAuth={() => setAuthModalOpen(true)}
            user={user}
          />
        )}

        {activePage === 'analysis' && (
          <AnalysisPage
            selectedAnalysisId={selectedAnalysisId}
            setSelectedAnalysisId={setSelectedAnalysisId}
          />
        )}

        {activePage === 'history' && (
          <HistoryPage
            setActivePage={setActivePage}
            setSelectedAnalysisId={setSelectedAnalysisId}
          />
        )}

        {activePage === 'settings' && (
          <SettingsPage
            user={user}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>FinRAG Intelligence Platform</strong> &bull; 5-Agent Local Corporate Filing Evaluation
          </div>
          <div>
            Powered by Ollama (qwen2.5:3b + qwen3-embedding) &bull; ChromaDB Vector Engine &bull; FlashRank Reranker
          </div>
        </div>
      </footer>
    </div>
  );
}
