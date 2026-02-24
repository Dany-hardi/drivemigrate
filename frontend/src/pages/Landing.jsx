import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col overflow-hidden relative">
      <div className="scan-line" />
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* Glow blobs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(245,197,24,0.07) 0%, transparent 65%)' }} />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(245,197,24,0.04) 0%, transparent 65%)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[#1a1a1a]">
        <span className="font-['Syne'] font-black text-lg tracking-tight text-[#f0ede0]">
          drive<span className="text-[#f5c518]">migrate</span>
        </span>
        <a href="https://github.com/Dany-hardi/drivemigrate" target="_blank" rel="noreferrer"
          className="flex items-center gap-2 text-[#666660] text-xs hover:text-[#f5c518] transition-colors font-['JetBrains_Mono'] border border-[#222] hover:border-[#f5c518]/30 rounded-lg px-3 py-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 border border-[#222] bg-[#111] rounded-full px-4 py-1.5 mb-10 fade-up">
          <span className="w-2 h-2 rounded-full bg-[#f5c518] pulse-dot" />
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#666660] tracking-[0.2em] uppercase">v1 · Free · Open Source</span>
        </div>

        <h1 className="font-['Syne'] font-black text-[clamp(3rem,9vw,7rem)] text-[#f0ede0] leading-[0.95] mb-6 fade-up stagger-1">
          Move your<br />
          <span className="text-[#f5c518]">Google Drive.</span><br />
          Without the<br />headache.
        </h1>

        <p className="font-['DM_Sans'] text-[#666660] text-base sm:text-lg max-w-md mb-10 leading-relaxed fade-up stagger-2">
          Migrate files between Google accounts in minutes — folders intact, formats preserved. No manual downloads.
        </p>

        <button onClick={() => navigate('/connect')}
          className="btn-yellow px-10 py-4 rounded-xl text-lg mb-4 fade-up stagger-3 glow-pulse">
          Start Migration →
        </button>

        <p className="font-['JetBrains_Mono'] text-[10px] text-[#444440] fade-up stagger-4">
          Tokens never leave your session · Nothing stored on our servers
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-14 fade-up stagger-5">
          {[['Free', 'Forever in v1'], ['< 5min', 'Avg migration'], ['100%', 'Structure kept']].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="font-['Syne'] font-black text-2xl text-[#f5c518]">{v}</p>
              <p className="font-['DM_Sans'] text-[#444440] text-xs mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Features */}
      <div className="relative z-10 border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#1a1a1a]">
          {[
            ['📁', 'Folder structure', 'Preserved exactly as-is'],
            ['📄', 'Google Docs', 'Exported to Office format'],
            ['✅', 'Selective migration', 'Pick exactly what to move'],
          ].map(([icon, label, desc]) => (
            <div key={label} className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-2 px-6 sm:px-8 py-5 sm:py-6 sm:text-center">
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div>
                <p className="font-['Syne'] font-bold text-[#f0ede0] text-sm">{label}</p>
                <p className="font-['DM_Sans'] text-[#444440] text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
