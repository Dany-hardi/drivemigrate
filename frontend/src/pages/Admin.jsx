import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || '';

function formatBytes(b) {
  if (!b || b === 0) return '0 B';
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function timeAgo(ts) {
  if (!ts) return '—';
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

const STATUS_STYLE = {
  completed: 'text-[#f5c518] bg-[#f5c518]/10 border-[#f5c518]/20',
  failed:    'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/20',
  running:   'text-[#60a5fa] bg-[#60a5fa]/10 border-[#60a5fa]/20',
  pending:   'text-[#666660] bg-[#1a1a1a] border-[#222]',
};

export default function Admin() {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchStats = async (k) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/admin/stats`, {
        headers: { 'x-admin-key': k || key }
      });
      if (!res.ok) { setError('Invalid admin key'); setLoading(false); return; }
      const json = await res.json();
      setData(json);
      setAuthed(true);
    } catch {
      setError('Connection failed');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => fetchStats(), 15000);
    return () => clearInterval(t);
  }, [authed]);

  if (!authed) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6 relative">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm scale-in">
        <div className="text-center mb-8">
          <span className="font-['Syne'] font-black text-xl text-[#f0ede0]">
            drive<span className="text-[#f5c518]">migrate</span>
          </span>
          <p className="text-[#333330] text-xs font-['JetBrains_Mono'] mt-1">ADMIN CONSOLE</p>
        </div>

        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
          <p className="font-['Syne'] font-bold text-[#f0ede0] mb-4">Enter admin key</p>
          <input
            type="password" value={key} onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchStats(key)}
            placeholder="••••••••"
            className="w-full bg-[#0a0a0a] border border-[#1e1e1e] focus:border-[#f5c518]/40 rounded-lg px-4 py-3 text-[#f0ede0] placeholder-[#333330] outline-none transition-all font-['JetBrains_Mono'] text-sm mb-3"
          />
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
          <span className="font-['JetBrains_Mono'] text-[#666660] text-xs">admin</span>
        </div>
        <button onClick={() => fetchStats()} disabled={loading}
          className="text-xs font-['JetBrains_Mono'] text-[#444440] hover:text-[#f5c518] border border-[#1e1e1e] hover:border-[#f5c518]/20 rounded-lg px-3 py-1.5 transition-all">
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-8">

        <div className="mb-8 fade-up">
          <h1 className="font-['Syne'] font-black text-3xl text-[#f0ede0] mb-1">Dashboard</h1>
          <p className="text-[#333330] text-sm font-['DM_Sans']">Real-time transfer activity across all users</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total Jobs', val: stats?.totalJobs || 0, color: '#f5c518', icon: '📦' },
            { label: 'Completed', val: stats?.completedJobs || 0, color: '#4ade80', icon: '✅' },
            { label: 'Failed', val: stats?.failedJobs || 0, color: '#f87171', icon: '❌' },
            { label: 'Active', val: stats?.pendingJobs || 0, color: '#60a5fa', icon: '⚡' },
            { label: 'Files Moved', val: (stats?.totalFilesTransferred || 0).toLocaleString(), color: '#f5c518', icon: '📄' },
            { label: 'Volume', val: formatBytes(stats?.totalBytesTransferred || 0), color: '#a78bfa', icon: '💾' },
          ].map((s, i) => (
            <div key={s.label} className={`bg-[#111] border border-[#1e1e1e] rounded-xl p-4 card-glow fade-up`}
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="text-lg mb-2">{s.icon}</div>
              <p className="font-['Syne'] font-black text-xl" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[#333330] text-[10px] font-['JetBrains_Mono'] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Success rate bar */}
        {stats && stats.totalJobs > 0 && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 mb-6 fade-up stagger-2">
            <div className="flex justify-between items-center mb-3">
              <span className="font-['JetBrains_Mono'] text-[#444440] text-xs">SUCCESS RATE</span>
              <span className="font-['Syne'] font-black text-[#f5c518]">
                {stats.totalJobs > 0 ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#1a1a1a]">
              <div className="h-full progress-bar transition-all duration-1000"
                style={{ width: `${stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Jobs table */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden fade-up stagger-3">
          <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <p className="font-['Syne'] font-bold text-[#f0ede0] text-sm">Recent Transfers</p>
            <span className="font-['JetBrains_Mono'] text-[#333330] text-[10px]">last {recentJobs.length} jobs</span>
          </div>

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
                    {['Status', 'From → To', 'Files', 'Volume', 'Time'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-['JetBrains_Mono'] text-[10px] text-[#333330] tracking-[0.1em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map(job => (
                    <tr key={job.id}
                      onClick={() => setSelected(selected?.id === job.id ? null : job)}
                      className="border-b border-[#0f0f0f] hover:bg-[#141414] cursor-pointer transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`font-['JetBrains_Mono'] text-[10px] px-2 py-1 rounded border capitalize ${STATUS_STYLE[job.status] || STATUS_STYLE.pending}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[#f0ede0] text-xs font-['DM_Sans'] truncate max-w-[180px]">{job.source_email}</p>
                        <p className="text-[#333330] text-[10px] font-['JetBrains_Mono']">→ {job.dest_email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-['Syne'] font-bold text-[#f5c518] text-sm">{job.transferred || 0}</span>
                        {job.failed > 0 && <span className="text-[#f87171] text-xs ml-1 font-['JetBrains_Mono']">+{job.failed} err</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-['JetBrains_Mono'] text-[#666660] text-xs">{formatBytes(job.bytes_transferred)}</span>
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

        {/* Error detail */}
        {selected?.error_log?.length > 0 && (
          <div className="mt-4 bg-[#111] border border-red-900/30 rounded-xl p-5 fade-in">
            <p className="font-['JetBrains_Mono'] text-[#f87171] text-[10px] mb-3">ERROR LOG — {selected.id?.slice(0,8)}</p>
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
