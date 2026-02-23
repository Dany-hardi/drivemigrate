import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';

function AccountCard({ type, account, onConnect, onDisconnect, loading }) {
  const label = type === 'source' ? 'Source Account' : 'Destination Account';
  const hint = type === 'source' ? 'The account you want to migrate FROM' : 'The account you want to migrate TO';

  return (
    <div className={`rounded-2xl border p-6 transition-all duration-300 ${account ? 'border-accent/40 bg-accent/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-2.5 h-2.5 rounded-full ${account ? 'bg-accent' : 'bg-muted'}`} />
        <div>
          <p className="font-display font-semibold text-light text-sm">{label}</p>
          <p className="font-body text-muted text-xs">{hint}</p>
        </div>
      </div>

      {account ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {account.picture && (
              <img src={account.picture} alt="" className="w-9 h-9 rounded-full border border-border" />
            )}
            <div>
              <p className="font-body text-light text-sm font-medium">{account.name}</p>
              <p className="font-mono text-muted text-xs">{account.email}</p>
            </div>
          </div>
          <button onClick={() => onDisconnect(type)}
            className="text-xs text-muted hover:text-red-400 transition-colors font-mono border border-border hover:border-red-400/30 px-3 py-1.5 rounded-lg">
            Remove
          </button>
        </div>
      ) : (
        <button
          onClick={() => onConnect(type)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-surface hover:bg-card border border-border hover:border-accent/40 text-light font-body font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          <GoogleIcon />
          Connect with Google
        </button>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Connect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState({ source: null, dest: null });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const status = await api.getAuthStatus();
      setAccounts(status);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    fetchStatus();
  }, [searchParams.get('connected')]); // refetch when redirect returns

  const handleConnect = async (type) => {
    setLoading(true);
    try {
      const { url } = await api.connectAccount(type);
      window.location.href = url;
    } catch (e) {
      alert(e.message);
      setLoading(false);
    }
  };

  const handleDisconnect = async (type) => {
    await api.disconnectAccount(type);
    fetchStatus();
  };

  const canProceed = accounts.source && accounts.dest;

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <span onClick={() => navigate('/')} className="font-display font-bold text-lg tracking-tight text-light cursor-pointer">
          drive<span className="text-accent">migrate</span>
        </span>
        <StepIndicator current={1} />
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 fade-up">
        <div className="w-full max-w-lg">
          <h2 className="font-display font-bold text-3xl text-light mb-2">Connect your accounts</h2>
          <p className="font-body text-muted mb-10">Link both Google accounts to begin the migration.</p>

          <div className="space-y-4 mb-10">
            <AccountCard type="source" account={accounts.source} onConnect={handleConnect} onDisconnect={handleDisconnect} loading={loading} />
            
            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full border border-border bg-surface flex items-center justify-center text-muted text-sm">↓</div>
            </div>

            <AccountCard type="dest" account={accounts.dest} onConnect={handleConnect} onDisconnect={handleDisconnect} loading={loading} />
          </div>

          <button
            onClick={() => navigate('/select')}
            disabled={!canProceed}
            className="w-full bg-accent hover:bg-green-300 disabled:bg-surface disabled:text-muted disabled:border disabled:border-border text-ink font-display font-bold py-4 rounded-xl transition-all duration-200 text-lg"
          >
            {canProceed ? 'Choose what to migrate →' : 'Connect both accounts to continue'}
          </button>
        </div>
      </main>
    </div>
  );
}

function StepIndicator({ current }) {
  const steps = ['Connect', 'Select', 'Migrate'];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 ${i + 1 === current ? 'text-accent' : i + 1 < current ? 'text-muted' : 'text-border'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono border ${i + 1 === current ? 'border-accent text-accent' : i + 1 < current ? 'border-muted bg-muted text-ink' : 'border-border text-border'}`}>
              {i + 1 < current ? '✓' : i + 1}
            </span>
            <span className="font-body text-sm hidden md:block">{s}</span>
          </div>
          {i < steps.length - 1 && <span className="text-border font-mono text-xs">—</span>}
        </div>
      ))}
    </div>
  );
}
