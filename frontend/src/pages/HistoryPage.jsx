import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Clock, ArrowRight, Plus } from 'lucide-react';
import { listJobs } from '../services/api';

const STATUS_ICONS = {
  completed: <CheckCircle2 size={15} className="text-success" />,
  failed: <XCircle size={15} className="text-danger" />,
  running: <Loader2 size={15} className="text-accent animate-spin" />,
  pending: <Clock size={15} className="text-stone" />,
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const n = parseInt(bytes);
  if (n > 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n > 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  return `${(n / 1e3).toFixed(0)} KB`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobs()
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-mist">
        <button onClick={() => navigate('/')} className="font-display font-bold text-xl tracking-tight hover:text-stone transition-colors">
          DriveMigrate
        </button>
        <button
          onClick={() => navigate('/connect')}
          className="flex items-center gap-1.5 bg-ink text-paper px-4 py-2 rounded-lg text-sm font-display font-semibold hover:bg-stone transition-colors"
        >
          <Plus size={14} />
          New migration
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="opacity-0 animate-fade-up mb-8">
            <h1 className="font-display font-bold text-4xl text-ink mb-1">Migration history</h1>
            <p className="text-stone font-light">All jobs tied to your current session.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-stone" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-stone mb-4">No migrations yet.</p>
              <button
                onClick={() => navigate('/connect')}
                className="flex items-center gap-2 bg-ink text-paper px-6 py-3 rounded-xl font-display font-semibold text-sm hover:bg-stone transition-colors"
              >
                Start your first migration <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {jobs.map((job, i) => (
                <button
                  key={job.id}
                  onClick={() => navigate(`/progress/${job.id}`)}
                  className="opacity-0 animate-fade-up text-left rounded-2xl border border-mist bg-white/40 hover:bg-white/70 hover:border-stone/40 p-5 transition-all group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {STATUS_ICONS[job.status] || STATUS_ICONS.pending}
                      <span className="font-display font-semibold text-sm text-ink capitalize">{job.status}</span>
                    </div>
                    <span className="text-xs text-stone font-mono">{timeAgo(job.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone font-mono mb-3 truncate">
                    <span className="truncate">{job.source_email}</span>
                    <ArrowRight size={11} className="flex-shrink-0" />
                    <span className="truncate">{job.dest_email}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-stone">
                    <span>{job.transferred_files}/{job.total_files} files</span>
                    <span>·</span>
                    <span>{formatBytes(job.transferred_bytes)}</span>
                    {job.failed_files > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-danger">{job.failed_files} failed</span>
                      </>
                    )}
                  </div>

                  {/* Progress mini bar */}
                  {job.total_files > 0 && (
                    <div className="mt-3 h-1.5 bg-mist rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${job.status === 'completed' ? 'bg-success' : job.status === 'failed' ? 'bg-danger' : 'bg-accent'}`}
                        style={{ width: `${Math.round(((job.transferred_files + job.failed_files) / job.total_files) * 100)}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
