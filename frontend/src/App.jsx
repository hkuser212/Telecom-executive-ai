import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, TrendingUp, MessageSquare,
  Bot, FileText, Bell, Settings, RefreshCw, Activity
} from 'lucide-react';
import ExecutiveOverview from './pages/ExecutiveOverview';
import CustomerAnalytics from './pages/CustomerAnalytics';
import SalesIntelligence from './pages/SalesIntelligence';
import SentimentMonitoring from './pages/SentimentMonitoring';
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';
import './index.css';

const NAV = [
  { to: '/', icon: <LayoutDashboard size={17} />, label: 'Executive Overview' },
  { to: '/customers', icon: <Users size={17} />, label: 'Customer Analytics', badge: '12' },
  { to: '/sales', icon: <TrendingUp size={17} />, label: 'Sales Intelligence' },
  { to: '/sentiment', icon: <MessageSquare size={17} />, label: 'Sentiment Monitoring' },
  { to: '/assistant', icon: <Bot size={17} />, label: 'AI Assistant' },
  { to: '/reports', icon: <FileText size={17} />, label: 'Reports' },
];

function Sidebar() {
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
        <button className="nav-item">
          <span className="nav-icon"><Settings size={17} /></span>
          Settings
        </button>
      </nav>
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">EA</div>
          <div className="user-info">
            <p>Exec Analyst</p>
            <span>admin@telecom.ai</span>
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
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
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
