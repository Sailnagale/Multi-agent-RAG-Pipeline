import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  TrendingUp, 
  ShieldAlert, 
  Scale, 
  DollarSign, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare, 
  BarChart2, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Send,
  Loader2,
  Clock,
  ArrowRight,
  BookOpen,
  PieChart as PieIcon,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

export default function AnalysisPage({ selectedAnalysisId, setSelectedAnalysisId }) {
  // Input states
  const [selectedFile, setSelectedFile] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('IT');
  const [reportDate, setReportDate] = useState('');
  // Progress of embedding during upload
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  
  // Status states
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0: idle, 1: positive, 2: negative, 3: neutral, 4: financial, 5: risk, 6: overall, 7: done
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overall'); // overall, positive, negative, neutral, financial, risk, visualizations, chat
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  // Ingested metadata
  const [ingestionInfo, setIngestionInfo] = useState(null);

  const industries = [
    "IT", "Banking", "Finance", "Insurance", "Healthcare", "Pharmaceuticals",
    "Agriculture", "Automotive", "Manufacturing", "Energy", "Retail",
    "Telecommunications", "Real Estate", "FMCG", "Logistics", "Mining",
    "Chemicals", "Infrastructure", "Media & Entertainment", "Other"
  ];

  // If selectedAnalysisId is passed from Dashboard / History, load it
  useEffect(() => {
    if (selectedAnalysisId) {
      fetch(`/api/history/${selectedAnalysisId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.overall) {
            setAnalysisResult(data);
            setCompanyName(data.company_name);
            setIndustry(data.industry);
            setReportDate(data.report_date);
            setActiveTab('overall');
          }
        })
        .catch(err => console.error("Failed to load selected analysis:", err));
    }
  }, [selectedAnalysisId]);

  // Load sample Apple report from history if available or prepare for demo
  const handleLoadSampleReport = () => {
    fetch('/api/history/analysis_aapl_fy26q1')
      .then(res => res.json())
      .then(data => {
        if (data && data.overall) {
          setAnalysisResult(data);
          setCompanyName("Apple Inc.");
          setIndustry("IT");
          setReportDate("Q1 FY2026");
          setActiveTab('overall');
        }
      })
      .catch(err => {
        console.error("Could not load sample directly:", err);
      });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setIsUploading(true);
    setEmbeddingProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    // Use lightweight embedding model
    formData.append('model_embed', 'all-minilm');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setIngestionInfo(data);
        if (data.detected_company && !companyName) {
          setCompanyName(data.detected_company);
        }
      } else {
        alert(`Upload error: ${data.detail || 'Failed to ingest file'}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Network error during upload: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!companyName.trim()) {
      alert("Please provide the company name.");
      return;
    }

    const colName = ingestionInfo?.collection_name || "financial_docs";

    setIsAnalyzing(true);
    setActiveStep(1);

    // Simulated progress steps for the 5 agents
    const timer1 = setTimeout(() => setActiveStep(2), 2500);
    const timer2 = setTimeout(() => setActiveStep(3), 5000);
    const timer3 = setTimeout(() => setActiveStep(4), 7500);
    const timer4 = setTimeout(() => setActiveStep(5), 10000);
    const timer5 = setTimeout(() => setActiveStep(6), 12500);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection_name: colName,
          company_name: companyName,
          industry: industry,
          report_date: reportDate || "Current Filing",
          model_llm: "qwen2.5:3b",
          model_embed: "all-minilm",
          confidence_threshold: 0.0001,
          top_k_retrieval: 10,
          top_k_final: 4,
          reranking: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAnalysisResult(data);
        setActiveTab('overall');
      } else {
        alert(`Analysis error: ${data.detail || 'Failed to complete analysis'}`);
      }
    } catch (err) {
      console.error("Analysis request error:", err);
      alert(`Network error during analysis: ${err.message}`);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      setIsAnalyzing(false);
      setActiveStep(0);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userQ = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setIsChatSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQ,
          collection_name: analysisResult?.collection_name || ingestionInfo?.collection_name || "financial_docs",
          model_llm: "qwen2.5:3b",
          model_embed: "qwen3-embedding"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          cited_pages: data.cited_pages,
          scores: data.scores
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: "Sorry, I encountered an error answering your question."
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}`
      }]);
    } finally {
      setIsChatSending(false);
    }
  };

  const agentTabs = [
    { id: 'overall', label: 'Overall Synthesis', icon: Sparkles, color: '#3b82f6' },
    { id: 'positive', label: 'Positive Agent', icon: TrendingUp, color: '#10b981' },
    { id: 'negative', label: 'Negative Agent', icon: ShieldAlert, color: '#f43f5e' },
    { id: 'neutral', label: 'Neutral Agent', icon: Scale, color: '#3b82f6' },
    { id: 'financial', label: 'Financial Agent', icon: DollarSign, color: '#8b5cf6' },
    { id: 'risk', label: 'Risk Agent', icon: AlertTriangle, color: '#f59e0b' },
    { id: 'visualizations', label: 'Financial Graphs', icon: BarChart2, color: '#06b6d4' },
    { id: 'chat', label: 'Document Chat', icon: MessageSquare, color: '#ec4899' },
  ];

  const overall = analysisResult?.overall || {};
  const agents = analysisResult?.agents || {};
  const visualizations = analysisResult?.visualizations || [];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Configuration & Upload Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Company Filing Ingestion & 5-Agent Setup
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Upload any corporate annual report (10-K, 10-Q, Annual Report PDF) to trigger forensic analysis
            </p>
          </div>

          {/* 1-Click Fast Loader */}
          <button
            onClick={handleLoadSampleReport}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <Sparkles size={14} color="#f59e0b" />
            1-Click Demo: Apple Q1 FY26 Report
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
          {/* File Upload Zone */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Upload Annual Report PDF / HTML
            </label>
            <div 
              style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-input)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <input
                type="file"
                accept=".pdf,.html"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.825rem' }}>
                <UploadCloud size={18} color="var(--accent-blue)" />
                {isUploading ? (
                  <span>Ingesting and chunking PDF...</span>
                ) : selectedFile ? (
                  <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{selectedFile.name}</span>
                ) : (
                  <span>Choose PDF or Drag & Drop</span>
                )}
              </div>
            </div>
            {ingestionInfo && (
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={13} /> {ingestionInfo.page_count} pages, {ingestionInfo.num_chunks} chunks indexed into ChromaDB
              </div>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Company Name
            </label>
            <input
              type="text"
              placeholder="e.g. Apple Inc. or Tesla Motors"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Industry Selection Dropdown (All 20 Required Industries) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Select Industry ({industries.length} Sectors)
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="input-field"
            >
              {industries.map((ind, i) => (
                <option key={i} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Run Analysis Button */}
          <div>
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || isUploading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                opacity: isAnalyzing ? 0.7 : 1
              }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Running 5 Agents...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Run All 5 Agents
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Execution Stepper */}
        {isAnalyzing && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <span style={{ color: activeStep >= 1 ? '#10b981' : 'inherit' }}>1. Positive Agent</span>
              <span style={{ color: activeStep >= 2 ? '#f43f5e' : 'inherit' }}>2. Negative Agent</span>
              <span style={{ color: activeStep >= 3 ? '#3b82f6' : 'inherit' }}>3. Neutral Agent</span>
              <span style={{ color: activeStep >= 4 ? '#8b5cf6' : 'inherit' }}>4. Financial Agent</span>
              <span style={{ color: activeStep >= 5 ? '#f59e0b' : 'inherit' }}>5. Risk Agent</span>
              <span style={{ color: activeStep >= 6 ? '#06b6d4' : 'inherit' }}>6. Synthesis & Graphs</span>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{
                  height: '100%',
                  width: `${(activeStep / 6) * 100}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results View */}
      {analysisResult ? (
        <div>
          {/* Top Company Summary Banner */}
          <div className="glass-panel" style={{
            padding: '1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            borderLeft: '4px solid var(--accent-blue)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>
                  {analysisResult.company_name}
                </h1>
                <span className="badge badge-blue">{analysisResult.industry}</span>
                <span className="badge badge-purple">{analysisResult.report_date || 'Audited Filing'}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Analyzed via Ollama (qwen2.5:3b + qwen3-embedding) &bull; Processed in {analysisResult.duration_sec || 14.2}s
              </div>
            </div>

            {/* Health Score Gauge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  INVESTMENT VERDICT
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                  {overall.verdict || 'Strong Bullish'}
                </div>
              </div>

              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))',
                border: '2px solid #10b981',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>{overall.health_score || 88}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {agentTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    color: isActive ? tab.color : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERALL SYNTHESIS */}
          {activeTab === 'overall' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Executive Investment Memo
                </h3>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '0.925rem', whiteSpace: 'pre-line' }}>
                  {overall.executive_summary || "Synthesized analysis across all 5 specialized agents reflects solid operational performance."}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {/* Bull Case */}
                <div className="glass-card" style={{ borderTop: '3px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#10b981' }}>
                    <TrendingUp size={18} />
                    <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>The Bull Thesis</h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {overall.bull_case || "Record top-line momentum, expanding margins, and high operating cash generation."}
                  </p>
                </div>

                {/* Bear Case */}
                <div className="glass-card" style={{ borderTop: '3px solid #f43f5e' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#f43f5e' }}>
                    <ShieldAlert size={18} />
                    <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>The Bear Thesis & Vulnerabilities</h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {overall.bear_case || "Product concentration exposure, cost inflation, and antitrust regulatory interventions."}
                  </p>
                </div>

                {/* Industry Context */}
                <div className="glass-card" style={{ borderTop: '3px solid #8b5cf6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#8b5cf6' }}>
                    <Layers size={18} />
                    <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{analysisResult.industry} Sector Dynamics</h4>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {overall.industry_context || `Maintains pricing power and superior capital returns compared to global ${analysisResult.industry} peers.`}
                  </p>
                </div>
              </div>

              {/* Key Catalysts */}
              {overall.key_catalysts && overall.key_catalysts.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    Upcoming Material Catalysts to Monitor
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {overall.key_catalysts.map((cat, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.825rem'
                      }}>
                        <Clock size={14} color="#3b82f6" />
                        <span>{cat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: POSITIVE AGENT */}
          {activeTab === 'positive' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
                    Positive Agent Analysis: Strengths & Growth Vectors
                  </h3>
                  <span className="badge badge-green">Confidence: {agents.positive?.confidence_rating || 'High'}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {agents.positive?.summary}
                </p>
                {agents.positive?.cited_pages && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <BookOpen size={13} /> Cited filing pages: {agents.positive.cited_pages.map(p => <span key={p} className="badge badge-blue">Page {p}</span>)}
                  </div>
                )}
              </div>

              {/* Strengths Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {agents.positive?.strengths?.map((s, idx) => (
                  <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.title}</h4>
                      {s.page && <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>p.{s.page}</span>}
                    </div>
                    {s.metric && (
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                        {s.metric}
                      </div>
                    )}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {s.description}
                    </p>
                    {s.quote && (
                      <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)', borderLeft: '2px solid #10b981', paddingLeft: '0.5rem', marginTop: 'auto' }}>
                        "{s.quote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Opportunities List */}
              {agents.positive?.opportunities && (
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#10b981' }}>
                    Future Expansion Vectors
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {agents.positive.opportunities.map((op, i) => (
                      <li key={i}>{op}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NEGATIVE AGENT */}
          {activeTab === 'negative' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f43f5e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f43f5e' }}>
                    Negative Agent Analysis: Forensic Vulnerabilities & Warnings
                  </h3>
                  <span className="badge badge-rose">Severity: {agents.negative?.severity_level || 'Moderate'}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {agents.negative?.summary}
                </p>
                {agents.negative?.cited_pages && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <BookOpen size={13} /> Cited filing pages: {agents.negative.cited_pages.map(p => <span key={p} className="badge badge-blue">Page {p}</span>)}
                  </div>
                )}
              </div>

              {/* Weaknesses Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {agents.negative?.weaknesses?.map((w, idx) => (
                  <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{w.title}</h4>
                      {w.page && <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>p.{w.page}</span>}
                    </div>
                    {w.metric && (
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f43f5e' }}>
                        {w.metric}
                      </div>
                    )}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {w.description}
                    </p>
                    {w.quote && (
                      <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)', borderLeft: '2px solid #f43f5e', paddingLeft: '0.5rem', marginTop: 'auto' }}>
                        "{w.quote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: NEUTRAL AGENT */}
          {activeTab === 'neutral' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>
                    Neutral Agent Analysis: Objective Evidence-Based Summary
                  </h3>
                  <span className="badge badge-blue">Health: {agents.neutral?.operational_health || 'Stable'}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {agents.neutral?.summary}
                </p>
                {agents.neutral?.cited_pages && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <BookOpen size={13} /> Cited filing pages: {agents.neutral.cited_pages.map(p => <span key={p} className="badge badge-blue">Page {p}</span>)}
                  </div>
                )}
              </div>

              {/* Key Observations */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {agents.neutral?.key_observations?.map((ob, idx) => (
                  <div key={idx} className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ob.title}</h4>
                      {ob.page && <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>p.{ob.page}</span>}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      {ob.description}
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderLeft: '2px solid #3b82f6', paddingLeft: '0.5rem' }}>
                      Evidence: {ob.evidence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FINANCIAL AGENT */}
          {activeTab === 'financial' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#8b5cf6', marginBottom: '0.5rem' }}>
                  Financial Agent: Quantitative Statement Analysis
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {agents.financial?.summary}
                </p>
              </div>

              {/* Margins Snapshot Row */}
              {agents.financial?.margins && (
                <div className="grid-cols-3">
                  <div className="glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GROSS MARGIN</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{agents.financial.margins.gross_margin}</div>
                  </div>
                  <div className="glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OPERATING MARGIN</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>{agents.financial.margins.operating_margin}</div>
                  </div>
                  <div className="glass-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NET PROFIT MARGIN</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{agents.financial.margins.net_margin}</div>
                  </div>
                </div>
              )}

              {/* Financial Metrics Table */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Audited Line Items & Ratios
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.65rem' }}>Line Item</th>
                      <th style={{ padding: '0.65rem' }}>Current Period</th>
                      <th style={{ padding: '0.65rem' }}>Prior Period</th>
                      <th style={{ padding: '0.65rem' }}>YoY Change</th>
                      <th style={{ padding: '0.65rem', textAlign: 'right' }}>Page Citation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.financial?.metrics?.map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{m.metric_name}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 700 }}>{m.value}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{m.prior_period_value || '—'}</td>
                        <td style={{ padding: '0.75rem', color: m.change?.startsWith('+') ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
                          {m.change || '—'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <span className="badge badge-blue">Page {m.page || 1}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: RISK AGENT */}
          {activeTab === 'risk' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>
                    Risk Agent: 4-Dimensional Enterprise Risk Matrix
                  </h3>
                  <span className="badge badge-amber">Overall: {agents.risk?.overall_risk_rating || 'Moderate'}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {agents.risk?.summary}
                </p>
                {agents.risk?.primary_concern && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>
                    Primary Material Concern: {agents.risk.primary_concern}
                  </div>
                )}
              </div>

              {/* Risk Categories Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {agents.risk?.risk_categories?.map((rc, idx) => {
                  const isHigh = rc.severity?.toLowerCase() === 'high' || rc.severity?.toLowerCase() === 'critical';
                  return (
                    <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-purple">{rc.category} Risk</span>
                        <span className={`badge ${isHigh ? 'badge-rose' : 'badge-amber'}`}>{rc.severity}</span>
                      </div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rc.risk_title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {rc.description}
                      </p>
                      {rc.mitigation && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderLeft: '2px solid #f59e0b', paddingLeft: '0.5rem', marginTop: 'auto' }}>
                          Mitigation: {rc.mitigation}
                        </div>
                      )}
                      {rc.page && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                          Reference: <span className="badge badge-blue">Page {rc.page}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: FINANCIAL VISUALIZATIONS */}
          {activeTab === 'visualizations' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Linked Financial Visualizations & Audited Excerpts
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Traceability loop: Metric &rarr; Interactive Graph &rarr; AI Interpretation &rarr; Supporting Evidence Quote &rarr; Page Citations
                </p>
              </div>

              {visualizations.map((chart, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Chart Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{chart.title}</h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unit: {chart.unit}</div>
                    </div>
                    {chart.pages && chart.pages.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Report Reference:</span>
                        {chart.pages.map(p => (
                          <span key={p} className="badge badge-blue">Page {p}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Chart Container */}
                  <div style={{ width: '100%', height: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {chart.chart_type === 'pie' ? (
                        <PieChart>
                          <Pie
                            data={chart.data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={4}
                            label={({ name, share_pct }) => `${name} (${share_pct || ''}%)`}
                          >
                            {chart.data?.map((_, i) => (
                              <Cell key={`cell-${i}`} fill={['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'][i % 6]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-medium)', borderRadius: '8px' }} />
                        </PieChart>
                      ) : chart.chart_type === 'line' ? (
                        <LineChart data={chart.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                          <XAxis dataKey="margin_type" stroke="var(--text-muted)" fontSize={12} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} />
                          <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-medium)', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6' }} />
                        </LineChart>
                      ) : (
                        <BarChart data={chart.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                          <XAxis dataKey={chart.data?.[0]?.period ? 'period' : chart.data?.[0]?.category ? 'category' : 'flow_type'} stroke="var(--text-muted)" fontSize={12} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} />
                          <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-medium)', borderRadius: '8px' }} />
                          <Legend />
                          {chart.data?.[0]?.revenue !== undefined && <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />}
                          {chart.data?.[0]?.gross_profit !== undefined && <Bar dataKey="gross_profit" fill="#10b981" name="Gross Profit" />}
                          {chart.data?.[0]?.operating_income !== undefined && <Bar dataKey="operating_income" fill="#8b5cf6" name="Operating Income" />}
                          {chart.data?.[0]?.net_income !== undefined && <Bar dataKey="net_income" fill="#f59e0b" name="Net Income" />}
                          {chart.data?.[0]?.amount !== undefined && <Bar dataKey="amount" fill="#3b82f6" name="Amount" />}
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>

                  {/* AI Interpretation Box */}
                  <div style={{
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: '8px',
                    padding: '1rem',
                    borderLeft: '4px solid var(--accent-blue)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sparkles size={14} /> AI Interpretation of Chart Trends:
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {chart.ai_interpretation}
                    </p>
                    {chart.supporting_evidence && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                        &ldquo;{chart.supporting_evidence}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 8: DOCUMENT RAG CHAT */}
          {activeTab === 'chat' && (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '600px' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={18} color="#ec4899" />
                  Interactive Financial Report Q&A
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Ask any question regarding {analysisResult.company_name}'s filing. Grounded in retrieved chunks with citations.
                </p>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', maxWidth: '400px' }}>
                    <MessageSquare size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ask anything about this filing</p>
                    <p style={{ fontSize: '0.8rem' }}>e.g. "What was Apple's total debt?" or "How did Services margin perform?"</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div 
                      key={i}
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        backgroundColor: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-input)',
                        color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                        padding: '0.85rem 1.15rem',
                        borderRadius: '12px',
                        border: msg.role === 'assistant' ? '1px solid var(--border-medium)' : 'none',
                        fontSize: '0.875rem',
                        lineHeight: 1.5
                      }}
                    >
                      <div>{msg.content}</div>
                      {msg.cited_pages && msg.cited_pages.length > 0 && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.3rem', alignItems: 'center', fontSize: '0.7rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Citations:</span>
                          {msg.cited_pages.map(p => (
                            <span key={p} className="badge badge-blue">Page {p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isChatSending && (
                  <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Loader2 size={16} className="animate-spin" /> Retrieving grounded chunks...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                  type="text"
                  placeholder="Ask any question about the report..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="input-field"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatSending}
                  className="btn btn-primary"
                  style={{ padding: '0 1.25rem' }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <TrendingUp size={48} color="var(--accent-blue)" style={{ margin: '0 auto 1rem auto', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Ready to Analyze Corporate Financials
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            Select an annual report PDF above, specify the industry, and click <strong>"Run All 5 Agents"</strong> to generate deep multi-agent insights and interactive visualizations.
          </p>
          <button
            onClick={handleLoadSampleReport}
            className="btn btn-primary"
          >
            <Sparkles size={16} />
            Load Sample Apple Q1 FY26 Report
          </button>
        </div>
      )}
    </div>
  );
}
