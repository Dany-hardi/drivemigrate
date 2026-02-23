import React, { useState, useEffect, useCallback } from 'react';
import { Folder, File, ChevronRight, Check, Loader2, RefreshCw } from 'lucide-react';
import { listFiles } from '../services/api';

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const GOOGLE_DOC_MIMES = [
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.form',
  'application/vnd.google-apps.drawing',
];

function formatBytes(bytes) {
  if (!bytes) return '';
  const n = parseInt(bytes);
  if (n > 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n > 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n > 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${n} B`;
}

function fileIcon(mimeType) {
  if (mimeType === FOLDER_MIME) return <Folder size={15} className="text-accent flex-shrink-0" />;
  if (GOOGLE_DOC_MIMES.includes(mimeType)) return <File size={15} className="text-green-600 flex-shrink-0" />;
  return <File size={15} className="text-stone flex-shrink-0" />;
}

function FileRow({ file, selected, onToggle, onExpand }) {
  const isFolder = file.mimeType === FOLDER_MIME;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors group ${
        selected ? 'bg-accent-light' : 'hover:bg-mist/60'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(file)}
        className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${
          selected
            ? 'bg-accent border-accent text-white'
            : 'border-stone/40 hover:border-accent'
        }`}
      >
        {selected && <Check size={11} strokeWidth={3} />}
      </button>

      {/* Icon */}
      {fileIcon(file.mimeType)}

      {/* Name */}
      <span className={`flex-1 text-sm font-body truncate ${selected ? 'text-ink font-medium' : 'text-ink'}`}>
        {file.name}
      </span>

      {/* Size */}
      {file.size && (
        <span className="text-xs text-stone font-mono flex-shrink-0">{formatBytes(file.size)}</span>
      )}

      {/* Expand folder */}
      {isFolder && (
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(file); }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-mist transition-all"
          title="Browse folder"
        >
          <ChevronRight size={14} className="text-stone" />
        </button>
      )}
    </div>
  );
}

export default function FileBrowser({ selected, onSelectionChange }) {
  const [folderStack, setFolderStack] = useState([{ id: 'root', name: 'My Drive' }]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentFolder = folderStack[folderStack.length - 1];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFiles('source', currentFolder.id);
      setFiles(data.files || []);
    } catch (err) {
      setError('Failed to load files. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [currentFolder.id]);

  useEffect(() => { load(); }, [load]);

  const toggleItem = (file) => {
    const exists = selected.find(s => s.id === file.id);
    if (exists) {
      onSelectionChange(selected.filter(s => s.id !== file.id));
    } else {
      onSelectionChange([...selected, file]);
    }
  };

  const selectAll = () => {
    const newSelected = [...selected];
    for (const file of files) {
      if (!newSelected.find(s => s.id === file.id)) {
        newSelected.push(file);
      }
    }
    onSelectionChange(newSelected);
  };

  const deselectAll = () => {
    const currentIds = new Set(files.map(f => f.id));
    onSelectionChange(selected.filter(s => !currentIds.has(s.id)));
  };

  const allSelected = files.length > 0 && files.every(f => selected.find(s => s.id === f.id));

  const navigateTo = (folder) => {
    setFolderStack(prev => [...prev, folder]);
  };

  const navigateBreadcrumb = (index) => {
    setFolderStack(prev => prev.slice(0, index + 1));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-mist text-sm overflow-x-auto">
        {folderStack.map((folder, i) => (
          <React.Fragment key={folder.id}>
            <button
              onClick={() => navigateBreadcrumb(i)}
              className={`whitespace-nowrap hover:text-accent transition-colors ${
                i === folderStack.length - 1 ? 'font-semibold text-ink' : 'text-stone'
              }`}
            >
              {folder.name}
            </button>
            {i < folderStack.length - 1 && (
              <ChevronRight size={14} className="text-mist flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-mist">
        <div className="flex gap-3 text-xs font-mono text-stone">
          <button onClick={selectAll} className="hover:text-ink transition-colors">Select all</button>
          <span>·</span>
          <button onClick={deselectAll} className="hover:text-ink transition-colors">Deselect all</button>
        </div>
        <button onClick={load} className="p-1.5 rounded hover:bg-mist transition-colors">
          <RefreshCw size={13} className={`text-stone ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Files list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={20} className="text-stone animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-sm text-danger">{error}</p>
            <button onClick={load} className="text-xs text-stone hover:text-ink underline">Retry</button>
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-stone">
            This folder is empty
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {files.map(file => (
              <FileRow
                key={file.id}
                file={file}
                selected={!!selected.find(s => s.id === file.id)}
                onToggle={toggleItem}
                onExpand={navigateTo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
