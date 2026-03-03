import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Plus, Trash2, Check, X, ListTodo, Edit2, Calendar, ChevronDown } from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: 'high',   emoji: '🔴', label: 'High',   color: 'text-red-600 dark:text-red-400' },
  { value: 'medium', emoji: '🟡', label: 'Medium', color: 'text-amber-600 dark:text-amber-400' },
  { value: 'normal', emoji: '⚪', label: 'Normal', color: 'text-gray-400 dark:text-gray-500' },
];

const PRIORITY_ORDER = { high: 0, medium: 1, normal: 2 };

const getPriority = (todo) => todo.priority || 'normal';

const PrioritySelector = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const current = PRIORITY_OPTIONS.find(p => p.value === value) || PRIORITY_OPTIONS[2];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Set priority"
      >
        <span>{current.emoji}</span>
        <ChevronDown size={10} className="text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[100px]">
            {PRIORITY_OPTIONS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => { onChange(p.value); setOpen(false); }}
                className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${p.color}`}
              >
                <span>{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const QuickToDo = () => {
  const { todos, addTodo, updateTodo, deleteTodo } = useApp();
  const [newItemText, setNewItemText] = useState('');
  const [newPriority, setNewPriority] = useState('normal');
  const [newDueDate, setNewDueDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [filterTab, setFilterTab] = useState('active'); // 'all' | 'active' | 'completed'

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItemText.trim()) {
      addTodo({
        id: crypto.randomUUID(),
        text: newItemText.trim(),
        completed: false,
        priority: newPriority,
        dueDate: newDueDate || null,
        createdAt: new Date().toISOString(),
      });
      setNewItemText('');
      setNewPriority('normal');
      setNewDueDate('');
    }
  };

  const handleToggleComplete = (todo) => {
    updateTodo(todo.id, { ...todo, completed: !todo.completed });
  };

  const handleStartEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const handleSaveEdit = (todo) => {
    if (editText.trim()) {
      updateTodo(todo.id, { ...todo, text: editText.trim() });
      setEditingId(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this item?')) {
      deleteTodo(id);
    }
  };

  // Sort: priority desc, then due date asc (undated last), then created asc
  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      const pA = PRIORITY_ORDER[getPriority(a)] ?? 2;
      const pB = PRIORITY_ORDER[getPriority(b)] ?? 2;
      if (pA !== pB) return pA - pB;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
  }, [todos]);

  const filteredTodos = useMemo(() => {
    if (filterTab === 'active') return sortedTodos.filter(t => !t.completed);
    if (filterTab === 'completed') return sortedTodos.filter(t => t.completed);
    return sortedTodos;
  }, [sortedTodos, filterTab]);

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  const todayStr = new Date().toISOString().slice(0, 10);

  const isOverdue = (todo) =>
    !todo.completed && todo.dueDate && todo.dueDate < todayStr;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Personal To-Do</h1>
        <p className="text-gray-600 dark:text-gray-400">Personal checklist — quick captures that don't need a full grant task card</p>
      </div>

      {/* Add New Item */}
      <Card>
        <form onSubmit={handleAddItem} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Capture something quick... (or press Space from any page)"
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <Button type="submit" variant="primary" disabled={!newItemText.trim()}>
              <Plus size={16} className="mr-1" />
              Add
            </Button>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Priority */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Priority:</span>
              <div className="flex gap-1">
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setNewPriority(p.value)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      newPriority === p.value
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Due date */}
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-gray-400" />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>
        </form>
      </Card>

      {/* Stats + Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'active', label: `Active (${activeTodos.length})` },
          { id: 'completed', label: `Completed (${completedTodos.length})` },
          { id: 'all', label: `All (${todos.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Todo list */}
      {filteredTodos.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <ListTodo size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {filterTab === 'active' ? "Nothing active — you're all caught up!" :
               filterTab === 'completed' ? 'Nothing completed yet' :
               'No items yet. Add one above or press Space from any page.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTodos.map(todo => {
            const priority = getPriority(todo);
            const priorityDef = PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[2];
            const overdue = isOverdue(todo);

            return (
              <div
                key={todo.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  todo.completed
                    ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-60'
                    : overdue
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(todo)}
                  className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                    todo.completed
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                  }`}
                >
                  {todo.completed && <Check size={12} className="text-white" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingId === todo.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-400 outline-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(todo);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <button onClick={() => handleSaveEdit(todo)} className="text-green-600 hover:text-green-700 p-0.5"><Check size={16} /></button>
                      <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 p-0.5"><X size={16} /></button>
                    </div>
                  ) : (
                    <span className={`text-sm ${todo.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                      {todo.text}
                    </span>
                  )}
                  {/* Due date tag */}
                  {todo.dueDate && editingId !== todo.id && (
                    <span className={`inline-flex items-center gap-1 mt-1 text-[10px] px-1.5 py-0.5 rounded ${
                      overdue
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      <Calendar size={9} />
                      {overdue ? 'Overdue · ' : ''}
                      {new Date(todo.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Priority + Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm" title={priorityDef.label}>{priorityDef.emoji}</span>
                  {!todo.completed && (
                    <>
                      <PrioritySelector
                        value={priority}
                        onChange={(val) => updateTodo(todo.id, { ...todo, priority: val })}
                      />
                      <button
                        onClick={() => handleStartEdit(todo)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuickToDo;
