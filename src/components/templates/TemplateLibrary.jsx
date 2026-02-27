import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { defaultTemplates } from '../../utils/defaultTemplates';
import { rwjfTemplates } from '../../utils/rwjfTemplates';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { FileText, Plus, Eye, Star } from 'lucide-react';

const TemplateLibrary = ({ isOpen, onClose }) => {
  const { addTemplate } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('rwjf'); // rwjf or standard

  const handleLoadTemplate = (template) => {
    addTemplate({
      ...template,
      name: template.name + ' (Copy)',
    });
    alert(`Template "${template.name}" has been added to your templates!`);
  };

  const allTemplates = activeTab === 'rwjf' ? rwjfTemplates : defaultTemplates;

  const categoryColors = {
    'grant-application': 'bg-blue-100 text-blue-700',
    'progress-report': 'bg-green-100 text-green-700',
    'budget-summary': 'bg-purple-100 text-purple-700',
    'payment-request': 'bg-orange-100 text-orange-700',
    'meeting-report': 'bg-pink-100 text-pink-700',
    'budget-justification': 'bg-indigo-100 text-indigo-700',
    'notification': 'bg-yellow-100 text-yellow-700',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Template Library" size="xl">
      <div className="space-y-4">
        <p className="text-gray-600">
          Choose from pre-built templates to get started quickly
        </p>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b pb-3">
          <button
            onClick={() => setActiveTab('rwjf')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'rwjf'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star size={16} />
            RWJF Specific ({rwjfTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('standard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'standard'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText size={16} />
            Standard Templates ({defaultTemplates.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allTemplates.map((template, index) => (
            <Card key={index} className="hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText size={24} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${categoryColors[template.category]}`}>
                    {template.category.replace('-', ' ')}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{template.description}</p>

              <div className="text-xs text-gray-500 mb-4">
                {template.fields.length} fields
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTemplate(template)}
                  className="flex-1"
                >
                  <Eye size={16} className="mr-1" />
                  Preview
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLoadTemplate(template)}
                  className="flex-1"
                >
                  <Plus size={16} className="mr-1" />
                  Use Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <Modal
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          title={`Preview: ${selectedTemplate.name}`}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-gray-600">{selectedTemplate.description}</p>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Form Fields:</h4>
              <div className="space-y-3">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{field.label}</span>
                        {field.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{field.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setSelectedTemplate(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleLoadTemplate(selectedTemplate);
                  setSelectedTemplate(null);
                  onClose();
                }}
              >
                <Plus size={16} className="mr-1" />
                Use This Template
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default TemplateLibrary;
