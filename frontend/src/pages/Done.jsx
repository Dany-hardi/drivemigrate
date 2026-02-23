import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Done() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);

  useEffect(() => {
    api.getJobStatus(jobId).then(setJob).catch(() => navigate('/'));
  }, []);

  const hasErrors = job?.error_log?.length > 0;
  const success = job?.status === 'completed';

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6 fade-up">
      <div className="w-full max-w-lg">
        {/* Status icon */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">{success ? '✅' : '⚠️'}</div>
          <h2 className="font-display font-bold text-4xl text-light mb-2">
            {success ? 'Migration complete' : 'Migration finished with errors'}
          </h2>
          <p className="font-body text-muted">
            {success
              ? `Successfully moved your files to the destination account.`
              : `Some files could not be transferred. See the report below.`}
          </p>
        </div>

        {/* Stats */}
        {job && (
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <div className="grid grid-cols-3 gap-6 text-center mb-6">
              {[
                { label: 'Transferred', value: job.transferred, color: 'text-accent' },
                { label: 'Failed', value: job.failed, color: 'text-red-400' },
                { label: 'Skipped', value: job.skipped, color: 'text-muted' },
              ].map(s => (
                <div key={s.label}>
                  <p className={`font-mono font-extrabold text-3xl ${s.color}`}>{s.value}</p>
                  <p className="font-body text-muted text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-1 font-mono text-xs text-muted">
              <p>From: <span className="text-light">{job.source_email}</span></p>
              <p>To: <span className="text-light">{job.dest_email}</span></p>
            </div>
          </div>
        )}

        {/* Error log */}
        {hasErrors && (
          <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-5 mb-6">
            <p className="font-display font-semibold text-red-400 text-sm mb-3">Failed transfers</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {job.error_log.map((e, i) => (
                <div key={i} className="font-mono text-xs">
                  <span className="text-light">{e.file}</span>
                  <span className="text-red-400 ml-2">— {e.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate('/')}
            className="flex-1 border border-border text-muted hover:text-light hover:border-light font-body py-3.5 rounded-xl transition-all duration-200 text-sm">
            ← Start over
          </button>
          <button onClick={() => navigate('/select')}
            className="flex-1 bg-accent hover:bg-green-300 text-ink font-display font-bold py-3.5 rounded-xl transition-all duration-200">
            Migrate more →
          </button>
        </div>
      </div>
    </div>
  );
}
