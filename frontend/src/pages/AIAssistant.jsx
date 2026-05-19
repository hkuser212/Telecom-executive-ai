import { useState } from 'react';
import { Bot, SendHorizonal, Sparkles, User } from 'lucide-react';

const SUGGESTIONS = [
  'Why is churn increasing in Assam?',
  'Show top 5 loss-making regions',
  'Predict next quarter revenue',
  'Which customers need retention offers?',
  'What is current NPS trend?',
  'Summarize this month\'s performance',
];

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: '👋 Hello! I\'m your **Executive AI Assistant** — powered by RAG + OpenAI. I can answer questions about churn, revenue, sentiment, KPIs, and generate strategic recommendations.\n\nTry asking me anything about your telecom business.',
  },
];

function botReply(q) {
  const lq = q.toLowerCase();
  if (lq.includes('assam')) return 'Churn in Assam has risen to **11.3%** — the highest in your network. Primary drivers are: poor network coverage in rural zones (reported by 68% of churned users), competitor pricing undercutting by ₹120/month, and high support ticket volume (avg 7 tickets/customer). **Recommendation:** Deploy targeted retention offer of ₹200 discount + free data upgrade for at-risk customers in Assam.';
  if (lq.includes('revenue') || lq.includes('quarter')) return 'Based on Prophet + LSTM ensemble, **Q4 Revenue Forecast: ₹4.5 Billion** (+28.6% YoY). Key growth drivers: Enterprise segment growing 37%, IoT/B2B at 36% growth. Risk factor: If Assam churn is uncontrolled, expected revenue loss is ₹84M. **Action:** Focus retention budget in high-churn, high-ARPU segments.';
  if (lq.includes('retention') || lq.includes('customer')) return '**Top 5 High-Priority Retention Targets:**\n\n1. Arjun Sharma — Risk 92% — ₹4,200 MRR\n2. Priya Mehta — Risk 87% — ₹12,500 MRR\n3. Rahul Verma — Risk 81% — ₹1,800 MRR\n4. Sneha Patel — Risk 78% — ₹8,900 MRR\n5. Karan Singh — Risk 74% — ₹950 MRR\n\n**Recommended offer:** 2-month plan discount + dedicated account manager for enterprise segment.';
  if (lq.includes('region') || lq.includes('loss')) return '**Top Loss-Making Regions by Churn Impact:**\n\n| Region | Churn | Revenue at Risk |\n|--------|-------|-------|\n| Assam | 11.3% | ₹28M |\n| Mumbai | 8.2% | ₹22M |\n| Delhi | 6.5% | ₹18M |\n| Punjab | 7.8% | ₹12M |\n| Kolkata | 5.1% | ₹8M |';
  if (lq.includes('nps') || lq.includes('score')) return '**Net Promoter Score (NPS) Trend:**\n\nCurrent NPS: **62** (up +4 pts from last month). Promoters: 68%, Passives: 18%, Detractors: 14%.\n\nKey NPS drivers: Customer support quality (+18), Network reliability (+12), Plan value (-6). Goal for Q4: NPS ≥ 70.';
  if (lq.includes('summary') || lq.includes('month')) return '**This Month\'s Executive Summary:**\n\n📈 Revenue: ₹3.3B (on track for Q4 target)\n⚠️ Churn: 5.3% (within acceptable range)\n😊 NPS: 62 (+4pts, improving)\n🔴 Assam Alert: Churn spike to 11.3%\n💡 Recommendation: Immediate retention campaign in Assam, upsell Enterprise plan to mid-tier customers in Mumbai.';
  return `Great question! Analyzing your query: **"${q}"**\n\nBased on current data patterns, this appears to relate to customer behavior analytics. For deeper analysis, our ML models suggest monitoring churn rate, ARPU, and support ticket volume simultaneously. Would you like me to drill deeper into any specific region or segment?`;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  function send(text) {
    const q = text || input;
    if (!q.trim()) return;
    setMessages(m => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: 'assistant', text: botReply(q) }]);
      setLoading(false);
    }, 1200);
  }

  return (
    <>
      <div className="page-header">
        <h1>AI Business Assistant</h1>
        <p>RAG-powered chatbot · ChromaDB · OpenAI Embeddings</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Suggestions */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={15} style={{ color: 'var(--accent-purple)' }} /> Quick Queries
              </div>
              <div className="card-subtitle">Tap to ask instantly</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '0.8rem', textAlign: 'left' }} onClick={() => send(s)}>
                → {s}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data Sources</div>
            {['Churn Model (XGBoost)', 'Revenue DB (PostgreSQL)', 'Sentiment API (BERT)', 'Forecast Engine (Prophet)', 'ChromaDB Embeddings'].map(s => (
              <div key={s} className="flex items-center gap-2" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 5 }}>
                <span style={{ width: 6, height: 6, background: 'var(--accent-green)', borderRadius: '50%', boxShadow: '0 0 4px var(--accent-green)' }} />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, background: 'var(--gradient-purple)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <div className="card-title">Executive AI Chat</div>
                <div className="card-subtitle">Powered by RAG + OpenAI</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="status-dot" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 460, display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0', marginBottom: 16 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: m.role === 'assistant' ? 'var(--gradient-purple)' : 'var(--gradient-blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {m.role === 'assistant' ? <Bot size={14} color="white" /> : <User size={14} color="white" />}
                </div>
                <div style={{
                  background: m.role === 'user' ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
                  border: `1px solid ${m.role === 'user' ? 'rgba(59,130,246,0.25)' : 'var(--border)'}`,
                  borderRadius: 12,
                  padding: '12px 16px',
                  maxWidth: '82%',
                  fontSize: '0.875rem',
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-line',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-3">
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--gradient-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="white" />
                </div>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Analyzing data<span style={{ animation: 'pulse-dot 1s infinite' }}>...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about churn, revenue, sentiment, regions..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button className="btn btn-primary" onClick={() => send()} style={{ padding: '10px 16px' }}>
              <SendHorizonal size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
