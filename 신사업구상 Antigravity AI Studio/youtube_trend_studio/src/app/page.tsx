"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Video, Settings, TrendingUp, Loader2, Play, Terminal, Clock, RefreshCw, Plus, CheckSquare, Square, ListOrdered, Download } from 'lucide-react';

interface Job {
  job_id: string;
  topic: string;
  format: string;
  status: 'pending' | 'running' | 'done' | 'error';
  messages: string[];
  progress: number;
  eta: number | null;
}

// Define Trend interface if not already defined
interface Trend {
  hook: string;
  topic: string;
  // Add other properties of a trend if they exist
}

export default function Dashboard() {
  const [format, setFormat] = useState<'short' | 'longform'>('short');
  const [manualTopic, setManualTopic] = useState('');
  
  // Trends Feature
  const [trends, setTrends] = useState<Trend[]>([]);
  const [fetchingTrends, setFetchingTrends] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [selectedTrends, setSelectedTrends] = useState<Set<number>>(new Set());
  const [collectionDate, setCollectionDate] = useState<string | null>(null);
  const [trendProgress, setTrendProgress] = useState(0);
  const [trendETA, setTrendETA] = useState(15);

  // Job Queue
  const [jobs, setJobs] = useState<Job[]>([]);
  const pollRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial queue state on page mount
  useEffect(() => {
    const fetchInitialQueue = async () => {
      try {
        const res = await fetch('http://localhost:5005/api/jobs');
        const data = await res.json();
        if (Array.isArray(data)) {
          const loadedJobs: Job[] = data.map((j: any) => ({
            job_id: j.job_id,
            topic: j.topic,
            format: j.format,
            status: j.status,
            messages: [],
            progress: j.status === 'done' ? 100 : 0,
            eta: 0
          }));
          setJobs(loadedJobs);
          
          loadedJobs.forEach(job => {
            if (job.status === 'running' || job.status === 'pending') {
              startPolling(job.job_id);
            }
          });
        }
      } catch (e) {
        console.error("Failed to fetch initial queue:", e);
      }
    };
    fetchInitialQueue();
  }, []);

  const fetchTrends = async () => {
    setFetchingTrends(true);
    setTrendError(null);
    setSelectedTrends(new Set());
    setTrendProgress(0);
    setTrendETA(15); // Assume 15 seconds for Grounded Google Search
    
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Cap at 95% until we actually finish
      let newProgress = Math.min((elapsed / 15) * 100, 95);
      setTrendProgress(Math.floor(newProgress));
      setTrendETA(Math.max(15 - Math.floor(elapsed), 0));
    }, 500);

    try {
      const res = await fetch('/api/trending');
      const data = await res.json();
      
      clearInterval(progressInterval);
      setTrendProgress(100);
      setTrendETA(0);

      if (res.ok && data.trends) {
        setTrends(data.trends);
        if (data.collected_at) setCollectionDate(data.collected_at);
      } else {
        setTrendError(data.error || '트렌드 API 응답 오류');
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setTrendError(e.message || '네트워크 연결 오류');
    }
    setFetchingTrends(false);
  };

  useEffect(() => { fetchTrends(); }, []);

  const handleCancel = async (job_id: string) => {
    if (!confirm('정말 이 작업을 취소하시겠습니까?')) return;
    try {
      await fetch(`http://localhost:5005/api/cancel/${job_id}`, { method: 'POST' });
    } catch (e) {
      console.error("Cancel failed", e);
    }
  };

  // Per-job polling
  const startPolling = (job_id: string) => {
    if (pollRef.current[job_id]) return;
    pollRef.current[job_id] = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5005/api/status/${job_id}`);
        const data = await res.json();
        
        setJobs(prev => prev.map(j => {
          if (j.job_id !== job_id) return j;
          const newMsgs = [...j.messages, ...(data.messages || [])];
          const logText = newMsgs.join(' ').toLowerCase();
          let progress = j.progress;
          let eta = j.eta;
          
          if (logText.includes('edit_video') || logText.includes('exporting')) { 
            progress = Math.max(progress, 75); 
          } else if (logText.includes('fetch_materials') || logText.includes('pexels')) { 
            progress = Math.max(progress, 45); 
          } else if (logText.includes('research_topic') || logText.includes('gemini')) { 
            progress = Math.max(progress, 15); 
          }

          // Parse Custom Progress Logger percentage (Search in reverse for latest)
          let parsedPct = 0;
          let hasProgress = false;
          for (let k = newMsgs.length - 1; k >= 0; k--) {
            const m = newMsgs[k].toLowerCase().match(/\[progress\]\s*(\d+)%/);
            if (m) {
              parsedPct = parseInt(m[1], 10);
              hasProgress = true;
              break;
            }
          }

          if (hasProgress) {
            // Map 0-100% rendering onto 75-99% total bar
            progress = Math.min(75 + Math.floor(parsedPct * 0.24), 99);
          } else {
            if (data.status === 'running' && progress < 95) progress = Math.min(progress + 0.3, 95);
          }

          if (data.status === 'done') { progress = 100; eta = 0; }
          
          return {
            ...j,
            status: data.status || j.status,
            messages: newMsgs,
            progress,
            eta: eta !== null && eta > 0 ? eta - 1.5 : eta,
          };
        }));
        
        if (data.status === 'done' || data.status === 'error' || data.status === 'cancelled') {
          clearInterval(pollRef.current[job_id]);
          delete pollRef.current[job_id];
        }
      } catch {}
    }, 1500);
  };

  const toggleTrend = (idx: number) => {
    setSelectedTrends(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const addJobsToQueue = async (items: {topic: string; format: string; orientation: string}[]) => {
    try {
      // Loop through items since 5005 /api/generate is single-job
      for (const item of items) {
        const res = await fetch('http://localhost:5005/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: item.topic,
            params: { ...item, category: 'Trend', style: 'Cinematic' }
          })
        });
        const data = await res.json();
        if (data.ok) {
          const newJob: Job = {
            job_id: data.job_id,
            topic: item.topic,
            format: item.format,
            status: 'pending',
            messages: [],
            progress: 0,
            eta: item.format === 'short' ? 120 : 480,
          };
          setJobs(prev => [newJob, ...prev]);
          startPolling(data.job_id);
        }
      }
    } catch (e: any) {
      console.error('Queue error:', e);
      alert('서버 오류: ' + (e.message || '알 수 없는 오류') + ' (백엔드 터미널이 켜져인지 확인하세요!)');
    }
  };

  const handleAddSelected = () => {
    if (selectedTrends.size === 0) return;
    const items = Array.from(selectedTrends).map(idx => ({
      topic: `"${trends[idx].hook}" - ${trends[idx].topic}`,
      format,
      orientation: format === 'short' ? 'portrait' : 'landscape'
    }));
    addJobsToQueue(items);
    setSelectedTrends(new Set());
  };

  const handleManualAdd = () => {
    if (!manualTopic.trim()) return;
    addJobsToQueue([{ topic: manualTopic, format, orientation: format === 'short' ? 'portrait' : 'landscape' }]);
    setManualTopic('');
  };

  const statusColor = (s: string) => {
    if (s === 'done') return '#10b981';
    if (s === 'error') return '#ef4444';
    if (s === 'running') return '#8b5cf6';
    if (s === 'cancelled') return '#94a3b8';
    return '#64748b';
  };
  const statusLabel = (s: string) => {
    if (s === 'done') return '✅ 완료';
    if (s === 'error') return '❌ 실패';
    if (s === 'cancelled') return '⏹️ 취소됨';
    if (s === 'running') return '⚙️ 렌더링 중';
    return '⏳ 대기 중';
  };
  const formatETA = (s: number | null) => {
    if (s === null) return '--';
    if (s <= 0) return '마무리 중...';
    return `${Math.floor(s/60)}분 ${Math.round(s%60)}초`;
  };

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [jobs]);

  const runningCount = jobs.filter(j => j.status === 'running').length;
  const pendingCount = jobs.filter(j => j.status === 'pending').length;
  const doneCount = jobs.filter(j => j.status === 'done').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', padding: '8px', borderRadius: '12px' }}>
            <TrendingUp size={24} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            Antigravity <span style={{ fontWeight: 300, color: 'var(--text-secondary)' }}>Zero-Cost Studio</span>
          </h1>
        </div>
        {jobs.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
            {runningCount > 0 && <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '4px 12px', borderRadius: '20px' }}>⚙️ 렌더링 {runningCount}개</span>}
            {pendingCount > 0 && <span style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', padding: '4px 12px', borderRadius: '20px' }}>⏳ 대기 {pendingCount}개</span>}
            {doneCount > 0 && <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 12px', borderRadius: '20px' }}>✅ 완료 {doneCount}개</span>}
          </div>
        )}
        <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', width: '44px', height: '44px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Settings size={20} /></button>
      </header>

      <main style={{ flex: 1, padding: '2rem', display: 'flex', gap: '2rem' }}>
        {/* LEFT: Control Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
              Free Pipeline <span className="text-accent-gradient">& Auto Render</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              트렌드 카드를 여러 개 선택하여 배치 렌더링 큐에 추가하세요.
            </p>

            {/* Format Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
              <button onClick={() => setFormat('short')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: format === 'short' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: format === 'short' ? 700 : 400, transition: 'all 0.2s' }}>
                Shorts (9:16)
              </button>
              <button onClick={() => setFormat('longform')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: format === 'longform' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: format === 'longform' ? 700 : 400, transition: 'all 0.2s' }}>
                Long-form (16:9)
              </button>
            </div>

            {/* Manual Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
              <input type="text" value={manualTopic} onChange={e => setManualTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleManualAdd()} placeholder="직접 주제 입력 후 Enter 또는 버튼 클릭..." style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem', outline: 'none' }} />
              <button onClick={handleManualAdd} disabled={!manualTopic.trim()} style={{ padding: '12px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={18} /> 큐 추가
              </button>
            </div>

            {/* Bulk Add Button */}
            {selectedTrends.size > 0 && (
              <button onClick={handleAddSelected} style={{ width: '100%', padding: '14px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>
                <ListOrdered size={20} /> 선택한 트렌드 {selectedTrends.size}개 배치 렌더링 시작!
              </button>
            )}

            {/* Trend Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔥 오늘의 HOT 트렌드 <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>(체크박스 중복 선택 가능)</span>
                </h3>
                <button onClick={fetchTrends} disabled={fetchingTrends} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={13} className={fetchingTrends ? 'animate-spin' : ''} /> {fetchingTrends ? '분석 중...' : '새로고침'}
                </button>
              </div>
              {collectionDate && (
                <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> 데이터 수집 기준: {collectionDate} (오늘 기준 실시간)
                </div>
              )}
            </div>

            {fetchingTrends ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem', gap: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <Loader2 size={36} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
                
                <div style={{ textAlign: 'center', width: '100%', maxWidth: '300px' }}>
                  <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>실시간 구글 검색으로 핫이슈 스캐닝 중...</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <span>진행률: {trendProgress}%</span>
                    <span>예상 남은 시간: {trendETA}초</span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${trendProgress}%`, background: 'linear-gradient(90deg, #8b5cf6, #00e3fd)', transition: 'width 0.5s ease-out', boxShadow: '0 0 10px rgba(0, 227, 253, 0.5)' }} />
                  </div>
                </div>
              </div>
            ) : trendError ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#fca5a5', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', fontSize: '0.9rem' }}>트렌드 엔진 오류: {trendError}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                {trends.map((t, idx) => {
                  const selected = selectedTrends.has(idx);
                  return (
                    <div key={idx} onClick={() => toggleTrend(idx)} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: selected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '10px', padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ flexShrink: 0, width: '24px', height: '24px', marginTop: '2px', color: selected ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                        {selected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 700, minWidth: '20px', marginTop: '3px' }}>{idx + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>"{t.hook}"</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>📌 {t.topic}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Job Queue Panel */}
        <div style={{ width: '420px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <ListOrdered size={18} /> 렌더링 작업 큐
              {jobs.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>총 {jobs.length}개</span>}
            </h3>

            {jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Play size={36} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <div>트렌드 카드를 선택하거나<br/>직접 주제를 입력하여 작업을 추가하세요</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.map(job => (
                  <div key={job.job_id} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem', border: `1px solid ${statusColor(job.status)}40` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColor(job.status) }}>{statusLabel(job.status)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {['pending', 'running'].includes(job.status) && (
                          <button onClick={() => handleCancel(job.job_id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}>취소</button>
                        )}
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{job.format.toUpperCase()} • #{job.job_id}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '10px', lineHeight: 1.4 }}>{job.topic.slice(0, 60)}{job.topic.length > 60 ? '...' : ''}</div>
                    
                    {/* Progress */}
                    {(job.status === 'running' || job.status === 'done') && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {job.status === 'done' ? '완료!' : `ETA: ${formatETA(job.eta)}`}</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                          <div style={{ height: '100%', width: `${job.progress}%`, background: `linear-gradient(90deg, var(--accent-secondary), ${statusColor(job.status)})`, transition: 'width 0.5s ease-out' }} />
                        </div>
                      </>
                    )}

                    {/* Last log line */}
                    {job.messages.length > 0 && job.status === 'running' && (
                      <div style={{ fontSize: '0.72rem', color: '#10b981', fontFamily: 'monospace', background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px' }}>
                        {job.messages[job.messages.length - 1]?.slice(0, 60)}
                      </div>
                    )}

                    {/* Download button */}
                    {job.status === 'done' && (
                      <a href={`http://localhost:5001/video/${job.job_id}`} target="_blank" download="final_video.mp4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', marginTop: '10px', padding: '8px', textAlign: 'center', textDecoration: 'none', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                        <Download size={14} /> 영상 다운로드
                      </a>
                    )}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html:`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
