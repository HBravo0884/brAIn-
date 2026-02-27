import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { askClaudeWithWorkflowTools } from '../../utils/ai';
import {
  Bot, Send, ChevronDown, ChevronUp, Sparkles,
  CheckCircle, RefreshCw, Trash2, X, Loader2
} from 'lucide-react';

// ── Quick action chips ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: '💳 P-Card SOP tasks',         prompt: 'Generate a complete task checklist for the P-Card workflow (Workflow A) including fund loading, purchase rules, and the monthly PaymentNet reconciliation deadline.' },
  { label: '✈️ Student travel checklist', prompt: 'Generate the full 4-phase student conference travel checklist with T-60 and T-30 day tasks.' },
  { label: '🎁 Aim 5 stipend flow',        prompt: 'Create tasks for processing an Aim 5 direct payment (stipend or gift card) through Workflow D.' },
  { label: '📋 Workday Req steps',         prompt: 'Generate tasks for submitting a Workday requisition including quotes if needed (Workflow B).' },
  { label: '⚠️ Overdue check',            prompt: 'Which tasks on the board are overdue? List them and move them to high priority.' },
  { label: '🧹 Clear Done tasks',          prompt: 'Delete all tasks that are currently in the "Done" column.' },
];

// ── Tool call badge ───────────────────────────────────────────────────────────
function ToolBadge({ call }) {
  const config = {
    create: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200', label: `Created ${call.count} task${call.count !== 1 ? 's' : ''}` },
    update: { icon: RefreshCw,    color: 'bg-blue-100 text-blue-800 border-blue-200',   label: `Updated ${call.count} task${call.count !== 1 ? 's' : ''}` },
    delete: { icon: Trash2,       color: 'bg-red-100 text-red-800 border-red-200',      label: `Deleted ${call.count} task${call.count !== 1 ? 's' : ''}` },
  };
  const c = config[call.type];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${c.color}`}>
      <Icon size={11} />
      {c.label}
    </span>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[85%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Tool call badges */}
        {msg.toolCalls?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.toolCalls.map((tc, i) => <ToolBadge key={i} call={tc} />)}
          </div>
        )}
        {/* Text bubble */}
        {msg.content && (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          }`}>
            {msg.content}
          </div>
        )}
        {/* Task preview (after create) */}
        {msg.toolCalls?.filter(tc => tc.type === 'create').flatMap(tc => tc.tasks || []).slice(0, 3).map((t, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 shadow-sm w-full">
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
            <span className="font-medium">{t.title}</span>
            {t.dueDate && <span className="text-gray-400 ml-2">· {t.dueDate}</span>}
          </div>
        ))}
        {msg.toolCalls?.filter(tc => tc.type === 'create').flatMap(tc => tc.tasks || []).length > 3 && (
          <div className="text-xs text-gray-400 pl-1">
            + {msg.toolCalls.filter(tc => tc.type === 'create').flatMap(tc => tc.tasks || []).length - 3} more tasks
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const WorkflowAIChat = () => {
  const { tasks, grants, addTask, updateTask, deleteTask } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I can manage your Kanban board using natural language. Try asking me to generate a P-Card SOP checklist, create the student travel tasks, check what's overdue, or anything else — I'll make the changes directly.",
      toolCalls: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // ── Tool callbacks ──────────────────────────────────────────────────────────
  const handleCreateTasks = async (taskDefs) => {
    const created = [];
    for (const def of taskDefs) {
      // addTask returns void — we generate the ID ourselves so we can return them
      const id = crypto.randomUUID();
      addTask({ id, ...def });
      created.push({ id, ...def });
    }
    return created;
  };

  const handleUpdateTasks = async (updates) => {
    for (const { taskId, ...rest } of updates) {
      updateTask(taskId, rest);
    }
  };

  const handleDeleteTasks = async (ids) => {
    for (const id of ids) {
      deleteTask(id);
    }
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async (text = input.trim()) => {
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { reply, toolCalls, newHistory } = await askClaudeWithWorkflowTools(
        text,
        conversationHistory,
        { tasks, grants },
        {
          onCreateTasks: handleCreateTasks,
          onUpdateTasks: handleUpdateTasks,
          onDeleteTasks: handleDeleteTasks,
        }
      );

      setConversationHistory(newHistory);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: reply, toolCalls },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Sorry, something went wrong: ${err.message}`, toolCalls: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared. What would you like to do with the board?",
      toolCalls: [],
    }]);
    setConversationHistory([]);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mt-6">
      {/* Toggle bar */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={16} />
          </div>
          <span className="font-semibold">Workflow AI</span>
          <span className="text-blue-200 text-sm">· Manage board with natural language</span>
        </div>
        <div className="flex items-center gap-3">
          {loading && <Loader2 size={16} className="animate-spin text-blue-200" />}
          {!loading && messages.length > 1 && (
            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {messages.length - 1} {messages.length === 2 ? 'message' : 'messages'}
            </span>
          )}
          {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-b-xl shadow-lg overflow-hidden">
          {/* Quick actions */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-indigo-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(qa.prompt)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  <span className="text-sm text-gray-500">Working on it...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="e.g. Create P-Card tasks for this month, move all Done tasks to archive, generate Aim 5 checklist..."
                disabled={loading}
                className="flex-1 resize-none px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 max-h-32"
                style={{ overflowY: 'auto' }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow"
              >
                <Send size={16} />
              </button>
              <button
                onClick={clearChat}
                title="Clear chat history"
                className="p-2.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1.5 px-1">Press Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowAIChat;
