import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="font-display font-bold text-lg tracking-tight text-light">
          drive<span className="text-accent">migrate</span>
        </span>
        <a href="https://github.com" target="_blank" rel="noreferrer"
          className="text-muted text-sm hover:text-light transition-colors font-body">
          GitHub ↗
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center fade-up">
        <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5 mb-10">
          <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
          <span className="font-mono text-xs text-muted tracking-widest uppercase">Free in v1</span>
        </div>

        <h1 className="font-display font-extrabold text-5xl md:text-7xl text-light leading-[1.05] mb-6 max-w-3xl">
          Move your Drive.<br />
          <span className="text-accent">Without the headache.</span>
        </h1>

        <p className="font-body text-muted text-lg md:text-xl max-w-xl mb-12 leading-relaxed">
          Migrate files between Google accounts in minutes — folders intact, formats preserved. No manual downloads. No data loss.
        </p>

        <button
          onClick={() => navigate('/connect')}
          className="group relative bg-accent hover:bg-green-300 text-ink font-display font-bold text-lg px-10 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-accent/20 hover:shadow-accent/40"
        >
          Start Migration
          <span className="ml-2 group-hover:translate-x-1 inline-block transition-transform">→</span>
        </button>

        <p className="mt-6 text-xs text-muted font-mono">
          Your tokens never leave your session. Nothing is stored on our servers.
        </p>
      </main>

      {/* Features strip */}
      <div className="relative z-10 border-t border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-border">
          {[
            { label: 'Folder structure', desc: 'Preserved exactly as-is' },
            { label: 'Google Docs', desc: 'Exported to Office format' },
            { label: 'Selective migration', desc: 'Pick exactly what to move' },
          ].map(f => (
            <div key={f.label} className="px-8 py-6 text-center">
              <p className="font-display font-semibold text-light text-sm mb-1">{f.label}</p>
              <p className="font-body text-muted text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
