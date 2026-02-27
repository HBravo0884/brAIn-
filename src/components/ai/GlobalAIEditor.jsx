import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { askClaudeWithGlobalTools } from '../../utils/ai';
import {
  Bot, Send, X, Loader2, Sparkles, CheckCircle,
  RefreshCw, Trash2, Edit3, Paperclip, AlertCircle,
  ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Tool badge config ─────────────────────────────────────────────────────────
const BADGE_CONFIG = {
  create:          { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200',    label: (n) => `Created ${n} task${n !== 1 ? 's' : ''}` },
  update:          { icon: RefreshCw,   color: 'bg-blue-100 text-blue-800 border-blue-200',       label: (n) => `Updated ${n} task${n !== 1 ? 's' : ''}` },
  delete_task:     { icon: Trash2,      color: 'bg-red-100 text-red-800 border-red-200',          label: (n) => `Deleted ${n} task${n !== 1 ? 's' : ''}` },
  update_grant:    { icon: Edit3,       color: 'bg-violet-100 text-violet-800 border-violet-200', label: () => 'Grant updated' },
  update_budget:   { icon: Edit3,       color: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: () => 'Budget updated' },
  update_category: { icon: Edit3,       color: 'bg-cyan-100 text-cyan-800 border-cyan-200',       label: () => 'Category updated' },
  delete_category: { icon: Trash2,      color: 'bg-red-100 text-red-800 border-red-200',          label: () => 'Category deleted' },
  update_mini_pool:{ icon: Edit3,       color: 'bg-teal-100 text-teal-800 border-teal-200',       label: () => 'Sub-budget updated' },
  delete_mini_pool:{ icon: Trash2,      color: 'bg-red-100 text-red-800 border-red-200',          label: () => 'Sub-budget deleted' },
};

function ToolBadge({ call }) {
  const cfg = BADGE_CONFIG[call.type];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label(call.count)}
    </span>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Bot size={12} className="text-white" />
        </div>
      )}
      <div className={`max-w-[88%] space-y-1.5 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {msg.toolCalls?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {msg.toolCalls.map((tc, i) => <ToolBadge key={i} call={tc} />)}
          </div>
        )}
        {msg.content && (
          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          }`}>
            {msg.content}
          </div>
        )}
        {msg.capturedPreview && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-800 max-w-full">
            <span className="font-medium">📎 Captured: </span>
            {msg.capturedPreview}
          </div>
        )}
        {msg.hasFiles && (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Paperclip size={10} /> {msg.hasFiles}
          </div>
        )}
        {/* Task preview for creates */}
        {msg.toolCalls?.filter(tc => tc.type === 'create').flatMap(tc => tc.tasks || []).slice(0, 3).map((t, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 shadow-sm w-full">
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
            <span className="font-medium">{t.title}</span>
            {t.dueDate && <span className="text-gray-400 ml-2">· {t.dueDate}</span>}
          </div>
        ))}
        {msg.toolCalls?.filter(tc => tc.type === 'create').flatMap(tc => tc.tasks || []).length > 3 && (
          <div className="text-xs text-gray-400 pl-1">
            + {msg.toolCalls.filter(tc => tc.type === 'create').flatMap(tc => tc.tasks || []).length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const GlobalAIEditor = () => {
  const {
    grants, budgets, tasks, knowledgeDocs,
    updateGrant, updateBudget,
    addTask, updateTask, deleteTask,
  } = useApp();

  const [isOpen, setIsOpen]           = useState(false);
  const [isDragOver, setIsDragOver]   = useState(false);
  const [showPending, setShowPending] = useState(true);
  const [messages, setMessages]       = useState([{
    role: 'assistant',
    content: "Hi! I'm your AI assistant.\n\n• Ask me to update grants, budgets, or tasks\n• Drag any text or file here to capture action items\n• Attach images or documents to extract to-dos",
    toolCalls: [],
  }]);
  const [input, setInput]                       = useState('');
  const [loading, setLoading]                   = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [attachedFiles, setAttachedFiles]       = useState([]);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Pending items (due today or overdue, not done)
  const today = new Date().toISOString().split('T')[0];
  const pendingItems = tasks
    .filter(t => t.status !== 'Done' && t.dueDate && t.dueDate <= today)
    .sort((a, b) => a.dueDate < b.dueDate ? -1 : 1);
  const urgentCount = pendingItems.length;

  // ── Tool callbacks ──────────────────────────────────────────────────────────
  const handleCreateTasks = async (taskDefs) => {
    const created = [];
    for (const def of taskDefs) {
      const id = crypto.randomUUID();
      addTask({ id, ...def });
      created.push({ id, ...def });
    }
    return created;
  };

  const handleUpdateTasks = async (updates) => {
    for (const { taskId, ...rest } of updates) updateTask(taskId, rest);
  };

  const handleDeleteTasks = async (ids) => {
    for (const id of ids) deleteTask(id);
  };

  const handleUpdateGrant = async (grantId, updates) => {
    updateGrant(grantId, updates);
  };

  const handleUpdateBudget = async (budgetId, updates) => {
    updateBudget(budgetId, updates);
  };

  const handleUpdateCategory = async (budgetId, categoryId, updates) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return;
    updateBudget(budgetId, {
      categories: budget.categories.map(cat =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      ),
    });
  };

  const handleDeleteCategory = async (budgetId, categoryId) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return;
    updateBudget(budgetId, {
      categories: budget.categories.filter(c => c.id !== categoryId),
    });
  };

  const handleUpdateMiniPool = async (budgetId, categoryId, miniPoolId, updates) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return;
    updateBudget(budgetId, {
      categories: budget.categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, miniPools: (cat.miniPools || []).map(mp => mp.id === miniPoolId ? { ...mp, ...updates } : mp) }
          : cat
      ),
    });
  };

  const handleDeleteMiniPool = async (budgetId, categoryId, miniPoolId) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return;
    updateBudget(budgetId, {
      categories: budget.categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, miniPools: (cat.miniPools || []).filter(mp => mp.id !== miniPoolId) }
          : cat
      ),
    });
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async (overrideText, overrideFiles, capturedPreview) => {
    const text  = overrideText  !== undefined ? overrideText  : input.trim();
    const files = overrideFiles !== undefined ? overrideFiles : attachedFiles;
    const effectiveText = text || (files.length > 0
      ? `Please analyze the ${files.length} attached file(s) and extract any action items or tasks I need to act on.`
      : '');
    if (!effectiveText || loading) return;

    setInput('');
    setAttachedFiles([]);

    const userMsg = {
      role: 'user',
      content: text,
      capturedPreview: capturedPreview ? (capturedPreview.length > 120 ? capturedPreview.slice(0, 120) + '…' : capturedPreview) : null,
      hasFiles: files.length > 0 ? files.map(f => f.name).join(', ') : null,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { reply, toolCalls, newHistory } = await askClaudeWithGlobalTools(
        effectiveText,
        conversationHistory,
        { grants, budgets, tasks, knowledgeDocs },
        {
          onCreateTasks:    handleCreateTasks,
          onUpdateTasks:    handleUpdateTasks,
          onDeleteTasks:    handleDeleteTasks,
          onUpdateGrant:    handleUpdateGrant,
          onUpdateBudget:   handleUpdateBudget,
          onUpdateCategory: handleUpdateCategory,
          onDeleteCategory: handleDeleteCategory,
          onUpdateMiniPool: handleUpdateMiniPool,
          onDeleteMiniPool: handleDeleteMiniPool,
        },
        files
      );
      setConversationHistory(newHistory);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, toolCalls }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, toolCalls: [] }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Drag and drop ───────────────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsOpen(true);

    const files = Array.from(e.dataTransfer.files);
    const text  = e.dataTransfer.getData('text/plain');

    if (files.length > 0) {
      const names = files.map(f => f.name).join(', ');
      await handleSend(
        `I've dropped these file(s): ${names}. Please analyze the content and extract any action items — create tasks for each one.`,
        files,
        `[Files: ${names}]`
      );
    } else if (text && text.trim()) {
      const trimmed = text.trim();
      await handleSend(
        `I've captured the following text. Please extract all action items and create tasks for each one that needs follow-up:\n\n"${trimmed}"`,
        [],
        trimmed
      );
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Chat cleared. What can I help you with?', toolCalls: [] }]);
    setConversationHistory([]);
  };

  const priorityDot = (p) =>
    p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-gray-400';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title={isDragOver ? 'Drop to capture' : 'AI Assistant'}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 select-none ${
          isDragOver
            ? 'scale-125 ring-4 ring-indigo-400 bg-indigo-700'
            : isOpen
              ? 'bg-gray-700 hover:bg-gray-800'
              : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105'
        }`}
      >
        {isDragOver
          ? <Sparkles size={22} className="text-white animate-pulse" />
          : isOpen
            ? <X size={20} className="text-white" />
            : <Bot size={22} className="text-white" />
        }
        {!isOpen && urgentCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
            {urgentCount > 9 ? '9+' : urgentCount}
          </span>
        )}
      </button>

      {/* Slide-in panel */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 flex flex-col border-l border-gray-200">

          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={18} />
              <span className="font-semibold">AI Assistant</span>
              {urgentCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {urgentCount} urgent
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin text-white/70" />}
              <button onClick={clearChat} className="text-white/70 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors">
                Clear
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Pending / urgent items */}
          {pendingItems.length > 0 && (
            <div className="flex-shrink-0 border-b border-gray-100">
              <button
                onClick={() => setShowPending(p => !p)}
                className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-red-500" />
                  <span>Needs Attention ({pendingItems.length})</span>
                </div>
                {showPending ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
              {showPending && (
                <div className="px-3 pb-2 space-y-1 max-h-36 overflow-y-auto">
                  {pendingItems.slice(0, 6).map(task => (
                    <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot(task.priority)}`} />
                      <span className="text-xs text-gray-700 flex-1 truncate">{task.title}</span>
                      {task.dueDate && (
                        <span className={`text-xs flex-shrink-0 font-medium ${task.dueDate < today ? 'text-red-500' : 'text-amber-500'}`}>
                          {task.dueDate === today ? 'Today' : task.dueDate < today ? 'Overdue' : task.dueDate}
                        </span>
                      )}
                    </div>
                  ))}
                  {pendingItems.length > 6 && (
                    <p className="text-xs text-gray-400 pl-2 pb-1">+{pendingItems.length - 6} more</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-indigo-500" />
                  <span className="text-sm text-gray-500">Working…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-amber-50 flex-shrink-0 flex flex-wrap gap-1.5">
              {attachedFiles.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-amber-200 text-amber-800 px-2 py-1 rounded-full">
                  <Paperclip size={10} />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 hover:text-red-600">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mb-2 text-center text-xs py-1.5 rounded-lg border-2 border-dashed transition-all ${
                isDragOver
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-600 font-medium'
                  : 'border-gray-200 text-gray-400'
              }`}
            >
              {isDragOver ? '✨ Drop to capture action items' : 'Drag text or files here to capture'}
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex-shrink-0"
                title="Attach file (image, PDF, text)"
              >
                <Paperclip size={16} />
              </button>
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Update grant, fix budget, create task…"
                disabled={loading}
                className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 max-h-32"
                style={{ overflowY: 'auto' }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && attachedFiles.length === 0) || loading}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1.5 px-1">Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.txt,.csv,.doc,.docx"
        multiple
        onChange={e => {
          setAttachedFiles(prev => [...prev, ...Array.from(e.target.files)]);
          e.target.value = '';
        }}
      />
    </>
  );
};

export default GlobalAIEditor;
