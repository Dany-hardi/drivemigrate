import React, { useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleDashed, ArrowRight, LogOut } from 'lucide-react';
import { AccountContext } from '../App';
import { getConnectUrl, disconnectAccount } from '../services/api';

function formatBytes(bytes) {
  if (!bytes) return '—';
  const gb = bytes / 1e9;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1e6).toFixed(0)} MB`;
}

function AccountCard({ role, account, onConnect, onDisconnect }) {
  const label = role === 'source' ? 'Source account' : 'Destination account';
  const sublabel = role === 'source' ? 'Files will be read from here' : 'Files will be copied here';
  const connected = !!account;

  return (
    <div className={`rounded-2xl border-2 p-6 transition-all ${connected ? 'border-ink bg-white/60' : 'border-mist bg-white/30'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-stone mb-1">{label}</p>
          <p className="text-sm text-stone font-light">{sublabel}</p>
        </div>
        {connected ? (
          <CheckCircle2 size={20} className="text-success mt-0.5 flex-shrink-0" />
        ) : (
          <CircleDashed size={20} className="text-mist mt-0.5 flex-shrink-0" />
        )}
      </div>

      {connected ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {account.picture && (
              <img src={account.picture} alt="" className="w-9 h-9 rounded-full ring-2 ring-mist" />
            )}
            <div>
              <p className="font-display font-semibold text-sm text-ink">{account.name}</p>
              <p className="text-xs text-stone font-mono">{account.email}</p>
            </div>
          </div>
          <button
            onClick={onDisconnect}
            className="p-2 rounded-lg text-stone hover:text-danger hover:bg-red-50 transition-colors"
            title="Disconnect"
          >
            <LogOut size={15} />
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="w-full flex items-center justify-center gap-2 bg-ink text-paper py-3 rounded-xl font-display font-semibold text-sm hover:bg-stone transition-colors group"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Connect with Google
        </button>
      )}
    </div>
  );
}

export default function ConnectPage() {
  const { accounts, refreshAccounts } = useContext(AccountContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Refresh after OAuth redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const role = searchParams.get('role');
    if (success && role) {
      refreshAccounts();
    }
  }, [searchParams]);

  const handleConnect = async (role) => {
    const url = await getConnectUrl(role);
    window.location.href = url;
  };

  const handleDisconnect = async (role) => {
    await disconnectAccount(role);
    await refreshAccounts();
  };

  const bothConnected = accounts.source && accounts.destination;
  const sameAccount = accounts.source?.email === accounts.destination?.email;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-mist">
        <button onClick={() => navigate('/')} className="font-display font-bold text-xl tracking-tight hover:text-stone transition-colors">
          DriveMigrate
        </button>
        <div className="flex items-center gap-2 text-sm font-mono text-stone">
          <span className="w-5 h-5 rounded-full bg-ink text-paper text-xs flex items-center justify-center font-bold">1</span>
          Connect
          <span className="mx-2 text-mist">→</span>
          <span className="w-5 h-5 rounded-full bg-mist text-stone text-xs flex items-center justify-center">2</span>
          Select
          <span className="mx-2 text-mist">→</span>
          <span className="w-5 h-5 rounded-full bg-mist text-stone text-xs flex items-center justify-center">3</span>
          Review
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          <div className="opacity-0 animate-fade-up mb-10">
            <h1 className="font-display font-bold text-4xl text-ink mb-2">Connect your accounts</h1>
            <p className="text-stone font-light">
              You'll need to authorize both accounts. We request only the Drive access we need.
            </p>
          </div>

          <div className="opacity-0 animate-fade-up animate-delay-100 flex flex-col gap-4 mb-8">
            <AccountCard
              role="source"
              account={accounts.source}
              onConnect={() => handleConnect('source')}
              onDisconnect={() => handleDisconnect('source')}
            />

            <div className="flex items-center justify-center text-stone">
              <ArrowRight size={20} />
            </div>

            <AccountCard
              role="destination"
              account={accounts.destination}
              onConnect={() => handleConnect('destination')}
              onDisconnect={() => handleDisconnect('destination')}
            />
          </div>

          {sameAccount && (
            <div className="opacity-0 animate-fade-up animate-delay-200 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm mb-6 font-body">
              ⚠️ Both accounts are the same. Please connect two different Google accounts.
            </div>
          )}

          <div className="opacity-0 animate-fade-up animate-delay-200">
            <button
              onClick={() => navigate('/select')}
              disabled={!bothConnected || sameAccount}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-display font-semibold text-base transition-all group ${
                bothConnected && !sameAccount
                  ? 'bg-ink text-paper hover:bg-stone cursor-pointer'
                  : 'bg-mist text-stone cursor-not-allowed'
              }`}
            >
              Choose files to migrate
              <ArrowRight size={16} className={bothConnected && !sameAccount ? 'group-hover:translate-x-0.5 transition-transform' : ''} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
