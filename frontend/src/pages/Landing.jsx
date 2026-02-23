import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink flex flex-col overflow-x-hidden">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />

      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, #4ade80 0%, transparent 70%)' }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5">
        <span className="font-display font-bold text-base sm:text-lg tracking-tight text-light">
          drive<span className="text-accent">migrate</span>
        </span>
        <a
          href="https://github.com/Dany-hardi/drivemigrate"
          target="_blank"
          rel="noreferrer"
          className="text-muted text-sm hover:text-light transition-colors font-body flex items-center gap-1.5 border border-border hover:border-accent/30 rounded-lg px-3 py-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-8 text-center py-12 sm:py-16 fade-up">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5 mb-8 sm:mb-10">
          <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
          <span className="font-mono text-xs text-muted tracking-widest uppercase">Free in v1</span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-7xl text-light leading-[1.05] mb-5 sm:mb-6 max-w-3xl">
          Move your Drive.<br />
          <span className="text-accent">Without the headache.</span>
        </h1>

        {/* Subheadline */}
        <p className="font-body text-muted text-base sm:text-lg md:text-xl max-w-xl mb-8 sm:mb-12 leading-relaxed px-2">
          Migrate files between Google accounts in minutes — folders intact, formats preserved. No manual downloads. No data loss.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/connect')}
          className="group relative bg-accent hover:bg-green-300 text-ink font-display font-bold text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl transition-all duration-200 shadow-lg shadow-accent/20 hover:shadow-accent/40 w-full sm:w-auto max-w-xs sm:max-w-none"
        >
          Start Migration
          <span className="ml-2 group-hover:translate-x-1 inline-block transition-transform">→</span>
        </button>

        <p className="mt-5 text-xs text-muted font-mono px-4 text-center">
          Your tokens never leave your session. Nothing is stored on our servers.
        </p>

        {/* Stats row */}
        <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-6 sm:gap-10">
          {[
            { value: 'Free', label: 'No cost, ever in v1' },
            { value: '< 5min', label: 'Average migration' },
            { value: '100%', label: 'Structure preserved' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-display font-bold text-2xl sm:text-3xl text-accent">{s.value}</p>
              <p className="font-body text-muted text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Features strip */}
      <div className="relative z-10 border-t border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {[
            { icon: '📁', label: 'Folder structure', desc: 'Preserved exactly as-is' },
            { icon: '📄', label: 'Google Docs', desc: 'Exported to Office format' },
            { icon: '✅', label: 'Selective migration', desc: 'Pick exactly what to move' },
          ].map(f => (
            <div key={f.label} className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-2 px-6 sm:px-8 py-5 sm:py-6 sm:text-center">
              <span className="text-2xl flex-shrink-0">{f.icon}</span>
              <div className="sm:text-center">
                <p className="font-display font-semibold text-light text-sm">{f.label}</p>
                <p className="font-body text-muted text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
