import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell, BarChart, Bar
} from 'recharts';
import { AlertTriangle, Shield, TrendingDown, Play, Upload, UserPlus } from 'lucide-react';
import { useState, useRef } from 'react';

const featureImportance = [
  { feature: 'Contract Type', importance: 0.31 },
  { feature: 'Tenure', importance: 0.24 },
  { feature: 'Monthly Charges', importance: 0.19 },
  { feature: 'Support Tickets', importance: 0.13 },
  { feature: 'Internet Service', importance: 0.08 },
  { feature: 'Payment Method', importance: 0.05 },
];

const radarData = [
  { metric: 'Loyalty', A: 20, B: 85 },
  { metric: 'Spend', A: 45, B: 90 },
  { metric: 'Engagement', A: 15, B: 75 },
  { metric: 'Support Freq', A: 90, B: 10 },
  { metric: 'Satisfaction', A: 25, B: 88 },
  { metric: 'Plan Value', A: 30, B: 70 },
];

function RiskBadge({ risk }) {
  if (risk >= 80) return <span className="badge red">High Risk</span>;
  if (risk >= 60) return <span className="badge orange">Medium Risk</span>;
  return <span className="badge green">Low Risk</span>;
}

export default function CustomerAnalytics() {
  const [activeTab, setActiveTab] = useState('batch'); // 'batch' or 'manual'
  
  // State for Batch Upload
  const [customers, setCustomers] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchStats, setBatchStats] = useState(null);
  const fileInputRef = useRef(null);

  // State for Manual Form
  const [formData, setFormData] = useState({
    gender: "Female", SeniorCitizen: 0, Partner: "Yes", Dependents: "No",
    tenure: 12, PhoneService: "Yes", MultipleLines: "No", InternetService: "Fiber optic",
    OnlineSecurity: "No", OnlineBackup: "No", DeviceProtection: "No", TechSupport: "No",
    StreamingTV: "Yes", StreamingMovies: "No", Contract: "Month-to-month",
    PaperlessBilling: "Yes", PaymentMethod: "Electronic check",
    MonthlyCharges: 85.5, TotalCharges: 1026.0
  });
  const [manualResult, setManualResult] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);

  // State for AI Support Triage
  const [triageData, setTriageData] = useState({ subject: "", description: "" });
  const [triageResult, setTriageResult] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  const handleTriagePredict = async (e) => {
    e.preventDefault();
    setTriageLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/predict-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(triageData)
      });
      const data = await res.json();
      setTriageResult(data);
    } catch (err) {
      alert("Failed to connect to triage API");
    }
    setTriageLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBatchLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('http://127.0.0.1:8000/predict-churn-batch', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if(data.high_risk_customers) {
        setCustomers(data.high_risk_customers);
        setBatchStats({ total: data.total_processed, highRisk: data.high_risk_customers.length });
      } else {
        alert(data.detail || 'Error processing file');
      }
    } catch (err) {
      alert("Failed to connect to backend for batch prediction.");
    }
    setBatchLoading(false);
  };

  const handleManualPredict = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/predict-churn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setManualResult(data);
    } catch (err) {
      setManualResult({ error: "Failed to connect to API" });
    }
    setManualLoading(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'tenure' || name === 'SeniorCitizen' || name === 'MonthlyCharges' || name === 'TotalCharges' ? Number(value) : value }));
  };

  return (
    <>
      <div className="page-header">
        <h1>Customer Analytics</h1>
        <p>Churn prediction powered by XGBoost with SMOTE balancing (91% Train Acc)</p>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi-card orange">
          <div className="kpi-icon-wrap"><AlertTriangle size={18} /></div>
          <div className="kpi-value">{batchStats ? batchStats.highRisk : 312}</div>
          <div className="kpi-label">High-Risk Customers</div>
          <div className="kpi-change down"><span>↑</span> Updates live</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon-wrap"><Shield size={18} /></div>
          <div className="kpi-value">87.4%</div>
          <div className="kpi-label">Retention Rate</div>
          <div className="kpi-change up"><span>↑</span> +1.2% vs last month</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon-wrap"><TrendingDown size={18} /></div>
          <div className="kpi-value">₹84M</div>
          <div className="kpi-label">Revenue at Risk</div>
          <div className="kpi-change down"><span>↑</span> If high-risk churn</div>
        </div>
      </div>

      {/* Interactive Prediction Section */}
      <div className="card mb-6">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <button 
              onClick={() => setActiveTab('batch')}
              style={{ background: 'none', border: 'none', fontSize: '1rem', fontWeight: 600, color: activeTab === 'batch' ? 'var(--accent-blue)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottom: activeTab === 'batch' ? '2px solid var(--accent-blue)' : '2px solid transparent' }}
            >
              <Upload size={16} /> Batch CSV Scanner
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              style={{ background: 'none', border: 'none', fontSize: '1rem', fontWeight: 600, color: activeTab === 'manual' ? 'var(--accent-green)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottom: activeTab === 'manual' ? '2px solid var(--accent-green)' : '2px solid transparent' }}
            >
              <UserPlus size={16} /> Manual Risk Calculator
            </button>
          </div>
        </div>
        
        <div style={{ padding: '24px 0 0 0' }}>
          {activeTab === 'batch' && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>
                Upload your latest customer dataset CSV. The XGBoost model will score all customers and instantly generate a "High Risk" intervention list.
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={() => fileInputRef.current.click()}
                  disabled={batchLoading}
                >
                  {batchLoading ? 'Scanning Dataset...' : 'Upload CSV & Scan'}
                </button>
                {batchStats && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                    Successfully processed {batchStats.total} customers! Found {batchStats.highRisk} at high risk.
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualPredict} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Tenure (months)</label>
                <input name="tenure" type="number" value={formData.tenure} onChange={handleFormChange} className="chat-input" style={{ width: '100%', padding: '8px 12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Monthly Charges ($)</label>
                <input name="MonthlyCharges" type="number" step="0.1" value={formData.MonthlyCharges} onChange={handleFormChange} className="chat-input" style={{ width: '100%', padding: '8px 12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Contract</label>
                <select name="Contract" value={formData.Contract} onChange={handleFormChange} className="chat-input" style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)' }}>
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingtop: 16, borderTop: '1px solid var(--border)' }}>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--gradient-green)' }} disabled={manualLoading}>
                  {manualLoading ? 'Calculating...' : 'Predict Risk'}
                </button>
                
                {manualResult && !manualResult.error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI Prediction:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: manualResult.is_high_risk ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                      {manualResult.is_high_risk ? 'High Risk' : 'Low Risk'} ({manualResult.risk_score}%)
                    </span>
                  </div>
                )}
                {manualResult && manualResult.error && <span style={{ color: 'var(--accent-red)' }}>{manualResult.error}</span>}
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="grid-2 mb-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Risk Profile Comparison</div>
              <div className="card-subtitle">High-risk vs loyal customers</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(99,179,237,0.1)" />
              <PolarAngleAxis dataKey="metric" style={{ fontSize: 10, fill: '#475569' }} />
              <Radar name="High Risk" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
              <Radar name="Loyal" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">⚠️ High-Risk Customers {customers.length > 0 && `(${customers.length} Found)`}</div>
              <div className="card-subtitle">
                {customers.length > 0 ? "Live data from CSV upload" : "Upload a CSV to view live high-risk customers"}
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 300 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Contract</th>
                  <th>Tenure</th>
                  <th>Monthly $</th>
                  <th>Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No data. Please upload a CSV dataset above.</td></tr>
                ) : (
                  customers.map((c, idx) => (
                    <tr key={c.customerID || idx}>
                      <td>{c.customerID || `User ${idx+1}`}</td>
                      <td><span className="badge blue" style={{ fontSize: '0.68rem' }}>{c.Contract}</span></td>
                      <td>{c.tenure}mo</td>
                      <td>${c.MonthlyCharges}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar-wrap" style={{ width: 60 }}>
                            <div className="progress-bar" style={{ width: `${c.RiskScore}%`, background: c.RiskScore >= 80 ? '#ef4444' : c.RiskScore >= 60 ? '#f59e0b' : '#10b981' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{c.RiskScore}%</span>
                        </div>
                      </td>
                      <td><RiskBadge risk={c.RiskScore} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Support Triage Widget */}
      <div className="card mb-6" style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, var(--bg-secondary) 100%)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <div className="card-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent-purple)' }}>✦</span> AI Support Auto-Triage
            </div>
            <div className="card-subtitle" style={{ opacity: 0.7 }}>Test the NLP routing engine with a simulated support ticket</div>
          </div>
        </div>
        <div style={{ padding: '20px' }}>
          <form onSubmit={handleTriagePredict} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input 
              name="subject"
              type="text"
              value={triageData.subject}
              onChange={(e) => setTriageData({...triageData, subject: e.target.value})}
              placeholder="Ticket Subject (e.g. Cannot connect to internet)"
              style={{
                background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '0.95rem', outline: 'none'
              }}
            />
            <textarea 
              name="description"
              value={triageData.description}
              onChange={(e) => setTriageData({...triageData, description: e.target.value})}
              placeholder="Detailed description of the problem..."
              style={{ 
                minHeight: '80px', resize: 'none', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px', color: '#fff', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none'
              }}
            />
            <button 
              type="submit" 
              disabled={triageLoading || !triageData.description.trim()} 
              style={{ 
                alignSelf: 'flex-start',
                background: triageLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', fontWeight: 600, fontSize: '1rem', cursor: (triageLoading || !triageData.description.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {triageLoading ? 'Routing...' : 'Auto-Triage Ticket'}
            </button>
          </form>

          {triageResult && (
            <div style={{ marginTop: 20, padding: '20px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', display: 'flex', gap: 24, border: `1px solid rgba(255,255,255,0.05)`, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 24 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 8 }}>Predicted Ticket Type</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="badge blue" style={{ fontSize: '1rem', padding: '8px 16px' }}>{triageResult.ticket_type}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conf: {(triageResult.type_confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 8 }}>Predicted Priority</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className={`badge ${triageResult.priority === 'Critical' ? 'red' : triageResult.priority === 'High' ? 'orange' : triageResult.priority === 'Medium' ? 'blue' : 'green'}`} style={{ fontSize: '1rem', padding: '8px 16px', boxShadow: triageResult.priority === 'Critical' ? '0 0 10px rgba(239,68,68,0.5)' : 'none' }}>
                    {triageResult.priority}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conf: {(triageResult.priority_confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
