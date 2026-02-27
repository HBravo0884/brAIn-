import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  generateDocSummary, parseEmailThread, extractTextFromFile,
} from '../utils/ai';
import {
  BookMarked, Plus, Mail, Search, Trash2, Eye, Tag,
  Loader2, Sparkles, FileText, ChevronDown, ChevronUp,
  X, Upload, AlertCircle, CheckCircle, Users, Calendar,
  Lightbulb, ArrowRight,
} from 'lucide-react';

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'policy',    label: 'Policy',     color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'sop',       label: 'SOP',        color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'email',     label: 'Email',      color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'reference', label: 'Reference',  color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'notes',     label: 'Notes',      color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
];

const catConfig = (cat) =>
  CATEGORIES.find(c => c.value === cat) || CATEGORIES[3];

const CategoryBadge = ({ cat, size = 'sm' }) => {
  const cfg = catConfig(cat);
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const FILTER_ALL = 'all';
const filters = [FILTER_ALL, ...CATEGORIES.map(c => c.value)];
const filterLabel = (f) => f === FILTER_ALL ? 'All' : catConfig(f).label;

// ── Document Card ─────────────────────────────────────────────────────────────
function DocCard({ doc, onView, onDelete }) {
  const date = new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isEmail = doc.type === 'email';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <CategoryBadge cat={doc.category} />
            {isEmail && <span className="text-xs text-purple-600 flex items-center gap-0.5"><Mail size={10} /> Email Thread</span>}
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{doc.title}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onView(doc)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View">
            <Eye size={14} />
          </button>
          <button onClick={() => onDelete(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {doc.summary && (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{doc.summary}</p>
      )}

      {isEmail && doc.emailMeta && (
        <div className="space-y-1">
          {doc.emailMeta.participants?.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users size={11} />
              <span className="truncate">{doc.emailMeta.participants.slice(0, 3).join(', ')}{doc.emailMeta.participants.length > 3 ? ` +${doc.emailMeta.participants.length - 3}` : ''}</span>
            </div>
          )}
          {doc.emailMeta.dateRange && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar size={11} />
              <span>{doc.emailMeta.dateRange}</span>
            </div>
          )}
        </div>
      )}

      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.tags.map((tag, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">#{tag}</span>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 mt-auto">{date}</div>
    </div>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ doc, onClose }) {
  const isEmail = doc.type === 'email';
  const [showFull, setShowFull] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <CategoryBadge cat={doc.category} />
              {isEmail && <span className="text-xs text-purple-600 flex items-center gap-1"><Mail size={11} /> Email Thread</span>}
            </div>
            <h2 className="font-bold text-gray-900 text-lg leading-snug">{doc.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {doc.summary && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Summary</p>
              <p className="text-sm text-blue-900">{doc.summary}</p>
            </div>
          )}

          {isEmail && doc.emailMeta && (
            <>
              {doc.emailMeta.participants?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Users size={12} /> Participants</p>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.emailMeta.participants.map((p, i) => (
                      <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {doc.emailMeta.dateRange && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} /> <span>{doc.emailMeta.dateRange}</span>
                </div>
              )}
              {doc.emailMeta.keyDecisions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle size={12} /> Key Decisions</p>
                  <ul className="space-y-1">
                    {doc.emailMeta.keyDecisions.map((d, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {doc.emailMeta.actionItems?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><ArrowRight size={12} /> Action Items</p>
                  <ul className="space-y-1">
                    {doc.emailMeta.actionItems.map((a, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-indigo-500 flex-shrink-0 mt-0.5">→</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {doc.content && (
            <div>
              <button
                onClick={() => setShowFull(f => !f)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700"
              >
                <FileText size={12} /> Full Content {showFull ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showFull && (
                <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-80 overflow-y-auto font-sans">
                  {doc.content}
                </pre>
              )}
              {!showFull && (
                <p className="text-xs text-gray-500 italic">{doc.content.length} characters · click to expand</p>
              )}
            </div>
          )}

          {doc.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {doc.tags.map((tag, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Document Modal ────────────────────────────────────────────────────────
function AddDocumentModal({ onSave, onClose }) {
  const [form, setForm] = useState({ title: '', category: 'reference', content: '', tags: '', summary: '' });
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [extractingFile, setExtractingFile]       = useState(false);
  const [error, setError]                         = useState('');
  const fileRef = useRef(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleFile = async (file) => {
    if (!file) return;
    setExtractingFile(true);
    setError('');
    try {
      const text = await extractTextFromFile(file);
      set('content', text);
      if (!form.title) set('title', file.name.replace(/\.[^.]+$/, ''));
    } catch (e) {
      setError(`File extraction failed: ${e.message}`);
    } finally {
      setExtractingFile(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!form.content.trim()) { setError('Add content first.'); return; }
    setGeneratingSummary(true);
    setError('');
    try {
      const summary = await generateDocSummary(form.content, form.title);
      set('summary', summary);
    } catch (e) {
      setError(`Summary generation failed: ${e.message}`);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.content.trim()) { setError('Content is required.'); return; }
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    onSave({ type: 'document', ...form, tags, summary: form.summary });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg">Add Knowledge Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Title *</label>
            <input
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="e.g. RWJF Allowable Expenses Policy"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Category</label>
            <select
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              {CATEGORIES.filter(c => c.value !== 'email').map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Content *</label>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={extractingFile}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
              >
                {extractingFile ? <><Loader2 size={11} className="animate-spin" /> Extracting…</> : <><Upload size={11} /> Upload PDF/Image</>}
              </button>
            </div>
            <textarea
              rows={8}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              placeholder="Paste policy text, SOPs, reference material…"
              value={form.content}
              onChange={e => set('content', e.target.value)}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.txt,.doc,.docx"
              className="hidden"
              onChange={e => { handleFile(e.target.files[0]); e.target.value = ''; }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Summary</label>
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary || !form.content.trim()}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
              >
                {generatingSummary ? <><Loader2 size={11} className="animate-spin" /> Generating…</> : <><Sparkles size={11} /> Generate with AI</>}
              </button>
            </div>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              placeholder="2–3 sentence summary (auto-generate or write your own)"
              value={form.summary}
              onChange={e => set('summary', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Tags</label>
            <input
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="p-card, procurement, aim-5  (comma-separated)"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Save Document
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Email Parser Modal ────────────────────────────────────────────────────────
function EmailParserModal({ onSave, onClose }) {
  const [rawText, setRawText]       = useState('');
  const [parsed, setParsed]         = useState(null);
  const [parsing, setParsing]       = useState(false);
  const [error, setError]           = useState('');
  const [title, setTitle]           = useState('');

  const handleParse = async () => {
    if (!rawText.trim()) { setError('Paste the email thread first.'); return; }
    setParsing(true);
    setError('');
    setParsed(null);
    try {
      const result = await parseEmailThread(rawText);
      setParsed(result);
      setTitle(result.subject || '');
    } catch (e) {
      setError(`Parsing failed: ${e.message}`);
    } finally {
      setParsing(false);
    }
  };

  const handleSave = () => {
    if (!parsed) return;
    onSave({
      type: 'email',
      category: 'email',
      title: title || parsed.subject || 'Email Thread',
      content: parsed.content || rawText,
      summary: parsed.summary || '',
      tags: [],
      emailMeta: {
        participants: parsed.participants || [],
        dateRange: parsed.dateRange || '',
        keyDecisions: parsed.keyDecisions || [],
        actionItems: parsed.actionItems || [],
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-purple-600" />
            <h2 className="font-bold text-gray-900 text-lg">Import Email Thread</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {!parsed ? (
            <>
              <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-purple-800">
                <p className="font-medium mb-1 flex items-center gap-1"><Lightbulb size={13} /> How to use</p>
                <p>Open your email thread in Gmail or Outlook → Select all text (Ctrl+A) → Copy (Ctrl+C) → Paste below. Claude will extract participants, decisions, and action items automatically.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Paste Email Thread *</label>
                <textarea
                  rows={12}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none font-mono"
                  placeholder="Paste the raw email thread here…"
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                />
              </div>
              <button
                onClick={handleParse}
                disabled={parsing || !rawText.trim()}
                className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {parsing ? <><Loader2 size={15} className="animate-spin" /> Parsing with AI…</> : <><Sparkles size={15} /> Parse Email Thread</>}
              </button>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-800 text-sm font-medium">
                <CheckCircle size={15} /> Email parsed successfully
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Title</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {parsed.summary && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-sm text-blue-900">{parsed.summary}</p>
                </div>
              )}

              {parsed.participants?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Users size={12} /> Participants ({parsed.participants.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.participants.map((p, i) => (
                      <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {parsed.dateRange && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} /> {parsed.dateRange}
                </div>
              )}

              {parsed.keyDecisions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle size={12} /> Key Decisions</p>
                  <ul className="space-y-1.5">
                    {parsed.keyDecisions.map((d, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsed.actionItems?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><ArrowRight size={12} /> Action Items</p>
                  <ul className="space-y-1.5">
                    {parsed.actionItems.map((a, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-indigo-500 flex-shrink-0 mt-0.5">→</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => { setParsed(null); setRawText(''); setTitle(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                ← Parse a different thread
              </button>
            </>
          )}
        </div>

        {parsed && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
            >
              Save to Knowledge Base
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const KnowledgeBase = () => {
  const { knowledgeDocs, addKnowledgeDoc, deleteKnowledgeDoc } = useApp();

  const [search, setSearch]           = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [viewDoc, setViewDoc]         = useState(null);

  // Filter + search
  const visible = knowledgeDocs.filter(doc => {
    if (activeFilter !== FILTER_ALL && doc.category !== activeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [doc.title, doc.summary, doc.content, (doc.tags || []).join(' ')]
      .join(' ').toLowerCase().includes(q);
  }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const handleSaveDoc = (doc) => {
    addKnowledgeDoc(doc);
    setShowAddModal(false);
    setShowEmailModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this knowledge document? This cannot be undone.')) {
      deleteKnowledgeDoc(id);
    }
  };

  // Stats
  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c.value] = knowledgeDocs.filter(d => d.category === c.value).length;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <BookMarked size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="text-gray-500 text-sm">Policies, SOPs, and email threads — feeding your AI assistant</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {knowledgeDocs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{knowledgeDocs.length}</div>
            <div className="text-xs text-gray-500">Total docs</div>
          </div>
          {CATEGORIES.map(c => (
            <div key={c.value} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{counts[c.value] || 0}</div>
              <div className={`text-xs font-medium inline-flex items-center px-1.5 py-0.5 rounded-full ${c.color}`}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="Search documents, policies, decisions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Mail size={15} /> Import Email
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={15} /> Add Document
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeFilter === f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {filterLabel(f)}
            {f !== FILTER_ALL && counts[f] > 0 && (
              <span className={`ml-1.5 text-xs ${activeFilter === f ? 'text-indigo-200' : 'text-gray-400'}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {knowledgeDocs.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <BookMarked size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
            Add grant policies, SOPs, or email threads. The AI assistant will automatically reference them when you ask questions.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">
              <Mail size={15} /> Import Email Thread
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              <Plus size={15} /> Add Document
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {knowledgeDocs.length > 0 && visible.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search size={32} className="mx-auto mb-3 text-gray-300" />
          <p>No documents match your search.</p>
        </div>
      )}

      {/* Document grid */}
      {visible.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              onView={setViewDoc}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* AI context banner */}
      {knowledgeDocs.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center gap-3">
          <Sparkles size={18} className="text-indigo-600 flex-shrink-0" />
          <div className="text-sm text-indigo-800">
            <span className="font-semibold">{knowledgeDocs.length} document{knowledgeDocs.length !== 1 ? 's' : ''} active in AI context.</span>
            {' '}Ask the AI assistant (bottom-right button) questions like <span className="italic">"What does the policy say about…"</span> or <span className="italic">"What did Nichelle decide about…"</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal   && <AddDocumentModal onSave={handleSaveDoc} onClose={() => setShowAddModal(false)} />}
      {showEmailModal && <EmailParserModal  onSave={handleSaveDoc} onClose={() => setShowEmailModal(false)} />}
      {viewDoc        && <ViewModal doc={viewDoc} onClose={() => setViewDoc(null)} />}
    </div>
  );
};

export default KnowledgeBase;
