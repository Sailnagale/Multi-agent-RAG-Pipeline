import React from 'react';
import { 
  TrendingUp, 
  ShieldAlert, 
  Scale, 
  DollarSign, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  BarChart2, 
  Cpu, 
  Search,
  Lock,
  Zap
} from 'lucide-react';

export default function LandingPage({ setActivePage, onOpenAuth }) {
  const agents = [
    {
      name: 'Positive Agent',
      role: 'Growth, Catalysts & Strategic Moats',
      icon: TrendingUp,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      description: 'Extracts record revenue expansion, product adoption vectors, competitive moats, and new commercial opportunities.'
    },
    {
      name: 'Negative Agent',
      role: 'Forensic Weaknesses & Warning Signs',
      icon: ShieldAlert,
      color: '#f43f5e',
      bgGlow: 'rgba(244, 63, 94, 0.15)',
      description: 'Scrutinizes margin erosion, cost inflation, underperforming segments, rising obligations, and critical warning signals.'
    },
    {
      name: 'Neutral Agent',
      role: 'Unbiased Factual Auditor',
      icon: Scale,
      color: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      description: 'Synthesizes an objective, evidence-based narrative balancing positive drivers and structural headwinds without hyperbole.'
    },
    {
      name: 'Financial Agent',
      role: 'CFO Statement Quantitative Modeler',
      icon: DollarSign,
      color: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      description: 'Calculates top-line growth, gross/operating/net margins, debt & liquidity reserves, free cash flows, and key financial ratios.'
    },
    {
      name: 'Risk Agent',
      role: 'Enterprise CRO Risk Assessor',
      icon: AlertTriangle,
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      description: 'Categorizes enterprise threats into Financial, Operational, Market, and Regulatory dimensions with severity rankings.'
    }
  ];

  const industries = [
    "IT", "Banking", "Finance", "Insurance", "Healthcare", "Pharmaceuticals",
    "Agriculture", "Automotive", "Manufacturing", "Energy", "Retail",
    "Telecommunications", "Real Estate", "FMCG", "Logistics", "Mining",
    "Chemicals", "Infrastructure", "Media & Entertainment", "Other"
  ];

  const tickerItems = [
    { ticker: "AAPL", name: "Apple Inc.", val: "$143.8B Q1 Net Sales", change: "+20.2%", up: true },
    { ticker: "NVDA", name: "NVIDIA Corp.", val: "75.1% Gross Margin", change: "+830 bps", up: true },
    { ticker: "MSFT", name: "Microsoft", val: "$65.6B Revenue", change: "+16.0%", up: true },
    { ticker: "AMZN", name: "Amazon", val: "$186.4B Q4 Net Sales", change: "+10.1%", up: true },
    { ticker: "GOOGL", name: "Alphabet", val: "$88.3B Revenue", change: "+15.1%", up: true },
    { ticker: "TSLA", name: "Tesla", val: "17.9% Op Margin", change: "-120 bps", up: false },
    { ticker: "META", name: "Meta Platforms", val: "$40.6B Revenue", change: "+18.9%", up: true }
  ];

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Ticker Banner */}
      <div style={{
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.5rem 0',
        whiteSpace: 'nowrap'
      }}>
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <div key={idx} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginRight: '2.5rem',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.ticker}</span>
              <span style={{ color: 'var(--text-muted)' }}>{item.val}</span>
              <span style={{ 
                fontWeight: 600, 
                color: item.up ? '#10b981' : '#f43f5e',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          color: '#60a5fa',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          <Sparkles size={16} />
          Powered by Local Ollama (qwen2.5:3b + qwen3-embedding)
        </div>

        <h1 style={{
          fontSize: 'clamp(2.25rem, 5vw, 4rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '1.25rem'
        }}>
          Autonomous 5-Agent <br />
          <span className="gradient-text">Financial Report Intelligence</span>
        </h1>

        <p style={{
          maxWidth: '720px',
          margin: '0 auto 2rem auto',
          fontSize: '1.125rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6
        }}>
          Ingest audited annual report PDFs and run 5 specialized forensic AI agents simultaneously.
          Ground every calculation in ChromaDB retrieval with exact page citations and linked interactive visualizations.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '3.5rem'
        }}>
          <button 
            onClick={() => setActivePage('analysis')}
            className="btn btn-primary"
            style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}
          >
            <TrendingUp size={18} />
            Start Company Analysis
            <ArrowRight size={16} />
          </button>

          <button 
            onClick={() => setActivePage('dashboard')}
            className="btn btn-secondary"
            style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
          >
            <BarChart2 size={18} />
            View Live Dashboard
          </button>
        </div>

        {/* Feature Badges Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '4rem',
          color: 'var(--text-muted)',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>Zero Hallucinations Guarantee</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>Exact PDF Page Citations</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>FlashRank Reranking & Confidence Threshold</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>100% Private Local Ollama Execution</span>
          </div>
        </div>
      </div>

      {/* 5 Specialized Agents Section */}
      <div className="container" style={{ marginBottom: '5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            The 5 Specialized Forensic Agents
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Each agent interrogates the document through an independent analytic lens with custom retrieval queries.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem'
        }}>
          {agents.map((ag, i) => {
            const Icon = ag.icon;
            return (
              <div 
                key={i} 
                className="glass-card" 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  borderTop: `3px solid ${ag.color}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: ag.bgGlow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: ag.color
                }}>
                  <Icon size={22} />
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {ag.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: ag.color, marginBottom: '0.5rem' }}>
                    {ag.role}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {ag.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Visualizations Architecture Teaser */}
      <div className="container" style={{ marginBottom: '5rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
            <div>
              <div className="badge badge-blue" style={{ marginBottom: '1rem' }}>
                <Zap size={14} /> Full Citation Traceability
              </div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '1rem' }}>
                Linked Financial Visualizations
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Every single chart rendered by FinRAG is dynamically tied to the underlying audited filing:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 700, fontSize: '0.8rem' }}>1</div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}><strong>Metric Extraction:</strong> Revenue, Debt, Cash Flow, Margins & Segments</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>2</div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}><strong>Interactive Chart:</strong> Responsive multi-bar, stacked debt, line and pie graphs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontWeight: 700, fontSize: '0.8rem' }}>3</div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}><strong>AI Interpretation:</strong> Strategic analysis of what the delta means for investors</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontWeight: 700, fontSize: '0.8rem' }}>4</div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}><strong>Exact Page Reference:</strong> Verifiable excerpt quotation and page link</span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>AAPL Q1 FY26 Top-Line</span>
                <span className="badge badge-green">Page 1 Citation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800 }}>$143,756M</span>
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>+20.2% YoY</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #3b82f6' }}>
                "Net sales for the three months ended Dec 27, 2025 rose to $143,756M from $119,575M powered by iPhone shipments of $85.3B."
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 20 Supported Industries Grid */}
      <div className="container" style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem' }}>
          Industry-Specific Financial Contexts
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          Contextualize risk weighting and metrics against industry-specific norms across 20 distinct sectors:
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {industries.map((ind, i) => (
            <span
              key={i}
              onClick={() => setActivePage('analysis')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {ind}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
