import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, TrendingUp, MessageSquare,
  Bot, FileText, Bell, Settings, RefreshCw, Activity, LogOut
} from 'lucide-react';
import { useState } from 'react';
import ExecutiveOverview from './pages/ExecutiveOverview';
import CustomerAnalytics from './pages/CustomerAnalytics';
import SalesIntelligence from './pages/SalesIntelligence';
import SentimentMonitoring from './pages/SentimentMonitoring';
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';
import AuthPage from './pages/AuthPage';
import './index.css';

const NAV = [
  { to: '/', icon: <LayoutDashboard size={17} />, label: 'Executive Overview' },
  { to: '/customers', icon: <Users size={17} />, label: 'Customer Analytics', badge: '12' },
  { to: '/sales', icon: <TrendingUp size={17} />, label: 'Sales Intelligence' },
  { to: '/sentiment', icon: <MessageSquare size={17} />, label: 'Sentiment Monitoring' },
  { to: '/assistant', icon: <Bot size={17} />, label: 'AI Assistant' },
  { to: '/reports', icon: <FileText size={17} />, label: 'Reports' },
];

function Sidebar({ user, onLogout }) {
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'EA';
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Executive AI<br />Decision Hub</h2>
        <span>Telecom Analytics Platform</span>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
            {n.badge && <span className="nav-badge">{n.badge}</span>}
          </NavLink>
        ))}
        <div className="nav-section-label" style={{ marginTop: 16 }}>System</div>
        <button className="nav-item"><span className="nav-icon"><Settings size={17} /></span>Settings</button>
        <button className="nav-item" onClick={onLogout} style={{ color: '#ef4444' }}>
          <span className="nav-icon"><LogOut size={17} /></span>Logout
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <p>{user?.name || 'Exec Analyst'}</p>
            <span>{user?.email || 'admin@telecom.ai'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

const PAGE_TITLES = {
  '/': 'Executive Overview',
  '/customers': 'Customer Analytics',
  '/sales': 'Sales Intelligence',
  '/sentiment': 'Sentiment Monitoring',
  '/assistant': 'AI Assistant',
  '/reports': 'Reports',
};

function Topbar() {
  const loc = useLocation();
  const title = PAGE_TITLES[loc.pathname] ?? 'Dashboard';
  return (
    <header className="topbar">
      <div className="topbar-title">
        {title}
        <span>/ Telecom AI Platform</span>
      </div>
      <div className="topbar-actions">
        <div className="status-dot" title="Live Data" />
        <button className="icon-btn" title="Refresh"><RefreshCw size={15} /></button>
        <button className="icon-btn" title="Alerts"><Bell size={15} /></button>
        <button className="icon-btn" title="Activity"><Activity size={15} /></button>
      </div>
    </header>
  );
}

function DashboardLayout({ user, onLogout }) {
  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="main-content">
        <Topbar />
        <main className="page-body">
          <Routes>
            <Route path="/" element={<ExecutiveOverview />} />
            <Route path="/customers" element={<CustomerAnalytics />} />
            <Route path="/sales" element={<SalesIntelligence />} />
            <Route path="/sentiment" element={<SentimentMonitoring />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const storedName = localStorage.getItem('user_name');
  const storedToken = localStorage.getItem('auth_token');
  const [user, setUser] = useState(storedToken && storedName ? { name: storedName } : null);

  const handleAuthSuccess = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_name');
    setUser(null);
  };

  return (
    <BrowserRouter>
      {user
        ? <DashboardLayout user={user} onLogout={handleLogout} />
        : <AuthPage onAuthSuccess={handleAuthSuccess} />
      }
    </BrowserRouter>
  );
}
