import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Plus, Trash2, Check, X, ListTodo, Edit2 } from 'lucide-react';

const QuickToDo = () => {
  const { todos, addTodo, updateTodo, deleteTodo } = useApp();
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItemText.trim()) {
      addTodo({
        id: crypto.randomUUID(),
        text: newItemText.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      });
      setNewItemText('');
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

  const incompleteTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick To-Do</h1>
          <p className="text-gray-600">Simple lists for quick tasks and reminders</p>
        </div>
      </div>

      {/* Add New Item */}
      <Card className="mb-6">
        <form onSubmit={handleAddItem} className="flex gap-3">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add a new to-do item..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg"
            autoFocus
          />
          <Button type="submit" variant="primary" disabled={!newItemText.trim()}>
            <Plus size={20} className="mr-2" />
            Add
          </Button>
        </form>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Active Items</p>
              <p className="text-3xl font-bold">{incompleteTodos.length}</p>
            </div>
            <ListTodo size={40} className="opacity-80" />
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold">{completedTodos.length}</p>
            </div>
            <Check size={40} className="opacity-80" />
          </div>
        </Card>
      </div>

      {/* Active Items */}
      {incompleteTodos.length > 0 && (
        <Card title="Active Items" className="mb-6">
          <div className="space-y-2">
            {incompleteTodos.map(todo => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <button
                  onClick={() => handleToggleComplete(todo)}
                  className="flex-shrink-0 w-6 h-6 border-2 border-gray-400 rounded hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  {todo.completed && (
                    <Check size={16} className="text-green-500" />
                  )}
                </button>

                {editingId === todo.id ? (
                  <>
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(todo);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <button
                      onClick={() => handleSaveEdit(todo)}
                      className="text-green-600 hover:text-green-700 p-1"
                      title="Save"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-gray-600 hover:text-gray-700 p-1"
                      title="Cancel"
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-gray-900">{todo.text}</span>
                    <button
                      onClick={() => handleStartEdit(todo)}
                      className="text-gray-500 hover:text-primary-600 p-1"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="text-gray-500 hover:text-red-600 p-1"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Completed Items */}
      {completedTodos.length > 0 && (
        <Card title="Completed" className="opacity-75">
          <div className="space-y-2">
            {completedTodos.map(todo => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <button
                  onClick={() => handleToggleComplete(todo)}
                  className="flex-shrink-0 w-6 h-6 border-2 border-green-500 bg-green-500 rounded hover:border-green-600 transition-colors flex items-center justify-center"
                >
                  <Check size={16} className="text-white" />
                </button>
                <span className="flex-1 text-gray-500 line-through">{todo.text}</span>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {todos.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <ListTodo size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No items yet</h3>
            <p className="text-gray-500">Add your first to-do item above to get started</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default QuickToDo;
