import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Sliders, 
  Activity, 
  CheckCircle2, 
  Save, 
  User, 
  Building, 
  Sparkles,
  FileCheck,
  Play,
  Loader2
} from 'lucide-react';

export default function SettingsPage({ user, onUpdateUser }) {
  // Profile state
  const [profileName, setProfileName] = useState(user?.name || 'Dr. Michael Chen');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'm.chen@apex-capital.com');
  const [profileOrg, setProfileOrg] = useState(user?.organization || 'Apex Institutional Capital');
  const [profileRole, setProfileRole] = useState(user?.role || 'Principal Investment Officer');

  // AI Configuration state
  const [modelLLM, setModelLLM] = useState('qwen2.5:3b');
  const [modelEmbed, setModelEmbed] = useState('qwen3-embedding');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.0001);
  const [topKRetrieval, setTopKRetrieval] = useState(10);
  const [topKFinal, setTopKFinal] = useState(4);
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [reranking, setReranking] = useState(true);

  // Diagnostics & Monitoring state
  const [healthInfo, setHealthInfo] = useState(null);
  const [monitoringLogs, setMonitoringLogs] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Golden Dataset Evaluation state
  const [goldenDatasetContent, setGoldenDatasetContent] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  useEffect(() => {
    // Fetch health & config
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthInfo(data))
      .catch(err => console.error("Health check error:", err));

    fetch('/api/monitoring/logs')
      .then(res => res.json())
      .then(data => setMonitoringLogs(data))
      .catch(err => console.error("Monitoring logs error:", err));
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    onUpdateUser({
      name: profileName,
      email: profileEmail,
      organization: profileOrg,
      role: profileRole
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLoadSampleDataset = () => {
    const sample = JSON.stringify([
      {
        "question": "What was Apple's total net sales for Q1 FY2026?",
        "expected": "143756"
      },
      {
        "question": "What was Apple's net income for the three months ended December 27 2025?",
        "expected": "42097"
      },
      {
        "question": "How much cash did Apple have at the end of Q1 FY2026?",
        "expected": "45317"
      },
      {
        "question": "How much net sales were from iPhones at the end of Q1 FY2026",
        "expected": "85269"
      }
    ], null, 2);
    setGoldenDatasetContent(sample);
  };

  const handleRunEvaluation = async () => {
    if (!goldenDatasetContent.trim()) {
      alert("Please provide or load a golden dataset.");
      return;
    }

    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_content: goldenDatasetContent,
          collection_name: "financial_docs",
          model_llm: modelLLM,
          model_embed: modelEmbed,
          model_judge: modelLLM,
          confidence_threshold: confidenceThreshold,
          top_k_retrieval: topKRetrieval,
          top_k_final: topKFinal,
          reranking: reranking
        })
      });
      const data = await res.json();
      if (res.ok) {
        setEvaluationResult(data);
      } else {
        alert(`Evaluation error: ${data.detail || 'Evaluation failed'}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Platform Settings & Diagnostics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Configure AI models, chunking parameters, evaluation benchmarking, and user profile
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* User Profile Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <User size={18} color="var(--accent-blue)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>User Profile & Fund Details</h2>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Organization / Asset Manager
              </label>
              <input
                type="text"
                value={profileOrg}
                onChange={(e) => setProfileOrg(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Investment Persona / Mandate
              </label>
              <select
                value={profileRole}
                onChange={(e) => setProfileRole(e.target.value)}
                className="input-field"
              >
                <option value="Forensic Equity Research">Forensic Equity Research</option>
                <option value="Long/Short Fundamental">Long/Short Fundamental</option>
                <option value="Value & Special Situations">Value & Special Situations</option>
                <option value="Credit & Debt Distressed">Credit & Debt Distressed</option>
                <option value="Quantitative Risk Management">Quantitative Risk Management</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              <Save size={16} /> Save Profile Changes
            </button>
            {saveSuccess && (
              <div style={{ fontSize: '0.8rem', color: '#10b981', textAlign: 'center' }}>
                Profile successfully saved!
              </div>
            )}
          </form>
        </div>

        {/* AI & RAG Engine Settings */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sliders size={18} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Models & RAG Engine</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* LLM Model Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                LLM Model
              </label>
              <select
                value={modelLLM}
                onChange={(e) => setModelLLM(e.target.value)}
                className="input-field"
              >
                <option value="qwen2.5:3b">qwen2.5:3b (Ollama Local - Recommended)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (Google GenAI Cloud)</option>
              </select>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                qwen2.5:3b runs locally via Ollama with 100% privacy and zero external data leaks.
              </div>
            </div>

            {/* Embedding Model Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Embedding Model
              </label>
              <select
                value={modelEmbed}
                onChange={(e) => setModelEmbed(e.target.value)}
                className="input-field"
              >
                <option value="qwen3-embedding">qwen3-embedding (Ollama Local - 4096-dim)</option>
                <option value="nomic-embed-text">nomic-embed-text (Ollama Local - 768-dim)</option>
                <option value="gemini-embedding-001">gemini-embedding-001 (Google GenAI)</option>
              </select>
            </div>

            {/* Confidence Threshold */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                <span>Confidence Threshold</span>
                <span style={{ color: 'var(--accent-blue)' }}>{confidenceThreshold}</span>
              </div>
              <input
                type="range"
                min="0.0000"
                max="0.9000"
                step="0.005"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Top K Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Top-K Retrieval: {topKRetrieval}
                </label>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={topKRetrieval}
                  onChange={(e) => setTopKRetrieval(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Top-K Final: {topKFinal}
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="1"
                  value={topKFinal}
                  onChange={(e) => setTopKFinal(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* FlashRank Rerank Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>FlashRank Re-ranking</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sort candidate KNN chunks by relevance before LLM analysis</div>
              </div>
              <input
                type="checkbox"
                checked={reranking}
                onChange={(e) => setReranking(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ollama Diagnostics & Query Monitoring Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Ollama Diagnostic Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Cpu size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Ollama System Health</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Daemon Status:</span>
              <span style={{ fontWeight: 700, color: healthInfo?.ollama_connected ? '#10b981' : '#f59e0b' }}>
                {healthInfo?.ollama_connected ? 'Active & Ready' : 'Disconnected'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Default LLM:</span>
              <span style={{ fontWeight: 600 }}>{healthInfo?.default_llm || 'qwen2.5:3b'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Default Embedding:</span>
              <span style={{ fontWeight: 600 }}>{healthInfo?.default_embedding || 'qwen3-embedding'}</span>
            </div>

            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Installed Models:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {healthInfo?.ollama_models?.map((m, i) => (
                  <span key={i} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Query Monitoring Stats */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#3b82f6" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>RAG Production Monitoring</h3>
            </div>
            <span className="badge badge-purple">{monitoringLogs?.total_queries || 0} Total Invocations</span>
          </div>

          <div className="grid-cols-3" style={{ marginBottom: '1.25rem' }}>
            <div className="glass-card" style={{ textAlign: 'center', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AVG RETRIEVAL</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{monitoringLogs?.avg_retrieval_sec || 0}s</div>
            </div>
            <div className="glass-card" style={{ textAlign: 'center', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AVG GENERATION</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{monitoringLogs?.avg_generation_sec || 0}s</div>
            </div>
            <div className="glass-card" style={{ textAlign: 'center', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL LATENCY</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{monitoringLogs?.avg_total_sec || 0}s</div>
            </div>
          </div>

          {/* Recent Query Table */}
          {monitoringLogs?.logs && monitoringLogs.logs.length > 0 && (
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '0.4rem' }}>Timestamp</th>
                    <th style={{ padding: '0.4rem' }}>Query</th>
                    <th style={{ padding: '0.4rem' }}>Retrieve</th>
                    <th style={{ padding: '0.4rem' }}>Generate</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoringLogs.logs.slice(0, 5).map((log, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>{log.timestamp?.slice(11, 19)}</td>
                      <td style={{ padding: '0.4rem', fontWeight: 600 }}>{log.question?.slice(0, 45)}...</td>
                      <td style={{ padding: '0.4rem' }}>{log.retrieval_time_sec}s</td>
                      <td style={{ padding: '0.4rem' }}>{log.generation_time_sec}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Golden Dataset Evaluation Suite */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={20} color="#8b5cf6" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Golden Dataset Benchmark Evaluation</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Evaluate RAG retrieval accuracy and completeness against ground truth QA pairs using LLM-as-a-judge (1-5 scale)
              </p>
            </div>
          </div>

          <button
            onClick={handleLoadSampleDataset}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            <Sparkles size={14} color="#8b5cf6" /> Load Apple Q1 Benchmark Pairs
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <textarea
            rows={5}
            placeholder="Paste Golden Dataset JSON array here..."
            value={goldenDatasetContent}
            onChange={(e) => setGoldenDatasetContent(e.target.value)}
            className="input-field"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={handleRunEvaluation}
            disabled={isEvaluating || !goldenDatasetContent.trim()}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.25rem' }}
          >
            {isEvaluating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Evaluating with LLM Judge...
              </>
            ) : (
              <>
                <Play size={16} /> Run Evaluation Benchmark
              </>
            )}
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Uses LLM judge scoring (1 to 5) to verify factual precision.
          </span>
        </div>

        {/* Evaluation Results Card */}
        {evaluationResult && (
          <div className="glass-card animate-fade-in" style={{ borderTop: '3px solid #10b981', padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>QUESTIONS EVALUATED</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{evaluationResult.total_questions}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AVERAGE SCORE</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                  {evaluationResult.average_score?.toFixed(2)} / 5.0
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OVERALL ACCURACY</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6' }}>
                  {((evaluationResult.average_score / 5) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Per-Question Results</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Question</th>
                    <th style={{ padding: '0.5rem' }}>Expected</th>
                    <th style={{ padding: '0.5rem' }}>RAG Generated Answer</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluationResult.results?.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>{r.question}</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{r.expected}</td>
                      <td style={{ padding: '0.6rem' }}>{r.answer}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                        <span className={`badge ${r.score >= 4 ? 'badge-green' : r.score >= 2 ? 'badge-amber' : 'badge-rose'}`}>
                          {r.score}/5
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
