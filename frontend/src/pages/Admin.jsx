import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || '';

function formatBytes(b) {
  if (!b || b === 0) return '0 B';
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDuration(ms) {
  if (!ms || ms === 0) return '—';
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

function timeAgo(ts) {
  if (!ts) return '—';
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_STYLE = {
  completed: 'text-[#f5c518] bg-[#f5c518]/10 border-[#f5c518]/20',
  failed:    'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20',
  running:   'text-[#60a5fa] bg-[#60a5fa]/10 border-[#60a5fa]/20',
  pending:   'text-[#666660] bg-[#1a1a1a] border-[#222]',
};

function DurationBar({ ms, max }) {
  const pct = max > 0 ? Math.min((ms / max) * 100, 100) : 0;
  const color = ms > 120000 ? '#f87171' : ms > 60000 ? '#fbbf24' : '#f5c518';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-['JetBrains_Mono'] text-[11px] w-14 text-right flex-shrink-0"
        style={{ color }}>{formatDuration(ms)}</span>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [selected, setSelected] = useState(null);
  const [printing, setPrinting] = useState(false);

  const fetchStats = async (k) => {
    const useKey = k || savedKey;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/admin/stats`, {
        headers: { 'x-admin-key': useKey }
      });
      if (!res.ok) { setError('Invalid admin key'); setLoading(false); return; }
      const json = await res.json();
      setData(json);
      setAuthed(true);
      setSavedKey(useKey);
    } catch {
      setError('Connection failed');
    }
    setLoading(false);
  };

  const printReport = async () => {
    setPrinting(true);
    try {
      const res = await fetch(`${BASE}/admin/report`, {
        headers: { 'x-admin-key': savedKey }
      });
      const text = await res.text();
      const win = window.open('', '_blank');
      win.document.write(`
        <html><head><title>DriveMigrate Report</title>
        <style>
          body { background: #080808; color: #f0ede0; font-family: 'Courier New', monospace; padding: 40px; font-size: 13px; line-height: 1.7; }
          pre { white-space: pre-wrap; }
          @media print { body { background: white; color: black; } }
        </style></head>
        <body><pre>${text}</pre>
        <script>window.onload = () => window.print();</script>
        </body></html>
      `);
      win.document.close();
    } catch {}
    setPrinting(false);
  };

  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => fetchStats(), 15000);
    return () => clearInterval(t);
  }, [authed, savedKey]);

  // ── LOGIN ──────────────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6 relative">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm scale-in">
        <div className="text-center mb-8">
          <span className="font-['Syne'] font-black text-xl text-[#f0ede0]">
            drive<span className="text-[#f5c518]">migrate</span>
          </span>
          <p className="text-[#333330] text-[10px] font-['JetBrains_Mono'] mt-1 tracking-widest">ADMIN CONSOLE</p>
        </div>
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
          <p className="font-['Syne'] font-bold text-[#f0ede0] mb-4">Enter admin key</p>
          <input type="password" value={key} onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchStats(key)}
            placeholder="••••••••"
            className="w-full bg-[#0a0a0a] border border-[#1e1e1e] focus:border-[#f5c518]/40 rounded-lg px-4 py-3 text-[#f0ede0] placeholder-[#333330] outline-none transition-all font-['JetBrains_Mono'] text-sm mb-3" />
          {error && <p className="text-[#f87171] text-xs font-['JetBrains_Mono'] mb-3">{error}</p>}
          <button onClick={() => fetchStats(key)} disabled={loading || !key}
            className="w-full btn-yellow py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? 'Verifying...' : 'Access Dashboard →'}
          </button>
        </div>
      </div>
    </div>
  );

  const { stats, recentJobs = [] } = data || {};
  const completedJobs = recentJobs.filter(j => j.status === 'completed');
  const maxDuration = Math.max(...completedJobs.map(j => j.duration_ms || 0), 1);

  const TABS = ['overview', 'transfers', 'timing'];

  // ── DASHBOARD ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080808] relative">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="scan-line" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-4 nav-bar">
        <div className="flex items-center gap-3">
          <span onClick={() => navigate('/')} className="font-['Syne'] font-black text-base text-[#f0ede0] cursor-pointer hover:text-[#f5c518] transition-colors">
            drive<span className="text-[#f5c518]">migrate</span>
          </span>
          <span className="text-[#222]">/</span>
          <span className="font-['JetBrains_Mono'] text-[#444440] text-xs">admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={printReport} disabled={printing}
            className="text-xs font-['JetBrains_Mono'] text-[#f5c518] hover:text-[#ffd60a] border border-[#f5c518]/20 hover:border-[#f5c518]/40 rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5">
            🖨️ {printing ? 'Preparing...' : 'Print Report'}
          </button>
          <button onClick={() => fetchStats()} disabled={loading}
            className="text-xs font-['JetBrains_Mono'] text-[#444440] hover:text-[#f5c518] border border-[#1e1e1e] hover:border-[#f5c518]/20 rounded-lg px-3 py-1.5 transition-all">
            {loading ? '...' : '↻ Refresh'}
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-8">

        {/* Title */}
        <div className="mb-6 fade-up">
          <h1 className="font-['Syne'] font-black text-3xl text-[#f0ede0] mb-1">Dashboard</h1>
          <p className="text-[#333330] text-sm font-['DM_Sans']">Real-time transfer activity · auto-refreshes every 15s</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 mb-6">
          {[
            { label: 'Total', val: stats?.totalJobs || 0, color: '#f5c518', icon: '📦' },
            { label: 'Done', val: stats?.completedJobs || 0, color: '#4ade80', icon: '✅' },
            { label: 'Failed', val: stats?.failedJobs || 0, color: '#f87171', icon: '❌' },
            { label: 'Active', val: stats?.pendingJobs || 0, color: '#60a5fa', icon: '⚡' },
            { label: 'Files', val: (stats?.totalFilesTransferred || 0).toLocaleString(), color: '#f5c518', icon: '📄' },
            { label: 'Volume', val: formatBytes(stats?.totalBytesTransferred || 0), color: '#a78bfa', icon: '💾' },
            { label: 'Avg Time', val: formatDuration(stats?.avgDurationMs || 0), color: '#fbbf24', icon: '⏱️' },
          ].map((s, i) => (
            <div key={s.label} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3.5 card-glow fade-up"
              style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="text-base mb-1.5">{s.icon}</div>
              <p className="font-['Syne'] font-black text-lg leading-none" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[#333330] text-[10px] font-['JetBrains_Mono'] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Success rate */}
        {stats && stats.totalJobs > 0 && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4 mb-6 fade-up stagger-2 flex items-center gap-4">
            <span className="font-['JetBrains_Mono'] text-[#444440] text-[10px] tracking-widest flex-shrink-0">SUCCESS RATE</span>
            <div className="flex-1 h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#1a1a1a]">
              <div className="h-full progress-bar" style={{ width: `${(stats.completedJobs / stats.totalJobs) * 100}%` }} />
            </div>
            <span className="font-['Syne'] font-black text-[#f5c518] flex-shrink-0">
              {Math.round((stats.completedJobs / stats.totalJobs) * 100)}%
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#1a1a1a] mb-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 font-['JetBrains_Mono'] text-xs capitalize transition-all border-b-2 -mb-px
                ${tab === t ? 'text-[#f5c518] border-[#f5c518]' : 'text-[#444440] border-transparent hover:text-[#f0ede0]'}`}>
              {t === 'overview' ? '📊 Overview' : t === 'transfers' ? '📋 Transfers' : '⏱️ Timing'}
            </button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="bg-[#111] border border-t-0 border-[#1e1e1e] rounded-b-xl overflow-hidden fade-in">
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-[#333330]">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm font-['DM_Sans']">No transfers yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      {['Status', 'From → To', 'Files', 'Volume', 'Duration', 'Time'].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-['JetBrains_Mono'] text-[10px] text-[#333330] tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.map(job => (
                      <tr key={job.id} onClick={() => setSelected(selected?.id === job.id ? null : job)}
                        className="border-b border-[#0f0f0f] hover:bg-[#141414] cursor-pointer transition-colors">
                        <td className="px-5 py-3.5">
                          <span className={`font-['JetBrains_Mono'] text-[10px] px-2 py-1 rounded border capitalize ${STATUS_STYLE[job.status] || STATUS_STYLE.pending}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-[#f0ede0] text-xs font-['DM_Sans'] truncate max-w-[160px]">{job.source_email}</p>
                          <p className="text-[#333330] text-[10px] font-['JetBrains_Mono']">→ {job.dest_email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-['Syne'] font-bold text-[#f5c518] text-sm">{job.transferred || 0}</span>
                          {job.failed > 0 && <span className="text-[#f87171] text-xs ml-1 font-['JetBrains_Mono']">+{job.failed}err</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-['JetBrains_Mono'] text-[#666660] text-xs">{formatBytes(job.bytes_transferred)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-['JetBrains_Mono'] text-[#fbbf24] text-xs">{formatDuration(job.duration_ms)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-['JetBrains_Mono'] text-[#333330] text-[10px]">{timeAgo(job.created_at)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: TRANSFERS ── */}
        {tab === 'transfers' && (
          <div className="bg-[#111] border border-t-0 border-[#1e1e1e] rounded-b-xl p-5 fade-in space-y-3">
            {recentJobs.length === 0 ? (
              <p className="text-[#333330] text-sm text-center py-10 font-['DM_Sans']">No data yet</p>
            ) : recentJobs.map(job => (
              <div key={job.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#f5c518]/10 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded border capitalize ${STATUS_STYLE[job.status] || STATUS_STYLE.pending}`}>
                      {job.status}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[#444440] text-[10px]">{job.id?.slice(0, 8)}</span>
                  </div>
                  <span className="font-['JetBrains_Mono'] text-[#333330] text-[10px]">{timeAgo(job.created_at)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-['DM_Sans'] mb-3">
                  <p className="text-[#444440]">From <span className="text-[#f0ede0] ml-1">{job.source_email}</span></p>
                  <p className="text-[#444440]">Files <span className="text-[#f5c518] ml-1 font-bold">{job.transferred || 0}</span></p>
                  <p className="text-[#444440]">To <span className="text-[#f0ede0] ml-1">{job.dest_email}</span></p>
                  <p className="text-[#444440]">Volume <span className="text-[#a78bfa] ml-1">{formatBytes(job.bytes_transferred)}</span></p>
                </div>
                {/* Mini progress bar */}
                {job.total_files > 0 && (
                  <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#f5c518]/60"
                      style={{ width: `${Math.min(((job.transferred || 0) / job.total_files) * 100, 100)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: TIMING ── */}
        {tab === 'timing' && (
          <div className="bg-[#111] border border-t-0 border-[#1e1e1e] rounded-b-xl p-5 fade-in">
            {completedJobs.length === 0 ? (
              <p className="text-[#333330] text-sm text-center py-10 font-['DM_Sans']">No completed jobs yet</p>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Fastest', val: formatDuration(Math.min(...completedJobs.map(j => j.duration_ms || Infinity))), color: '#4ade80' },
                    { label: 'Average', val: formatDuration(stats?.avgDurationMs), color: '#f5c518' },
                    { label: 'Slowest', val: formatDuration(Math.max(...completedJobs.map(j => j.duration_ms || 0))), color: '#f87171' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 text-center">
                      <p className="font-['Syne'] font-black text-xl" style={{ color: s.color }}>{s.val}</p>
                      <p className="font-['JetBrains_Mono'] text-[#333330] text-[10px] mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Duration bars */}
                <p className="font-['JetBrains_Mono'] text-[#333330] text-[10px] tracking-widest mb-3">DURATION PER JOB</p>
                <div className="space-y-3">
                  {completedJobs.map((job, i) => (
                    <div key={job.id} className="grid grid-cols-[auto_1fr] gap-3 items-center">
                      <div className="text-right w-32 flex-shrink-0">
                        <p className="font-['JetBrains_Mono'] text-[#444440] text-[10px] truncate">{job.source_email?.split('@')[0]}</p>
                        <p className="font-['JetBrains_Mono'] text-[#222220] text-[9px]">{timeAgo(job.created_at)}</p>
                      </div>
                      <DurationBar ms={job.duration_ms || 0} max={maxDuration} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Error detail on click */}
        {selected?.error_log?.length > 0 && (
          <div className="mt-4 bg-[#111] border border-red-900/30 rounded-xl p-5 fade-in">
            <p className="font-['JetBrains_Mono'] text-[#f87171] text-[10px] mb-3 tracking-widest">ERROR LOG — {selected.id?.slice(0, 8)}</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {selected.error_log.map((e, i) => (
                <div key={i} className="font-['JetBrains_Mono'] text-[11px] flex gap-3">
                  <span className="text-[#f0ede0] truncate">{e.file}</span>
                  <span className="text-[#f87171] flex-shrink-0">— {e.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
