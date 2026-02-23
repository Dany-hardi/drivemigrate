import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const FOLDER_ICON = '📁';
const FILE_ICONS = {
  'application/vnd.google-apps.document': '📝',
  'application/vnd.google-apps.spreadsheet': '📊',
  'application/vnd.google-apps.presentation': '📋',
  'application/pdf': '📄',
  'image/': '🖼',
  'video/': '🎬',
  'audio/': '🎵',
};

function getIcon(mimeType) {
  if (!mimeType) return '📄';
  if (mimeType === 'application/vnd.google-apps.folder') return FOLDER_ICON;
  const match = Object.entries(FILE_ICONS).find(([k]) => mimeType.startsWith(k));
  return match ? match[1] : '📄';
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  const b = parseInt(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function Select() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [children, setChildren] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.getSourceFolders()
      .then(({ folders }) => setFolders(folders))
      .catch(e => { alert(e.message); navigate('/connect'); })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (folder) => {
    const id = folder.id;
    if (expanded[id]) {
      setExpanded(e => ({ ...e, [id]: false }));
      return;
    }
    if (!children[id]) {
      const { files } = await api.getFolderContents(id);
      setChildren(c => ({ ...c, [id]: files }));
    }
    setExpanded(e => ({ ...e, [id]: true }));
  };

  const toggleSelect = (item) => {
    setSelected(prev => {
      const next = new Set(prev);
      const key = item.id;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Build selectedItems array for API
  const allItems = [
    ...folders.map(f => ({ ...f, type: 'folder' })),
    ...Object.values(children).flat().map(f => ({
      ...f,
      type: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
    })),
  ];
  const selectedItems = allItems.filter(i => selected.has(i.id));

  const startMigration = async () => {
    if (!selectedItems.length) return;
    setStarting(true);
    try {
      const { jobId } = await api.startTransfer(selectedItems);
      navigate(`/progress/${jobId}`);
    } catch (e) {
      alert(e.message);
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <span onClick={() => navigate('/')} className="font-display font-bold text-lg tracking-tight text-light cursor-pointer">
          drive<span className="text-accent">migrate</span>
        </span>
        <button onClick={() => navigate('/connect')} className="text-muted text-sm font-body hover:text-light transition-colors">
          ← Back
        </button>
      </nav>

      <main className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full gap-6 px-6 py-10 fade-up">
        {/* File browser */}
        <div className="flex-1">
          <h2 className="font-display font-bold text-2xl text-light mb-1">Select what to migrate</h2>
          <p className="font-body text-muted text-sm mb-6">Browse your source Drive and pick folders or files.</p>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-card rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              {folders.length === 0 && (
                <div className="px-6 py-12 text-center text-muted font-body">No folders found in source account.</div>
              )}
              {folders.map((folder, idx) => (
                <div key={folder.id}>
                  {idx > 0 && <div className="border-t border-border" />}
                  {/* Folder row */}
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors group">
                    <input type="checkbox" checked={selected.has(folder.id)} onChange={() => toggleSelect(folder)}
                      className="accent-accent rounded w-4 h-4 flex-shrink-0" />
                    <button onClick={() => toggleExpand(folder)} className="flex items-center gap-3 flex-1 text-left">
                      <span className="text-base">{expanded[folder.id] ? '📂' : '📁'}</span>
                      <span className="font-body text-light text-sm flex-1">{folder.name}</span>
                      <span className="text-muted text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {expanded[folder.id] ? 'collapse' : 'expand'}
                      </span>
                    </button>
                  </div>

                  {/* Children */}
                  {expanded[folder.id] && children[folder.id] && (
                    <div className="bg-surface border-t border-border">
                      {children[folder.id].length === 0 && (
                        <div className="px-10 py-3 text-muted text-xs font-body">Empty folder</div>
                      )}
                      {children[folder.id].map((file, fi) => (
                        <div key={file.id}>
                          {fi > 0 && <div className="border-t border-border/50 ml-10" />}
                          <div className="flex items-center gap-3 px-4 py-2.5 pl-10 hover:bg-card/50 transition-colors">
                            <input type="checkbox" checked={selected.has(file.id)} onChange={() => toggleSelect(file)}
                              className="accent-accent rounded w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{getIcon(file.mimeType)}</span>
                            <span className="font-body text-light text-sm flex-1">{file.name}</span>
                            <span className="font-mono text-muted text-xs">{formatBytes(file.size)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="md:w-72 flex-shrink-0">
          <div className="sticky top-8 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-light mb-4 text-sm">Migration summary</h3>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-body text-muted text-sm">Selected items</span>
                <span className="font-mono text-light text-sm">{selected.size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-muted text-sm">Folders</span>
                <span className="font-mono text-light text-sm">
                  {selectedItems.filter(i => i.type === 'folder').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-muted text-sm">Files</span>
                <span className="font-mono text-light text-sm">
                  {selectedItems.filter(i => i.type === 'file').length}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-surface border border-border p-3 mb-6 text-xs font-mono text-muted space-y-1">
              <p>✓ Folder structure preserved</p>
              <p>✓ Google Docs → .docx</p>
              <p>✓ Sheets → .xlsx</p>
              <p>✓ Slides → .pptx</p>
            </div>

            <button
              onClick={startMigration}
              disabled={!selected.size || starting}
              className="w-full bg-accent hover:bg-green-300 disabled:bg-surface disabled:text-muted disabled:border disabled:border-border text-ink font-display font-bold py-3.5 rounded-xl transition-all duration-200"
            >
              {starting ? 'Starting...' : selected.size ? `Migrate ${selected.size} item${selected.size > 1 ? 's' : ''} →` : 'Select items first'}
            </button>

            <p className="mt-3 text-center text-xs text-muted font-body">This may take a while for large drives.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
