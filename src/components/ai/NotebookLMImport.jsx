import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { parseNotebookLMOutput } from '../../utils/ai';
import {
  X,
  FileInput,
  Loader2,
  CheckSquare,
  Square,
  Lightbulb,
  CheckCircle2,
  Plus,
  RefreshCw,
  AlertTriangle,
  BookMarked,
  Award,
} from 'lucide-react';

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const CATEGORY_COLORS = {
  policy: 'bg-blue-100 text-blue-700',
  sop: 'bg-indigo-100 text-indigo-700',
  decision: 'bg-purple-100 text-purple-700',
  meeting: 'bg-teal-100 text-teal-700',
  reference: 'bg-gray-100 text-gray-700',
  notes: 'bg-orange-100 text-orange-700',
};

const Toggle = ({ checked, onChange }) => (
  <button onClick={onChange} className="flex-shrink-0 mt-0.5">
    {checked
      ? <CheckSquare size={16} className="text-indigo-600" />
      : <Square size={16} className="text-gray-300" />}
  </button>
);

const SectionHeader = ({ color, label, count }) => (
  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${color}`}>
    {label} ({count})
  </div>
);

const NotebookLMImport = ({ onClose }) => {
  const {
    grants, tasks, knowledgeDocs,
    addTask, updateTask, updateGrant, addKnowledgeDoc,
  } = useApp();

  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);

  const toggle = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const isEmpty = result && (
    (result.newTasks || []).length === 0 &&
    (result.taskUpdates || []).length === 0 &&
    (result.grantUpdates || []).length === 0 &&
    (result.newKnowledgeDocs || []).length === 0 &&
    (result.generalInsights || []).length === 0
  );

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setApplied(false);
    try {
      const parsed = await parseNotebookLMOutput(text, { grants, tasks, knowledgeDocs });
      setResult(parsed);
      const keys = new Set();
      (parsed.newTasks || []).forEach((_, i) => keys.add(`newTask-${i}`));
      (parsed.taskUpdates || []).forEach((_, i) => keys.add(`taskUpdate-${i}`));
      (parsed.grantUpdates || []).forEach((_, i) => keys.add(`grantUpdate-${i}`));
      (parsed.newKnowledgeDocs || []).forEach((_, i) => keys.add(`newDoc-${i}`));
      setSelected(keys);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    setIsApplying(true);

    const taskIdSet = new Set(tasks.map(t => t.id));
    const grantIdSet = new Set(grants.map(g => g.id));

    (result.newTasks || []).forEach((t, i) => {
      if (!selected.has(`newTask-${i}`)) return;
      addTask({
        title: t.title,
        description: t.description || '',
        priority: t.priority || 'medium',
        status: 'To Do',
        dueDate: t.dueDate || '',
        assignee: t.assignee || '',
      });
    });

    (result.taskUpdates || []).forEach((u, i) => {
      if (!selected.has(`taskUpdate-${i}`)) return;
      if (!taskIdSet.has(u.taskId)) return;
      updateTask(u.taskId, u.changes);
    });

    (result.grantUpdates || []).forEach((u, i) => {
      if (!selected.has(`grantUpdate-${i}`)) return;
      if (!grantIdSet.has(u.grantId)) return;
      updateGrant(u.grantId, u.changes);
    });

    (result.newKnowledgeDocs || []).forEach((d, i) => {
      if (!selected.has(`newDoc-${i}`)) return;
      addKnowledgeDoc({
        title: d.title,
        type: 'document',
        category: d.category || 'notes',
        content: d.content || '',
        summary: d.summary || '',
        tags: d.tags || ['notebooklm'],
      });
    });

    setIsApplying(false);
    setApplied(true);
  };

  const selectedCount = selected.size;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="flex items-center gap-3">
            <FileInput size={20} className="text-white" />
            <h2 className="text-lg font-bold text-white">NotebookLM Import</h2>
            <span className="text-emerald-200 text-sm">→ brAIn</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={18} className="text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Paste area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Paste NotebookLM output</p>
              <span className={`text-xs ${text.length > 7500 ? 'text-red-500' : 'text-gray-400'}`}>
                {text.length.toLocaleString()} / 8,000 chars
              </span>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={7}
              placeholder="Paste the output from your NotebookLM session here — fact-checks, summaries, action items, policy clarifications..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !text.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
          >
            {isAnalyzing
              ? <><Loader2 size={18} className="animate-spin" /> Analyzing…</>
              : result
                ? <><RefreshCw size={18} /> Re-analyze</>
                : <><FileInput size={18} /> Analyze & Propose Changes</>
            }
          </button>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Summary banner */}
          {result && result.summary && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
              <strong>Analysis: </strong>{result.summary}
            </div>
          )}

          {/* Empty result */}
          {result && isEmpty && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm text-gray-500">
              No actionable changes found in this NotebookLM output.
            </div>
          )}

          {/* New Tasks */}
          {result && (result.newTasks || []).length > 0 && (
            <div className="space-y-2">
              <SectionHeader color="bg-green-100 text-green-700" label="New Tasks" count={result.newTasks.length} />
              <div className="space-y-2">
                {result.newTasks.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                    <Toggle checked={selected.has(`newTask-${i}`)} onChange={() => toggle(`newTask-${i}`)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium}`}>
                          {t.priority || 'medium'}
                        </span>
                        {t.dueDate && (
                          <span className="text-xs text-gray-500">Due {t.dueDate}</span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                      )}
                      {t.assignee && (
                        <p className="text-xs text-gray-400 mt-0.5">→ {t.assignee}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Updates */}
          {result && (result.taskUpdates || []).length > 0 && (
            <div className="space-y-2">
              <SectionHeader color="bg-blue-100 text-blue-700" label="Task Updates" count={result.taskUpdates.length} />
              <div className="space-y-2">
                {result.taskUpdates.map((u, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <Toggle checked={selected.has(`taskUpdate-${i}`)} onChange={() => toggle(`taskUpdate-${i}`)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{u.currentTitle}</p>
                      <p className="text-xs text-blue-600 mt-0.5">{u.reason}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {Object.entries(u.changes || {}).map(([k, v]) => v && (
                          <span key={k} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grant Updates */}
          {result && (result.grantUpdates || []).length > 0 && (
            <div className="space-y-2">
              <SectionHeader color="bg-violet-100 text-violet-700" label="Grant Updates" count={result.grantUpdates.length} />
              <div className="space-y-2">
                {result.grantUpdates.map((u, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                    <Toggle checked={selected.has(`grantUpdate-${i}`)} onChange={() => toggle(`grantUpdate-${i}`)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-violet-500" />
                        <p className="text-sm font-semibold text-gray-800">{u.currentTitle}</p>
                      </div>
                      <p className="text-xs text-violet-600 mt-0.5">{u.reason}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {Object.entries(u.changes || {}).map(([k, v]) => v && (
                          <span key={k} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs">
                            {k}: {String(v).slice(0, 40)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Knowledge Docs */}
          {result && (result.newKnowledgeDocs || []).length > 0 && (
            <div className="space-y-2">
              <SectionHeader color="bg-amber-100 text-amber-700" label="Knowledge Docs" count={result.newKnowledgeDocs.length} />
              <div className="space-y-2">
                {result.newKnowledgeDocs.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <Toggle checked={selected.has(`newDoc-${i}`)} onChange={() => toggle(`newDoc-${i}`)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <BookMarked size={14} className="text-amber-500" />
                        <p className="text-sm font-semibold text-gray-800">{d.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[d.category] || CATEGORY_COLORS.notes}`}>
                          {d.category || 'notes'}
                        </span>
                      </div>
                      {d.summary && (
                        <p className="text-xs text-gray-500 mt-0.5">{d.summary}</p>
                      )}
                      <p className="text-xs text-amber-600 mt-1 italic">AI-generated from NotebookLM output</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Insights */}
          {result && (result.generalInsights || []).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb size={14} className="text-gray-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">General Insights</p>
              </div>
              <div className="space-y-1.5">
                {result.generalInsights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 text-xs mt-0.5">•</span>
                    <p className="text-xs text-gray-600">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          {result && !applied && !isEmpty && (
            <button
              onClick={handleApply}
              disabled={isApplying || selectedCount === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
            >
              {isApplying
                ? <><Loader2 size={18} className="animate-spin" /> Applying…</>
                : <><Plus size={18} /> Apply {selectedCount} Selected Change{selectedCount !== 1 ? 's' : ''}</>
              }
            </button>
          )}

          {/* Success */}
          {applied && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-700">
                <CheckCircle2 size={20} />
                <p className="font-semibold">Changes applied successfully!</p>
              </div>
              <p className="text-xs text-emerald-600">Your grants, tasks, and knowledge base have been updated.</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Workflow tip */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 leading-relaxed">
            <strong>Workflow:</strong> Use the <strong>Briefing</strong> button to export status → paste into NotebookLM → get validated output → paste here to import changes back into brAIn.
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotebookLMImport;
