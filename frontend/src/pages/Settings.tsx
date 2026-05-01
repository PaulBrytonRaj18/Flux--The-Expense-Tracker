import { useState, useEffect } from 'react';
import { api, showToast } from '../api/client';
import type { Settings as SettingsData } from '../api/client';

export function Settings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    setError(false);
    api.getSettings().then(setSettings).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleUpdate = (key: keyof SettingsData, value: number | boolean) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await api.updateSettings(settings);
      setSettings(result);
      showToast('Settings saved!');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p className="text-muted">Loading settings...</p>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Failed to load settings</p>
          <button className="btn btn-primary" onClick={fetchSettings}>Retry</button>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure your financial profile</p>
      </div>

      {/* Financial Profile */}
      <h3 className="section-title mb-md" style={{ marginTop: 8 }}>💰 Financial Profile</h3>
      <div className="settings-group mb-lg">
        <div className="settings-item">
          <label className="label" htmlFor="settings-balance">Current Balance</label>
          <input
            id="settings-balance"
            className="input"
            type="number"
            value={settings.balance}
            onChange={(e) => handleUpdate('balance', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="settings-item">
          <label className="label" htmlFor="settings-bills">Monthly Bills</label>
          <input
            id="settings-bills"
            className="input"
            type="number"
            value={settings.committed_bills}
            onChange={(e) => handleUpdate('committed_bills', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="settings-item">
          <label className="label" htmlFor="settings-savings">Goal Savings</label>
          <input
            id="settings-savings"
            className="input"
            type="number"
            value={settings.goal_savings}
            onChange={(e) => handleUpdate('goal_savings', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Investment Settings */}
      <h3 className="section-title mb-md">📈 Investment Projections</h3>
      <div className="settings-group mb-lg">
        <div className="settings-item">
          <div>
            <label className="label" htmlFor="settings-rate">Annual Return Rate</label>
            <div className="text-mono text-sm" style={{ color: 'var(--neon-cyan)', marginTop: 2 }}>
              {settings.investment_rate}%
            </div>
          </div>
          <input
            id="settings-rate"
            className="slider"
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={settings.investment_rate}
            onChange={(e) => handleUpdate('investment_rate', parseFloat(e.target.value))}
            style={{ maxWidth: 160 }}
          />
        </div>
        <div className="settings-item">
          <label className="label" htmlFor="settings-age">Your Age</label>
          <input
            id="settings-age"
            className="input"
            type="number"
            value={settings.user_age}
            onChange={(e) => handleUpdate('user_age', parseInt(e.target.value) || 28)}
          />
        </div>
        <div className="settings-item">
          <label className="label" htmlFor="settings-retirement">Retirement Age</label>
          <input
            id="settings-retirement"
            className="input"
            type="number"
            value={settings.retirement_age}
            onChange={(e) => handleUpdate('retirement_age', parseInt(e.target.value) || 60)}
          />
        </div>
      </div>

      {/* Privacy */}
      <h3 className="section-title mb-md">🔒 Privacy</h3>
      <div className="settings-group mb-lg">
        <div className="settings-item">
          <div>
            <span className="label">Privacy Mode</span>
            <div className="text-sm text-muted" style={{ marginTop: 2 }}>Blur sensitive amounts</div>
          </div>
          <button
            className={`toggle ${settings.privacy_mode ? 'active' : ''}`}
            onClick={() => handleUpdate('privacy_mode', !settings.privacy_mode)}
            role="switch"
            aria-checked={settings.privacy_mode}
            aria-label="Toggle privacy mode"
          >
            <div className="knob" />
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        className="btn btn-primary w-full"
        style={{ height: 48 }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>

      {/* About */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <p className="text-gradient" style={{ fontWeight: 800, fontSize: '1.125rem' }}>Flux</p>
        <p className="text-sm text-muted">Expense Tracking for Behavioral Change</p>
        <p className="text-sm text-muted" style={{ marginTop: 4 }}>v1.0.0</p>
      </div>
    </div>
  );
}
