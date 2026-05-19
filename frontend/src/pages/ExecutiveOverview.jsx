import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Users, DollarSign, TrendingDown, Star, ArrowUp, ArrowDown } from 'lucide-react';

const churnTrend = [
  { month: 'Jan', churn: 4.2, retained: 95.8 },
  { month: 'Feb', churn: 5.1, retained: 94.9 },
  { month: 'Mar', churn: 3.8, retained: 96.2 },
  { month: 'Apr', churn: 6.0, retained: 94.0 },
  { month: 'May', churn: 4.7, retained: 95.3 },
  { month: 'Jun', churn: 5.9, retained: 94.1 },
  { month: 'Jul', churn: 7.2, retained: 92.8 },
  { month: 'Aug', churn: 6.5, retained: 93.5 },
  { month: 'Sep', churn: 5.3, retained: 94.7 },
  { month: 'Oct', churn: 4.8, retained: 95.2 },
  { month: 'Nov', churn: 5.5, retained: 94.5 },
  { month: 'Dec', churn: 4.1, retained: 95.9 },
];

const revenueData = [
  { month: 'Jan', actual: 2.1, forecast: 2.0 },
  { month: 'Feb', actual: 2.4, forecast: 2.3 },
  { month: 'Mar', actual: 2.2, forecast: 2.5 },
  { month: 'Apr', actual: 2.8, forecast: 2.7 },
  { month: 'May', actual: 3.1, forecast: 2.9 },
  { month: 'Jun', actual: 2.9, forecast: 3.2 },
  { month: 'Jul', actual: 3.5, forecast: 3.3 },
  { month: 'Aug', actual: 3.3, forecast: 3.5 },
  { month: 'Sep', actual: null, forecast: 3.8 },
  { month: 'Oct', actual: null, forecast: 4.0 },
  { month: 'Nov', actual: null, forecast: 4.2 },
  { month: 'Dec', actual: null, forecast: 4.5 },
];

const regionChurn = [
  { region: 'Mumbai', churn: 8.2 },
  { region: 'Delhi', churn: 6.5 },
  { region: 'Assam', churn: 11.3 },
  { region: 'Kerala', churn: 4.1 },
  { region: 'Punjab', churn: 7.8 },
  { region: 'Gujarat', churn: 5.2 },
];

const sentimentPie = [
  { name: 'Positive', value: 58, color: '#10b981' },
  { name: 'Neutral', value: 24, color: '#f59e0b' },
  { name: 'Negative', value: 18, color: '#ef4444' },
];

const riskCustomers = [
  { name: 'Arjun Sharma', plan: 'Postpaid Pro', risk: 92, revenue: '₹4,200', region: 'Assam' },
  { name: 'Priya Mehta', plan: 'Enterprise', risk: 87, revenue: '₹12,500', region: 'Delhi' },
  { name: 'Rahul Verma', plan: 'Postpaid Basic', risk: 81, revenue: '₹1,800', region: 'Mumbai' },
  { name: 'Sneha Patel', plan: 'Business Plus', risk: 78, revenue: '₹8,900', region: 'Gujarat' },
  { name: 'Karan Singh', plan: 'Prepaid Max', risk: 74, revenue: '₹950', region: 'Punjab' },
];

const KPIS = [
  { label: 'Total Customers', value: '2.4M', change: '+3.2%', dir: 'up', color: 'blue', icon: <Users size={18} /> },
  { label: 'Monthly Revenue', value: '₹3.5B', change: '+8.7%', dir: 'up', color: 'green', icon: <DollarSign size={18} /> },
  { label: 'Churn Rate', value: '5.3%', change: '-0.8%', dir: 'up', color: 'orange', icon: <TrendingDown size={18} /> },
  { label: 'Net Promoter Score', value: '62', change: '+4pts', dir: 'up', color: 'purple', icon: <Star size={18} /> },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '10px 14px', minWidth: 140 }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: '0.82rem', color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function ExecutiveOverview() {
  return (
    <>
      <div className="page-header">
        <h1>Executive Overview</h1>
        <p>Real-time business intelligence · Updated 2 minutes ago</p>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        {KPIS.map(k => (
          <div key={k.label} className={`kpi-card ${k.color}`}>
            <div className="kpi-icon-wrap">{k.icon}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
            <div className={`kpi-change ${k.dir}`}>
              {k.dir === 'up' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {k.change} vs last month
            </div>
          </div>
        ))}
      </div>

      {/* Churn Trend + Revenue Forecast */}
      <div className="grid-2 mb-6">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Churn Rate Trend</div>
              <div className="card-subtitle">Monthly churn % · Last 12 months</div>
            </div>
            <span className="badge orange">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={churnTrend}>
              <defs>
                <linearGradient id="cgChurn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="churn" name="Churn %" stroke="#f59e0b" strokeWidth={2} fill="url(#cgChurn)" dot={{ r: 3, fill: '#f59e0b' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue Forecast</div>
              <div className="card-subtitle">Actual vs AI forecast (₹ Billion)</div>
            </div>
            <span className="badge blue">Prophet</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="cgActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cgForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis unit="B" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#3b82f6" strokeWidth={2} fill="url(#cgActual)" connectNulls={false} />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 4" fill="url(#cgForecast)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Region Churn + Sentiment + High Risk */}
      <div className="grid-2 mb-6" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Churn by Region</div>
              <div className="card-subtitle">Top regions by churn rate</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={regionChurn} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" unit="%" />
              <YAxis dataKey="region" type="category" width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="churn" name="Churn %" radius={[0, 6, 6, 0]}>
                {regionChurn.map((entry, idx) => (
                  <Cell key={idx} fill={entry.churn > 9 ? '#ef4444' : entry.churn > 6 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Sentiment Mix</div>
              <div className="card-subtitle">Customer feedback analysis</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sentimentPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {sentimentPie.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-3" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            {sentimentPie.map(s => (
              <div key={s.name} className="flex items-center gap-2" style={{ fontSize: '0.78rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                <span className="text-muted">{s.name}</span>
                <span style={{ fontWeight: 700 }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High Risk Customers Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">⚠️ High-Risk Customers</div>
            <div className="card-subtitle">Customers with highest churn probability — act now</div>
          </div>
          <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '7px 14px' }}>Export List</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Plan</th>
              <th>Region</th>
              <th>Risk Score</th>
              <th>MRR</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {riskCustomers.map(c => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td><span className="badge blue">{c.plan}</span></td>
                <td>{c.region}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="progress-bar-wrap" style={{ width: 80 }}>
                      <div className="progress-bar" style={{ width: `${c.risk}%`, background: c.risk > 85 ? '#ef4444' : c.risk > 75 ? '#f59e0b' : '#10b981' }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: c.risk > 85 ? 'var(--accent-red)' : 'var(--accent-orange)' }}>{c.risk}%</span>
                  </div>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.revenue}</td>
                <td>
                  <button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '5px 10px' }}>Retain</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
