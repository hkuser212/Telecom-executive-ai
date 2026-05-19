import { FileText, Download, BarChart2, Clock } from 'lucide-react';

const REPORTS = [
  {
    title: 'Monthly Executive Summary',
    desc: 'KPIs, churn overview, revenue vs target, AI recommendations',
    type: 'PDF',
    size: '2.4 MB',
    date: 'May 2026',
    color: 'red',
    badge: 'red',
  },
  {
    title: 'Q2 Churn Analysis Report',
    desc: 'Full churn prediction breakdown with SHAP explanations and region heatmap',
    type: 'PDF',
    size: '4.1 MB',
    date: 'Apr 2026',
    color: 'orange',
    badge: 'orange',
  },
  {
    title: 'Revenue Forecast Deck',
    desc: 'Prophet + LSTM + ARIMA multi-model forecast with confidence intervals',
    type: 'PPT',
    size: '8.7 MB',
    date: 'May 2026',
    color: 'blue',
    badge: 'blue',
  },
  {
    title: 'Sentiment Intelligence Brief',
    desc: 'BERT-based sentiment trends across Twitter, tickets, and reviews',
    type: 'PDF',
    size: '1.8 MB',
    date: 'May 2026',
    color: 'purple',
    badge: 'purple',
  },
  {
    title: 'Investor KPI Dashboard Export',
    desc: 'ARPU, NPS, Churn Rate, CAC — formatted for board presentation',
    type: 'PPT',
    size: '5.2 MB',
    date: 'Mar 2026',
    color: 'green',
    badge: 'green',
  },
];

const SCHEDULED = [
  { report: 'Weekly Churn Alert', next: 'Mon, 26 May 2026', freq: 'Weekly', status: 'active' },
  { report: 'Monthly Executive PDF', next: '1 Jun 2026', freq: 'Monthly', status: 'active' },
  { report: 'Quarterly Forecast PPT', next: '1 Jul 2026', freq: 'Quarterly', status: 'paused' },
];

export default function Reports() {
  return (
    <>
      <div className="page-header">
        <h1>Reports & Exports</h1>
        <p>Auto-generated executive PDFs and PowerPoint decks powered by ReportLab + python-pptx</p>
      </div>

      {/* Generate Now */}
      <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <BarChart2 size={20} style={{ color: 'var(--accent-purple)' }} />
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>Generate AI Report Now</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>AI automatically collects latest KPIs, charts, and insights to produce a professional executive report.</p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary">📄 Generate PDF</button>
            <button className="btn btn-ghost">📊 Generate PPT</button>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Report List */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Report Library</div>
              <div className="card-subtitle">All auto-generated executive reports</div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {REPORTS.map(r => (
              <div key={r.title} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)',
                transition: 'var(--transition)', cursor: 'default'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: `rgba(var(--accent-${r.color === 'red' ? '239,68,68' : r.color === 'orange' ? '245,158,11' : r.color === 'blue' ? '59,130,246' : r.color === 'purple' ? '139,92,246' : '16,185,129'}),0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  <FileText size={18} style={{ color: `var(--accent-${r.color === 'red' ? 'red' : r.color === 'orange' ? 'orange' : r.color === 'blue' ? 'blue' : r.color === 'purple' ? 'purple' : 'green'})` }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{r.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span className={`badge ${r.badge}`}>{r.type}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.size} · {r.date}</span>
                  </div>
                </div>
                <button className="icon-btn" title="Download"><Download size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={15} style={{ color: 'var(--accent-cyan)' }} />
                Scheduled Reports
              </div>
              <div className="card-subtitle">Auto-delivered to your inbox</div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Next Run</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULED.map(s => (
                <tr key={s.report}>
                  <td style={{ fontSize: '0.8rem' }}>{s.report}</td>
                  <td style={{ fontSize: '0.75rem' }}>{s.next}</td>
                  <td>
                    <span className={`badge ${s.status === 'active' ? 'green' : 'orange'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase' }}>Report Contents</div>
            {['📊 KPI Summary Cards', '📈 Churn Trend Charts', '💰 Revenue Forecast', '😊 Sentiment Scores', '🎯 AI Recommendations', '🗺️ Region Heatmap'].map(item => (
              <div key={item} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{item}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
