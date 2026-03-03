import { useState, useRef } from 'react';
import {
  Inbox,
  Plus,
  Sparkles,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Upload,
  X,
  ExternalLink,
  BookOpen,
  Brain,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeReplyItem, getAdvisorAdvice } from '../utils/ai';
import { useNavigate, Link } from 'react-router-dom';

const URGENCY_CONFIG = {
  urgent: { label: 'Urgent',  color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500'    },
  high:   { label: 'High',    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  medium: { label: 'Medium',  color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
  low:    { label: 'Low',     color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200',   dot: 'bg-gray-400'   },
};

const urgencyToPriority = { urgent: 'high', high: 'high', medium: 'medium', low: 'low' };

const UrgencyBadge = ({ urgency }) => {
  const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.low;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Advisor Advice panel ────────────────────────────────────────────────────
const AdvisorAdvicePanel = ({ advice }) => (
  <div className="mt-3 border border-violet-200 rounded-xl overflow-hidden">
    <div className="px-3 py-2 bg-violet-50 flex items-center gap-2">
      <Brain size={13} className="text-violet-600" />
      <span className="text-xs font-semibold text-violet-700">Advisor Advice — based on your boss profile</span>
    </div>
    <div className="p-3 space-y-2.5 bg-white">
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">What's expected</p>
        <p className="text-sm text-gray-800">{advice.expectation}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">How to approach</p>
        <p className="text-sm text-gray-800">{advice.approach}</p>
        {advice.suggestedTone && (
          <span className="inline-block mt-1 px-2 py-0.5 bg-violet-50 text-violet-600 text-xs rounded-full font-medium">
            Tone: {advice.suggestedTone}
          </span>
        )}
      </div>
      {advice.keyPoints?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Key points to include</p>
          <ul className="space-y-0.5">
            {advice.keyPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                <span className="text-violet-400 font-bold mt-0.5">→</span> {p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {advice.watchOut?.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Watch out for</p>
          <ul className="space-y-0.5">
            {advice.watchOut.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                <span className="text-amber-500 font-bold mt-0.5">!</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}
      {advice.prioritySignal && (
        <div className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">{advice.prioritySignal}</div>
      )}
    </div>
  </div>
);

// ── Single queue card ───────────────────────────────────────────────────────
const ReplyCard = ({ item, onMarkReplied, onDelete, onUpdateItem, replyContextDocs, advisorProfile }) => {
  const [expanded, setExpanded]         = useState(false);
  const [fetchingAdvice, setFetchingAdvice] = useState(false);
  const [adviceError, setAdviceError]   = useState('');
  const cfg = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.low;

  const handleGetAdvice = async () => {
    setFetchingAdvice(true);
    setAdviceError('');
    try {
      const advice = await getAdvisorAdvice(item, replyContextDocs, advisorProfile);
      onUpdateItem(item.id, { advisorAdvice: advice });
    } catch (err) {
      setAdviceError(err.message || 'Failed to get advice. Check your API key in Settings.');
    } finally {
      setFetchingAdvice(false);
    }
  };

  const hasAdvisorProfile = advisorProfile?.trim().length > 0;

  return (
    <div className={`rounded-xl border ${cfg.border} overflow-hidden`}>
      {/* header */}
      <div className={`${cfg.bg} px-4 py-3 flex items-start gap-3`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyBadge urgency={item.urgency} />
            {item.dueDate && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock size={11} /> Due {item.dueDate}
              </span>
            )}
            {item.grantWorktag && (
              <span className="text-xs font-mono bg-white/70 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                {item.grantWorktag}
              </span>
            )}
            {item.status === 'replied' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> Replied
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-gray-900 truncate">{item.subject}</p>
          {item.from && <p className="text-xs text-gray-500 truncate">From: {item.from}</p>}
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.summary}</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 hover:bg-white/60 rounded-lg text-gray-500 transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {item.status !== 'replied' && (
            <button onClick={() => onMarkReplied(item.id)} title="Mark replied"
              className="p-1.5 hover:bg-white/60 rounded-lg text-green-600 transition-colors">
              <CheckCircle2 size={15} />
            </button>
          )}
          <button onClick={() => onDelete(item.id)} title="Delete"
            className="p-1.5 hover:bg-white/60 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* expanded body */}
      {expanded && (
        <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-3">
          {/* Info checklist */}
          {item.infoNeeded?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <ListChecks size={12} /> Info to collect before replying
              </p>
              <ul className="space-y-1">
                {item.infoNeeded.map((info, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-4 h-4 mt-0.5 rounded border border-gray-300 flex-shrink-0" />
                    {info}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Advisor Advice */}
          {item.advisorAdvice ? (
            <AdvisorAdvicePanel advice={item.advisorAdvice} />
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGetAdvice}
                disabled={fetchingAdvice}
                title={!hasAdvisorProfile ? 'Add an Advisor Profile in Settings first' : 'Get advice based on your boss profile'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  hasAdvisorProfile
                    ? 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200'
                    : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                {fetchingAdvice ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                {fetchingAdvice ? 'Getting advice…' : 'Get Advisor Advice'}
              </button>
              {!hasAdvisorProfile && (
                <Link to="/settings" className="text-xs text-violet-500 hover:text-violet-700 underline">
                  Add boss profile in Settings →
                </Link>
              )}
              {adviceError && <p className="text-xs text-red-500">{adviceError}</p>}
            </div>
          )}

          {item.advisorAdvice && (
            <button
              onClick={handleGetAdvice}
              disabled={fetchingAdvice}
              className="text-xs text-gray-400 hover:text-violet-600 transition-colors flex items-center gap-1"
            >
              {fetchingAdvice ? <Loader2 size={11} className="animate-spin" /> : <Brain size={11} />}
              Refresh advice
            </button>
          )}

          {item.taskId && (
            <Link to="/workflows"
              className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium">
              <ExternalLink size={12} /> View linked Kanban task
            </Link>
          )}

          {item.rawText && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">
                Show original text
              </summary>
              <pre className="mt-2 p-2 bg-gray-50 rounded text-gray-600 whitespace-pre-wrap font-mono text-[11px] max-h-40 overflow-y-auto">
                {item.rawText}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

// ── Context Wall ────────────────────────────────────────────────────────────
const ContextWall = ({ docs, onAdd, onDelete }) => {
  const [open, setOpen]         = useState(false);
  const [addingDoc, setAddingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const fileRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setDocContent(prev => prev ? prev + '\n\n' + text : text);
    if (!docTitle) setDocTitle(file.name.replace(/\.[^.]+$/, ''));
    e.target.value = '';
  };

  const handleSave = () => {
    if (!docTitle.trim() || !docContent.trim()) return;
    onAdd({ title: docTitle.trim(), content: docContent.trim() });
    setDocTitle('');
    setDocContent('');
    setAddingDoc(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <BookOpen size={16} className="text-emerald-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-800">Context Wall</span>
          <span className="ml-2 text-xs text-gray-400">
            {docs.length} document{docs.length !== 1 ? 's' : ''} · injected automatically into every analysis
          </span>
        </div>
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          <p className="text-xs text-gray-500">
            Add email threads, org charts, policy docs, or any reference material.
            The AI reads these when analyzing new messages and when giving advisor advice — giving you more accurate, context-aware results.
          </p>

          {/* Doc list */}
          {docs.length > 0 && (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-start gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <FileText size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{doc.content}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{doc.content.length.toLocaleString()} chars · {doc.createdAt?.slice(0, 10)}</p>
                  </div>
                  <button onClick={() => onDelete(doc.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {addingDoc ? (
            <div className="space-y-2 pt-1">
              <input
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="Document title (e.g. 'Q1 Email Thread — Budget Discussion')"
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <textarea
                value={docContent}
                onChange={e => setDocContent(e.target.value)}
                placeholder="Paste email thread, document text, or policy excerpt here…"
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Upload size={11} /> Upload .txt / .md
                </button>
                <input ref={fileRef} type="file" accept=".txt,.md,text/*" className="hidden" onChange={handleFileUpload} />
                <div className="flex-1" />
                <button onClick={() => { setAddingDoc(false); setDocTitle(''); setDocContent(''); }}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!docTitle.trim() || !docContent.trim()}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Save Document
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingDoc(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <Plus size={12} /> Add Context Document
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main page ───────────────────────────────────────────────────────────────
const ReplyQueue = () => {
  const {
    replyQueue, addReplyItem, updateReplyItem, deleteReplyItem,
    replyContextDocs, addReplyContextDoc, deleteReplyContextDoc,
    addTodo, addTask, grants, settings,
  } = useApp();

  const advisorProfile = settings?.advisorProfile || '';
  const advisorSummary = settings?.advisorSummary || '';

  const [inputText, setInputText]   = useState('');
  const [analyzing, setAnalyzing]   = useState(false);
  const [draft, setDraft]           = useState(null);
  const [draftError, setDraftError] = useState('');
  const [filter, setFilter]         = useState('pending');
  const fileRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md');
    if (isText) {
      const text = await file.text();
      setInputText(prev => prev ? prev + '\n\n---\n\n' + text : text);
    } else {
      setDraftError('Only text files supported here. For PDFs/images, copy-paste the text.');
    }
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    const text = inputText.trim();
    if (!text) return;
    setAnalyzing(true);
    setDraft(null);
    setDraftError('');
    try {
      const result = await analyzeReplyItem(text, grants, { contextDocs: replyContextDocs, advisorProfile, advisorSummary });
      let dueDate = null;
      if (result.daysUntilDue != null && !isNaN(Number(result.daysUntilDue))) {
        const d = new Date();
        d.setDate(d.getDate() + Number(result.daysUntilDue));
        dueDate = d.toISOString().slice(0, 10);
      }
      setDraft({ ...result, dueDate, rawText: text });
    } catch (err) {
      setDraftError(err.message || 'AI analysis failed. Check your API key in Settings.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddToQueue = () => {
    if (!draft) return;

    const taskId = crypto.randomUUID();
    addTask({
      id: taskId,
      title: draft.subject,
      description: `${draft.summary}\n\n${draft.from ? 'From: ' + draft.from + '\n' : ''}Info needed:\n${(draft.infoNeeded || []).map(i => '• ' + i).join('\n')}`,
      status: 'todo',
      priority: urgencyToPriority[draft.urgency] || 'medium',
      dueDate: draft.dueDate || '',
      grantId: grants.find(g => g.worktag === draft.grantWorktag)?.id || '',
      tags: ['reply-queue'],
    });

    addTodo({
      id: crypto.randomUUID(),
      text: `Reply: ${draft.subject}${draft.dueDate ? ` (by ${draft.dueDate})` : ''}`,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    addReplyItem({ ...draft, taskId });
    setInputText('');
    setDraft(null);
  };

  const handleMarkReplied = (id) => updateReplyItem(id, { status: 'replied' });
  const handleDelete = (id) => {
    if (window.confirm('Remove from queue?')) deleteReplyItem(id);
  };

  const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...replyQueue].sort((a, b) => {
    const uDiff = (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
    if (uDiff !== 0) return uDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const filtered = sorted.filter(item =>
    filter === 'all'     ? true :
    filter === 'pending' ? item.status !== 'replied' :
                           item.status === 'replied'
  );

  const pendingCount = replyQueue.filter(i => i.status !== 'replied').length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Inbox size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reply Queue</h1>
          <p className="text-sm text-gray-500">
            Paste a message → AI extracts action, urgency &amp; deadline → syncs to Tasks, Calendar &amp; Quick To-Do
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="ml-auto px-2.5 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Advisor status bar */}
      {advisorProfile ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-700">
          <Brain size={13} className="text-violet-500 flex-shrink-0" />
          <span><strong>Advisor Profile active</strong> — boss model is factored into analysis &amp; advice.</span>
          <Link to="/settings" className="ml-auto underline hover:text-violet-900">Edit in Settings →</Link>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
          <Brain size={13} className="flex-shrink-0" />
          <span>No Advisor Profile set — add your boss model in Settings for tailored advice.</span>
          <Link to="/settings" className="ml-auto text-violet-500 underline hover:text-violet-700">Add profile →</Link>
        </div>
      )}

      {/* Context Wall */}
      <ContextWall
        docs={replyContextDocs}
        onAdd={addReplyContextDoc}
        onDelete={deleteReplyContextDoc}
      />

      {/* Input panel */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Paste message or email</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Upload size={12} /> Upload .txt
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md,text/*" className="hidden" onChange={handleFileUpload} />
        </div>

        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Paste email, Slack message, memo, or any communication here…&#10;&#10;The AI will use your Context Wall + Advisor Profile to give you smarter analysis."
          className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
          rows={7}
        />

        {draftError && (
          <div className="px-4 pb-2">
            <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertTriangle size={13} /> {draftError}</p>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          {inputText.trim() && (
            <button onClick={() => { setInputText(''); setDraft(null); setDraftError(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <X size={12} /> Clear
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {replyContextDocs.length > 0 && (
              <span className="text-xs text-emerald-600 font-medium">
                {replyContextDocs.length} context doc{replyContextDocs.length !== 1 ? 's' : ''} active
              </span>
            )}
            <button
              onClick={handleAnalyze}
              disabled={!inputText.trim() || analyzing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {analyzing ? 'Analyzing…' : 'Analyze with AI'}
            </button>
          </div>
        </div>
      </div>

      {/* AI draft */}
      {draft && (
        <div className="bg-white border border-primary-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-primary-50 border-b border-primary-100 flex items-center gap-2">
            <Sparkles size={14} className="text-primary-600" />
            <span className="text-sm font-semibold text-primary-700">AI Analysis — Review &amp; Add to Queue</span>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Subject / Task</label>
              <input value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Urgency</label>
                <select value={draft.urgency} onChange={e => setDraft(d => ({ ...d, urgency: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300">
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Due Date</label>
                <input type="date" value={draft.dueDate || ''}
                  onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Grant</label>
                <input value={draft.grantWorktag || ''} onChange={e => setDraft(d => ({ ...d, grantWorktag: e.target.value }))}
                  placeholder="e.g. GRT000937"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Summary</label>
              <textarea value={draft.summary} onChange={e => setDraft(d => ({ ...d, summary: e.target.value }))}
                rows={2} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                <ListChecks size={12} className="inline mr-1" /> Info to collect before replying
              </label>
              <div className="space-y-1.5">
                {(draft.infoNeeded || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={item} onChange={e => setDraft(d => {
                      const arr = [...d.infoNeeded]; arr[i] = e.target.value;
                      return { ...d, infoNeeded: arr };
                    })} className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300" />
                    <button onClick={() => setDraft(d => ({ ...d, infoNeeded: d.infoNeeded.filter((_, j) => j !== i) }))}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                  </div>
                ))}
                <button onClick={() => setDraft(d => ({ ...d, infoNeeded: [...(d.infoNeeded || []), ''] }))}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
                  <Plus size={12} /> Add item
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 space-y-0.5">
              <p className="font-semibold text-gray-600 mb-1">Adding to queue will create:</p>
              <p>✓ Kanban task ({urgencyToPriority[draft.urgency] || 'medium'} priority{draft.dueDate ? `, due ${draft.dueDate}` : ''})</p>
              <p>✓ Quick To-Do reminder</p>
              {draft.dueDate && <p>✓ Visible on Calendar on the due date</p>}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setDraft(null)}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Discard
              </button>
              <button onClick={handleAddToQueue}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Plus size={15} /> Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue list */}
      {replyQueue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {[['pending', 'Pending'], ['replied', 'Replied'], ['all', 'All']].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  filter === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {label}
                {key === 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No {filter === 'replied' ? 'replied' : 'pending'} items
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(item => (
                <ReplyCard
                  key={item.id}
                  item={item}
                  onMarkReplied={handleMarkReplied}
                  onDelete={handleDelete}
                  onUpdateItem={updateReplyItem}
                  replyContextDocs={replyContextDocs}
                  advisorProfile={advisorProfile}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {replyQueue.length === 0 && !draft && (
        <div className="text-center py-16 text-gray-400">
          <Inbox size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Queue is empty</p>
          <p className="text-sm mt-1">Paste your first message above to get started</p>
        </div>
      )}
    </div>
  );
};

export default ReplyQueue;
