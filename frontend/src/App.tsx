import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { PrivacyShield } from './components/PrivacyShield';
import { QuickEntry } from './components/QuickEntry';
import { Toast } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Goals } from './pages/Goals';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { AuthPage } from './pages/AuthPage';
import { MdAdd } from 'react-icons/md';
import { api } from './api/client';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (session) {
      api.getSettings().then((s) => setPrivacyMode(s.privacy_mode)).catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    if (session && user) {
      api.seedData().catch(() => {});
    }
  }, [session, user]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="text-gradient" style={{ fontWeight: 900, fontSize: '2rem' }}>Flux</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPageWrapper />;
  }

  const togglePrivacy = () => {
    setPrivacyMode((prev) => {
      const next = !prev;
      api.updateSettings({ privacy_mode: next } as any).catch(() => {});
      return next;
    });
  };

  const handleExpenseSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleSignOut = () => {
    signOut();
    setPage('dashboard');
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard key={refreshKey} />;
      case 'expenses': return <Expenses key={refreshKey} />;
      case 'goals': return <Goals key={refreshKey} />;
      case 'insights': return <Insights key={refreshKey} />;
      case 'settings': return <Settings />;
      default: return <Dashboard key={refreshKey} />;
    }
  };

  return (
    <div className={`app-container ${privacyMode ? 'privacy-active' : ''}`}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px 0',
      }}>
        <div>
          <span className="text-gradient" style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
            Flux
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: '#8892b0', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </span>
          <PrivacyShield active={privacyMode} onToggle={togglePrivacy} />
          <button
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: '1px solid #2d3748',
              borderRadius: '8px',
              color: '#8892b0',
              padding: '6px 12px',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main>
        {renderPage()}
      </main>

      <button className="fab" onClick={() => setQuickEntryOpen(true)} title="Add expense" aria-label="Add new expense">
        <MdAdd />
      </button>

      <QuickEntry
        open={quickEntryOpen}
        onClose={() => setQuickEntryOpen(false)}
        onSaved={handleExpenseSaved}
      />

      <Toast />

      <Navigation activePage={page} onNavigate={setPage} />
    </div>
  );
}

function AuthPageWrapper() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  return <AuthPage mode={mode} onSwitch={() => setMode(mode === 'login' ? 'signup' : 'login')} />;
}

export default AppContent;
