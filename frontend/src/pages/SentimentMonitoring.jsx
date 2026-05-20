import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { SmilePlus, Frown, Meh, Loader2, Send } from 'lucide-react';

const sentimentColor = { positive: 'green', negative: 'red', neutral: 'orange' };
const sentimentIcon = { positive: <SmilePlus size={14} />, negative: <Frown size={14} />, neutral: <Meh size={14} /> };

export default function SentimentMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tester state
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/sentiment-dashboard')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching sentiment dashboard data:", err);
        setError("Failed to load sentiment data. Is the backend running?");
        setLoading(false);
      });
  }, []);

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!testText.trim()) return;
    setIsTesting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/predict-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText })
      });
      const result = await res.json();
      setTestResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return null;

  return (
    <>
      <div className="page-header">
        <h1>Sentiment Monitoring</h1>
        <p>TF-IDF · LinearSVC — Real-time customer voice analysis</p>
      </div>

      {/* Interactive Tester */}
      <div className="card mb-6" style={{ background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(30, 41, 59, 0.4) 100%)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <div className="card-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent-blue)' }}>✦</span> Live Model Testing
            </div>
            <div className="card-subtitle" style={{ opacity: 0.7 }}>Test the robust NLP pipeline with custom text</div>
          </div>
        </div>
        <div style={{ padding: '0 20px 20px 20px' }}>
          <form onSubmit={handleTestSubmit} style={{ display: 'flex', gap: 16, alignItems: 'stretch', marginTop: 16 }}>
            <textarea 
              value={testText}
              onChange={e => setTestText(e.target.value)}
              placeholder="e.g. The network connection has been absolutely terrible today!"
              style={{ 
                flex: 1, 
                minHeight: '60px', 
                resize: 'none', 
                background: 'rgba(0, 0, 0, 0.2)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '12px', 
                padding: '16px', 
                color: '#fff', 
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            <button 
              type="submit" 
              disabled={isTesting || !testText.trim()} 
              style={{ 
                background: isTesting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '0 28px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: (isTesting || !testText.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'transform 0.1s ease, filter 0.2s ease',
                boxShadow: isTesting ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
              onMouseOver={(e) => { if(!isTesting && testText.trim()) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.filter = 'none'; }}
              onMouseDown={(e) => { if(!isTesting && testText.trim()) e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isTesting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Analyze</>}
            </button>
          </form>

          {testResult && (
            <div style={{ 
              marginTop: 20, 
              padding: '20px', 
              background: 'rgba(0, 0, 0, 0.25)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 24,
              border: `1px solid rgba(255,255,255,0.05)`,
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
                 <span className={`badge ${sentimentColor[testResult.sentiment]}`} style={{ 
                    fontSize: '1rem', 
                    padding: '8px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    boxShadow: `0 0 15px var(--accent-${sentimentColor[testResult.sentiment]})`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                 }}>
                    {sentimentIcon[testResult.sentiment]} {testResult.sentiment}
                 </span>
                 <span style={{ fontSize: '0.75rem', marginTop: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.5px' }}>
                   CONFIDENCE: <span style={{ color: '#fff' }}>{(testResult.confidence * 100).toFixed(1)}%</span>
                 </span>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 24, flex: 1 }}>
                 <div style={{ marginBottom: 8 }}>
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>Original Text</span>
                   <p style={{ margin: 0, fontSize: '0.95rem', color: '#fff', lineHeight: 1.4 }}>"{testResult.text}"</p>
                 </div>
                 <div>
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>Cleaned Tokens</span>
                   <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-blue)', fontFamily: 'monospace', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>{testResult.cleaned_text || "none"}</p>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi-card green">
          <div className="kpi-icon-wrap"><SmilePlus size={18} /></div>
          <div className="kpi-value">{data.kpis.positive.value}%</div>
          <div className="kpi-label">Positive Sentiment</div>
          <div className="kpi-change up">↑ {data.kpis.positive.change}</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-icon-wrap"><Meh size={18} /></div>
          <div className="kpi-value">{data.kpis.neutral.value}%</div>
          <div className="kpi-label">Neutral Sentiment</div>
          <div className="kpi-change up">→ {data.kpis.neutral.change}</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon-wrap"><Frown size={18} /></div>
          <div className="kpi-value">{data.kpis.negative.value}%</div>
          <div className="kpi-label">Negative Sentiment</div>
          <div className="kpi-change up">↓ {data.kpis.negative.change}</div>
        </div>
      </div>

      <div className="grid-2 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weekly Sentiment Trend</div>
              <div className="card-subtitle">% of feedback by sentiment category</div>
            </div>
            <span className="badge blue">Live Model</span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={data.sentimentTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="positive" name="Positive" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="neutral" name="Neutral" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Feedback Sources</div>
              <div className="card-subtitle">Where customers speak</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data.sourcePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {data.sourcePie.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, justifyContent: 'center' }}>
            {data.sourcePie.map(s => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, display: 'inline-block' }} />
                <span className="text-muted">{s.name} {s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Topic Sentiment Breakdown</div>
              <div className="card-subtitle">What are customers saying about?</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.topicsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="topic" type="category" width={120} style={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="negative" name="Negative" fill="#ef4444" radius={[0, 4, 4, 0]} stackId="a" />
              <Bar dataKey="positive" name="Positive" fill="#10b981" radius={[0, 4, 4, 0]} stackId="b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Live Feedback Feed</div>
              <div className="card-subtitle">Real-time classified mentions</div>
            </div>
            <div className="status-dot" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.recentFeedback.map((f, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, borderLeft: `3px solid var(--accent-${sentimentColor[f.sentiment]})` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${sentimentColor[f.sentiment]}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {sentimentIcon[f.sentiment]} {f.sentiment}
                  </span>
                  <span className="text-muted text-sm">{f.source}</span>
                  <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>{f.time}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
