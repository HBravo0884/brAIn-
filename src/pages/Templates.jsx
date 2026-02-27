import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import TemplateLibrary from '../components/templates/TemplateLibrary';
import { Plus, FileText, Edit, Trash2, Library } from 'lucide-react';

const Templates = () => {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    fields: []
  });

  const categories = [
    { value: 'grant-application', label: 'Grant Application' },
    { value: 'progress-report', label: 'Progress Report' },
    { value: 'budget-summary', label: 'Budget Summary' },
    { value: 'payment-request', label: 'Payment Request' },
    { value: 'meeting-report', label: 'Meeting Report' },
    { value: 'budget-justification', label: 'Budget Justification' },
    { value: 'notification', label: 'Notification' },
    { value: 'custom', label: 'Custom' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, formData);
    } else {
      addTemplate(formData);
    }
    setIsModalOpen(false);
    setEditingTemplate(null);
    setFormData({ name: '', category: '', description: '', fields: [] });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      description: template.description,
      fields: template.fields
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates</h1>
          <p className="text-gray-600">Manage your document templates</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsLibraryOpen(true)}
          >
            <Library size={20} className="mr-2" />
            Template Library
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditingTemplate(null);
              setFormData({ name: '', category: '', description: '', fields: [] });
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-6">Create your first template to get started</p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} className="mr-2" />
              Create Template
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card key={template.id} className="hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                    {categories.find(c => c.value === template.category)?.label || template.category}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.description}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  className="flex-1"
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }}
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Template Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Grant Application Form"
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={categories}
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Describe the purpose of this template..."
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </form>
      </Modal>

      <TemplateLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />
    </div>
  );
};

export default Templates;
