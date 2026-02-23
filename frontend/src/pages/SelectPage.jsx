import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, X, Folder, File } from 'lucide-react';
import { AccountContext } from '../App';
import FileBrowser from '../components/FileBrowser';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

export default function SelectPage() {
  const { accounts } = useContext(AccountContext);
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  if (!accounts.source || !accounts.destination) {
    navigate('/connect');
    return null;
  }

  const handleContinue = () => {
    sessionStorage.setItem('selectedItems', JSON.stringify(selected));
    navigate('/review');
  };

  const folders = selected.filter(s => s.mimeType === FOLDER_MIME);
  const files = selected.filter(s => s.mimeType !== FOLDER_MIME);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-mist">
        <button onClick={() => navigate('/')} className="font-display font-bold text-xl tracking-tight hover:text-stone transition-colors">
          DriveMigrate
        </button>
        <div className="flex items-center gap-2 text-sm font-mono text-stone">
          <span className="w-5 h-5 rounded-full bg-mist text-stone text-xs flex items-center justify-center">✓</span>
          Connect
          <span className="mx-2 text-mist">→</span>
          <span className="w-5 h-5 rounded-full bg-ink text-paper text-xs flex items-center justify-center font-bold">2</span>
          Select
          <span className="mx-2 text-mist">→</span>
          <span className="w-5 h-5 rounded-full bg-mist text-stone text-xs flex items-center justify-center">3</span>
          Review
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{ height: 'calc(100vh - 89px)' }}>
        {/* Left: File browser */}
        <div className="flex-1 flex flex-col border-r border-mist overflow-hidden">
          <div className="px-6 py-4 border-b border-mist">
            <h1 className="font-display font-bold text-2xl text-ink">Choose what to migrate</h1>
            <p className="text-sm text-stone mt-1 font-light">
              From <span className="font-medium text-ink font-mono">{accounts.source.email}</span>
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <FileBrowser selected={selected} onSelectionChange={setSelected} />
          </div>
        </div>

        {/* Right: Selection summary */}
        <div className="w-full md:w-80 flex flex-col border-t md:border-t-0 border-mist bg-white/30">
          <div className="px-5 py-4 border-b border-mist">
            <p className="font-display font-semibold text-sm text-ink">
              Selected ({selected.length})
            </p>
            <p className="text-xs text-stone mt-0.5">
              {folders.length} folder{folders.length !== 1 ? 's' : ''}, {files.length} file{files.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {selected.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-sm text-stone">Nothing selected yet</p>
                <p className="text-xs text-stone/60 mt-1">Use the browser on the left</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {selected.map(item => (
                  <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 group">
                    {item.mimeType === FOLDER_MIME
                      ? <Folder size={13} className="text-accent flex-shrink-0" />
                      : <File size={13} className="text-stone flex-shrink-0" />
                    }
                    <span className="flex-1 text-xs text-ink truncate">{item.name}</span>
                    <button
                      onClick={() => setSelected(sel => sel.filter(s => s.id !== item.id))}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-mist transition-all"
                    >
                      <X size={11} className="text-stone" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-mist">
            {selected.length > 0 && (
              <p className="text-xs text-stone text-center mb-3">
                Migrating to <span className="font-medium text-ink font-mono">{accounts.destination.email}</span>
              </p>
            )}
            <button
              onClick={handleContinue}
              disabled={selected.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-semibold text-sm transition-all group ${
                selected.length > 0
                  ? 'bg-ink text-paper hover:bg-stone cursor-pointer'
                  : 'bg-mist text-stone cursor-not-allowed'
              }`}
            >
              Review & confirm
              <ArrowRight size={14} className={selected.length > 0 ? 'group-hover:translate-x-0.5 transition-transform' : ''} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
