import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  ChevronRight,
  Trash2,
  PieChart as PieIcon,
  Activity,
  LogIn,
  User
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';

export default function DashboardPage({ setActivePage, setSelectedAnalysisId, onOpenAuth, user }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');

  const fetchHistory = () => {
    setLoading(true);
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setHistoryList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch history:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this analysis?")) return;
    fetch(`/api/history/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => fetchHistory())
      .catch(err => console.error("Delete failed:", err));
  };

  const handleOpenDetail = (id) => {
    setSelectedAnalysisId(id);
    setActivePage('analysis');
  };

  const filtered = historyList.filter(item => {
    const matchesSearch = !searchTerm || 
      item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = selectedIndustry === 'All' || item.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  const industriesList = ['All', ...new Set(historyList.map(h => h.industry).filter(Boolean))];

  // Aggregated Stats
  const totalAnalyzed = historyList.length;
  const avgHealthScore = totalAnalyzed > 0 
    ? Math.round(historyList.reduce((acc, h) => acc + (h.health_score || 70), 0) / totalAnalyzed) 
    : 0;

  // Chart data for Sentiment / Health Distribution
  const sentimentDistribution = [
    { name: 'Strong Bullish (80-100)', count: historyList.filter(h => (h.health_score || 0) >= 80).length, color: '#10b981' },
    { name: 'Moderate / Hold (60-79)', count: historyList.filter(h => (h.health_score || 0) >= 60 && (h.health_score || 0) < 80).length, color: '#3b82f6' },
    { name: 'Caution / Bearish (<60)', count: historyList.filter(h => (h.health_score || 0) < 60).length, color: '#f59e0b' }
  ].filter(d => d.count > 0);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Executive Financial Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Portfolio-wide multi-agent financial evaluations and risk indicators
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Dashboard Login Button */}
          {user ? (
            <button
              onClick={() => setActivePage('login')}
              className="btn btn-secondary"
              style={{
                padding: '0.65rem 1.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid var(--border-medium)',
                background: 'rgba(59, 130, 246, 0.08)'
              }}
              title="Click to open the interactive animated Minions & Cats login page"
            >
              <User size={16} color="var(--accent-blue)" />
              <span>{user.name.split(' ')[0]} (Interactive Login Page)</span>
            </button>
          ) : (
            <button
              onClick={() => setActivePage('login')}
              className="btn"
              style={{
                padding: '0.65rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #2563eb, #8b5cf6)',
                color: '#fff',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}
              title="Open full-page login"
            >
              <LogIn size={18} />
              <span>Log In</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedAnalysisId(null);
              setActivePage('analysis');
            }}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <Plus size={18} />
            New Company Analysis
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        {/* Card 1 */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>COMPANIES ANALYZED</span>
            <Building2 size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalAnalyzed}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={14} /> Full 5-Agent RAG Coverage
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>AVG HEALTH SCORE</span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
            {avgHealthScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Consolidated Multi-Agent Score
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>RISK INDICATORS MONITORED</span>
            <ShieldAlert size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
            4 Dimensions
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Financial, Operational, Market, Regulatory
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>PROCESSING ENGINE</span>
            <Activity size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.4rem' }}>
            qwen2.5:3b
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            qwen3-embedding + FlashRank
          </div>
        </div>
      </div>

      {/* Main Content Layout: Table & Distribution Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Analyzed Companies Table */}
        <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap'
          }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Analyzed Annual Reports
            </h2>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem', width: '180px', fontSize: '0.8rem' }}
                />
              </div>

              {industriesList.length > 1 && (
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="input-field"
                  style={{ width: '130px', fontSize: '0.8rem', padding: '0.5rem' }}
                >
                  {industriesList.map((ind, i) => (
                    <option key={i} value={ind}>{ind}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading analyzed filings...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No analyzed reports found matching your criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Company</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Industry</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Report Date</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Health Score</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Verdict</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const score = item.health_score || 75;
                    const scoreColor = score >= 80 ? '#10b981' : score >= 65 ? '#3b82f6' : '#f59e0b';
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDetail(item.id)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem 0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.company_name}
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span className="badge badge-blue">{item.industry}</span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {item.report_date}
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontWeight: 700,
                            color: scoreColor
                          }}>
                            {score}/100
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span className={`badge ${score >= 80 ? 'badge-green' : 'badge-purple'}`}>
                            {item.verdict || 'Moderate Buy'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span className="badge badge-green">
                            <CheckCircle2 size={12} /> {item.status || 'Complete'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(item.id);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              Inspect <ArrowUpRight size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, item.id)}
                              title="Delete Analysis"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.3rem'
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sentiment & Risk Distribution Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Sentiment Distribution
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Distribution of overall company health ratings
          </p>

          <div style={{ width: '100%', height: '220px' }}>
            {sentimentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border-medium)',
                      borderRadius: '8px',
                      fontSize: '0.8rem'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-muted)' }}>
                No distribution data yet
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
            {sentimentDistribution.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span style={{ fontWeight: 700 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
