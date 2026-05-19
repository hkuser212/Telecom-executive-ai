import { useState } from 'react';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 12 + 8,
  delay: Math.random() * 5,
}));

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  const switchMode = (m) => {
    setAnimating(true);
    setError(''); setSuccess('');
    setTimeout(() => { setMode(m); setAnimating(false); }, 300);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (mode === 'signup' && form.password !== form.confirm) {
      setError('Passwords do not match.'); return;
    }
    setLoading(true);
    const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
    const payload = mode === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password };
    try {
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Something went wrong');
      if (mode === 'login') {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_name', data.user.name);
        onAuthSuccess(data.user);
      } else {
        setSuccess('Account created! You can now log in.');
        setTimeout(() => switchMode('login'), 1500);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-root">
      {/* Animated blobs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      {/* Floating Particles */}
      {PARTICLES.map(p => (
        <div key={p.id} className="auth-particle" style={{
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}

      {/* ── Left Branding Panel ── */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="auth-brand-name">Executive AI</span>
        </div>

        <h1 className="auth-hero-title">
          Turn Data Into<br />
          <span className="auth-hero-gradient">Business Decisions</span>
        </h1>
        <p className="auth-hero-sub">
          The AI-powered telecom intelligence platform for churn prediction, sales forecasting, and real-time sentiment analysis.
        </p>

        <div className="auth-stats">
          {[['91%', 'Model Accuracy'], ['10K+', 'Customers Scored'], ['2.4s', 'Avg Prediction']].map(([v, l]) => (
            <div key={v} className="auth-stat">
              <div className="auth-stat-val">{v}</div>
              <div className="auth-stat-label">{l}</div>
            </div>
          ))}
        </div>

        <div className="auth-features">
          {['🤖 XGBoost Churn Prediction', '📈 Prophet + LSTM Forecasting', '💬 BERT Sentiment Analysis', '🧠 AI Business Assistant'].map(f => (
            <div key={f} className="auth-feature-item">{f}</div>
          ))}
        </div>
      </div>

      {/* ── Right Auth Card ── */}
      <div className="auth-right">
        <div className="auth-card" style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(10px)' : 'translateY(0)' }}>
          {/* Tabs */}
          <div className="auth-tabs">
            <button onClick={() => switchMode('login')} className={`auth-tab ${mode === 'login' ? 'active' : ''}`}>Sign In</button>
            <button onClick={() => switchMode('signup')} className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}>Sign Up</button>
          </div>

          <div className="auth-card-body">
            <h2 className="auth-card-title">{mode === 'login' ? 'Welcome back 👋' : 'Create your account'}</h2>
            <p className="auth-card-sub">
              {mode === 'login' ? 'Sign in to access your AI analytics dashboard.' : 'Join the platform. No credit card required.'}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'signup' && (
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">👤</span>
                    <input name="name" type="text" placeholder="Harsh Kumar" required value={form.name} onChange={handleChange} className="auth-input" />
                  </div>
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">✉️</span>
                  <input name="email" type="email" placeholder="you@company.com" required value={form.email} onChange={handleChange} className="auth-input" />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">🔒</span>
                  <input name="password" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" required value={form.password} onChange={handleChange} className="auth-input" />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="auth-eye-btn">{showPass ? '🙈' : '👁️'}</button>
                </div>
              </div>

              {mode === 'signup' && (
                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">🔐</span>
                    <input name="confirm" type="password" placeholder="Repeat password" required value={form.confirm} onChange={handleChange} className="auth-input" />
                  </div>
                </div>
              )}

              {error && <div className="auth-error">⚠️ {error}</div>}
              {success && <div className="auth-success">✅ {success}</div>}

              <button type="submit" disabled={loading} className="auth-submit-btn">
                {loading ? <span className="auth-spinner" /> : (mode === 'login' ? 'Sign In to Dashboard →' : 'Create Account →')}
              </button>
            </form>

            <div className="auth-divider"><span>or continue with</span></div>
            <div className="auth-oauth-row">
              <button className="auth-oauth-btn">🔷 Google</button>
              <button className="auth-oauth-btn">⚫ GitHub</button>
            </div>

            <p className="auth-switch-text">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="auth-switch-link">
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
