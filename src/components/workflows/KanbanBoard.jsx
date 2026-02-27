import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import { Plus, MoreVertical, Edit, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const KanbanBoard = () => {
  const { tasks, addTask, updateTask, deleteTask, grants } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'medium',
    dueDate: '',
    assignee: '',
    grantId: ''
  });

  const columns = ['To Do', 'In Progress', 'Review', 'Done'];

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTask) {
      updateTask(editingTask.id, formData);
    } else {
      addTask(formData);
    }
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'medium',
      dueDate: '',
      assignee: '',
      grantId: ''
    });
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      assignee: task.assignee || '',
      grantId: task.grantId || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
    }
  };

  const moveTask = (taskId, newStatus) => {
    updateTask(taskId, { status: newStatus });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Kanban Board</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingTask(null);
            setFormData({
              title: '',
              description: '',
              status: 'To Do',
              priority: 'medium',
              dueDate: '',
              assignee: '',
              grantId: ''
            });
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} className="mr-1" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => {
          const columnTasks = tasks.filter(task => task.status === column);

          return (
            <div key={column} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{column}</h3>
                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.map(task => {
                  const grant = grants.find(g => g.id === task.grantId);

                  return (
                    <Card key={task.id} className="p-4 cursor-pointer hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm flex-1">{task.title}</h4>
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        {grant && (
                          <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                            {grant.title.substring(0, 20)}
                          </span>
                        )}
                      </div>

                      {task.dueDate && (
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <Calendar size={12} className="mr-1" />
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}

                      {task.assignee && (
                        <div className="text-xs text-gray-500 mt-2">
                          Assigned to: {task.assignee}
                        </div>
                      )}

                      {/* Quick move buttons */}
                      <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                        {columns.filter(c => c !== column).map(targetColumn => (
                          <button
                            key={targetColumn}
                            onClick={() => moveTask(task.id, targetColumn)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            → {targetColumn}
                          </button>
                        ))}
                      </div>
                    </Card>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Task Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Review grant application"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Task details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={columns.map(col => ({ value: col, label: col }))}
              required
            />

            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]}
              required
            />
          </div>

          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />

          <Input
            label="Assignee"
            value={formData.assignee}
            onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
            placeholder="e.g., John Doe"
          />

          <Select
            label="Related Grant (Optional)"
            value={formData.grantId}
            onChange={(e) => setFormData({ ...formData, grantId: e.target.value })}
            options={grants.map(g => ({ value: g.id, label: g.title }))}
          />

          <div className="flex justify-end gap-3 mt-6">
            {editingTask && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  handleDelete(editingTask.id);
                  setIsModalOpen(false);
                }}
              >
                <Trash2 size={16} className="mr-1" />
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTask ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KanbanBoard;
