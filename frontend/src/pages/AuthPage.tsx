import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  mode: 'login' | 'signup';
  onSwitch: () => void;
}

export function AuthPage({ mode, onSwitch }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error, requiresConfirmation } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else if (requiresConfirmation) {
          setSuccessMsg('Account created! Check your email to confirm before signing in.');
          setEmail('');
          setPassword('');
        } else {
          setSuccessMsg('Account created! You are now signed in.');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="text-gradient" style={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '-1px' }}>
            Flux
          </span>
          <p style={{ color: '#8892b0', marginTop: '0.5rem' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}
          {successMsg && <div className="auth-success">{successMsg}</div>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#8892b0' }}>
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button className="text-link" onClick={onSwitch}>Sign Up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="text-link" onClick={onSwitch}>Sign In</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
