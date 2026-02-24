import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const FOLDER = 'application/vnd.google-apps.folder';

const MIME_ICONS = {
  [FOLDER]: '📁',
  'application/vnd.google-apps.document': '📝',
  'application/vnd.google-apps.spreadsheet': '📊',
  'application/vnd.google-apps.presentation': '📋',
  'application/pdf': '📄',
};

function getIcon(mime) {
  if (!mime) return '📄';
  if (MIME_ICONS[mime]) return MIME_ICONS[mime];
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.startsWith('audio/')) return '🎵';
  return '📄';
}

function formatBytes(b) {
  if (!b) return '';
  const n = parseInt(b);
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

function FileRow({ item, depth, selected, onToggle, expanded, onExpand, childItems, loading }) {
  const isFolder = item.mimeType === FOLDER;
  const isSelected = selected.has(item.id);

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-3 pr-4 cursor-pointer group transition-all duration-100
          ${isSelected
            ? 'bg-[#f5c518]/8 border-l-[3px] border-[#f5c518]'
            : 'hover:bg-[#141414] border-l-[3px] border-transparent'}`}
        style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: `${14 + depth * 22}px` }}
      >
        {/* Checkbox */}
        <div onClick={() => onToggle(item)}
          className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center flex-shrink-0 border transition-all duration-100 cursor-pointer
            ${isSelected ? 'bg-[#f5c518] border-[#f5c518]' : 'border-[#333330] group-hover:border-[#f5c518]/50'}`}>
          {isSelected && (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1 4.5l2.5 2.5 4-4" stroke="#080808" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Icon */}
        <span className="text-sm flex-shrink-0 w-5 text-center">
          {loading ? <span className="w-3 h-3 border border-[#f5c518]/40 border-t-[#f5c518] rounded-full animate-spin inline-block" />
            : isFolder ? (expanded ? '📂' : '📁') : getIcon(item.mimeType)}
        </span>

        {/* Name */}
        <span onClick={isFolder ? () => onExpand(item) : () => onToggle(item)}
          className={`flex-1 text-sm truncate font-['DM_Sans'] transition-colors
            ${isSelected ? 'text-[#f5c518]' : 'text-[#c0bdb0] group-hover:text-[#f0ede0]'}`}>
          {item.name}
        </span>

        {/* Size */}
        {!isFolder && item.size && (
          <span className="font-['JetBrains_Mono'] text-[#444440] text-[11px] flex-shrink-0">{formatBytes(item.size)}</span>
        )}

        {/* Expand */}
        {isFolder && (
          <button onClick={() => onExpand(item)}
            className="text-[#444440] hover:text-[#f5c518] transition-colors flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs">
            {expanded ? '▾' : '▸'}
          </button>
        )}
      </div>

      {/* Children */}
      {isFolder && expanded && (
        <div className="fade-in">
          {!childItems || childItems.length === 0 ? (
            <p style={{ paddingLeft: `${36 + depth * 22}px` }} className="py-2 text-[#333330] text-xs font-['DM_Sans'] italic">empty</p>
          ) : (
            childItems.map(child => (
              <ConnectedRow key={child.id} item={child} depth={depth + 1} selected={selected} onToggle={onToggle} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ConnectedRow({ item, depth, selected, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [childItems, setChildItems] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    if (item.mimeType !== FOLDER) return;
    if (expanded) { setExpanded(false); return; }
    if (!childItems) {
      setLoading(true);
      try {
        const { files } = await api.getFolderContents(item.id);
        setChildItems(files || []);
      } catch {}
      setLoading(false);
    }
    setExpanded(true);
  };

  return <FileRow item={item} depth={depth} selected={selected} onToggle={onToggle}
    expanded={expanded} onExpand={handleExpand} childItems={childItems} loading={loading} />;
}

export default function Select() {
  const navigate = useNavigate();
  const [allFiles, setAllFiles] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showPanel, setShowPanel] = useState(true);

  useEffect(() => {
    api.getSourceFolders()
      .then(({ folders }) => setAllFiles(folders || []))
      .catch(e => { alert(e.message); navigate('/connect'); })
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = useCallback((item) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
      return next;
    });
  }, []);

  const filteredFiles = allFiles.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all'
      || (filter === 'folders' && f.mimeType === FOLDER)
      || (filter === 'files' && f.mimeType !== FOLDER);
    return matchSearch && matchFilter;
  });

  const selectedItems = allFiles
    .filter(f => selected.has(f.id))
    .map(f => ({ ...f, type: f.mimeType === FOLDER ? 'folder' : 'file' }));

  const folderCount = selectedItems.filter(i => i.type === 'folder').length;
  const fileCount = selectedItems.filter(i => i.type === 'file').length;

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
    <div className="min-h-screen bg-[#080808] flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-60" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-5 sm:px-8 py-4 nav-bar flex-shrink-0">
        <span onClick={() => navigate('/')} className="font-['Syne'] font-black text-base text-[#f0ede0] cursor-pointer hover:text-[#f5c518] transition-colors">
          drive<span className="text-[#f5c518]">migrate</span>
        </span>
        <div className="flex items-center gap-1.5 text-xs font-['JetBrains_Mono']">
          <span className="text-[#333330]">① Connect</span>
          <span className="text-[#222220] mx-1">—</span>
          <span className="text-[#f5c518] font-bold bg-[#f5c518]/10 px-2 py-0.5 rounded">② Select</span>
          <span className="text-[#222220] mx-1">—</span>
          <span className="text-[#333330]">③ Migrate</span>
        </div>
        <button onClick={() => setShowPanel(p => !p)}
          className="lg:hidden text-[#666660] hover:text-[#f5c518] transition-colors text-xs font-['JetBrains_Mono'] border border-[#222] rounded px-2 py-1">
          {showPanel ? 'Hide' : 'Summary'} {selected.size > 0 && `(${selected.size})`}
        </button>
      </nav>

      {/* Main layout */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* ─── FILE BROWSER ─────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-[#1a1a1a] slide-left stagger-1 flex-shrink-0">
            <div className="flex items-baseline gap-3 mb-1">
              <h2 className="font-['Syne'] font-black text-2xl text-[#f0ede0]">Your Google Drive</h2>
              {!loading && (
                <span className="font-['JetBrains_Mono'] text-[#444440] text-xs">
                  {allFiles.length} items
                </span>
              )}
            </div>
            <p className="text-[#444440] text-sm font-['DM_Sans']">Click to select · Click folders to expand</p>
          </div>

          {/* Toolbar */}
          <div className="px-5 py-3 border-b border-[#1a1a1a] flex items-center gap-2.5 flex-shrink-0 slide-left stagger-2">
            {/* Search */}
            <div className="flex-1 relative min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333330] text-sm">⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#111] border border-[#1e1e1e] focus:border-[#f5c518]/40 rounded-lg pl-8 pr-3 py-2 text-sm text-[#f0ede0] placeholder-[#333330] outline-none transition-all font-['DM_Sans']" />
            </div>

            {/* Filter */}
            <div className="flex border border-[#1e1e1e] rounded-lg overflow-hidden">
              {['all', 'folders', 'files'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 text-[11px] font-['JetBrains_Mono'] capitalize transition-all
                    ${filter === f ? 'bg-[#f5c518] text-[#080808] font-bold' : 'bg-[#111] text-[#444440] hover:text-[#f0ede0]'}`}>
                  {f}
                </button>
              ))}
            </div>

            <button onClick={() => setSelected(new Set(allFiles.map(f => f.id)))}
              className="text-[11px] text-[#444440] hover:text-[#f5c518] font-['JetBrains_Mono'] px-2.5 py-2 border border-[#1e1e1e] hover:border-[#f5c518]/20 rounded-lg transition-all whitespace-nowrap">
              All
            </button>
            <button onClick={() => setSelected(new Set())}
              className="text-[11px] text-[#444440] hover:text-[#f0ede0] font-['JetBrains_Mono'] px-2.5 py-2 border border-[#1e1e1e] rounded-lg transition-all">
              None
            </button>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-5 space-y-1">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ animationDelay: `${i * 0.03}s` }}>
                    <div className="w-4 h-4 rounded shimmer flex-shrink-0" />
                    <div className="w-5 h-4 rounded shimmer flex-shrink-0" />
                    <div className="h-4 rounded shimmer flex-1" />
                    <div className="h-3 w-12 rounded shimmer" />
                  </div>
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-[#333330]">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm font-['DM_Sans']">{search ? 'No matches' : 'Drive is empty'}</p>
              </div>
            ) : (
              <div className="divide-y divide-[#111111]">
                {filteredFiles.map(file => (
                  <ConnectedRow key={file.id} item={file} depth={0} selected={selected} onToggle={toggleSelect} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── SIDE PANEL ───────────────────────────────── */}
        <div className={`${showPanel ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0
          w-72 xl:w-80 border-l border-[#1a1a1a] flex flex-col bg-[#0a0a0a]
          transition-transform duration-300 absolute right-0 top-0 bottom-0 lg:relative lg:right-auto lg:top-auto lg:bottom-auto z-10`}>

          <div className="px-5 pt-5 pb-4 border-b border-[#1a1a1a] flex-shrink-0">
            <p className="font-['Syne'] font-bold text-[#f0ede0] text-sm">Summary</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Selected', val: selected.size, color: '#f5c518' },
                { label: 'Folders', val: folderCount, color: '#666660' },
                { label: 'Files', val: fileCount, color: '#666660' },
              ].map(s => (
                <div key={s.label} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 text-center">
                  <p className="font-['Syne'] font-black text-xl count-up" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[#333330] text-[10px] font-['JetBrains_Mono'] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* What's preserved */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4">
              <p className="font-['JetBrains_Mono'] text-[#f5c518]/60 text-[10px] mb-3 tracking-[0.15em]">WHAT'S PRESERVED</p>
              {['📁 Folder structure', '📝 Docs → .docx', '📊 Sheets → .xlsx', '📋 Slides → .pptx'].map(t => (
                <p key={t} className="text-[#444440] text-xs font-['DM_Sans'] py-1.5 border-b border-[#1a1a1a] last:border-0">{t}</p>
              ))}
            </div>

            {/* Selected preview */}
            {selectedItems.length > 0 && (
              <div className="fade-in">
                <p className="font-['JetBrains_Mono'] text-[#333330] text-[10px] mb-2 tracking-[0.15em]">QUEUED</p>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {selectedItems.slice(0, 15).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-[#444440] bg-[#111] rounded-lg px-3 py-2 hover:bg-[#141414] transition-colors">
                      <span className="flex-shrink-0 text-[11px]">{item.mimeType === FOLDER ? '📁' : getIcon(item.mimeType)}</span>
                      <span className="truncate font-['DM_Sans']">{item.name}</span>
                    </div>
                  ))}
                  {selectedItems.length > 15 && (
                    <p className="text-[10px] text-[#f5c518]/60 font-['JetBrains_Mono'] text-center py-1">
                      +{selectedItems.length - 15} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="p-5 border-t border-[#1a1a1a] flex-shrink-0">
            <button onClick={startMigration} disabled={!selected.size || starting}
              className={`w-full py-4 rounded-xl font-['Syne'] font-black text-base transition-all duration-200
                ${selected.size && !starting ? 'btn-yellow glow-pulse' : 'bg-[#111] text-[#333330] border border-[#1e1e1e] cursor-not-allowed'}`}>
              {starting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#080808] border-t-transparent rounded-full animate-spin" />
                  Starting...
                </span>
              ) : selected.size
                ? `Migrate ${selected.size} item${selected.size !== 1 ? 's' : ''} →`
                : 'Select to continue'}
            </button>
            <p className="text-center text-[10px] text-[#333330] mt-2 font-['JetBrains_Mono']">Large drives may take a few minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
