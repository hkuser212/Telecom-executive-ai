import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { TrendingUp, Package, MapPin } from 'lucide-react';

const forecast = [
  { month: 'Jan', actual: 2.1, prophet: 2.0, lstm: 2.05, arima: 1.98 },
  { month: 'Feb', actual: 2.4, prophet: 2.35, lstm: 2.38, arima: 2.3 },
  { month: 'Mar', actual: 2.2, prophet: 2.5, lstm: 2.4, arima: 2.45 },
  { month: 'Apr', actual: 2.8, prophet: 2.7, lstm: 2.75, arima: 2.65 },
  { month: 'May', actual: 3.1, prophet: 2.9, lstm: 3.0, arima: 2.85 },
  { month: 'Jun', actual: 2.9, prophet: 3.2, lstm: 3.1, arima: 3.05 },
  { month: 'Jul', actual: 3.5, prophet: 3.3, lstm: 3.45, arima: 3.2 },
  { month: 'Aug', actual: 3.3, prophet: 3.5, lstm: 3.4, arima: 3.35 },
  { month: 'Sep', actual: null, prophet: 3.8, lstm: 3.75, arima: 3.6 },
  { month: 'Oct', actual: null, prophet: 4.0, lstm: 3.95, arima: 3.8 },
  { month: 'Nov', actual: null, prophet: 4.2, lstm: 4.1, arima: 3.95 },
  { month: 'Dec', actual: null, prophet: 4.5, lstm: 4.4, arima: 4.2 },
];

const productSales = [
  { product: 'Postpaid', q1: 1.2, q2: 1.4, q3: 1.6, q4: 1.9 },
  { product: 'Prepaid', q1: 0.6, q2: 0.7, q3: 0.8, q4: 0.9 },
  { product: 'Enterprise', q1: 0.2, q2: 0.3, q3: 0.4, q4: 0.55 },
  { product: 'IoT/B2B', q1: 0.1, q2: 0.15, q3: 0.22, q4: 0.3 },
];

const regions = [
  { region: 'Mumbai', revenue: 1.2, growth: 12.4 },
  { region: 'Delhi', revenue: 0.98, growth: 8.1 },
  { region: 'Bangalore', revenue: 0.76, growth: 15.3 },
  { region: 'Chennai', revenue: 0.54, growth: 6.8 },
  { region: 'Kolkata', revenue: 0.42, growth: 4.2 },
  { region: 'Hyderabad', revenue: 0.38, growth: 11.7 },
];

export default function SalesIntelligence() {
  return (
    <>
      <div className="page-header">
        <h1>Sales Intelligence</h1>
        <p>Revenue forecasting with Prophet · ARIMA · LSTM</p>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi-card green">
          <div className="kpi-icon-wrap"><TrendingUp size={18} /></div>
          <div className="kpi-value">₹4.5B</div>
          <div className="kpi-label">Q4 Revenue Forecast</div>
          <div className="kpi-change up">↑ +28.6% YoY</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon-wrap"><Package size={18} /></div>
          <div className="kpi-value">₹890</div>
          <div className="kpi-label">ARPU (Avg Revenue/User)</div>
          <div className="kpi-change up">↑ +5.4% vs last quarter</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon-wrap"><MapPin size={18} /></div>
          <div className="kpi-value">6</div>
          <div className="kpi-label">Top Performing Regions</div>
          <div className="kpi-change up">↑ Mumbai leads at ₹1.2B</div>
        </div>
      </div>

      {/* Multi-model forecast */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <div className="card-title">Multi-Model Revenue Forecast</div>
            <div className="card-subtitle">Actual vs Prophet / LSTM / ARIMA predictions (₹ Billion) · Sep–Dec are projected</div>
          </div>
          <div className="flex gap-2">
            <span className="badge green">Prophet</span>
            <span className="badge blue">LSTM</span>
            <span className="badge orange">ARIMA</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={forecast}>
            <defs>
              <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis unit="B" domain={[1.5, 5]} />
            <Tooltip formatter={(v, n) => [v ? `₹${v}B` : 'N/A', n]} />
            <Legend />
            <ReferenceLine x="Aug" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: 'Forecast Start', fill: '#475569', fontSize: 11 }} />
            <Area type="monotone" dataKey="actual" name="Actual" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gActual)" connectNulls={false} />
            <Area type="monotone" dataKey="prophet" name="Prophet" stroke="#10b981" strokeWidth={1.8} strokeDasharray="5 4" fill="none" />
            <Area type="monotone" dataKey="lstm" name="LSTM" stroke="#8b5cf6" strokeWidth={1.8} strokeDasharray="5 4" fill="none" />
            <Area type="monotone" dataKey="arima" name="ARIMA" stroke="#f59e0b" strokeWidth={1.8} strokeDasharray="5 4" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        {/* Product Revenue */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue by Product Line</div>
              <div className="card-subtitle">Quarterly breakdown (₹ Billion)</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={productSales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" />
              <YAxis unit="B" />
              <Tooltip formatter={v => [`₹${v}B`]} />
              <Legend />
              <Bar dataKey="q1" name="Q1" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="q2" name="Q2" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="q3" name="Q3" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="q4" name="Q4 (F)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Region Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue by Region</div>
              <div className="card-subtitle">Current year performance</div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Revenue</th>
                <th>Growth</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {regions.map(r => (
                <tr key={r.region}>
                  <td>{r.region}</td>
                  <td>₹{r.revenue}B</td>
                  <td>
                    <span className={`badge ${r.growth > 10 ? 'green' : r.growth > 6 ? 'blue' : 'orange'}`}>
                      +{r.growth}%
                    </span>
                  </td>
                  <td>
                    <div className="progress-bar-wrap" style={{ width: 80 }}>
                      <div className="progress-bar" style={{
                        width: `${(r.revenue / 1.2) * 100}%`,
                        background: 'var(--gradient-blue)'
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
