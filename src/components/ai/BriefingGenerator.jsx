import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateStatusBriefing } from '../../utils/ai';
import {
  X,
  FileText,
  CheckSquare,
  DollarSign,
  Zap,
  Sparkles,
  Copy,
  Download,
  CheckCheck,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
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

const BriefingGenerator = ({ onClose }) => {
  const {
    grants,
    budgets,
    tasks,
    paymentRequests,
    travelRequests,
    giftCardDistributions,
    knowledgeDocs,
  } = useApp();

  const [selectedType, setSelectedType] = useState('full');
  const [briefing, setBriefing] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showNbLM, setShowNbLM] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setBriefing('');
    try {
      const result = await generateStatusBriefing(
        { grants, budgets, tasks, paymentRequests, travelRequests, giftCardDistributions, knowledgeDocs },
        selectedType
      );
      setBriefing(result);
    } catch (err) {
      setError(err.message || 'Failed to generate briefing.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!briefing) return;
    await navigator.clipboard.writeText(briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!briefing) return;
    const typeLabel = BRIEFING_TYPES.find(t => t.id === selectedType)?.label || 'Briefing';
    const date = new Date().toISOString().split('T')[0];
    const filename = `brAIn_${typeLabel.replace(/\s+/g, '_')}_${date}.txt`;
    const blob = new Blob([briefing], { type: 'text/plain;charset=utf-8' });
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
          {/* Type selector */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Select briefing type</p>
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

          {/* Data summary chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: `${grants.length} grant${grants.length !== 1 ? 's' : ''}`, color: 'bg-blue-100 text-blue-700' },
              { label: `${budgets.length} budget${budgets.length !== 1 ? 's' : ''}`, color: 'bg-green-100 text-green-700' },
              { label: `${tasks.filter(t => t.status !== 'Done').length} open tasks`, color: 'bg-orange-100 text-orange-700' },
              { label: `${(paymentRequests || []).length} payment req`, color: 'bg-yellow-100 text-yellow-700' },
              { label: `${knowledgeDocs.length} KB docs`, color: 'bg-purple-100 text-purple-700' },
            ].map(chip => (
              <span key={chip.label} className={`px-2.5 py-1 rounded-full text-xs font-medium ${chip.color}`}>
                {chip.label}
              </span>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            title="Generate a briefing document from your current app data — then copy it into NotebookLM as a source"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-md"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating briefing…
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate{briefing ? ' New' : ''} Briefing
              </>
            )}
          </button>

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
                <p className="text-sm font-semibold text-gray-700">Generated Briefing</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    title="Copy briefing text to clipboard — then paste it into NotebookLM as a new source"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                  >
                    {copied ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    title="Download briefing as a .txt file you can upload to NotebookLM"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                  >
                    <Download size={14} />
                    Download .txt
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-72 overflow-y-auto">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                  {briefing}
                </pre>
              </div>
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
            <strong>Workflow:</strong> Generate briefing → Copy or Download → Add as a source in NotebookLM → Use the prompts above to validate and fact-check → Save corrected output back to brAIn Knowledge Base.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BriefingGenerator;
