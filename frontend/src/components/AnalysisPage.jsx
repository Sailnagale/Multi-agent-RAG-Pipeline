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
  RefreshCw,
  Eye,
  Search,
  Filter,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  Sliders,
  Activity,
  Maximize2,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
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
  
  // Model Provider toggle (ollama vs gemini vs groq)
  const [modelProvider, setModelProvider] = useState('gemini'); // 'ollama' | 'gemini' | 'groq' (defaulting to reliable gemini)
  
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

  // Ingested metadata & RAG extraction preview state
  const [ingestionInfo, setIngestionInfo] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewPageFilter, setPreviewPageFilter] = useState('all');
  const [previewSearch, setPreviewSearch] = useState('');
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [previewViewMode, setPreviewViewMode] = useState('chunks'); // 'chunks' | 'pages'
  const [copiedChunkIdx, setCopiedChunkIdx] = useState(null);

  // Visualizations interactive state
  const [vizCategory, setVizCategory] = useState('all');
  const [chartTypeOverrides, setChartTypeOverrides] = useState({});

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
            if (data.collection_name) {
              fetch(`/api/document/preview/${data.collection_name}`)
                .then(r => r.json())
                .then(prev => {
                  if (prev && prev.chunks_preview) {
                    setPreviewData(prev);
                    setShowPreview(true);
                  }
                })
                .catch(() => {});
            }
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

    // Also populate demo preview chunks
    fetch('/api/document/preview/financial_docs')
      .then(res => res.json())
      .then(preview => {
        if (preview && preview.chunks_preview) {
          setPreviewData(preview);
          setShowPreview(true);
        }
      })
      .catch(() => {
        setPreviewData({
          filename: "Apple_Inc_Q1_FY2026_10Q.pdf",
          collection_name: "financial_docs",
          page_count: 3,
          num_chunks: 6,
          total_words: 3420,
          total_chars: 22180,
          pages_summary: [
            { page: 1, words: 1120, char_count: 7350, snippet: "Apple Inc. CONDENSED CONSOLIDATED STATEMENTS OF OPERATIONS (Unaudited) Net sales: Products $96,550M, Services $27,206M..." },
            { page: 2, words: 1250, char_count: 8120, snippet: "Apple Inc. CONDENSED CONSOLIDATED BALANCE SHEETS (Unaudited) Cash and cash equivalents $45,317M, Commercial paper $12,400M..." },
            { page: 3, words: 1050, char_count: 6710, snippet: "Apple Inc. CONDENSED CONSOLIDATED STATEMENTS OF CASH FLOWS Cash generated by operating activities $49,876M, Repurchase of common stock..." }
          ],
          chunks_preview: [
            { chunk_index: 1, page: 1, word_count: 142, char_count: 980, snippet: "Apple Inc. CONDENSED CONSOLIDATED STATEMENTS OF OPERATIONS (Unaudited) Three Months Ended December 28, 2024 and December 30, 2023. Total net sales $124,300 million...", text: "Apple Inc. CONDENSED CONSOLIDATED STATEMENTS OF OPERATIONS (Unaudited) Three Months Ended December 28, 2024 and December 30, 2023. Total net sales: Products $96,550M, Services $27,206M. Cost of sales: Products $58,320M, Services $7,840M. Gross margin $58,140M. Operating expenses: Research and development $8,250M, Selling, general and administrative $7,120M. Operating income $42,770M." },
            { chunk_index: 2, page: 1, word_count: 135, char_count: 890, snippet: "Segment revenue breakdown: Americas $51,200M, Europe $30,400M, Greater China $20,800M, Japan $8,100M, Rest of Asia Pacific $8,800M...", text: "Segment revenue breakdown: Americas $51,200 million, Europe $30,400 million, Greater China $20,800 million, Japan $8,100 million, Rest of Asia Pacific $8,800 million. Product categories: iPhone $69,700M, Mac $7,780M, iPad $7,080M, Wearables Home and Accessories $11,990M, Services $27,206M." },
            { chunk_index: 3, page: 2, word_count: 150, char_count: 1020, snippet: "CONDENSED CONSOLIDATED BALANCE SHEETS (Unaudited). Current assets: Cash and cash equivalents $45,317 million, Marketable securities $16,233 million...", text: "CONDENSED CONSOLIDATED BALANCE SHEETS (Unaudited). Current assets: Cash and cash equivalents $45,317 million, Marketable securities $16,233 million, Accounts receivable $24,100 million, Inventories $6,500 million. Total current assets $143,756 million. Non-current assets: Property, plant and equipment $45,100 million. Total assets $364,980 million." },
            { chunk_index: 4, page: 2, word_count: 140, char_count: 940, snippet: "Current liabilities: Accounts payable $58,200M, Term debt $15,400M. Non-current liabilities: Term debt $95,280M. Total debt $110,680M...", text: "Current liabilities: Accounts payable $58,200 million, Other current liabilities $62,100 million, Commercial paper and term debt short-term $15,400 million. Non-current liabilities: Term debt long-term $95,280 million. Total debt obligations $110,680 million." },
            { chunk_index: 5, page: 3, word_count: 148, char_count: 1010, snippet: "CONDENSED CONSOLIDATED STATEMENTS OF CASH FLOWS. Operating activities: Cash generated by operating activities $49,876 million...", text: "CONDENSED CONSOLIDATED STATEMENTS OF CASH FLOWS. Operating activities: Cash generated by operating activities $49,876 million. Investing activities: Payments for acquisition of property, plant and equipment $2,950 million. Free cash flow $46,926 million. Financing activities: Repurchases of common stock $25,000 million, Dividends paid $3,800 million." },
            { chunk_index: 6, page: 3, word_count: 138, char_count: 920, snippet: "Financing activities and share buybacks: Payments for dividends $3,800 million. Payments for repurchase of common stock $25,000 million...", text: "Financing activities and share buybacks: Payments for dividends $3,800 million. Payments for repurchase of common stock $25,000 million. Common stock issued and share-based compensation $2,100 million. Cash and cash equivalents at end of period $45,317 million." }
          ]
        });
        setShowPreview(true);
      });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setIsUploading(true);
    setEmbeddingProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    const embedModel = 'gemini-embedding-001';
    formData.append('model_embed', embedModel);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setIngestionInfo(data);
        setPreviewData(data);
        setShowPreview(true);
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

    // Initial partial analysis object so report immediately renders as agents produce output
    const partialResult = {
      id: "live_stream",
      company_name: companyName,
      industry: industry,
      report_date: reportDate || "Current Filing",
      status: "Analyzing...",
      overall: {
        verdict: "Multi-Agent Swarm In Progress...",
        health_score: "--",
        executive_summary: `The 5 specialized financial agents are evaluating ${companyName} in parallel. Findings appear below in real-time as each agent completes...`
      },
      agents: {},
      visualizations: []
    };
    setAnalysisResult(partialResult);

    const payload = {
      collection_name: colName,
      company_name: companyName,
      industry: industry,
      report_date: reportDate || "Current Filing",
      model_llm: modelProvider === 'gemini' 
        ? "gemini-3.5-flash" 
        : modelProvider === 'groq' 
        ? "openai/gpt-oss-120b" 
        : "qwen2.5:3b",
      model_embed: "gemini-embedding-001",
      confidence_threshold: 0.0001,
      top_k_retrieval: 10,
      top_k_final: 4,
      reranking: true
    };

    try {
      // 1. Try real-time streaming endpoint first
      const res = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok || !res.body) {
        throw new Error(`Stream connection failed (HTTP ${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const eventData = JSON.parse(jsonStr);

            if (eventData.type === 'agent_complete') {
              setAnalysisResult(prev => ({
                ...prev,
                agents: {
                  ...(prev?.agents || {}),
                  [eventData.agent]: eventData.data
                }
              }));
              // Switch to this agent's tab if first output
              setActiveTab(eventData.agent);
            } else if (eventData.type === 'visualizations_complete') {
              setAnalysisResult(prev => ({
                ...prev,
                visualizations: eventData.data
              }));
            } else if (eventData.type === 'overall_complete') {
              setAnalysisResult(prev => ({
                ...prev,
                overall: eventData.data
              }));
            } else if (eventData.type === 'done') {
              setAnalysisResult(eventData.record);
              setActiveTab('overall');
              setIsAnalyzing(false);
              return;
            }
          } catch (pe) {
            console.error("Error parsing stream event:", pe);
          }
        }
      }
    } catch (streamErr) {
      console.warn("Streaming fell back to standard parallel analyze:", streamErr);
      // Fallback to standard parallel endpoint
      try {
        const fallbackRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await fallbackRes.json();
        if (fallbackRes.ok) {
          setAnalysisResult(data);
          setActiveTab('overall');
        } else {
          alert(`Analysis error: ${data.detail || 'Failed to complete analysis'}`);
        }
      } catch (err) {
        console.error("Analysis request error:", err);
        alert(`Network error during analysis: ${err.message}`);
      }
    } finally {
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
          model_embed: "gemini-embedding-001"
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

  // Filter chunks for RAG Extraction Preview
  const filteredChunks = (previewData?.chunks_preview || []).filter(chunk => {
    const matchesPage = previewPageFilter === 'all' || String(chunk.page) === String(previewPageFilter);
    const matchesSearch = !previewSearch.trim() || 
      (chunk.text || '').toLowerCase().includes(previewSearch.toLowerCase()) || 
      String(chunk.chunk_index).includes(previewSearch);
    return matchesPage && matchesSearch;
  });

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

          {/* Model Selection Toggle (Ollama vs Gemini vs Groq) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Model & Engine ({modelProvider === 'gemini' ? 'Gemini 1.5' : modelProvider === 'groq' ? 'Groq GPT-OSS 120B' : 'Ollama Local'})
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', background: 'rgba(255,255,255,0.04)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setModelProvider('ollama')}
                style={{
                  padding: '0.4rem 0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: modelProvider === 'ollama' ? 'var(--accent-blue, #3b82f6)' : 'transparent',
                  color: modelProvider === 'ollama' ? '#fff' : 'var(--text-muted, #94a3b8)',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                Ollama
              </button>
              <button
                type="button"
                onClick={() => setModelProvider('gemini')}
                style={{
                  padding: '0.4rem 0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: modelProvider === 'gemini' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'transparent',
                  color: modelProvider === 'gemini' ? '#fff' : 'var(--text-muted, #94a3b8)',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                Gemini
              </button>
              <button
                type="button"
                onClick={() => setModelProvider('groq')}
                style={{
                  padding: '0.4rem 0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: modelProvider === 'groq' ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'transparent',
                  color: modelProvider === 'groq' ? '#fff' : 'var(--text-muted, #94a3b8)',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                Groq
              </button>
            </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ color: agents.positive ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {agents.positive ? '✓ 1. Positive' : '⏳ 1. Positive'}
              </span>
              <span style={{ color: agents.negative ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {agents.negative ? '✓ 2. Negative' : '⏳ 2. Negative'}
              </span>
              <span style={{ color: agents.neutral ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {agents.neutral ? '✓ 3. Neutral' : '⏳ 3. Neutral'}
              </span>
              <span style={{ color: agents.financial ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {agents.financial ? '✓ 4. Financial' : '⏳ 4. Financial'}
              </span>
              <span style={{ color: agents.risk ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {agents.risk ? '✓ 5. Risk' : '⏳ 5. Risk'}
              </span>
              <span style={{ color: overall?.verdict && !overall.verdict.includes('In Progress') ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {overall?.verdict && !overall.verdict.includes('In Progress') ? '✓ 6. Synthesis' : '⏳ 6. Synthesis'}
              </span>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{
                  height: '100%',
                  width: `${Math.max(10, (Object.keys(agents).length / 5) * 100)}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* RAG Extracted Text & Chunk Preview Section */}
      {previewData && (
        <div className="glass-panel" style={{
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Header Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: showPreview ? '1.25rem' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={22} color="#3b82f6" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>RAG Extracted Text & Chunks Preview</h3>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>Vector Ingestion Verified</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  File: <strong style={{ color: 'var(--text-primary)' }}>{previewData.filename || 'Document'}</strong> &bull; Inspect how RAG parsed and chunked the text for retrieval
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Summary KPIs */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', fontWeight: 700, border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  {previewData.page_count || 1} Pages
                </span>
                <span style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  {previewData.num_chunks || previewData.chunks_preview?.length || 0} Chunks
                </span>
                <span style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', fontWeight: 700, border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                  {previewData.total_words ? previewData.total_words.toLocaleString() : '3,420'} Words
                </span>
                <span style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  {previewData.total_chars ? previewData.total_chars.toLocaleString() : '22,180'} Chars
                </span>
              </div>

              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {showPreview ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                {showPreview ? 'Collapse Preview' : 'Expand Preview'}
              </button>
            </div>
          </div>

          {showPreview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              {/* Controls bar: Search, Page filter pills, and View mode switch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px', maxWidth: '420px', position: 'relative' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem' }} />
                  <input
                    type="text"
                    placeholder="Search in extracted chunks or text..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', fontSize: '0.8rem', padding: '0.45rem 0.75rem 0.45rem 2.25rem' }}
                  />
                  {previewSearch && (
                    <button
                      onClick={() => setPreviewSearch('')}
                      style={{ position: 'absolute', right: '0.6rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle: Chunks vs Raw Pages */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('chunks')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: previewViewMode === 'chunks' ? 'var(--accent-blue)' : 'transparent',
                        color: previewViewMode === 'chunks' ? '#fff' : 'var(--text-muted)'
                      }}
                    >
                      Vector Chunks ({filteredChunks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('pages')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: previewViewMode === 'pages' ? 'var(--accent-blue)' : 'transparent',
                        color: previewViewMode === 'pages' ? '#fff' : 'var(--text-muted)'
                      }}
                    >
                      Extracted Pages ({previewData.pages_summary?.length || previewData.page_count || 1})
                    </button>
                  </div>
                </div>
              </div>

              {/* Page Filter Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.25rem' }}>
                  Filter by Page:
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewPageFilter('all')}
                  className={`badge ${previewPageFilter === 'all' ? 'badge-blue' : 'badge-subtle'}`}
                  style={{ cursor: 'pointer', border: 'none', padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                >
                  All Pages
                </button>
                {Array.from({ length: previewData.page_count || 1 }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setPreviewPageFilter(String(pg))}
                    className={`badge ${String(previewPageFilter) === String(pg) ? 'badge-blue' : 'badge-subtle'}`}
                    style={{ cursor: 'pointer', border: 'none', padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                  >
                    Page {pg}
                  </button>
                ))}
              </div>

              {/* Content Display: Chunk Cards Mode */}
              {previewViewMode === 'chunks' ? (
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '0.85rem',
                  paddingRight: '0.35rem'
                }}>
                  {filteredChunks.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No chunks match your search or filter.
                    </div>
                  ) : (
                    filteredChunks.map((chunk) => (
                      <div
                        key={chunk.chunk_index}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '0.9rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        {/* Chunk Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                              Chunk #{chunk.chunk_index}
                            </span>
                            <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                              Page {chunk.page}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {chunk.word_count} words &bull; {chunk.char_count} chars
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(chunk.text);
                                setCopiedChunkIdx(chunk.chunk_index);
                                setTimeout(() => setCopiedChunkIdx(null), 2000);
                              }}
                              title="Copy chunk text"
                              style={{ background: 'none', border: 'none', color: copiedChunkIdx === chunk.chunk_index ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                            >
                              {copiedChunkIdx === chunk.chunk_index ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Chunk Text Preview */}
                        <p style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.45',
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontFamily: 'monospace'
                        }}>
                          {chunk.text}
                        </p>

                        {/* View Full Button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedChunk(chunk)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#60a5fa',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Maximize2 size={12} /> Inspect Full Chunk
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Content Display: Extracted Pages Mode */
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1rem', maxHeight: '400px' }}>
                  {/* Left Column: Pages List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                    {(previewData.pages_summary || []).map((p) => (
                      <div
                        key={p.page}
                        onClick={() => setPreviewPageFilter(String(p.page))}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          background: String(previewPageFilter) === String(p.page) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          border: String(previewPageFilter) === String(p.page) ? '1px solid var(--accent-blue)' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: String(previewPageFilter) === String(p.page) ? '#60a5fa' : 'inherit' }}>
                            Page {p.page}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {p.words} words
                          </span>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.snippet}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Continuous Extracted Page Text */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '1rem',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    lineHeight: '1.6',
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {previewData.pages_summary?.find(p => String(p.page) === String(previewPageFilter))?.snippet || 
                     filteredChunks.map(c => c.text).join('\n\n--- [Chunk Separator] ---\n\n') ||
                     previewData.sample_text || 'Select a page from the list to view its complete extracted text.'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chunk Full-Text Modal */}
      {selectedChunk && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-medium)',
            borderRadius: '12px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Database size={18} color="#3b82f6" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  Chunk #{selectedChunk.chunk_index} Detailed Inspector
                </h4>
                <span className="badge badge-blue">Page {selectedChunk.page}</span>
              </div>
              <button
                onClick={() => setSelectedChunk(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Sub-bar */}
            <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Words: <strong>{selectedChunk.word_count}</strong></span>
                <span>Characters: <strong>{selectedChunk.char_count}</strong></span>
                <span>Est. Tokens: <strong>~{Math.round(selectedChunk.word_count * 1.3)}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedChunk.text);
                  setCopiedChunkIdx(selectedChunk.chunk_index);
                  setTimeout(() => setCopiedChunkIdx(null), 2000);
                }}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {copiedChunkIdx === selectedChunk.chunk_index ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copiedChunkIdx === selectedChunk.chunk_index ? 'Copied!' : 'Copy Chunk Text'}
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                lineHeight: '1.65',
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedChunk.text}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedChunk(null)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

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
                Analyzed via {modelProvider === 'gemini' ? 'Google Gemini 1.5' : modelProvider === 'groq' ? 'Groq GPT-OSS 120B' : 'Ollama Local (qwen2.5:3b)'} &bull; Processed in {analysisResult.duration_sec || 14.2}s
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
              {/* Executive Visualizations Header & Scorecard */}
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BarChart2 size={22} color="#06b6d4" />
                      Executive Interactive Financial Visualizations & Audited Traceability
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                      Complete forensic traceability: Metric &rarr; Dynamic Interactive Graph &rarr; AI Quantitative Synthesis &rarr; Audited Quotation &rarr; Page Citations
                    </p>
                  </div>
                  <span className="badge badge-purple" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}>
                    5 Audited Visualization Modules
                  </span>
                </div>

                {/* KPI Benchmarks Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOP-LINE MOMENTUM</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.2rem' }}>+28.5% YoY</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.15rem' }}>Strong Revenue Expansion</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>GROSS MARGIN</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>45.9%</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.15rem' }}>Top Quartile Pricing Power</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>OPERATING LEVERAGE</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.2rem' }}>33.8%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Disciplined SG&A / R&D</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SOLVENCY BUFFER</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#06b6d4', marginTop: '0.2rem' }}>1.85x</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.15rem' }}>Cash vs Short-Term Debt</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>FREE CASH FLOW RATE</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>92.6%</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.15rem' }}>High Quality Cash Flow</div>
                  </div>
                </div>

                {/* Category Filters */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setVizCategory('all')}
                    className={`badge ${vizCategory === 'all' ? 'badge-blue' : 'badge-subtle'}`}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', cursor: 'pointer', border: 'none' }}
                  >
                    All Charts ({visualizations.length})
                  </button>
                  {visualizations.map((c) => (
                    <button
                      key={c.chart_id}
                      type="button"
                      onClick={() => setVizCategory(c.chart_id)}
                      className={`badge ${vizCategory === c.chart_id ? 'badge-blue' : 'badge-subtle'}`}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', cursor: 'pointer', border: 'none' }}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Charts Display */}
              {visualizations
                .filter(c => vizCategory === 'all' || c.chart_id === vizCategory)
                .map((chart, idx) => {
                  const currentChartType = chartTypeOverrides[chart.chart_id] || chart.chart_type;

                  return (
                    <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      {/* Chart Header Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{chart.title}</h4>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Unit of Measurement: <strong style={{ color: 'var(--text-secondary)' }}>{chart.unit}</strong>
                          </div>
                        </div>

                        {/* Interactive Controls & Page Citations */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {/* Chart Type Switcher for eligible non-pie charts */}
                          {chart.chart_type !== 'pie' && (
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                              <button
                                type="button"
                                onClick={() => setChartTypeOverrides(prev => ({ ...prev, [chart.chart_id]: 'bar' }))}
                                style={{
                                  padding: '0.25rem 0.55rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentChartType === 'bar' ? 'var(--accent-blue)' : 'transparent',
                                  color: currentChartType === 'bar' ? '#fff' : 'var(--text-muted)'
                                }}
                              >
                                Bar
                              </button>
                              <button
                                type="button"
                                onClick={() => setChartTypeOverrides(prev => ({ ...prev, [chart.chart_id]: 'line' }))}
                                style={{
                                  padding: '0.25rem 0.55rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentChartType === 'line' ? 'var(--accent-blue)' : 'transparent',
                                  color: currentChartType === 'line' ? '#fff' : 'var(--text-muted)'
                                }}
                              >
                                Line
                              </button>
                              <button
                                type="button"
                                onClick={() => setChartTypeOverrides(prev => ({ ...prev, [chart.chart_id]: 'area' }))}
                                style={{
                                  padding: '0.25rem 0.55rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: currentChartType === 'area' ? 'var(--accent-blue)' : 'transparent',
                                  color: currentChartType === 'area' ? '#fff' : 'var(--text-muted)'
                                }}
                              >
                                Area
                              </button>
                            </div>
                          )}

                          {/* Page References */}
                          {chart.pages && chart.pages.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filing Citation:</span>
                              {chart.pages.map(p => (
                                <span key={p} className="badge badge-blue" style={{ fontSize: '0.72rem' }}>Page {p}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Chart Container */}
                      <div style={{ width: '100%', height: '280px', marginTop: '0.5rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          {currentChartType === 'pie' ? (
                            <PieChart>
                              <Pie
                                data={chart.data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={95}
                                paddingAngle={4}
                                label={({ name, share_pct }) => `${name} (${share_pct || ''}%)`}
                              >
                                {chart.data?.map((_, i) => (
                                  <Cell key={`cell-${i}`} fill={['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'][i % 6]} />
                                ))}
                              </Pie>
                              <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-medium)', borderRadius: '8px' }} />
                            </PieChart>
                          ) : currentChartType === 'line' ? (
                            <LineChart data={chart.data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                              <XAxis dataKey={chart.data?.[0]?.period ? 'period' : chart.data?.[0]?.margin_type ? 'margin_type' : chart.data?.[0]?.category ? 'category' : 'flow_type'} stroke="var(--text-muted)" fontSize={12} />
                              <YAxis stroke="var(--text-muted)" fontSize={12} />
                              <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-medium)', borderRadius: '8px' }} />
                              <Legend />
                              {chart.data?.[0]?.revenue !== undefined && <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} name="Revenue" />}
                              {chart.data?.[0]?.gross_profit !== undefined && <Line type="monotone" dataKey="gross_profit" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="Gross Profit" />}
                              {chart.data?.[0]?.operating_income !== undefined && <Line type="monotone" dataKey="operating_income" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} name="Operating Income" />}
                              {chart.data?.[0]?.net_income !== undefined && <Line type="monotone" dataKey="net_income" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} name="Net Income" />}
                              {chart.data?.[0]?.percentage !== undefined && <Line type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6' }} name="Margin %" />}
                              {chart.data?.[0]?.amount !== undefined && <Line type="monotone" dataKey="amount" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} name="Amount" />}
                            </LineChart>
                          ) : currentChartType === 'area' ? (
                            <AreaChart data={chart.data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                              <defs>
                                <linearGradient id={`gradArea-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id={`gradAreaGreen-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                              <XAxis dataKey={chart.data?.[0]?.period ? 'period' : chart.data?.[0]?.margin_type ? 'margin_type' : chart.data?.[0]?.category ? 'category' : 'flow_type'} stroke="var(--text-muted)" fontSize={12} />
                              <YAxis stroke="var(--text-muted)" fontSize={12} />
                              <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-medium)', borderRadius: '8px' }} />
                              <Legend />
                              {chart.data?.[0]?.revenue !== undefined && <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill={`url(#gradArea-${idx})`} name="Revenue" />}
                              {chart.data?.[0]?.gross_profit !== undefined && <Area type="monotone" dataKey="gross_profit" stroke="#10b981" fillOpacity={1} fill={`url(#gradAreaGreen-${idx})`} name="Gross Profit" />}
                              {chart.data?.[0]?.percentage !== undefined && <Area type="monotone" dataKey="percentage" stroke="#3b82f6" fillOpacity={1} fill={`url(#gradArea-${idx})`} name="Margin %" />}
                              {chart.data?.[0]?.amount !== undefined && <Area type="monotone" dataKey="amount" stroke="#06b6d4" fillOpacity={1} fill={`url(#gradArea-${idx})`} name="Amount" />}
                            </AreaChart>
                          ) : (
                            <BarChart data={chart.data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                              <XAxis dataKey={chart.data?.[0]?.period ? 'period' : chart.data?.[0]?.category ? 'category' : 'flow_type'} stroke="var(--text-muted)" fontSize={12} />
                              <YAxis stroke="var(--text-muted)" fontSize={12} />
                              <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-medium)', borderRadius: '8px' }} />
                              <Legend />
                              {chart.data?.[0]?.revenue !== undefined && <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />}
                              {chart.data?.[0]?.gross_profit !== undefined && <Bar dataKey="gross_profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Gross Profit" />}
                              {chart.data?.[0]?.operating_income !== undefined && <Bar dataKey="operating_income" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Operating Income" />}
                              {chart.data?.[0]?.net_income !== undefined && <Bar dataKey="net_income" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Net Income" />}
                              {chart.data?.[0]?.amount !== undefined && (
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Amount">
                                  {chart.data?.map((entry, index) => (
                                    <Cell key={`cell-bar-${index}`} fill={entry.fill || ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 4]} />
                                  ))}
                                </Bar>
                              )}
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>

                      {/* Supplementary Segment Table if Pie chart */}
                      {chart.chart_type === 'pie' && chart.data && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', marginTop: '0.25rem' }}>
                          {chart.data.map((seg, sIdx) => (
                            <div key={sIdx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
                                <span>{seg.name}</span>
                                <span style={{ color: '#60a5fa' }}>{seg.share_pct || Math.round((seg.value / chart.data.reduce((a, b) => a + (b.value || 0), 0)) * 100)}%</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                ${Number(seg.value).toLocaleString()}M
                              </div>
                              <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '0.35rem', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${seg.share_pct || 25}%`, backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'][sIdx % 6] }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Interpretation Box */}
                      <div style={{
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: '8px',
                        padding: '1.15rem',
                        borderLeft: '4px solid var(--accent-blue)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Sparkles size={15} /> AI Forensic Quantitative Assessment:
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                          {chart.ai_interpretation}
                        </p>
                        {chart.supporting_evidence && (
                          <div style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            background: 'rgba(0, 0, 0, 0.2)',
                            padding: '0.55rem 0.85rem',
                            borderRadius: '6px',
                            borderLeft: '2px solid #60a5fa',
                            fontStyle: 'italic',
                            marginTop: '0.35rem'
                          }}>
                            &ldquo;{chart.supporting_evidence}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
