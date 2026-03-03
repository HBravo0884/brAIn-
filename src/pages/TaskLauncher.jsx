import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket, Plus, Pencil, Trash2, X, Play, Upload, CheckCircle,
  Plane, CreditCard, DollarSign, ShoppingCart, ClipboardList,
  ExternalLink, FileText, Loader2, Copy, Check, Lock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractFormFields } from '../utils/ai';

// ── Icon lookup ────────────────────────────────────────────────────────────────
const ICON_MAP = { Plane, CreditCard, DollarSign, ShoppingCart, ClipboardList, Rocket, FileText };

const TaskIcon = ({ name, size = 20, className = '' }) => {
  const Icon = ICON_MAP[name] || FileText;
  return <Icon size={size} className={className} />;
};

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',        label: 'All',        color: 'bg-gray-100 text-gray-700'        },
  { key: 'travel',     label: 'Travel',     color: 'bg-blue-100 text-blue-700'        },
  { key: 'payment',    label: 'Payment',    color: 'bg-green-100 text-green-700'      },
  { key: 'purchasing', label: 'Purchasing', color: 'bg-orange-100 text-orange-700'    },
  { key: 'custom',     label: 'Custom',     color: 'bg-purple-100 text-purple-700'    },
];

const catBadge = (cat) => {
  const c = CATEGORIES.find(c => c.key === cat) || CATEGORIES[0];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.color}`}>{c.label}</span>;
};

// ── Auto-fill resolver ─────────────────────────────────────────────────────────
const AUTO_FILL_KEYS = {
  'pi.name':          (s) => s.piName        || 'Dr. Marjorie Gondré-Lewis',
  'pi.email':         (s) => s.piEmail       || '',
  'pd.name':          (s) => s.fullName      || 'Héctor Bravo-Rivera',
  'pd.title':         (s) => s.title         || 'Program Director',
  'pd.department':    (s) => s.department    || '',
  'pd.institution':   (s) => s.institution   || '',
  'grant.title':      (s, g) => g?.title     || '',
  'grant.worktag':    (s, g) => g?.worktag   || '',
  'grant.costCenter': (s, g) => g?.costCenter|| '',
  'grant.agency':     (s, g) => g?.fundingAgency || '',
  'date.today':       () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
};

const resolveAutoFill = (key, settings, grant) => {
  const fn = AUTO_FILL_KEYS[key];
  return fn ? fn(settings?.userProfile || {}, grant) : '';
};

const AUTO_FILL_OPTIONS = [
  { value: 'pi.name',          label: 'PI Name' },
  { value: 'pi.email',         label: 'PI Email' },
  { value: 'pd.name',          label: 'PD Name' },
  { value: 'pd.title',         label: 'PD Title' },
  { value: 'pd.department',    label: 'Department' },
  { value: 'pd.institution',   label: 'Institution' },
  { value: 'grant.title',      label: 'Grant Title' },
  { value: 'grant.worktag',    label: 'Grant Worktag' },
  { value: 'grant.costCenter', label: 'Cost Center' },
  { value: 'grant.agency',     label: 'Funding Agency' },
  { value: 'date.today',       label: "Today's Date" },
];

const APP_ROUTES = [
  { label: 'Dashboard',        path: '/' },
  { label: 'Grants',           path: '/grants' },
  { label: 'Budget',           path: '/budget' },
  { label: 'Kanban',           path: '/workflows' },
  { label: 'Calendar',         path: '/calendar' },
  { label: 'Meetings',         path: '/meetings' },
  { label: 'Personnel',        path: '/personnel' },
  { label: 'Payment Requests', path: '/payment-requests' },
  { label: 'Travel Requests',  path: '/travel-requests' },
  { label: 'Gift Cards',       path: '/gift-cards' },
  { label: 'Templates',        path: '/templates' },
  { label: 'Documents',        path: '/documents' },
  { label: 'Quick To-Do',      path: '/quick-todo' },
  { label: 'Knowledge Base',   path: '/knowledge' },
];

// ── Empty form defaults ────────────────────────────────────────────────────────
const EMPTY_TYPE = {
  name: '', category: 'custom', description: '', iconName: 'FileText',
  isBuiltIn: false, appLinks: [], forms: [],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════
const TaskLauncher = () => {
  const { grants, settings, taskTypes, addTaskType, updateTaskType, deleteTaskType } = useApp();

  const [catFilter, setCatFilter]     = useState('all');
  const [runningTask, setRunningTask] = useState(null);   // task type being executed
  const [editingType, setEditingType] = useState(null);   // null | EMPTY_TYPE | existing

  // Execution modal state
  const [runGrant, setRunGrant]         = useState('');
  const [manualValues, setManualValues] = useState({});   // fieldId → value
  const [fillSheet, setFillSheet]       = useState(null); // generated text
  const [copied, setCopied]             = useState(false);
  const [runForms, setRunForms]         = useState([]);   // working copy of forms for this run
  const [extracting, setExtracting]     = useState(null); // formId being analyzed
  const [expandedForms, setExpandedForms] = useState({});

  // Edit type modal state
  const [editForm, setEditForm]         = useState(EMPTY_TYPE);
  const [editForms, setEditForms]       = useState([]);
  const [editLinks, setEditLinks]       = useState([]);
  const [analyzingForm, setAnalyzingForm] = useState(null);
  const [saving, setSaving]             = useState(false);

  const fileInputRef = useRef(null);
  const runFileRef   = useRef(null);

  // ── Filtering ────────────────────────────────────────────────────────────────
  const visible = catFilter === 'all'
    ? taskTypes
    : taskTypes.filter(t => t.category === catFilter);

  // ── Execution helpers ────────────────────────────────────────────────────────
  const openRun = (taskType) => {
    setRunningTask(taskType);
    setRunGrant('');
    setManualValues({});
    setFillSheet(null);
    setCopied(false);
    setRunForms(JSON.parse(JSON.stringify(taskType.forms))); // deep clone
    setExpandedForms({});
  };

  const closeRun = () => { setRunningTask(null); setFillSheet(null); };

  const selectedGrant = grants.find(g => g.id === runGrant) || null;

  const resolveField = (field) => {
    if (field.autoFillKey) return resolveAutoFill(field.autoFillKey, settings, selectedGrant);
    return manualValues[field.id] ?? field.value ?? '';
  };

  const generateFillSheet = () => {
    if (!runningTask) return;
    const grantLabel = selectedGrant ? `${selectedGrant.title} (${selectedGrant.worktag || selectedGrant.id.slice(0, 8)})` : 'No grant selected';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let text = `TASK: ${runningTask.name} — ${grantLabel}\nGenerated: ${date}\n`;

    if (runForms.length > 0) {
      for (const form of runForms) {
        text += `\n${'═'.repeat(60)}\n`;
        text += `FORM: ${form.name}${form.fileName ? ` (${form.fileName})` : ''}\n`;
        text += `${'─'.repeat(60)}\n`;
        for (const field of form.fields) {
          const val = resolveField(field);
          const display = val || '____________________';
          text += `${field.label.padEnd(24)} ${display}\n`;
        }
        if (form.fields.length === 0) {
          text += '  (No fields extracted — upload and analyze the form)\n';
        }
      }
    } else {
      text += '\n(No forms attached to this task type yet)\n';
    }

    if (runningTask.appLinks.length > 0) {
      text += `\n${'═'.repeat(60)}\nLINKED PAGES\n${'─'.repeat(60)}\n`;
      for (const link of runningTask.appLinks) {
        text += `• ${link.label} → ${link.path}\n`;
      }
    }

    setFillSheet(text);
  };

  const copySheet = () => {
    navigator.clipboard.writeText(fillSheet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Upload additional form during execution
  const handleRunUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newForm = {
      id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ''),
      fileName: file.name, fileData: null, fileType: file.type, fields: [],
    };
    // Read as base64 for thumbnail
    const reader = new FileReader();
    reader.onload = (ev) => { newForm.fileData = ev.target.result.split(',')[1]; };
    reader.readAsDataURL(file);

    setRunForms(prev => [...prev, newForm]);
    setExtracting(newForm.id);
    try {
      const fields = await extractFormFields(file);
      const mapped = fields.map(f => ({ id: crypto.randomUUID(), label: f.label, fieldType: f.fieldType, autoFillKey: f.autoFillKey || null, value: '' }));
      setRunForms(prev => prev.map(f => f.id === newForm.id ? { ...f, fields: mapped } : f));
    } catch {
      // leave fields empty — user can still manually fill
    } finally {
      setExtracting(null);
    }
    e.target.value = '';
  };

  const toggleFormExpand = (id) => setExpandedForms(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Edit type helpers ────────────────────────────────────────────────────────
  const openNew = () => {
    setEditForm({ ...EMPTY_TYPE });
    setEditForms([]);
    setEditLinks([]);
    setEditingType('new');
  };

  const openEdit = (t) => {
    setEditForm({ name: t.name, category: t.category, description: t.description, iconName: t.iconName, isBuiltIn: t.isBuiltIn });
    setEditForms(JSON.parse(JSON.stringify(t.forms)));
    setEditLinks([...t.appLinks]);
    setEditingType(t);
  };

  const closeEdit = () => { setEditingType(null); };

  const addLink = () => setEditLinks(prev => [...prev, { label: '', path: '' }]);
  const removeLink = (i) => setEditLinks(prev => prev.filter((_, idx) => idx !== i));
  const updateLink = (i, key, val) => setEditLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));

  const handleEditUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newF = { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ''), fileName: file.name, fileData: null, fileType: file.type, fields: [] };
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditForms(prev => prev.map(f => f.id === newF.id ? { ...f, fileData: ev.target.result.split(',')[1] } : f));
    };
    reader.readAsDataURL(file);
    setEditForms(prev => [...prev, newF]);
    e.target.value = '';
  };

  const analyzeEditForm = async (formId, file) => {
    setAnalyzingForm(formId);
    try {
      const fields = await extractFormFields(file);
      const mapped = fields.map(f => ({ id: crypto.randomUUID(), label: f.label, fieldType: f.fieldType, autoFillKey: f.autoFillKey || null, value: '' }));
      setEditForms(prev => prev.map(f => f.id === formId ? { ...f, fields: mapped } : f));
    } catch (err) {
      alert('Field extraction failed: ' + err.message);
    } finally {
      setAnalyzingForm(null);
    }
  };

  const updateFieldMapping = (formId, fieldId, autoFillKey) => {
    setEditForms(prev => prev.map(f =>
      f.id === formId ? { ...f, fields: f.fields.map(field => field.id === fieldId ? { ...field, autoFillKey: autoFillKey || null } : field) } : f
    ));
  };

  const removeEditForm = (id) => setEditForms(prev => prev.filter(f => f.id !== id));

  const saveType = async () => {
    if (!editForm.name.trim()) return alert('Name is required.');
    setSaving(true);
    const payload = {
      ...editForm,
      appLinks: editLinks.filter(l => l.label && l.path),
      forms: editForms,
    };
    if (editingType === 'new') {
      addTaskType(payload);
    } else {
      updateTaskType(editingType.id, payload);
    }
    setSaving(false);
    closeEdit();
  };

  const handleDelete = (t) => {
    if (t.isBuiltIn) return;
    if (confirm(`Delete "${t.name}"?`)) deleteTaskType(t.id);
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Launcher</h1>
          <p className="text-sm text-gray-500 mt-1">Start a task workflow — forms load with known fields pre-filled</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          New Task Type
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCatFilter(c.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              catFilter === c.key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {c.label}
            <span className="ml-1.5 text-xs opacity-70">
              {c.key === 'all' ? taskTypes.length : taskTypes.filter(t => t.category === c.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Task Type Grid */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Rocket size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No task types in this category</p>
          <p className="text-sm mt-1">Click "+ New Task Type" to add one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(t => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TaskIcon name={t.iconName} size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{t.name}</h3>
                    <div className="mt-0.5">{catBadge(t.category)}</div>
                  </div>
                </div>
                {t.isBuiltIn ? (
                  <Lock size={14} className="text-gray-300 mt-1 flex-shrink-0" title="Built-in task type" />
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(t)} className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed flex-1">{t.description}</p>

              {/* Meta row */}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{t.forms.length} form{t.forms.length !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{t.appLinks.length} link{t.appLinks.length !== 1 ? 's' : ''}</span>
              </div>

              {/* CTA */}
              <button
                onClick={() => openRun(t)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Play size={14} />
                Start Task
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Execution Modal ──────────────────────────────────────────────────── */}
      {runningTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                  <TaskIcon name={runningTask.iconName} size={16} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{runningTask.name}</h2>
                  <p className="text-xs text-gray-400">{catBadge(runningTask.category)}</p>
                </div>
              </div>
              <button onClick={closeRun} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {fillSheet ? (
                /* Fill Sheet Output */
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Your fill sheet is ready — copy it and use it to complete the actual forms:</p>
                  <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-80">{fillSheet}</pre>
                  <div className="flex gap-3">
                    <button
                      onClick={copySheet}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        copied ? 'bg-green-600 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                      {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                    <button
                      onClick={() => setFillSheet(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Edit Values
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Grant selector */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Which grant is this for?</label>
                    <select
                      value={runGrant}
                      onChange={e => setRunGrant(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                    >
                      <option value="">— Select grant (optional) —</option>
                      {grants.map(g => (
                        <option key={g.id} value={g.id}>{g.title}{g.worktag ? ` (${g.worktag})` : ''}</option>
                      ))}
                    </select>
                    {selectedGrant && (
                      <p className="text-xs text-gray-400 mt-1">
                        Auto-fill: PI = {resolveAutoFill('pi.name', settings, selectedGrant)} · Worktag = {selectedGrant.worktag || '—'} · CC = {selectedGrant.costCenter || '—'}
                      </p>
                    )}
                  </div>

                  {/* App Links */}
                  {runningTask.appLinks.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Related Pages</p>
                      <div className="flex flex-wrap gap-2">
                        {runningTask.appLinks.map((link, i) => (
                          <Link
                            key={i}
                            to={link.path}
                            onClick={closeRun}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-medium rounded-lg transition-colors"
                          >
                            <ExternalLink size={13} />
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Forms */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Forms</p>
                    {runForms.length === 0 && (
                      <p className="text-xs text-gray-400 mb-2">No forms attached yet. Upload one below.</p>
                    )}
                    <div className="space-y-3">
                      {runForms.map(form => (
                        <div key={form.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Form header */}
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            onClick={() => toggleFormExpand(form.id)}
                          >
                            <div className="flex items-center gap-2">
                              <FileText size={15} className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">{form.name}</span>
                              <span className="text-xs text-gray-400">({form.fields.length} fields)</span>
                              {extracting === form.id && <Loader2 size={13} className="animate-spin text-primary-500" />}
                            </div>
                            {expandedForms[form.id] ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                          </button>

                          {expandedForms[form.id] && (
                            <div className="px-4 py-3 space-y-2">
                              {/* Form reference image */}
                              {form.fileData && form.fileType?.startsWith('image/') && (
                                <img
                                  src={`data:${form.fileType};base64,${form.fileData}`}
                                  alt={form.name}
                                  className="w-full max-h-48 object-contain border border-gray-200 rounded-lg mb-2"
                                />
                              )}
                              {/* Fields */}
                              {form.fields.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-2">No fields — re-upload and analyze to extract them</p>
                              ) : (
                                form.fields.map(field => {
                                  const filled = field.autoFillKey && resolveAutoFill(field.autoFillKey, settings, selectedGrant);
                                  return (
                                    <div key={field.id} className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 w-36 flex-shrink-0 truncate" title={field.label}>{field.label}</span>
                                      {filled ? (
                                        <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                                          <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                                          <span className="text-xs text-green-700 truncate">{filled}</span>
                                        </div>
                                      ) : (
                                        <input
                                          type="text"
                                          placeholder={`Enter ${field.label}…`}
                                          value={manualValues[field.id] ?? ''}
                                          onChange={e => setManualValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary-400 focus:border-transparent outline-none"
                                        />
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Upload additional form */}
                    <input type="file" accept="image/*,application/pdf" ref={runFileRef} className="hidden" onChange={handleRunUpload} />
                    <button
                      onClick={() => runFileRef.current?.click()}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 hover:border-primary-300 text-gray-400 hover:text-primary-600 text-sm rounded-xl transition-colors"
                    >
                      <Upload size={15} />
                      Upload Additional Form (auto-extracts fields with AI)
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!fillSheet && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
                <button onClick={closeRun} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                <button
                  onClick={generateFillSheet}
                  className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <FileText size={15} />
                  Generate Fill Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── New / Edit Task Type Modal ───────────────────────────────────────── */}
      {editingType !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="font-bold text-gray-900">{editingType === 'new' ? 'New Task Type' : 'Edit Task Type'}</h2>
              <button onClick={closeEdit} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. IRB Amendment Submission"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
                />
              </div>

              {/* Category + Icon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                  >
                    {CATEGORIES.filter(c => c.key !== 'all').map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={editForm.iconName}
                    onChange={e => setEditForm(f => ({ ...f, iconName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                  >
                    {Object.keys(ICON_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="What is this task for?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none resize-none"
                />
              </div>

              {/* App Links */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">App Links</label>
                  <button onClick={addLink} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                    <Plus size={12} /> Add Link
                  </button>
                </div>
                {editLinks.length === 0 && <p className="text-xs text-gray-400">No links yet.</p>}
                {editLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={link.label}
                      onChange={e => updateLink(i, 'label', e.target.value)}
                      placeholder="Label (e.g. Open Travel Requests)"
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary-400 outline-none"
                    />
                    <select
                      value={link.path}
                      onChange={e => updateLink(i, 'path', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary-400 outline-none"
                    >
                      <option value="">— Page —</option>
                      {APP_ROUTES.map(r => <option key={r.path} value={r.path}>{r.label}</option>)}
                    </select>
                    <button onClick={() => removeLink(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><X size={13} /></button>
                  </div>
                ))}
              </div>

              {/* Forms */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Forms</label>
                </div>
                {editForms.length === 0 && <p className="text-xs text-gray-400 mb-2">No forms yet. Upload one below.</p>}
                {editForms.map(form => (
                  <div key={form.id} className="border border-gray-200 rounded-xl mb-2 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      <span className="text-sm font-medium text-gray-700 truncate">{form.name}</span>
                      <div className="flex items-center gap-2">
                        {form.fields.length > 0 && <span className="text-xs text-gray-400">{form.fields.length} fields</span>}
                        {analyzingForm === form.id && <Loader2 size={13} className="animate-spin text-primary-500" />}
                        <button onClick={() => removeEditForm(form.id)} className="p-1 text-gray-400 hover:text-red-500"><X size={13} /></button>
                      </div>
                    </div>
                    {/* Fields */}
                    {form.fields.length > 0 && (
                      <div className="px-3 py-2 space-y-1.5">
                        {form.fields.map(field => (
                          <div key={field.id} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-32 flex-shrink-0 truncate">{field.label}</span>
                            <select
                              value={field.autoFillKey || ''}
                              onChange={e => updateFieldMapping(form.id, field.id, e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-primary-400 outline-none"
                            >
                              <option value="">— manual —</option>
                              {AUTO_FILL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Analyze button */}
                    {form.fields.length === 0 && form.fileData && (
                      <div className="px-3 pb-2">
                        <input
                          type="file" accept="image/*,application/pdf"
                          className="hidden"
                          id={`analyze-${form.id}`}
                          onChange={async (e) => {
                            if (e.target.files?.[0]) await analyzeEditForm(form.id, e.target.files[0]);
                          }}
                        />
                        <label
                          htmlFor={`analyze-${form.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                        >
                          <Rocket size={12} />
                          Analyze Fields with AI
                        </label>
                      </div>
                    )}
                  </div>
                ))}
                <input type="file" accept="image/*,application/pdf" ref={fileInputRef} className="hidden" onChange={handleEditUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 hover:border-primary-300 text-gray-400 hover:text-primary-600 text-sm rounded-xl transition-colors"
                >
                  <Upload size={15} />
                  Upload Form (PDF or image)
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <button onClick={closeEdit} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
              <button
                onClick={saveType}
                disabled={saving || !editForm.name.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Save Task Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskLauncher;
