import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Home, RotateCcw } from 'lucide-react';
import { getTransferJob, getTransferLogs } from '../services/api';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const n = parseInt(bytes);
  if (n > 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n > 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n > 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${n} B`;
}

function formatDuration(start, end) {
  const ms = new Date(end || new Date()) - new Date(start);
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

const STATUS_CONFIG = {
  pending:   { label: 'Queued',      color: 'text-stone',   bg: 'bg-mist',           icon: <Loader2 size={16} className="animate-spin" /> },
  running:   { label: 'Migrating…',  color: 'text-accent',  bg: 'bg-accent-light',   icon: <Loader2 size={16} className="animate-spin text-accent" /> },
  completed: { label: 'Done!',       color: 'text-success', bg: 'bg-green-50',        icon: <CheckCircle2 size={16} className="text-success" /> },
  failed:    { label: 'Failed',      color: 'text-danger',  bg: 'bg-red-50',          icon: <XCircle size={16} className="text-danger" /> },
};

export default function ProgressPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [logs, setLogs] = useState([]);
  const logsRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      const [jobData, logData] = await Promise.all([
        getTransferJob(jobId),
        getTransferLogs(jobId, 100, 0),
      ]);
      setJob(jobData);
      setLogs(logData.logs || []);

      if (['completed', 'failed'].includes(jobData.status)) {
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      console.error('Failed to fetch job data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 2000);
    return () => clearInterval(intervalRef.current);
  }, [jobId]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-stone" />
      </div>
    );
  }

  const progress = job.total_files > 0
    ? Math.round(((job.transferred_files + job.failed_files) / job.total_files) * 100)
    : 0;

  const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const isActive = ['pending', 'running'].includes(job.status);
  const isDone = job.status === 'completed';
  const isFailed = job.status === 'failed';

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-mist">
        <button onClick={() => navigate('/')} className="font-display font-bold text-xl tracking-tight hover:text-stone transition-colors">
          DriveMigrate
        </button>
        <span className="text-xs font-mono text-stone">{jobId.slice(0, 8)}…</span>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Status header */}
          <div className="opacity-0 animate-fade-up mb-8 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusCfg.bg} mb-4`}>
              {statusCfg.icon}
              <span className={`font-mono text-sm font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
            <h1 className="font-display font-bold text-4xl text-ink">
              {isDone ? 'Migration complete' : isFailed ? 'Migration failed' : 'Migrating your files'}
            </h1>
            {isActive && (
              <p className="text-stone font-light mt-2">You can leave this page — the job runs in the background.</p>
            )}
          </div>

          {/* Progress bar */}
          <div className="opacity-0 animate-fade-up animate-delay-100 rounded-2xl border border-mist bg-white/50 p-6 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-semibold text-2xl text-ink">{progress}%</span>
              <span className="text-sm text-stone font-mono">
                {job.transferred_files} / {job.total_files} files
              </span>
            </div>
            <div className="w-full h-3 bg-mist rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDone ? 'bg-success' : isFailed ? 'bg-danger' : `bg-accent ${isActive ? 'progress-animated' : ''}`
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-display font-bold text-success">{job.transferred_files}</p>
                <p className="text-xs text-stone mt-0.5">transferred</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-danger">{job.failed_files}</p>
                <p className="text-xs text-stone mt-0.5">failed</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-ink">{formatBytes(job.transferred_bytes)}</p>
                <p className="text-xs text-stone mt-0.5">copied</p>
              </div>
            </div>

            {job.started_at && (
              <div className="mt-4 pt-4 border-t border-mist text-center">
                <span className="text-xs text-stone font-mono">
                  Duration: {formatDuration(job.started_at, job.completed_at)}
                  {isActive ? ' (running)' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Accounts */}
          <div className="opacity-0 animate-fade-up animate-delay-100 flex items-center gap-3 rounded-xl border border-mist bg-white/40 px-4 py-3 text-sm mb-4">
            <span className="font-mono text-stone truncate">{job.source_email}</span>
            <span className="text-stone flex-shrink-0">→</span>
            <span className="font-mono text-stone truncate">{job.dest_email}</span>
          </div>

          {/* Error */}
          {isFailed && job.error && (
            <div className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-4">
              <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{job.error}</p>
            </div>
          )}

          {/* Logs */}
          <div className="opacity-0 animate-fade-up animate-delay-200 rounded-2xl border border-mist bg-white/30 overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-mist flex items-center justify-between">
              <p className="font-display font-semibold text-sm text-ink">Activity log</p>
              <span className="text-xs font-mono text-stone">{logs.length} entries</span>
            </div>
            <div ref={logsRef} className="h-56 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
              {logs.length === 0 ? (
                <p className="text-stone text-center py-8">Waiting for activity…</p>
              ) : (
                [...logs].reverse().map(log => (
                  <div key={log.id} className={`flex gap-2 py-0.5 ${log.level === 'error' ? 'text-danger' : 'text-stone'}`}>
                    <span className="text-mist flex-shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                    <span className="flex-1 break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          {!isActive && (
            <div className="opacity-0 animate-fade-up animate-delay-300 flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-display font-semibold text-sm border border-mist hover:border-stone text-ink transition-colors"
              >
                <Home size={15} />
                Back to home
              </button>
              <button
                onClick={() => navigate('/connect')}
                className="flex-1 flex items-center justify-center gap-2 bg-ink text-paper py-4 rounded-xl font-display font-semibold text-sm hover:bg-stone transition-colors"
              >
                <RotateCcw size={15} />
                New migration
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
