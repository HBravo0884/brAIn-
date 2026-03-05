import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HardDrive, FolderOpen, Upload, ExternalLink, RefreshCw,
  CheckCircle2, Loader2, ChevronDown, ChevronRight, Info, X,
  Award, Briefcase, FlaskConical, Brain, Mic, Clock, Sparkles,
  Search, FileText, AlertCircle, ChevronDown as ChevDown,
} from 'lucide-react';
import {
  DRIVE_FOLDER_DEFS,
  initializeDriveFolders,
  getStoredFolderLinks,
  uploadToFolderKey,
  getRecentUploads,
  isConfigured,
  classifyFileForFolder,
  searchDriveFiles,
} from '../utils/googleDrive';

// ── Color map ─────────────────────────────────────────────────────────────────
const COLOR_MAP = {
  green:  { border: 'border-l-green-500',  bg: 'bg-green-50 dark:bg-green-950/20',   text: 'text-green-700 dark:text-green-400',   badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  blue:   { border: 'border-l-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/20',     text: 'text-blue-700 dark:text-blue-400',     badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  teal:   { border: 'border-l-teal-500',   bg: 'bg-teal-50 dark:bg-teal-950/20',     text: 'text-teal-700 dark:text-teal-400',     badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' },
  cyan:   { border: 'border-l-cyan-500',   bg: 'bg-cyan-50 dark:bg-cyan-950/20',     text: 'text-cyan-700 dark:text-cyan-400',     badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
  indigo: { border: 'border-l-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-700 dark:text-indigo-400', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
  purple: { border: 'border-l-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  violet: { border: 'border-l-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/20', text: 'text-violet-700 dark:text-violet-400', badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
  fuchsia:{ border: 'border-l-fuchsia-500',bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/20',text:'text-fuchsia-700 dark:text-fuchsia-400',badge:'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-300' },
  orange: { border: 'border-l-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
  amber:  { border: 'border-l-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/20',   text: 'text-amber-700 dark:text-amber-400',   badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  slate:  { border: 'border-l-slate-500',  bg: 'bg-slate-50 dark:bg-slate-950/20',   text: 'text-slate-700 dark:text-slate-400',   badge: 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300' },
};

const SECTION_ICON_MAP = { Award, Briefcase, FlaskConical, Brain, Mic };

// Flat list of all child folder defs for override dropdown
const ALL_CHILD_FOLDERS = DRIVE_FOLDER_DEFS.flatMap(def =>
  (def.children || []).map(c => ({ ...c, sectionLabel: def.label }))
);

// Find a child def by key
const findDef = (key) => ALL_CHILD_FOLDERS.find(c => c.key === key) || null;

// ── Financial Naming Modal ────────────────────────────────────────────────────
function FinancialNamingModal({ file, onUpload, onSkip, onCancel }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [type, setType] = useState('PCARD');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');

  const preview = [date, 'GRT000937', vendor || 'Vendor', type,
    amount ? `$${parseFloat(amount).toFixed(2)}` : '$0.00']
    .join('__') + (file?.name?.match(/\.[^.]+$/)?.[0] || '.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Financial File Naming</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            File: <span className="font-medium text-gray-700 dark:text-gray-300">{file?.name}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Worktag</label>
              <input value="GRT000937" readOnly
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option>PCARD</option>
                <option>REQ</option>
                <option>PRF</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount ($)</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vendor</label>
              <input type="text" placeholder="e.g. Anthropic" value={vendor}
                onChange={e => setVendor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Preview filename:</p>
            <code className="text-xs text-green-800 dark:text-green-300 break-all">{preview}</code>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={() => onUpload(preview)}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            Upload with this name
          </button>
          <button onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            Skip — use original
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Smart Upload Zone ─────────────────────────────────────────────────────────
function SmartUploadZone({ onFileDrop }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileDrop(file);
  };

  return (
    <div
      className={`rounded-xl border-2 border-dashed transition-all cursor-pointer p-6 flex flex-col items-center justify-center gap-3 ${
        isDragOver
          ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30 shadow-md'
          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/10'
      }`}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-violet-500" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Smart Upload</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
        Drop any file here — AI will read the filename and content, suggest the right folder, and ask you to confirm before uploading.
      </p>
      <input ref={fileInputRef} type="file" className="hidden" onChange={e => {
        const f = e.target.files?.[0];
        if (f) onFileDrop(f);
        e.target.value = '';
      }} />
    </div>
  );
}

// ── AI Classification Result Panel ────────────────────────────────────────────
function ClassificationPanel({ file, onConfirm, onCancel }) {
  const [status, setStatus] = useState('classifying'); // classifying | done | error
  const [suggestion, setSuggestion] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showOverride, setShowOverride] = useState(false);

  useEffect(() => {
    classifyFileForFolder(file)
      .then(result => {
        if (!result) { setStatus('error'); setErrorMsg('AI could not determine a folder.'); return; }
        setSuggestion(result);
        setSelectedKey(result.key);
        setStatus('done');
      })
      .catch(e => { setStatus('error'); setErrorMsg(e.message); });
  }, [file]);

  const selectedDef = findDef(selectedKey);
  const colors = selectedDef ? (COLOR_MAP[selectedDef.color] || COLOR_MAP.slate) : COLOR_MAP.slate;
  const pct = suggestion ? Math.round((suggestion.confidence || 0) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Smart Upload</h3>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            File: <span className="font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
          </p>

          {status === 'classifying' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={24} className="animate-spin text-violet-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing file…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {status === 'done' && suggestion && (
            <>
              {/* Suggested folder */}
              <div className={`rounded-xl border-l-4 ${colors.border} ${colors.bg} p-4`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Suggested folder</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    pct >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : pct >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>{pct}% confident</span>
                </div>
                <p className={`text-sm font-semibold ${colors.text}`}>{suggestion.label}</p>
                {suggestion.reason && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">"{suggestion.reason}"</p>
                )}
              </div>

              {/* Override dropdown */}
              <div>
                <button
                  onClick={() => setShowOverride(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ChevDown size={13} className={`transition-transform ${showOverride ? 'rotate-180' : ''}`} />
                  Change folder
                </button>
                {showOverride && (
                  <select
                    value={selectedKey || ''}
                    onChange={e => setSelectedKey(e.target.value)}
                    className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    {DRIVE_FOLDER_DEFS.map(def => (
                      <optgroup key={def.key} label={def.label}>
                        {def.children?.map(c => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={() => onConfirm(file, selectedKey, findDef(selectedKey))}
            disabled={status !== 'done' || !selectedKey}
            className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            Upload here
          </button>
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drive Search Panel ────────────────────────────────────────────────────────
function DriveSearchPanel({ folderIds }) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('ours'); // 'ours' | 'all'
  const [status, setStatus] = useState('idle'); // idle | searching | done | error
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);
  const initialized = Object.keys(folderIds).length > 0;

  const runSearch = async () => {
    if (!query.trim()) return;
    setStatus('searching');
    setResults([]);
    setErrorMsg('');
    try {
      const res = await searchDriveFiles(query.trim(), scope === 'ours');
      setResults(res);
      setStatus('done');
    } catch (e) {
      setErrorMsg(e.message);
      setStatus('error');
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') runSearch(); };

  const mimeIcon = (mime = '') => {
    if (mime.includes('spreadsheet') || mime.includes('excel')) return '📊';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📽️';
    if (mime.includes('pdf')) return '📄';
    if (mime.includes('text')) return '📝';
    if (mime.includes('image')) return '🖼️';
    if (mime.includes('zip') || mime.includes('archive')) return '🗜️';
    return '📎';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Search size={15} className="text-gray-400" />
        Search Drive Files
      </h2>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder='e.g. "GRT000937" or "P-Card" or "CW-08"'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={scope}
          onChange={e => setScope(e.target.value)}
          title={scope === 'ours' ? 'Search only in brAIn folders' : 'Search all of Google Drive'}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ours" disabled={!initialized}>brAIn folders{!initialized ? ' (not init)' : ''}</option>
          <option value="all">All of Drive</option>
        </select>
        <button
          onClick={runSearch}
          disabled={!query.trim() || status === 'searching'}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
        >
          {status === 'searching' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Search
        </button>
      </div>

      {/* Results */}
      {status === 'error' && (
        <div className="mt-4 flex items-start gap-2 text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {status === 'done' && results.length === 0 && (
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          No files found for "{query}"{scope === 'ours' ? ' in brAIn folders' : ''}.
        </p>
      )}

      {status === 'done' && results.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            {results.length} file{results.length !== 1 ? 's' : ''} found for "{query}"
          </p>
          <ul className="space-y-2">
            {results.map(r => (
              <li key={r.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-100 dark:border-gray-700 transition-colors">
                <span className="text-lg flex-shrink-0">{mimeIcon(r.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {r.folderLabel
                      ? <span className="text-blue-500 dark:text-blue-400">{r.folderLabel}</span>
                      : <span className="italic">Unknown folder</span>
                    }
                    {r.modifiedTime && (
                      <span className="ml-2">· {new Date(r.modifiedTime).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
                {r.webViewLink && (
                  <a href={r.webViewLink} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-400 whitespace-nowrap">
                    <ExternalLink size={12} />
                    Open
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Folder Card ───────────────────────────────────────────────────────────────
function FolderCard({ def, folderIds, onFileDrop }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const link = folderIds[def.key];
  const colors = COLOR_MAP[def.color] || COLOR_MAP.slate;

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileDrop(def.key, file, def);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileDrop(def.key, file, def);
    e.target.value = '';
  };

  useEffect(() => {
    def._setUploading = setUploading;
    def._setUploadDone = (v) => {
      setUploadDone(v);
      if (v) {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setUploadDone(false), 3000);
      }
    };
    def._setError = setError;
    return () => clearTimeout(timerRef.current);
  }, [def]);

  return (
    <div
      className={`relative rounded-xl border-l-4 border border-gray-200 dark:border-gray-700 ${colors.border} ${colors.bg} p-4 flex flex-col gap-2 min-h-[140px] transition-shadow ${isDragOver ? 'shadow-lg ring-2 ring-offset-1 ring-blue-400' : 'hover:shadow-md'}`}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className={`text-sm font-semibold ${colors.text} leading-tight`}>{def.label}</h4>
        <button title={def.description} className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <Info size={13} />
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{def.description}</p>

      {def.namingHint && (
        <div className={`text-[10px] font-mono px-2 py-1 rounded ${colors.badge} truncate`} title={def.namingHint}>
          {def.namingHint}
        </div>
      )}

      {def.accepts && (
        <div className="flex flex-wrap gap-1">
          {def.accepts.map(ext => (
            <span key={ext} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded font-mono">.{ext}</span>
          ))}
        </div>
      )}

      <div
        className={`mt-1 border-2 border-dashed rounded-lg px-3 py-2 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-600'
            : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-500'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <><Loader2 size={14} className="animate-spin" /><span className="text-xs">Uploading…</span></>
        ) : uploadDone ? (
          <><CheckCircle2 size={14} className="text-green-500" /><span className="text-xs text-green-600">Uploaded!</span></>
        ) : (
          <><Upload size={14} /><span className="text-xs">Drop or click</span></>
        )}
      </div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}

      {link?.webViewLink ? (
        <a href={link.webViewLink} target="_blank" rel="noopener noreferrer"
          className="mt-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
          <ExternalLink size={12} />Open in Drive
        </a>
      ) : (
        <button disabled
          className="mt-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed">
          <FolderOpen size={12} />Initialize first
        </button>
      )}
    </div>
  );
}

// ── Domain Section ────────────────────────────────────────────────────────────
function DomainSection({ def, folderIds, onFileDrop }) {
  const [open, setOpen] = useState(true);
  const Icon = SECTION_ICON_MAP[def.icon] || FolderOpen;
  const colors = COLOR_MAP[def.color] || COLOR_MAP.slate;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <Icon size={18} className={colors.text} />
        <span className="flex-1 font-semibold text-gray-900 dark:text-gray-100 text-sm">{def.label}</span>
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {def.children.map(child => (
            <FolderCard key={child.key} def={child} folderIds={folderIds} onFileDrop={onFileDrop} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Drive() {
  const [folderIds, setFolderIds] = useState(() => getStoredFolderLinks());
  const [recentUploads, setRecentUploads] = useState(() => getRecentUploads());
  const [initProgress, setInitProgress] = useState(null);
  const [initDone, setInitDone] = useState(false);
  const [initError, setInitError] = useState(null);

  // Smart upload state
  const [classifyTarget, setClassifyTarget] = useState(null); // file pending AI classification
  const [namingModal, setNamingModal] = useState(null);       // { file, folderKey, def }

  const configured = isConfigured();

  const refreshLinks = () => {
    setFolderIds(getStoredFolderLinks());
    setRecentUploads(getRecentUploads());
  };

  const handleInitialize = async () => {
    setInitError(null);
    setInitDone(false);
    setInitProgress({ done: 0, total: 14, label: 'Starting…' });
    try {
      const ids = await initializeDriveFolders(p => setInitProgress({ ...p }));
      setFolderIds(ids);
      setInitDone(true);
    } catch (e) {
      setInitError(e.message);
    } finally {
      setInitProgress(null);
    }
  };

  const doUpload = useCallback(async (folderKey, file, def, suggestedName) => {
    def._setUploading?.(true);
    def._setError?.(null);
    try {
      await uploadToFolderKey(file, folderKey, suggestedName);
      def._setUploadDone?.(true);
      setRecentUploads(getRecentUploads());
    } catch (e) {
      def._setError?.(e.message);
    } finally {
      def._setUploading?.(false);
    }
  }, []);

  // Direct drop onto a folder card (manual)
  const handleFileDrop = useCallback((folderKey, file, def) => {
    if (folderKey === 'financial') {
      setNamingModal({ file, folderKey, def });
    } else {
      doUpload(folderKey, file, def, null);
    }
  }, [doUpload]);

  // After AI classification confirmed
  const handleClassificationConfirm = useCallback((file, folderKey, def) => {
    setClassifyTarget(null);
    if (!def) return;
    if (folderKey === 'financial') {
      setNamingModal({ file, folderKey, def });
    } else {
      doUpload(folderKey, file, def, null);
    }
  }, [doUpload]);

  const totalFolders = DRIVE_FOLDER_DEFS.reduce((acc, d) => acc + 1 + (d.children?.length || 0), 0);
  const initializedCount = Object.keys(folderIds).length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <HardDrive size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Google Drive</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {!configured
                ? <span className="text-amber-600 dark:text-amber-400">Google Client ID not configured — go to Settings → Google Drive</span>
                : initializedCount > 0
                  ? <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-green-500" />{initializedCount} of {totalFolders} folders initialized</span>
                  : 'Drive connected — initialize folders to enable uploads'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={refreshLinks} title="Refresh cached folder links"
            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg transition-colors">
            <RefreshCw size={16} />
          </button>
          {folderIds['brain_root']?.webViewLink && (
            <a href={folderIds['brain_root'].webViewLink}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ExternalLink size={14} />Open brAIn Folder
            </a>
          )}
          <button onClick={handleInitialize} disabled={!configured || !!initProgress}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors">
            {initProgress
              ? <><Loader2 size={15} className="animate-spin" />Initializing…</>
              : <><FolderOpen size={15} />Initialize Folders</>
            }
          </button>
        </div>
      </div>

      {/* ── Init progress ── */}
      {initProgress && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700 dark:text-green-400">{initProgress.label}</span>
            <span className="text-xs text-green-600 dark:text-green-500">{initProgress.done}/{initProgress.total}</span>
          </div>
          <div className="w-full bg-green-100 dark:bg-green-900/40 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${initProgress.total ? (initProgress.done / initProgress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      {initDone && !initProgress && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 size={16} />{totalFolders} folders ready in Google Drive.
        </div>
      )}
      {initError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          <X size={16} className="flex-shrink-0" />{initError}
        </div>
      )}

      {/* ── Smart Upload + Search (two-column on desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SmartUploadZone onFileDrop={file => setClassifyTarget(file)} />
        <DriveSearchPanel folderIds={folderIds} />
      </div>

      {/* ── Domain Sections ── */}
      <div className="space-y-4">
        {DRIVE_FOLDER_DEFS.map(def => (
          <DomainSection key={def.key} def={def} folderIds={folderIds} onFileDrop={handleFileDrop} />
        ))}
      </div>

      {/* ── Recent Uploads ── */}
      {recentUploads.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock size={15} className="text-gray-400" />Recently Uploaded
          </h2>
          <ul className="space-y-2">
            {recentUploads.slice(0, 10).map((u, i) => (
              <li key={u.fileId || i} className="flex items-center gap-3 text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-xs text-gray-400 dark:text-gray-500 w-24 flex-shrink-0">{u.uploadedAt?.slice(0, 10)}</span>
                <span className="flex-1 text-gray-700 dark:text-gray-300 truncate font-medium">{u.fileName}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">→ {u.folderLabel}</span>
                {u.webViewLink && (
                  <a href={u.webViewLink} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs flex items-center gap-1 text-green-600 hover:text-green-700 dark:text-green-400 font-medium">
                    <ExternalLink size={12} />Open
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Modals ── */}
      {classifyTarget && (
        <ClassificationPanel
          file={classifyTarget}
          onConfirm={handleClassificationConfirm}
          onCancel={() => setClassifyTarget(null)}
        />
      )}
      {namingModal && (
        <FinancialNamingModal
          file={namingModal.file}
          onUpload={(suggestedName) => {
            const { folderKey, file, def } = namingModal;
            setNamingModal(null);
            doUpload(folderKey, file, def, suggestedName);
          }}
          onSkip={() => {
            const { folderKey, file, def } = namingModal;
            setNamingModal(null);
            doUpload(folderKey, file, def, null);
          }}
          onCancel={() => setNamingModal(null)}
        />
      )}
    </div>
  );
}
