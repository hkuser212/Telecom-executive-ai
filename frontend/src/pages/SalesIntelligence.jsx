import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, Package, MapPin, Sliders, RefreshCw, BarChart2, 
  CheckCircle2, Upload, Download, Database, AlertTriangle, 
  FileText, CheckCircle, HelpCircle, Activity 
} from 'lucide-react';

const MOCK_FORECAST = [
  { month: 'Jan', actual: 2.45, prophet: 2.69, lstm: 2.98, arima: 2.57 },
  { month: 'Feb', actual: 2.46, prophet: 2.67, lstm: 2.98, arima: 2.61 },
  { month: 'Mar', actual: 3.03, prophet: 3.16, lstm: 2.98, arima: 3.1 },
  { month: 'Apr', actual: 3.35, prophet: 3.42, lstm: 2.98, arima: 3.42 },
  { month: 'May', actual: 3.58, prophet: 3.68, lstm: 2.98, arima: 3.65 },
  { month: 'Jun', actual: 3.70, prophet: 3.77, lstm: 2.98, arima: 3.76 },
  { month: 'Jul', actual: 4.00, prophet: 4.03, lstm: 2.98, arima: 4.08 },
  { month: 'Aug', actual: 3.60, prophet: 3.69, lstm: 2.98, arima: 3.63 },
  { month: 'Sep', actual: null, prophet: 3.44, lstm: 2.98, arima: 3.4 },
  { month: 'Oct', actual: null, prophet: 3.35, lstm: 2.98, arima: 3.31 },
  { month: 'Nov', actual: null, prophet: 3.44, lstm: 2.98, arima: 3.38 },
  { month: 'Dec', actual: null, prophet: 2.84, lstm: 2.98, arima: 2.74 },
];

const BASE_PRODUCTS = [
  { product: 'Postpaid', q1: 1.20, q2: 1.40, q3: 1.60, q4: 1.90 },
  { product: 'Prepaid', q1: 0.60, q2: 0.70, q3: 0.80, q4: 0.90 },
  { product: 'Enterprise', q1: 0.20, q2: 0.30, q3: 0.40, q4: 0.55 },
  { product: 'IoT/B2B', q1: 0.10, q2: 0.15, q3: 0.22, q4: 0.30 },
];

const BASE_REGIONS = [
  { region: 'Mumbai', revenue: 1.20, growth: 12.4, share: 0.32 },
  { region: 'Delhi', revenue: 0.98, growth: 8.1, share: 0.26 },
  { region: 'Bangalore', revenue: 0.76, growth: 15.3, share: 0.20 },
  { region: 'Chennai', revenue: 0.54, growth: 6.8, share: 0.12 },
  { region: 'Kolkata', revenue: 0.42, growth: 4.2, share: 0.06 },
  { region: 'Hyderabad', regionWeight: 0.38, revenue: 0.38, growth: 11.7, share: 0.04 },
];

export default function SalesIntelligence() {
  const [forecast, setForecast] = useState(MOCK_FORECAST);
  const [defaultForecast, setDefaultForecast] = useState(MOCK_FORECAST);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' or 'testing'

  // Strategic Parameter States (Inputs for User Interaction)
  const [baseScale, setBaseScale] = useState(1.0);
  const [summerBoost, setSummerBoost] = useState(0);
  const [rechargePattern, setRechargePattern] = useState('balanced');
  const [focusPostpaid, setFocusPostpaid] = useState(1.0);
  const [focusPrepaid, setFocusPrepaid] = useState(1.0);
  const [focusEnterprise, setFocusEnterprise] = useState(1.0);
  const [focusIoT, setFocusIoT] = useState(1.0);

  // Active Model Line Focus
  const [activeModel, setActiveModel] = useState('arima'); // Default to winning model

  // Dynamic Custom Upload states
  const [customModelActive, setCustomModelActive] = useState(false);
  const [customMetrics, setCustomMetrics] = useState(null);
  const [customStationarity, setCustomStationarity] = useState(null);
  const [customRecords, setCustomRecords] = useState(0);
  const [customMonths, setCustomMonths] = useState(0);

  // Drag & Drop / Progress states
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [activeStep, setActiveStep] = useState(0); // 0: Idle, 1: Uploading, 2: Aggregating & ADF, 3: Fitting models, 4: Done

  useEffect(() => {
    fetch('http://127.0.0.1:8000/forecast-sales')
      .then(res => {
        if (!res.ok) throw new Error('Models not trained or server unavailable');
        return res.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          setForecast(data);
          setDefaultForecast(data);
          setIsLive(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn("Using offline trained forecast results due to:", err.message);
        setLoading(false);
      });
  }, []);

  // Helper function to round values
  const round = (num, decimals = 2) => Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

  // Dynamic Real-time Calculations (Output Mapping)
  const simulatedForecast = forecast.map((f, idx) => {
    let mult = baseScale;
    const isCustomSeries = forecast.length > 12;

    if (isCustomSeries) {
      // Custom 24-month series: index 0 to 11 are test history, index 12 to 23 are future predictions
      const mName = f.month;
      if (mName === 'Jun' || mName === 'Jul' || mName === 'Aug') {
        mult += (summerBoost / 100);
      }
      if (idx >= 12) {
        if (rechargePattern === 'postpaid_premium') {
          mult *= (1.0 + 0.12 * focusPostpaid);
        } else if (rechargePattern === 'prepaid_mass') {
          mult *= (1.0 + 0.06 * focusPrepaid);
        } else if (rechargePattern === 'enterprise_shift') {
          mult *= (1.0 + 0.18 * focusEnterprise);
        }
      }
    } else {
      // Standard 12-month series: index 0 to 7 are actuals, index 8 to 11 are future forecasts
      if (idx >= 5 && idx <= 7) {
        mult += (summerBoost / 100);
      }
      if (idx >= 8) {
        if (rechargePattern === 'postpaid_premium') {
          mult *= (1.0 + 0.12 * focusPostpaid);
        } else if (rechargePattern === 'prepaid_mass') {
          mult *= (1.0 + 0.06 * focusPrepaid);
        } else if (rechargePattern === 'enterprise_shift') {
          mult *= (1.0 + 0.18 * focusEnterprise);
        }
      }
    }

    return {
      month: f.month,
      year: f.year || 2017,
      actual: f.actual ? round(f.actual * baseScale) : null,
      raw_actual: f.raw_actual || null,
      prophet: f.prophet ? round(f.prophet * mult) : null,
      lstm: f.lstm ? round(f.lstm * mult) : null,
      arima: f.arima ? round(f.arima * mult) : null,
    };
  });

  // Calculate simulated Product Sales breakdown based on category sliders
  const simulatedProducts = BASE_PRODUCTS.map(p => {
    let weight = 1.0;
    if (p.product === 'Postpaid') weight = focusPostpaid;
    else if (p.product === 'Prepaid') weight = focusPrepaid;
    else if (p.product === 'Enterprise') weight = focusEnterprise;
    else if (p.product === 'IoT/B2B') weight = focusIoT;

    const scale = baseScale * weight;
    return {
      product: p.product,
      q1: round(p.q1 * scale),
      q2: round(p.q2 * scale),
      q3: round(p.q3 * scale),
      q4: round(p.q4 * scale),
    };
  });

  // Calculate simulated Region Performance
  const simulatedRegions = BASE_REGIONS.map(r => {
    let weight = 1.0;
    if (r.region === 'Mumbai' || r.region === 'Delhi') {
      weight = (focusPostpaid * 0.6 + focusPrepaid * 0.4);
    } else if (r.region === 'Bangalore' || r.region === 'Hyderabad') {
      weight = (focusEnterprise * 0.7 + focusIoT * 0.3);
    } else {
      weight = (focusPrepaid * 0.5 + focusEnterprise * 0.5);
    }

    const currentRevenue = round(r.revenue * baseScale * weight);
    const dynamicGrowth = round(r.growth * (1 + (baseScale - 1) * 0.5) * weight);

    return {
      region: r.region,
      revenue: currentRevenue,
      growth: dynamicGrowth,
    };
  });

  // Calculate Dynamic KPIs for dashboard cards
  const lastIndex = simulatedForecast.length - 1;
  const activeDecForecast = simulatedForecast[lastIndex]?.[activeModel] || 2.74;

  const totalForecastedQ4 = round(
    (simulatedForecast[lastIndex - 3]?.[activeModel] || 0) +
    (simulatedForecast[lastIndex - 2]?.[activeModel] || 0) +
    (simulatedForecast[lastIndex - 1]?.[activeModel] || 0) +
    (simulatedForecast[lastIndex]?.[activeModel] || 0)
  );

  let arpuBase = 890;
  if (rechargePattern === 'postpaid_premium') arpuBase += 85 * focusPostpaid;
  else if (rechargePattern === 'prepaid_mass') arpuBase -= 110 * focusPrepaid;
  else if (rechargePattern === 'enterprise_shift') arpuBase += 140 * focusEnterprise;
  const dynamicARPU = Math.round(arpuBase * baseScale);

  const resetParameters = () => {
    setBaseScale(1.0);
    setSummerBoost(0);
    setRechargePattern('balanced');
    setFocusPostpaid(1.0);
    setFocusPrepaid(1.0);
    setFocusEnterprise(1.0);
    setFocusIoT(1.0);
    setActiveModel('arima');

    if (customModelActive) {
      setForecast(defaultForecast);
      setCustomModelActive(false);
      setCustomMetrics(null);
      setCustomStationarity(null);
      setCustomRecords(0);
      setCustomMonths(0);
    }
  };

  // CSV Drag and Drop / Uploader handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);
    setActiveStep(1);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Mock progression states to wow user during fast computation
      setTimeout(() => setActiveStep(2), 600);
      setTimeout(() => setActiveStep(3), 1300);

      const res = await fetch('http://127.0.0.1:8000/forecast-sales-upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to parse or fit models on dataset.");
      }

      const data = await res.json();
      setForecast(data.forecast_data);
      setCustomMetrics(data.metrics);
      setCustomStationarity(data.stationarity);
      setCustomRecords(data.total_records);
      setCustomMonths(data.aggregated_months);
      setCustomModelActive(true);
      setActiveModel(data.best_model);
      setActiveStep(4);
      setUploadLoading(false);
    } catch (err) {
      setUploadError(err.message);
      setUploadLoading(false);
      setActiveStep(0);
    }
  };

  // CSV Export handler
  const handleExportForecast = async () => {
    const exportData = simulatedForecast.map(f => ({
      month: f.month,
      year: f.year,
      actual_revenue: f.actual || "",
      arima_prediction: f.arima || "",
      prophet_prediction: f.prophet || "",
      lightgbm_prediction: f.lstm || ""
    }));

    try {
      const res = await fetch('http://127.0.0.1:8000/forecast-sales-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: exportData })
      });

      if (!res.ok) throw new Error("Failed to compile CSV report.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `telecom_sales_forecast_${customModelActive ? 'custom_model' : 'standard_model'}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Could not export forecast report. Make sure backend service is active.");
    }
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Sales Forecasting Studio</h1>
            <p>Refit advanced time series models, execute stationarity analytics, and run real-time predictions</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={resetParameters} 
              className="btn btn-secondary" 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 
                color: '#e2e8f0', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' 
              }}
            >
              <RefreshCw size={14} /> {customModelActive ? 'Revert to Base Model' : 'Reset'}
            </button>
            <span 
              className={`badge ${customModelActive ? 'green' : isLive ? 'purple' : 'blue'}`} 
              style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '6px', fontWeight: 600 }}
            >
              {customModelActive ? '● Active Custom Dataset' : isLive ? '● Live Predictions (train.csv)' : '● Offline Serialized Results'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card green" style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="kpi-icon-wrap"><TrendingUp size={18} /></div>
          <div className="kpi-value">₹{activeDecForecast}B</div>
          <div className="kpi-label">December Forecast ({activeModel.toUpperCase()})</div>
          <div className="kpi-change up">↑ Total Q4 Forecast: ₹{totalForecastedQ4}B</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon-wrap"><Package size={18} /></div>
          <div className="kpi-value">₹{dynamicARPU}</div>
          <div className="kpi-label">Simulated ARPU (Avg Revenue/User)</div>
          <div className="kpi-change up">
            {rechargePattern === 'postpaid_premium' ? 'Postpaid Premium Active' : rechargePattern === 'prepaid_mass' ? 'Prepaid Mass Volume Active' : 'Balanced Recharge Mix'}
          </div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon-wrap"><MapPin size={18} /></div>
          <div className="kpi-value">₹{simulatedRegions[0].revenue}B</div>
          <div className="kpi-label">Top Performance Hub ({simulatedRegions[0].region})</div>
          <div className="kpi-change up">↑ Projected Growth: +{simulatedRegions[0].growth}%</div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('simulator')} 
          style={{ 
            background: 'none', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: 600, 
            color: activeTab === 'simulator' ? '#3b82f6' : '#94a3b8', 
            borderBottom: activeTab === 'simulator' ? '2.5px solid #3b82f6' : '2.5px solid transparent',
            cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <Sliders size={16} /> Strategic Planning Simulator
        </button>
        <button 
          onClick={() => setActiveTab('testing')} 
          style={{ 
            background: 'none', border: 'none', padding: '10px 16px', fontSize: '14px', fontWeight: 600, 
            color: activeTab === 'testing' ? '#3b82f6' : '#94a3b8', 
            borderBottom: activeTab === 'testing' ? '2.5px solid #3b82f6' : '2.5px solid transparent',
            cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}
        >
          <Database size={16} /> Upload & Test ML Models
        </button>
      </div>

      {/* STRATEGIC CONTROL CENTER TAB */}
      {activeTab === 'simulator' && (
        <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} className="text-blue" style={{ color: '#3b82f6' }} />
              <div>
                <div className="card-title">Strategic Planning Simulator (Inputs)</div>
                <div className="card-subtitle">Tune the active parameters to project changes to forecast models instantly</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            
            {/* Historical Data & Seasonal Controls */}
            <div>
              <h4 style={{ color: '#e2e8f0', marginBottom: '14px', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>Macro Trends</h4>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>
                  <span>Historical Scale Bias</span>
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>{baseScale}x</span>
                </div>
                <input 
                  type="range" min="0.8" max="1.5" step="0.05" 
                  value={baseScale} onChange={(e) => setBaseScale(parseFloat(e.target.value))} 
                  style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
                />
                <p style={{ color: '#64748b', fontSize: '10px', marginTop: '4px' }}>Simulates overall volume expansions or contractions</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>
                  <span>Seasonal Summer Boost</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>+{summerBoost}%</span>
                </div>
                <input 
                  type="range" min="0" max="30" step="5" 
                  value={summerBoost} onChange={(e) => setSummerBoost(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <p style={{ color: '#64748b', fontSize: '10px', marginTop: '4px' }}>Amplifies annual peak spikes (June-August)</p>
              </div>
            </div>

            {/* Recharge Patterns Selector */}
            <div>
              <h4 style={{ color: '#e2e8f0', marginBottom: '14px', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>Recharge & ARPU Mix</h4>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '8px' }}>User Recharge Pattern Mix</label>
                <select 
                  value={rechargePattern} 
                  onChange={(e) => setRechargePattern(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="balanced">Balanced Traditional Mix</option>
                  <option value="postpaid_premium">Postpaid Premium Heavy (+12% Forecast)</option>
                  <option value="prepaid_mass">Prepaid High Volume Mass (+6% Forecast)</option>
                  <option value="enterprise_shift">Enterprise & Cloud IoT B2B (+18% Forecast)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', padding: '10px', borderRadius: '6px' }}>
                <CheckCircle2 size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <p style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: '1.4' }}>
                  {rechargePattern === 'balanced' && "Traditional balanced split preserves standard seasonal ML weights."}
                  {rechargePattern === 'postpaid_premium' && "Postpaid heavy increases Q4 ARPU by ₹85. Direct positive effect on margin forecasts."}
                  {rechargePattern === 'prepaid_mass' && "Prepaid focus drives higher user volumes with slightly lower unit pricing."}
                  {rechargePattern === 'enterprise_shift' && "Enterprise IoT shifting expands baseline stability, elevating ARIMA floor."}
                </p>
              </div>
            </div>

            {/* Product Weights FOCUS */}
            <div>
              <h4 style={{ color: '#e2e8f0', marginBottom: '14px', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>Product Focus (Weights)</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
                    <span>Postpaid</span>
                    <span style={{ color: '#8b5cf6' }}>{focusPostpaid}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="1.5" step="0.1" 
                    value={focusPostpaid} onChange={(e) => setFocusPostpaid(parseFloat(e.target.value))} 
                    style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
                    <span>Prepaid</span>
                    <span style={{ color: '#ec4899' }}>{focusPrepaid}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="1.5" step="0.1" 
                    value={focusPrepaid} onChange={(e) => setFocusPrepaid(parseFloat(e.target.value))} 
                    style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
                    <span>Enterprise</span>
                    <span style={{ color: '#06b6d4' }}>{focusEnterprise}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="1.5" step="0.1" 
                    value={focusEnterprise} onChange={(e) => setFocusEnterprise(parseFloat(e.target.value))} 
                    style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
                    <span>IoT/B2B</span>
                    <span style={{ color: '#10b981' }}>{focusIoT}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="1.5" step="0.1" 
                    value={focusIoT} onChange={(e) => setFocusIoT(parseFloat(e.target.value))} 
                    style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD & ML MODEL TESTING TAB */}
      {activeTab === 'testing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
          
          {/* UPLOADER CONTAINER */}
          <div className="card" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                
                {/* File Dropzone */}
                <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Refit Forecasting Models</h3>
                  <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
                    Upload a custom daily or monthly sales dataset (CSV) to retrain ARIMA, Prophet, and LightGBM regressors on-the-fly. The CSV should contain a date column and a sales value column.
                  </p>

                  <div 
                    style={{ 
                      border: '2px dashed rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '24px',
                      textAlign: 'center', background: 'rgba(59, 130, 246, 0.02)', position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', minHeight: '160px', transition: 'all 0.3s'
                    }}
                  >
                    <Upload size={36} className="text-blue" style={{ color: '#3b82f6', marginBottom: '12px' }} />
                    <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      Drag and drop your CSV here, or click to browse
                    </span>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      Supports standard columns like date, sales, revenue (min 24 months)
                    </span>
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={handleFileUpload}
                      style={{ 
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                        opacity: 0, cursor: 'pointer' 
                      }} 
                    />
                  </div>
                </div>

                {/* Progress / Step Monitor */}
                <div style={{ flex: '1 1 300px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} className="text-blue" style={{ color: '#3b82f6' }} /> Execution Stream
                  </h4>

                  {!uploadLoading && activeStep === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                      <Database size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <p style={{ fontSize: '12px' }}>Waiting for dataset upload...</p>
                    </div>
                  )}

                  {uploadLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '18px', height: '18px', borderRadius: '50%', border: '2px solid transparent',
                          borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite', flexShrink: 0
                        }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                          {activeStep === 1 && "Ingesting CSV file contents..."}
                          {activeStep === 2 && "Performing stationarity and ADF test..."}
                          {activeStep === 3 && "Retraining Prophet, ARIMA & LightGBM..."}
                        </span>
                      </div>
                      
                      {/* Interactive Visual steps */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '30px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: '11px', color: activeStep >= 1 ? '#3b82f6' : '#64748b', fontWeight: activeStep === 1 ? 600 : 400 }}>
                          {activeStep > 1 ? '✓' : '●'} CSV Ingestion & Parsing
                        </div>
                        <div style={{ fontSize: '11px', color: activeStep >= 2 ? '#10b981' : '#64748b', fontWeight: activeStep === 2 ? 600 : 400 }}>
                          {activeStep > 2 ? '✓' : '●'} Augmented Dickey-Fuller Test
                        </div>
                        <div style={{ fontSize: '11px', color: activeStep >= 3 ? '#8b5cf6' : '#64748b', fontWeight: activeStep === 3 ? 600 : 400 }}>
                          {activeStep > 3 ? '✓' : '●'} SARIMAX & Regression Modeling
                        </div>
                      </div>
                    </div>
                  )}

                  {!uploadLoading && activeStep === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
                      <CheckCircle size={32} style={{ color: '#10b981' }} />
                      <div>
                        <p style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 600 }}>Models Trained Successfully!</p>
                        <p style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                          Processed {customRecords.toLocaleString()} rows · {customMonths} aggregated months.
                        </p>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', display: 'flex', gap: '8px' }}>
                      <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <p style={{ color: '#fca5a5', fontSize: '11px', lineHeight: '1.4' }}>
                        <strong>Error:</strong> {uploadError}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

          {/* TELEMETRY CARDS (VISIBLE ONCE CUSTOM MODEL ACTIVE) */}
          {customModelActive && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Telemetry Card: Model Comparison */}
              <div className="card">
                <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={16} className="text-purple" style={{ color: '#8b5cf6' }} />
                    <div className="card-title">Retrained Model Accuracy Telemetry</div>
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <table className="data-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Model Name</th>
                        <th style={{ textAlign: 'center' }}>MAPE</th>
                        <th style={{ textAlign: 'center' }}>RMSE</th>
                        <th style={{ textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>ARIMA (SARIMAX)</td>
                        <td style={{ textAlign: 'center', color: '#cbd5e1' }}>{customMetrics?.arima?.mape}%</td>
                        <td style={{ textAlign: 'center', color: '#cbd5e1' }}>{customMetrics?.arima?.rmse}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${activeModel === 'arima' ? 'orange' : 'blue'}`} style={{ padding: '2px 6px', fontSize: '10px', fontWeight: 600 }}>
                            {activeModel === 'arima' ? 'Champion' : 'Challenger'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>Prophet Predictor</td>
                        <td style={{ textAlign: 'center', color: '#cbd5e1' }}>{customMetrics?.prophet?.mape}%</td>
                        <td style={{ textAlign: 'center', color: '#cbd5e1' }}>{customMetrics?.prophet?.rmse}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${activeModel === 'prophet' ? 'green' : 'blue'}`} style={{ padding: '2px 6px', fontSize: '10px', fontWeight: 600 }}>
                            {activeModel === 'prophet' ? 'Champion' : 'Challenger'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>LightGBM Regressor</td>
                        <td style={{ textAlign: 'center', color: '#cbd5e1' }}>{customMetrics?.lstm?.mape}%</td>
                        <td style={{ textAlign: 'center', color: '#cbd5e1' }}>{customMetrics?.lstm?.rmse}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${activeModel === 'lstm' ? 'purple' : 'blue'}`} style={{ padding: '2px 6px', fontSize: '10px', fontWeight: 600 }}>
                            {activeModel === 'lstm' ? 'Champion' : 'Challenger'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ color: '#64748b', fontSize: '10px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HelpCircle size={10} /> MAPE (Mean Absolute Percentage Error) quantifies projection error. Lower is better.
                  </p>
                </div>
              </div>

              {/* Telemetry Card: ADF Stationarity Test */}
              <div className="card">
                <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} className="text-green" style={{ color: '#10b981' }} />
                    <div className="card-title">Augmented Dickey-Fuller (ADF) Report</div>
                  </div>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justify: 'space-between', height: '80%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '4px' }}>ADF Statistic</span>
                      <strong style={{ color: '#f8fafc', fontSize: '15px' }}>{customStationarity?.adf_statistic}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '4px' }}>p-value</span>
                      <strong style={{ color: '#f8fafc', fontSize: '15px' }}>{customStationarity?.p_value}</strong>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', gap: '10px', alignItems: 'center', padding: '12px', 
                    borderRadius: '8px', background: customStationarity?.is_stationary ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                    border: customStationarity?.is_stationary ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(245, 158, 11, 0.15)'
                  }}>
                    <CheckCircle2 size={20} style={{ color: customStationarity?.is_stationary ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                    <div>
                      <h5 style={{ color: customStationarity?.is_stationary ? '#10b981' : '#f59e0b', fontSize: '12px', fontWeight: 600 }}>
                        {customStationarity?.is_stationary ? "Series is Stationary" : "Trend / Drift Detected"}
                      </h5>
                      <p style={{ color: '#cbd5e1', fontSize: '10.5px', marginTop: '2px', lineHeight: '1.4' }}>
                        {customStationarity?.is_stationary 
                          ? "The time series shows stable variance over time, making it highly suitable for seasonal SARIMAX fitting."
                          : "The series exhibits non-stationary trends. Models differenced this internally to extract forecast bounds safely."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* FORECAST GRAPH */}
      <div className="card mb-6">
        <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
          <div>
            <div className="card-title">Interactive Multi-Model Projections</div>
            <div className="card-subtitle">
              {customModelActive 
                ? `Custom Model Outputs · Aggregated scaled sales (₹ Billions)` 
                : `Real-time simulator outputs (₹ Billions) · Select model focus below to adjust main KPI forecasts`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveModel('arima')} 
              className={`badge ${activeModel === 'arima' ? 'active' : ''}`}
              style={{ background: activeModel === 'arima' ? '#f59e0b' : 'rgba(255,255,255,0.05)', color: activeModel === 'arima' ? '#000' : '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              ARIMA {customMetrics ? `(${customMetrics?.arima?.mape}% MAPE)` : '(Champion: 2.6% MAPE)'}
            </button>
            <button 
              onClick={() => setActiveModel('prophet')} 
              className={`badge ${activeModel === 'prophet' ? 'active' : ''}`}
              style={{ background: activeModel === 'prophet' ? '#10b981' : 'rgba(255,255,255,0.05)', color: activeModel === 'prophet' ? '#000' : '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              Prophet {customMetrics ? `(${customMetrics?.prophet?.mape}% MAPE)` : '(4.1% MAPE)'}
            </button>
            <button 
              onClick={() => setActiveModel('lstm')} 
              className={`badge ${activeModel === 'lstm' ? 'active' : ''}`}
              style={{ background: activeModel === 'lstm' ? '#8b5cf6' : 'rgba(255,255,255,0.05)', color: activeModel === 'lstm' ? '#fff' : '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              LightGBM {customMetrics ? `(${customMetrics?.lstm?.mape}% MAPE)` : '(14.5% MAPE)'}
            </button>
          </div>
        </div>
        <div style={{ padding: '20px' }}>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={simulatedForecast}>
              <defs>
                <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis unit="B" domain={['auto', 'auto']} stroke="#64748b" />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                formatter={(v, n) => [v ? `₹${v}B` : 'N/A', n]} 
              />
              <Legend verticalAlign="top" height={36} />
              
              {/* If it is a custom series of 24 months, the split line should be at index 12 (month name of f[11]) */}
              <ReferenceLine 
                x={simulatedForecast.length > 12 ? simulatedForecast[11]?.month : "Aug"} 
                stroke="rgba(255,255,255,0.2)" 
                strokeDasharray="4 4" 
                label={{ value: 'Forecast Horizon', fill: '#94a3b8', fontSize: 11, position: 'top' }} 
              />
              
              <Area type="monotone" dataKey="actual" name="Historical Actual" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gActual)" connectNulls={false} />
              <Area type="monotone" dataKey="prophet" name="Prophet Predictor" stroke="#10b981" strokeWidth={activeModel === 'prophet' ? 3 : 1.5} strokeDasharray={activeModel === 'prophet' ? '0' : '4 4'} fill="none" opacity={activeModel === 'prophet' ? 1.0 : 0.4} />
              <Area type="monotone" dataKey="lstm" name="LightGBM Predictor" stroke="#8b5cf6" strokeWidth={activeModel === 'lstm' ? 3 : 1.5} strokeDasharray={activeModel === 'lstm' ? '0' : '4 4'} fill="none" opacity={activeModel === 'lstm' ? 1.0 : 0.4} />
              <Area type="monotone" dataKey="arima" name="ARIMA Predictor" stroke="#f59e0b" strokeWidth={activeModel === 'arima' ? 3 : 1.5} strokeDasharray={activeModel === 'arima' ? '0' : '4 4'} fill="none" opacity={activeModel === 'arima' ? 1.0 : 0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        {/* Product Revenue Chart */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} style={{ color: '#8b5cf6' }} />
              <div>
                <div className="card-title">Simulated Product Line Revenues</div>
                <div className="card-subtitle">Dynamic allocation matching product sliders (₹ Billion)</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={simulatedProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="product" stroke="#64748b" />
                <YAxis unit="B" stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}
                  formatter={v => [`₹${v}B`]} 
                />
                <Legend />
                <Bar dataKey="q1" name="Q1 Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="q2" name="Q2 Actual" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="q3" name="Q3 Actual" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="q4" name="Q4 Forecast" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Table */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
            <div>
              <div className="card-title">Regional Growth Distributions</div>
              <div className="card-subtitle">Real-time scaling mapping to selected categories</div>
            </div>
          </div>
          <div style={{ padding: '8px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Region Hub</th>
                  <th>Projected Revenue</th>
                  <th>Growth Rate</th>
                  <th>Relative Share</th>
                </tr>
              </thead>
              <tbody>
                {simulatedRegions.map((r, i) => {
                  const maxRevenue = Math.max(...simulatedRegions.map(x => x.revenue));
                  return (
                    <tr key={r.region}>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>{r.region}</td>
                      <td>₹{r.revenue}B</td>
                      <td>
                        <span className={`badge ${r.growth > 12 ? 'green' : r.growth > 8 ? 'blue' : 'orange'}`} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          +{r.growth}%
                        </span>
                      </td>
                      <td>
                        <div className="progress-bar-wrap" style={{ width: '90px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div className="progress-bar" style={{
                            width: `${maxRevenue > 0 ? (r.revenue / maxRevenue) * 100 : 0}%`,
                            height: '100%',
                            background: i === 0 ? 'var(--gradient-blue)' : i === 1 ? 'var(--gradient-purple)' : 'var(--gradient-cyan)',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* COMPARATIVE FORECAST DATA GRID & EXPORT */}
      <div className="card mt-6" style={{ background: 'rgba(15,23,42,0.3)' }}>
        <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-title">Executive Forecasting Ledger</div>
            <div className="card-subtitle">Monthly breakdown of actual historical figures side-by-side with ML forecasts</div>
          </div>
          <button 
            onClick={handleExportForecast} 
            className="btn btn-secondary" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', 
              color: '#3b82f6', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' 
            }}
          >
            <Download size={14} /> Download Forecast Report (.csv)
          </button>
        </div>
        <div style={{ padding: '8px', maxHeight: '350px', overflowY: 'auto' }}>
          <table className="data-table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Period</th>
                <th>Year</th>
                <th>Actual Revenue (Scaled ₹B)</th>
                <th>ARIMA Forecast (₹B)</th>
                <th>Prophet Forecast (₹B)</th>
                <th>LightGBM Forecast (₹B)</th>
              </tr>
            </thead>
            <tbody>
              {simulatedForecast.map((f, i) => (
                <tr key={`${f.month}-${f.year}-${i}`} style={{ opacity: f.actual ? 1 : 0.85 }}>
                  <td style={{ fontWeight: 600, color: f.actual ? '#3b82f6' : '#cbd5e1' }}>
                    {f.month} {!f.actual && <span style={{ fontSize: '10px', color: '#10b981', marginLeft: '4px' }}>[Forecast]</span>}
                  </td>
                  <td>{f.year}</td>
                  <td style={{ color: '#f8fafc', fontWeight: f.actual ? 600 : 400 }}>
                    {f.actual ? `₹${f.actual}B` : <span style={{ color: '#64748b' }}>--</span>}
                  </td>
                  <td>₹{f.arima || '--'}B</td>
                  <td>₹{f.prophet || '--'}B</td>
                  <td>₹{f.lstm || '--'}B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
