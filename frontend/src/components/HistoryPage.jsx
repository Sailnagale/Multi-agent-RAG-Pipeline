import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  ArrowRight, 
  Trash2, 
  ExternalLink,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function HistoryPage({ setActivePage, setSelectedAnalysisId }) {
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
        console.error("Failed to load history:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this analysis from history?")) return;
    fetch(`/api/history/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => fetchHistory())
      .catch(err => console.error("Failed to delete record:", err));
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

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <HistoryIcon size={24} color="var(--accent-blue)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Analysis History</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Saved multi-agent financial evaluations with persistent access to complete reports & graphs
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.25rem', width: '220px' }}
            />
          </div>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="input-field"
            style={{ width: '160px' }}
          >
            {industriesList.map((ind, i) => (
              <option key={i} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History Cards / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading saved analyses...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Building2 size={42} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Reports Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {searchTerm || selectedIndustry !== 'All' 
              ? 'Try adjusting your search query or industry filter.'
              : 'You have not performed any analyses yet. Start your first analysis now.'}
          </p>
          <button
            onClick={() => setActivePage('analysis')}
            className="btn btn-primary"
          >
            Analyze a Company
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(item => {
            const score = item.health_score || 75;
            const scoreColor = score >= 80 ? '#10b981' : score >= 65 ? '#3b82f6' : '#f59e0b';
            const formattedDate = item.timestamp 
              ? new Date(item.timestamp).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })
              : 'Recently';

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item.id)}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  cursor: 'pointer',
                  borderLeft: `4px solid ${scoreColor}`,
                  flexWrap: 'wrap',
                  transition: 'transform 0.15s ease, background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
              >
                {/* Company & Industry Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-blue)',
                    fontWeight: 800
                  }}>
                    {item.company_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {item.company_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <span className="badge badge-blue">{item.industry}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.report_date}</span>
                    </div>
                  </div>
                </div>

                {/* Score & Verdict */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>HEALTH SCORE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: scoreColor }}>
                      {score} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 100</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>VERDICT</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                      {item.verdict || 'Moderate Buy'}
                    </div>
                  </div>
                </div>

                {/* Timestamp & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginLeft: 'auto' }}>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div>Analyzed on</div>
                    <div style={{ fontWeight: 600 }}>{formattedDate}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(item.id);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      View Full Analysis <ArrowRight size={14} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      title="Delete Report"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.45rem'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
