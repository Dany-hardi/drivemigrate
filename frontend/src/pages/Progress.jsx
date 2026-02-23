import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Progress() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);

  useEffect(() => {
    const source = new EventSource(`/transfer/${jobId}/stream`);
    source.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setJob(data);
      if (['completed', 'failed'].includes(data.status)) {
        source.close();
        setTimeout(() => navigate(`/done/${jobId}`), 1200);
      }
    };
    source.onerror = () => source.close();
    return () => source.close();
  }, [jobId]);

  const total = job?.total_files || 0;
  const done = (job?.transferred || 0) + (job?.failed || 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6 fade-up">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full border-2 border-border bg-card flex items-center justify-center mx-auto mb-8">
          <span className="text-2xl">🚀</span>
        </div>

        <h2 className="font-display font-bold text-3xl text-light mb-2">Migration in progress</h2>
        <p className="font-body text-muted mb-10">Don't close this tab. Your files are being transferred.</p>

        {/* Progress bar */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="font-display font-semibold text-light text-sm">
              {job?.status === 'running' ? 'Transferring...' : job?.status === 'pending' ? 'Queued...' : 'Almost done...'}
            </span>
            <span className="font-mono text-accent text-sm">{pct}%</span>
          </div>

          <div className="w-full h-2 bg-surface rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Transferred', value: job?.transferred || 0, color: 'text-accent' },
              { label: 'Failed', value: job?.failed || 0, color: 'text-red-400' },
              { label: 'Skipped', value: job?.skipped || 0, color: 'text-muted' },
            ].map(s => (
              <div key={s.label}>
                <p className={`font-mono font-bold text-2xl ${s.color}`}>{s.value}</p>
                <p className="font-body text-muted text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="font-mono text-xs text-muted">
          Job ID: <span className="text-light">{jobId}</span>
        </p>
      </div>
    </div>
  );
}
