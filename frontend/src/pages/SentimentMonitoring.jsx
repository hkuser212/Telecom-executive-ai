import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { SmilePlus, Frown, Meh } from 'lucide-react';

const sentimentTrend = [
  { week: 'W1', positive: 55, neutral: 27, negative: 18 },
  { week: 'W2', positive: 60, neutral: 24, negative: 16 },
  { week: 'W3', positive: 52, neutral: 28, negative: 20 },
  { week: 'W4', positive: 65, neutral: 22, negative: 13 },
  { week: 'W5', positive: 58, neutral: 25, negative: 17 },
  { week: 'W6', positive: 70, neutral: 20, negative: 10 },
  { week: 'W7', positive: 63, neutral: 23, negative: 14 },
  { week: 'W8', positive: 68, neutral: 21, negative: 11 },
];

const topicsData = [
  { topic: 'Network Quality', negative: 42, positive: 12 },
  { topic: 'Billing Issues', negative: 38, positive: 8 },
  { topic: 'Customer Support', negative: 29, positive: 35 },
  { topic: 'Plan Value', negative: 18, positive: 42 },
  { topic: 'App Experience', negative: 12, positive: 55 },
  { topic: 'Coverage', negative: 35, positive: 18 },
];

const sourcePie = [
  { name: 'Twitter', value: 38, color: '#3b82f6' },
  { name: 'Support Tickets', value: 28, color: '#8b5cf6' },
  { name: 'App Reviews', value: 22, color: '#10b981' },
  { name: 'Chat Logs', value: 12, color: '#f59e0b' },
];

const recentFeedback = [
  { text: 'Network has been terrible in Assam region for the past week!', sentiment: 'negative', source: 'Twitter', time: '2m ago' },
  { text: 'Finally a telecom that picks up within 2 rings. Excellent support!', sentiment: 'positive', source: 'Support', time: '8m ago' },
  { text: 'Billing is confusing, I was charged twice for the same plan.', sentiment: 'negative', source: 'App Review', time: '15m ago' },
  { text: 'Coverage in metro areas is flawless. Very satisfied.', sentiment: 'positive', source: 'Twitter', time: '22m ago' },
  { text: 'Average plan for average price. Nothing special.', sentiment: 'neutral', source: 'Chat', time: '35m ago' },
];

const sentimentColor = { positive: 'green', negative: 'red', neutral: 'orange' };
const sentimentIcon = { positive: <SmilePlus size={14} />, negative: <Frown size={14} />, neutral: <Meh size={14} /> };

export default function SentimentMonitoring() {
  return (
    <>
      <div className="page-header">
        <h1>Sentiment Monitoring</h1>
        <p>BERT · DistilBERT · VADER — Real-time customer voice analysis</p>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi-card green">
          <div className="kpi-icon-wrap"><SmilePlus size={18} /></div>
          <div className="kpi-value">63%</div>
          <div className="kpi-label">Positive Sentiment</div>
          <div className="kpi-change up">↑ +5% this week</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-icon-wrap"><Meh size={18} /></div>
          <div className="kpi-value">23%</div>
          <div className="kpi-label">Neutral Sentiment</div>
          <div className="kpi-change up">→ Stable</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-icon-wrap"><Frown size={18} /></div>
          <div className="kpi-value">14%</div>
          <div className="kpi-label">Negative Sentiment</div>
          <div className="kpi-change up">↓ -3% this week (good)</div>
        </div>
      </div>

      <div className="grid-2 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Sentiment Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weekly Sentiment Trend</div>
              <div className="card-subtitle">% of feedback by sentiment category</div>
            </div>
            <span className="badge blue">BERT</span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={sentimentTrend}>
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

        {/* Source pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Feedback Sources</div>
              <div className="card-subtitle">Where customers speak</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sourcePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {sourcePie.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, justifyContent: 'center' }}>
            {sourcePie.map(s => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, display: 'inline-block' }} />
                <span className="text-muted">{s.name} {s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Sentiment + Live Feed */}
      <div className="grid-2 mb-6">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Topic Sentiment Breakdown</div>
              <div className="card-subtitle">What are customers saying about?</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topicsData} layout="vertical">
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
            {recentFeedback.map((f, i) => (
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
