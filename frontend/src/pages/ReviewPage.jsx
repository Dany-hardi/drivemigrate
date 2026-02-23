import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Folder, File, AlertTriangle, ChevronLeft, Loader2 } from 'lucide-react';
import { AccountContext } from '../App';
import { startTransfer } from '../services/api';

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const GOOGLE_EXPORT_MIMES = [
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.form',
  'application/vnd.google-apps.drawing',
];

function mimeLabel(mimeType) {
  const map = {
    'application/vnd.google-apps.document': 'Google Doc → .docx',
    'application/vnd.google-apps.spreadsheet': 'Google Sheet → .xlsx',
    'application/vnd.google-apps.presentation': 'Google Slides → .pptx',
    'application/vnd.google-apps.form': 'Google Form → .pdf',
    'application/vnd.google-apps.drawing': 'Google Drawing → .png',
    'application/vnd.google-apps.folder': 'Folder',
  };
  return map[mimeType] || mimeType.split('/').pop();
}

export default function ReviewPage() {
  const { accounts } = useContext(AccountContext);
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('selectedItems');
    if (!raw) { navigate('/select'); return; }
    setSelectedItems(JSON.parse(raw));
  }, []);

  if (!accounts.source || !accounts.destination) {
    navigate('/connect');
    return null;
  }

  const folders = selectedItems.filter(s => s.mimeType === FOLDER_MIME);
  const files = selectedItems.filter(s => s.mimeType !== FOLDER_MIME);
  const googleNativeFiles = files.filter(f => GOOGLE_EXPORT_MIMES.includes(f.mimeType));
  const hasConversions = googleNativeFiles.length > 0;

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const { jobId } = await startTransfer(selectedItems);
      sessionStorage.removeItem('selectedItems');
      navigate(`/progress/${jobId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start migration. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-mist">
        <button onClick={() => navigate('/')} className="font-display font-bold text-xl tracking-tight hover:text-stone transition-colors">
          DriveMigrate
        </button>
        <div className="flex items-center gap-2 text-sm font-mono text-stone">
          <span className="w-5 h-5 rounded-full bg-mist text-stone text-xs flex items-center justify-center">✓</span>
          Connect
          <span className="mx-2 text-mist">→</span>
          <span className="w-5 h-5 rounded-full bg-mist text-stone text-xs flex items-center justify-center">✓</span>
          Select
          <span className="mx-2 text-mist">→</span>
          <span className="w-5 h-5 rounded-full bg-ink text-paper text-xs flex items-center justify-center font-bold">3</span>
          Review
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <button
            onClick={() => navigate('/select')}
            className="flex items-center gap-1.5 text-sm text-stone hover:text-ink transition-colors mb-8 group"
          >
            <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to selection
          </button>

          <div className="opacity-0 animate-fade-up mb-8">
            <h1 className="font-display font-bold text-4xl text-ink mb-2">Review migration</h1>
            <p className="text-stone font-light">Double-check everything before we start.</p>
          </div>

          {/* Transfer summary card */}
          <div className="opacity-0 animate-fade-up animate-delay-100 rounded-2xl border border-mist bg-white/50 p-6 mb-4">
            <div className="flex items-start gap-4 pb-5 mb-5 border-b border-mist">
              <div className="flex-1">
                <p className="text-xs font-mono text-stone uppercase tracking-widest mb-1">From</p>
                <div className="flex items-center gap-2">
                  {accounts.source.picture && <img src={accounts.source.picture} className="w-7 h-7 rounded-full" alt="" />}
                  <div>
                    <p className="font-semibold text-sm text-ink">{accounts.source.name}</p>
                    <p className="text-xs text-stone font-mono">{accounts.source.email}</p>
                  </div>
                </div>
              </div>
              <ArrowRight size={18} className="text-stone mt-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-mono text-stone uppercase tracking-widest mb-1">To</p>
                <div className="flex items-center gap-2">
                  {accounts.destination.picture && <img src={accounts.destination.picture} className="w-7 h-7 rounded-full" alt="" />}
                  <div>
                    <p className="font-semibold text-sm text-ink">{accounts.destination.name}</p>
                    <p className="text-xs text-stone font-mono">{accounts.destination.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-mist/40 rounded-xl p-4">
                <p className="text-3xl font-display font-bold text-ink">{selectedItems.length}</p>
                <p className="text-sm text-stone mt-1">items selected</p>
              </div>
              <div className="bg-mist/40 rounded-xl p-4">
                <p className="text-3xl font-display font-bold text-ink">{folders.length}</p>
                <p className="text-sm text-stone mt-1">folder{folders.length !== 1 ? 's' : ''} (recursive)</p>
              </div>
            </div>
          </div>

          {/* Items list */}
          <div className="opacity-0 animate-fade-up animate-delay-200 rounded-2xl border border-mist bg-white/50 p-4 mb-4 max-h-52 overflow-y-auto">
            <div className="flex flex-col gap-1">
              {selectedItems.map(item => (
                <div key={item.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-mist/40 transition-colors">
                  {item.mimeType === FOLDER_MIME
                    ? <Folder size={14} className="text-accent flex-shrink-0" />
                    : <File size={14} className="text-stone flex-shrink-0" />
                  }
                  <span className="flex-1 text-sm text-ink truncate">{item.name}</span>
                  <span className="text-xs text-stone/60 font-mono flex-shrink-0">{mimeLabel(item.mimeType)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion warning */}
          {hasConversions && (
            <div className="opacity-0 animate-fade-up animate-delay-200 flex gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200 mb-4">
              <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">{googleNativeFiles.length} Google Workspace file{googleNativeFiles.length !== 1 ? 's' : ''}</span> will be converted to Office format (Docs → .docx, Sheets → .xlsx, Slides → .pptx). Minor formatting differences may occur.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="opacity-0 animate-fade-up animate-delay-300">
            <button
              onClick={handleStart}
              disabled={loading || selectedItems.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-ink text-paper py-4 rounded-xl font-display font-semibold text-base hover:bg-stone transition-colors group disabled:bg-mist disabled:text-stone disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Starting migration…
                </>
              ) : (
                <>
                  Start migration
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
