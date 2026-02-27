import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import EnhancedGrantDetails from '../components/grants/EnhancedGrantDetails';
import { createRWJFGrant, createRWJFBudget } from '../utils/rwjfGrantSetup';
import { Plus, Award, Edit, Trash2, Calendar, DollarSign, Eye, Target, Star } from 'lucide-react';
import { format } from 'date-fns';

const Grants = () => {
  const { grants, addGrant, updateGrant, deleteGrant, addBudget } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState(null);
  const [viewingGrant, setViewingGrant] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    fundingAgency: '',
    amount: '',
    status: 'pending',
    startDate: '',
    endDate: '',
    aims: []
  });

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const grantData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    if (editingGrant) {
      updateGrant(editingGrant.id, grantData);
    } else {
      addGrant(grantData);
    }
    setIsModalOpen(false);
    setEditingGrant(null);
    setFormData({
      title: '',
      fundingAgency: '',
      amount: '',
      status: 'pending',
      startDate: '',
      endDate: '',
      aims: []
    });
  };

  const handleEdit = (grant) => {
    setEditingGrant(grant);
    setFormData({
      title: grant.title,
      fundingAgency: grant.fundingAgency,
      amount: grant.amount.toString(),
      status: grant.status,
      startDate: grant.startDate,
      endDate: grant.endDate,
      aims: grant.aims || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this grant?')) {
      deleteGrant(id);
    }
  };

  const handleCreateRWJFGrant = () => {
    if (window.confirm('This will create a complete RWJF grant structure with 5 aims (including Aim 5 - Re-Entry), KPIs, and milestones. You can edit everything after creation. Continue?')) {
      const rwjfGrant = createRWJFGrant();
      addGrant(rwjfGrant);

      // Also create a budget structure for the grant
      // We need to get the grant ID after it's created, so we'll use a timeout
      setTimeout(() => {
        const createdGrant = grants[grants.length - 1];
        if (createdGrant) {
          const rwjfBudget = createRWJFBudget(createdGrant.id);
          addBudget(rwjfBudget);
          alert('RWJF Grant created successfully with 5 aims! Click "View Details" to edit aims, add timelines, and allocate budgets.');
        }
      }, 100);
    }
  };

  // Check if RWJF grant already exists
  const rwjfGrantExists = grants.some(g => g.title.includes('RWJF'));

  // If viewing grant details, show EnhancedGrantDetails component
  if (viewingGrant) {
    return (
      <EnhancedGrantDetails
        grant={viewingGrant}
        onClose={() => setViewingGrant(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Grants</h1>
          <p className="text-gray-600">Manage your grant applications and awards</p>
        </div>
        <div className="flex gap-3">
          {!rwjfGrantExists && (
            <Button
              variant="success"
              onClick={handleCreateRWJFGrant}
              className="flex items-center gap-2"
            >
              <Star size={20} />
              Create RWJF Grant
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => {
              setEditingGrant(null);
              setFormData({
                title: '',
                fundingAgency: '',
                amount: '',
                status: 'pending',
                startDate: '',
                endDate: '',
                aims: []
              });
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} className="mr-2" />
            New Grant
          </Button>
        </div>
      </div>

      {!rwjfGrantExists && grants.length === 0 && (
        <Card className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Star size={32} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Quick Start: Create Your RWJF Grant
              </h3>
              <p className="text-gray-700 mb-4">
                Get started instantly with a pre-configured RWJF grant structure that includes:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-0.5">✓</span>
                  <span><strong>5 Grant Aims</strong> (Aim 1-4 + Aim 5 Re-Entry Program)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-0.5">✓</span>
                  <span><strong>KPIs for each aim</strong> with tracking fields</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-0.5">✓</span>
                  <span><strong>Milestones</strong> for each aim with completion tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-0.5">✓</span>
                  <span><strong>Budget structure</strong> with categories (Personnel, Travel, Gift Cards, etc.)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-0.5">✓</span>
                  <span><strong>Fully editable</strong> - Customize titles, dates, budgets, and all details</span>
                </li>
              </ul>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCreateRWJFGrant}
                className="flex items-center gap-2"
              >
                <Star size={20} />
                Create RWJF Grant Structure
              </Button>
            </div>
          </div>
        </Card>
      )}

      {grants.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Award size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No grants yet</h3>
            <p className="text-gray-500 mb-6">Add your first grant to get started</p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} className="mr-2" />
              Create Grant
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {grants.map(grant => (
            <Card key={grant.id} className="hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{grant.title}</h3>
                  <p className="text-gray-600 mb-3">{grant.fundingAgency}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      grant.status === 'active' ? 'bg-green-100 text-green-700' :
                      grant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      grant.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {grant.status}
                    </span>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign size={16} className="mr-1" />
                      ${(grant.amount / 1000).toFixed(1)}K
                    </div>
                  </div>
                </div>
              </div>

              {grant.startDate && (
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <Calendar size={16} className="mr-2" />
                  {format(new Date(grant.startDate), 'MMM d, yyyy')} - {grant.endDate ? format(new Date(grant.endDate), 'MMM d, yyyy') : 'Ongoing'}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setViewingGrant(grant)}
                  className="flex-1"
                >
                  <Eye size={16} className="mr-1" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(grant)}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(grant.id)}
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
          setEditingGrant(null);
        }}
        title={editingGrant ? 'Edit Grant' : 'Create Grant'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Grant Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., NIH Research Grant"
          />
          <Input
            label="Funding Agency"
            value={formData.fundingAgency}
            onChange={(e) => setFormData({ ...formData, fundingAgency: e.target.value })}
            required
            placeholder="e.g., National Institutes of Health"
          />
          <Input
            label="Amount ($)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            placeholder="e.g., 250000"
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statusOptions}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
              {editingGrant ? 'Update' : 'Create'} Grant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Grants;
