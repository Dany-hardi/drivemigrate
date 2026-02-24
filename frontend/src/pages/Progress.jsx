import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getToken } from '../lib/api.js';

const BASE = import.meta.env.VITE_API_URL || '';

function formatBytes(b) {
  if (!b || b === 0) return '0 B';
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function Progress() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [dots, setDots] = useState('');
  const prevTransferred = useRef(0);
  const [flash, setFlash] = useState(false);

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  // Polling
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/transfer/${jobId}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.transferred !== prevTransferred.current) {
          setFlash(true);
          setTimeout(() => setFlash(false), 400);
          prevTransferred.current = data.transferred;
        }

        setJob(data);
        if (['completed', 'failed'].includes(data.status)) {
          clearInterval(poll);
          setTimeout(() => navigate(`/done/${jobId}`), 1500);
        }
      } catch {}
    }, 1200);
    return () => clearInterval(poll);
  }, [jobId]);

  const total = job?.total_files || 0;
  const done = (job?.transferred || 0) + (job?.failed || 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : job?.status === 'completed' ? 100 : 0;
  const isRunning = job?.status === 'running';
  const isPending = !job || job.status === 'pending';

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
      <div className="scan-line" />

      {/* Glow behind card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse, rgba(245,197,24,${isRunning ? 0.07 : 0.03}) 0%, transparent 70%)` }} />

      <div className="relative z-10 w-full max-w-md scale-in">

        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-['Syne'] font-black text-lg text-[#f0ede0]">
            drive<span className="text-[#f5c518]">migrate</span>
          </span>
        </div>

        {/* Animated rocket */}
        <div className="text-center mb-8">
          <div className={`text-5xl inline-block ${isRunning ? 'float' : ''}`}>
            {isPending ? '⏳' : isRunning ? '🚀' : '✅'}
          </div>
        </div>

        <h2 className="font-['Syne'] font-black text-3xl text-[#f0ede0] text-center mb-2">
          {isPending ? `Getting ready${dots}` : isRunning ? `Transferring${dots}` : 'Almost done!'}
        </h2>
        <p className="text-[#444440] text-center text-sm font-['DM_Sans'] mb-8">
          Don't close this tab. Your files are on the move.
        </p>

        {/* Main card */}
        <div className={`rounded-2xl border p-6 mb-4 transition-all duration-500
          ${isRunning ? 'border-[#f5c518]/20 bg-[#0f0f0a] shadow-[0_0_40px_rgba(245,197,24,0.06)]' : 'border-[#1e1e1e] bg-[#111]'}`}>

          {/* Status label */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {isRunning && <span className="w-2 h-2 rounded-full bg-[#f5c518] pulse-dot" />}
              <span className="font-['JetBrains_Mono'] text-xs text-[#666660]">
                {isPending ? 'QUEUED' : isRunning ? 'RUNNING' : 'FINISHING'}
              </span>
            </div>
            <span className="font-['Syne'] font-black text-[#f5c518] text-lg">{pct}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-[#0a0a0a] rounded-full overflow-hidden mb-6 border border-[#1a1a1a]">
            <div className={`h-full transition-all duration-700 ease-out ${isRunning ? 'progress-bar' : 'bg-[#f5c518]/40 rounded-full'}`}
              style={{ width: `${Math.max(pct, isRunning ? 2 : 0)}%` }} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Transferred', value: job?.transferred || 0, color: '#f5c518', flash },
              { label: 'Failed', value: job?.failed || 0, color: '#f87171', flash: false },
              { label: 'Skipped', value: job?.skipped || 0, color: '#444440', flash: false },
            ].map(s => (
              <div key={s.label} className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 transition-all duration-200
                ${s.flash ? 'border-[#f5c518]/30 scale-[1.02]' : ''}`}>
                <p className="font-['Syne'] font-black text-2xl" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[#333330] text-[10px] font-['JetBrains_Mono'] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Volume transferred */}
          {job?.bytes_transferred > 0 && (
            <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex justify-between items-center fade-in">
              <span className="font-['JetBrains_Mono'] text-[#333330] text-xs">Data moved</span>
              <span className="font-['JetBrains_Mono'] text-[#f5c518] text-sm font-bold">{formatBytes(job.bytes_transferred)}</span>
            </div>
          )}
        </div>

        {/* Job ID */}
        <p className="font-['JetBrains_Mono'] text-[10px] text-[#222220] text-center">
          JOB <span className="text-[#333330]">{jobId?.slice(0, 8)}...</span>
        </p>
      </div>
    </div>
  );
}
