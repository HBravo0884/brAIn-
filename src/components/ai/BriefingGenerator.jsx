import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { generateStatusBriefing, buildSnapshot, SNAPSHOT_TYPES } from '../../utils/ai';
import { uploadBriefingDoc, getNblmBriefingLinks } from '../../utils/googleDrive';
import CitedBriefing from './CitedBriefing';
import {
  X,
  FileText,
  CheckSquare,
  DollarSign,
  Users,
  BookOpen,
  Zap,
  Sparkles,
  Copy,
  Download,
  CheckCheck,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
  HardDrive,
  ExternalLink,
  RefreshCw,
  Save,
} from 'lucide-react';

const BRIEFING_TYPES = [
  {
    id: 'full',
    label: 'Full Status',
    icon: FileText,
    color: 'indigo',
    description: 'Everything — grants, budget, tasks, requests, deadlines.',
    bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    activeBg: 'bg-indigo-600 border-indigo-600 text-white',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'tasks',
    label: 'Task Focus',
    icon: CheckSquare,
    color: 'emerald',
    description: 'Kanban board — overdue, due soon, blocked items.',
    bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    activeBg: 'bg-emerald-600 border-emerald-600 text-white',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'budget',
    label: 'Budget Focus',
    icon: DollarSign,
    color: 'amber',
    description: 'Spending, allocations, categories, mini-pools.',
    bg: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    activeBg: 'bg-amber-600 border-amber-600 text-white',
    iconColor: 'text-amber-600',
  },
  {
    id: 'executive',
    label: 'Executive',
    icon: Zap,
    color: 'purple',
    description: '~250 words. High-level for senior stakeholders.',
    bg: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    activeBg: 'bg-purple-600 border-purple-600 text-white',
    iconColor: 'text-purple-600',
  },
];

const NB_LM_PROMPTS = [
  {
    label: 'Validate briefing accuracy',
    prompt: 'Review this briefing against all source documents. Identify any factual discrepancies, outdated information, or items that conflict with official grant policies or prior decisions.',
  },
  {
    label: 'Generate action summary',
    prompt: 'Based on all sources and this briefing, generate a consolidated list of the 10 most urgent action items, sorted by deadline. Include the owner and relevant policy reference for each.',
  },
  {
    label: 'Identify risks',
    prompt: 'What are the top 5 compliance risks or deadline risks in the current program status? Cite specific policy documents or email decisions that support your assessment.',
  },
  {
    label: 'Policy cross-check',
    prompt: 'For each open task or pending request in the briefing, identify which grant policy, SOP, or email decision governs it. Flag any items with unclear policy guidance.',
  },
  {
    label: 'Compact weekly digest',
    prompt: 'Synthesise all sources into a 150-word weekly program digest suitable for forwarding to a PI or co-investigator. Plain language, no jargon.',
  },
];

// Icon map for snapshot types
const SNAPSHOT_ICONS = {
  full: FileText,
  financial: DollarSign,
  tasks: CheckSquare,
  people: Users,
  knowledge: BookOpen,
};

// Tailwind color classes for each snapshot type
const SNAPSHOT_COLORS = {
  full: {
    border: 'border-indigo-200',
    bg: 'bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-700',
    btn: 'bg-indigo-600 hover:bg-indigo-700',
    icon: 'text-indigo-600',
    link: 'text-indigo-700',
    title: 'text-indigo-900',
  },
  financial: {
    border: 'border-green-200',
    bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-700',
    btn: 'bg-green-600 hover:bg-green-700',
    icon: 'text-green-600',
    link: 'text-green-700',
    title: 'text-green-900',
  },
  tasks: {
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    btn: 'bg-orange-600 hover:bg-orange-700',
    icon: 'text-orange-600',
    link: 'text-orange-700',
    title: 'text-orange-900',
  },
  people: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    btn: 'bg-blue-600 hover:bg-blue-700',
    icon: 'text-blue-600',
    link: 'text-blue-700',
    title: 'text-blue-900',
  },
  knowledge: {
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-700',
    btn: 'bg-purple-600 hover:bg-purple-700',
    icon: 'text-purple-600',
    link: 'text-purple-700',
    title: 'text-purple-900',
  },
};

const BriefingGenerator = ({ onClose }) => {
  const {
    grants,
    budgets,
    tasks,
    paymentRequests,
    travelRequests,
    giftCardDistributions,
    knowledgeDocs,
    personnel,
    meetings,
    todos,
    documents,
    workflows,
    templates,
    replyQueue,
  } = useApp();

  const [selectedType, setSelectedType] = useState('full');
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
  const [briefing, setBriefing] = useState(null); // { text, references, allRefs }
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showNbLM, setShowNbLM] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(null);

  // Per-snapshot-type saving state
  const [savingType, setSavingType] = useState(null); // which type key is saving
  const [savedType, setSavedType] = useState(null);   // which type just finished saving
  const [driveLinks, setDriveLinks] = useState(() => getNblmBriefingLinks());
  const [driveError, setDriveError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null); // which type link was just copied
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveAllDone, setSaveAllDone] = useState(false);

  // Reload cached links whenever modal opens
  useEffect(() => {
    setDriveLinks(getNblmBriefingLinks());
  }, []);

  const allData = {
    grants, budgets, tasks, paymentRequests, travelRequests,
    giftCardDistributions, knowledgeDocs, personnel, meetings, todos,
    documents, workflows, templates, replyQueue,
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setBriefing(null);
    try {
      const result = await generateStatusBriefing(
        { grants, budgets, tasks, paymentRequests, travelRequests, giftCardDistributions, knowledgeDocs, personnel, meetings, todos },
        selectedType,
        selectedModel
      );
      setBriefing(result);
    } catch (err) {
      setError(err.message || 'Failed to generate briefing.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDrive = async (typeKey) => {
    setSavingType(typeKey);
    setDriveError(null);
    setSavedType(null);
    try {
      const snapshot = buildSnapshot(allData, typeKey);
      await uploadBriefingDoc(snapshot, typeKey);
      const updated = getNblmBriefingLinks();
      setDriveLinks(updated);
      setSavedType(typeKey);
      setTimeout(() => setSavedType(null), 4000);
    } catch (err) {
      setDriveError(err.message || 'Drive upload failed.');
    } finally {
      setSavingType(null);
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    setSaveAllDone(false);
    setDriveError(null);
    const types = Object.keys(SNAPSHOT_TYPES);
    for (const typeKey of types) {
      setSavingType(typeKey);
      try {
        const snapshot = buildSnapshot(allData, typeKey);
        await uploadBriefingDoc(snapshot, typeKey);
      } catch (err) {
        setDriveError(`Failed saving ${SNAPSHOT_TYPES[typeKey].label}: ${err.message}`);
      }
    }
    const updated = getNblmBriefingLinks();
    setDriveLinks(updated);
    setSavingType(null);
    setIsSavingAll(false);
    setSaveAllDone(true);
    setTimeout(() => setSaveAllDone(false), 5000);
  };

  const handleCopy = async () => {
    if (!briefing) return;
    await navigator.clipboard.writeText(briefing.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!briefing) return;
    const typeLabel = BRIEFING_TYPES.find(t => t.id === selectedType)?.label || 'Briefing';
    const date = new Date().toISOString().split('T')[0];
    const filename = `brAIn_${typeLabel.replace(/\s+/g, '_')}_${date}.txt`;
    const blob = new Blob([briefing.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = async (prompt, idx) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompt(idx);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const handleCopyLink = async (typeKey, url) => {
    await navigator.clipboard.writeText(url);
    setCopiedLink(typeKey);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-white" />
            <h2 className="text-lg font-bold text-white">brAIn Briefing Generator</h2>
            <span className="text-indigo-200 text-sm">→ NotebookLM</span>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── 5 Snapshot Type Cards ─────────────────────────────────────── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">NotebookLM Data Sources — Save to Google Drive</p>
            <div className="overflow-x-auto pb-1">
              <div className="flex gap-3 min-w-max">
                {Object.entries(SNAPSHOT_TYPES).map(([typeKey, info]) => {
                  const Icon = SNAPSHOT_ICONS[typeKey] || FileText;
                  const colors = SNAPSHOT_COLORS[typeKey];
                  const link = driveLinks[typeKey];
                  const isSaving = savingType === typeKey;
                  const justSaved = savedType === typeKey;
                  return (
                    <div
                      key={typeKey}
                      className={`flex flex-col gap-2 p-3 rounded-xl border-2 ${colors.border} ${colors.bg} w-44 flex-shrink-0`}
                    >
                      {/* Card header */}
                      <div className="flex items-center gap-2">
                        <Icon size={15} className={colors.icon} />
                        <p className={`text-xs font-bold ${colors.title} leading-tight`}>{info.label}</p>
                      </div>
                      <p className="text-xs text-gray-500 leading-snug" style={{ minHeight: '2.5rem' }}>{info.description}</p>

                      {/* Drive link status */}
                      {link ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          <a
                            href={link.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-0.5 text-xs font-semibold ${colors.link} hover:underline`}
                          >
                            Open ↗
                          </a>
                          <button
                            onClick={() => handleCopyLink(typeKey, link.webViewLink)}
                            className="p-0.5 hover:bg-white/60 rounded"
                            title="Copy Drive URL"
                          >
                            {copiedLink === typeKey
                              ? <CheckCheck size={11} className="text-green-600" />
                              : <Copy size={11} className={colors.icon} />}
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Not saved yet</p>
                      )}

                      {/* Save button */}
                      <button
                        onClick={() => handleSaveToDrive(typeKey)}
                        disabled={isSaving || isSavingAll}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 ${colors.btn} disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-all`}
                      >
                        {isSaving ? (
                          <><Loader2 size={11} className="animate-spin" /> Saving…</>
                        ) : justSaved ? (
                          <><CheckCheck size={11} /> Saved!</>
                        ) : (
                          <><HardDrive size={11} /> {link ? 'Update' : 'Save'}</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save All button */}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleSaveAll}
                disabled={isSavingAll || !!savingType}
                className="flex items-center gap-2 py-2 px-4 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all shadow"
              >
                {isSavingAll ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving all 5…</>
                ) : saveAllDone ? (
                  <><CheckCheck size={14} /> All 5 saved!</>
                ) : (
                  <><Save size={14} /> Save All 5 to Drive</>
                )}
              </button>
              {savingType && isSavingAll && (
                <span className="text-xs text-gray-500">
                  Saving: {SNAPSHOT_TYPES[savingType]?.label}…
                </span>
              )}
            </div>

            {/* Drive error */}
            {driveError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {driveError}
              </div>
            )}
          </div>

          {/* ── Type selector (for AI briefing generation) ─────────────── */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Generate AI briefing</p>
            <div className="grid grid-cols-2 gap-3">
              {BRIEFING_TYPES.map(type => {
                const Icon = type.icon;
                const isActive = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      isActive ? type.activeBg : type.bg + ' text-gray-800'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : type.iconColor}`}
                    />
                    <div>
                      <p className={`font-semibold text-sm ${isActive ? 'text-white' : ''}`}>
                        {type.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Model:</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
              <button
                onClick={() => setSelectedModel('claude-sonnet-4-6')}
                className={`px-3 py-1.5 transition-colors ${selectedModel === 'claude-sonnet-4-6' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Sonnet — Fast
              </button>
              <button
                onClick={() => setSelectedModel('claude-opus-4-6')}
                className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${selectedModel === 'claude-opus-4-6' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Opus — Best
              </button>
            </div>
            {selectedModel === 'claude-opus-4-6' && (
              <span className="text-xs text-amber-600">May timeout on Netlify — use Sonnet if it fails</span>
            )}
          </div>

          {/* Data summary chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: `${grants.length} grants`, color: 'bg-blue-100 text-blue-700' },
              { label: `${tasks.filter(t => t.status !== 'Done').length} open tasks`, color: 'bg-orange-100 text-orange-700' },
              { label: `${(paymentRequests || []).length} payment req`, color: 'bg-yellow-100 text-yellow-700' },
              { label: `${(travelRequests || []).length} travel req`, color: 'bg-sky-100 text-sky-700' },
              { label: `${personnel.length} personnel`, color: 'bg-pink-100 text-pink-700' },
              { label: `${meetings.length} meetings`, color: 'bg-violet-100 text-violet-700' },
              { label: `${knowledgeDocs.length} KB docs`, color: 'bg-purple-100 text-purple-700' },
              { label: `${(documents || []).length} docs`, color: 'bg-gray-100 text-gray-700' },
              { label: `${todos.filter(t => !t.completed).length} open todos`, color: 'bg-emerald-100 text-emerald-700' },
            ].map(chip => (
              <span key={chip.label} className={`px-2.5 py-1 rounded-full text-xs font-medium ${chip.color}`}>
                {chip.label}
              </span>
            ))}
          </div>

          {/* Generate button row */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              title="Generate an AI-written briefing summary from your current data"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-md"
            >
              {isGenerating ? (
                <><Loader2 size={18} className="animate-spin" />Generating…</>
              ) : (
                <><Sparkles size={18} />Generate{briefing?.text ? ' New' : ''} Briefing</>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Briefing output */}
          {briefing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  Generated Briefing
                  {briefing.references?.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-indigo-600">
                      — click any <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold border border-indigo-200">N</span> to see source
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                    {copied ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                    <Download size={14} />.txt
                  </button>
                </div>
              </div>

              <CitedBriefing
                text={briefing.text}
                references={briefing.references || []}
                allRefs={briefing.allRefs || []}
              />
            </div>
          )}

          {/* NotebookLM Prompts section */}
          <div className="border border-amber-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowNbLM(!showNbLM)}
              className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">
                  NotebookLM Prompts
                </span>
                <span className="text-xs text-amber-600">
                  — use after uploading the briefing as a source
                </span>
              </div>
              {showNbLM ? (
                <ChevronUp size={16} className="text-amber-600" />
              ) : (
                <ChevronDown size={16} className="text-amber-600" />
              )}
            </button>
            {showNbLM && (
              <div className="divide-y divide-amber-100">
                {NB_LM_PROMPTS.map((item, idx) => (
                  <div key={idx} className="px-4 py-3 bg-white hover:bg-amber-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-700 mb-1">{item.label}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.prompt}</p>
                      </div>
                      <button
                        onClick={() => handleCopyPrompt(item.prompt, idx)}
                        className="flex-shrink-0 p-1.5 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Copy prompt"
                      >
                        {copiedPrompt === idx ? (
                          <CheckCheck size={14} className="text-green-600" />
                        ) : (
                          <Copy size={14} className="text-amber-600" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workflow tip */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 leading-relaxed">
            <strong>Setup (once):</strong> Click "Save" on any snapshot type → copy its Drive URL → add it as a source in NotebookLM.<br />
            <strong>Ongoing:</strong> Click "Update" or "Save All 5" whenever data changes — NotebookLM sees the latest version automatically.<br />
            <strong>Each snapshot contains:</strong> Full = everything | Financial = budgets + payments + travel + gift cards | Tasks = kanban + workflows + todos | People = personnel + all meetings | Knowledge = KB docs + documents + templates.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BriefingGenerator;
