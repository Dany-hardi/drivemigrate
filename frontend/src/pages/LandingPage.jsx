import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderSync, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-mist">
        <span className="font-display font-800 text-xl tracking-tight">DriveMigrate</span>
        <button
          onClick={() => navigate('/history')}
          className="text-sm text-stone hover:text-ink transition-colors font-body"
        >
          Past migrations
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto w-full py-24">
        <div className="opacity-0 animate-fade-up">
          <span className="inline-block px-3 py-1 text-xs font-mono tracking-widest uppercase bg-accent-light text-accent rounded-full mb-8">
            Free during beta
          </span>
        </div>

        <h1 className="opacity-0 animate-fade-up animate-delay-100 font-display font-extrabold text-5xl md:text-7xl leading-[1.05] tracking-tight text-ink mb-6">
          Move your Drive.
          <br />
          <span className="text-stone">Not your patience.</span>
        </h1>

        <p className="opacity-0 animate-fade-up animate-delay-200 text-lg text-stone font-body font-light max-w-xl leading-relaxed mb-12">
          Migrate files and folders between Google accounts in a few clicks. No manual downloads, no zip files, no headaches.
        </p>

        <div className="opacity-0 animate-fade-up animate-delay-300 flex flex-col sm:flex-row gap-3 items-center">
          <button
            onClick={() => navigate('/connect')}
            className="flex items-center gap-2 bg-ink text-paper px-8 py-4 rounded-xl font-display font-semibold text-base hover:bg-stone transition-colors group"
          >
            Start migrating
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/history')}
            className="px-8 py-4 rounded-xl font-display font-semibold text-base border border-mist hover:border-stone text-ink transition-colors"
          >
            View past jobs
          </button>
        </div>

        {/* Features */}
        <div className="opacity-0 animate-fade-up animate-delay-400 grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 w-full text-left">
          {[
            {
              icon: <FolderSync size={20} />,
              title: 'Folder structure preserved',
              desc: 'Your file tree moves over exactly as-is, every subfolder intact.',
            },
            {
              icon: <Zap size={20} />,
              title: 'Selective migration',
              desc: 'Pick exactly what goes — specific files, folders, or everything.',
            },
            {
              icon: <Shield size={20} />,
              title: 'Secure by design',
              desc: 'OAuth only. We never store your files or read their contents.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="p-5 rounded-2xl border border-mist bg-white/40 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-lg bg-mist flex items-center justify-center text-ink mb-3">
                {icon}
              </div>
              <h3 className="font-display font-semibold text-sm text-ink mb-1">{title}</h3>
              <p className="text-sm text-stone font-light leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-mist flex items-center justify-between">
        <span className="text-xs text-stone font-mono">v1.0 — beta</span>
        <span className="text-xs text-stone">Built with Google Drive API</span>
      </footer>
    </div>
  );
}
