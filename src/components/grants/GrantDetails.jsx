import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import { Plus, Edit, Trash2, Target, Calendar, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const GrantDetails = ({ grant, onClose }) => {
  const { updateGrant, budgets } = useApp();
  const [editingAim, setEditingAim] = useState(null);
  const [isAimModalOpen, setIsAimModalOpen] = useState(false);
  const [aimFormData, setAimFormData] = useState({
    number: '',
    title: '',
    description: '',
    targetDate: '',
    status: 'in-progress',
    budgetAllocation: '',
    completionPercentage: 0,
    kpis: [],
    milestones: []
  });

  const grantBudget = budgets.find(b => b.grantId === grant.id);
  const aims = grant.aims || [];

  const handleAddAim = () => {
    setEditingAim(null);
    setAimFormData({
      number: '',
      title: '',
      description: '',
      targetDate: '',
      status: 'in-progress',
      budgetAllocation: '',
      completionPercentage: 0,
      kpis: [],
      milestones: []
    });
    setIsAimModalOpen(true);
  };

  const handleEditAim = (aim) => {
    setEditingAim(aim);
    setAimFormData({
      number: aim.number,
      title: aim.title,
      description: aim.description,
      targetDate: aim.targetDate || '',
      status: aim.status,
      budgetAllocation: aim.budgetAllocation?.toString() || '',
      completionPercentage: aim.completionPercentage || 0,
      kpis: aim.kpis || [],
      milestones: aim.milestones || []
    });
    setIsAimModalOpen(true);
  };

  const handleSaveAim = () => {
    const aimData = {
      ...aimFormData,
      id: editingAim?.id || crypto.randomUUID(),
      budgetAllocation: parseFloat(aimFormData.budgetAllocation) || 0,
      completionPercentage: parseInt(aimFormData.completionPercentage) || 0,
      budgetSpent: editingAim?.budgetSpent || 0
    };

    let updatedAims;
    if (editingAim) {
      updatedAims = aims.map(a => a.id === editingAim.id ? aimData : a);
    } else {
      updatedAims = [...aims, aimData];
    }

    updateGrant(grant.id, { aims: updatedAims });
    setIsAimModalOpen(false);
  };

  const handleDeleteAim = (aimId) => {
    if (window.confirm('Are you sure you want to delete this aim?')) {
      const updatedAims = aims.filter(a => a.id !== aimId);
      updateGrant(grant.id, { aims: updatedAims });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'not-started': 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'at-risk': 'bg-red-100 text-red-700',
      'on-hold': 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || colors['in-progress'];
  };

  const totalBudgetAllocated = aims.reduce((sum, aim) => sum + (aim.budgetAllocation || 0), 0);
  const avgCompletion = aims.length > 0
    ? aims.reduce((sum, aim) => sum + (aim.completionPercentage || 0), 0) / aims.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Grant Summary */}
      <Card title="Grant Overview">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">
              ${(grant.amount / 1000).toFixed(0)}K
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
              grant.status === 'active' ? 'bg-green-100 text-green-700' :
              grant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              grant.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>
              {grant.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Aims</p>
            <p className="text-xl font-bold text-gray-900">{aims.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Avg Progress</p>
            <p className="text-xl font-bold text-green-600">{avgCompletion.toFixed(0)}%</p>
          </div>
        </div>

        {grant.startDate && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar size={16} className="mr-2" />
              {format(new Date(grant.startDate), 'MMM d, yyyy')} - {grant.endDate ? format(new Date(grant.endDate), 'MMM d, yyyy') : 'Ongoing'}
            </div>
          </div>
        )}

        {grantBudget && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Budget Utilization</span>
              <span className="font-medium">${(grantBudget.totalBudget / 1000).toFixed(0)}K allocated</span>
            </div>
          </div>
        )}
      </Card>

      {/* Aims Section */}
      <Card
        title="Grant Aims & Objectives"
        subtitle={`${aims.length} aim${aims.length !== 1 ? 's' : ''} defined`}
        actions={
          <Button variant="primary" size="sm" onClick={handleAddAim}>
            <Plus size={16} className="mr-1" />
            Add Aim
          </Button>
        }
      >
        {aims.length === 0 ? (
          <div className="text-center py-8">
            <Target size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">No aims defined yet</p>
            <Button variant="primary" onClick={handleAddAim}>
              <Plus size={16} className="mr-2" />
              Add First Aim
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {aims.map(aim => {
              const budgetSpentPercent = aim.budgetAllocation > 0
                ? (aim.budgetSpent / aim.budgetAllocation) * 100
                : 0;

              return (
                <Card key={aim.id} className="bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">{aim.number}</h4>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(aim.status)}`}>
                          {aim.status}
                        </span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">{aim.title}</h5>
                      <p className="text-sm text-gray-600 mb-3">{aim.description}</p>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Completion</span>
                          <span className="font-medium">{aim.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-full rounded-full transition-all ${
                              aim.completionPercentage >= 75 ? 'bg-green-500' :
                              aim.completionPercentage >= 50 ? 'bg-blue-500' :
                              aim.completionPercentage >= 25 ? 'bg-yellow-500' :
                              'bg-orange-500'
                            }`}
                            style={{ width: `${aim.completionPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Budget Info */}
                      {aim.budgetAllocation > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">Allocated</p>
                              <p className="font-medium">${(aim.budgetAllocation / 1000).toFixed(0)}K</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Spent</p>
                              <p className="font-medium text-orange-600">${(aim.budgetSpent / 1000).toFixed(0)}K</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Remaining</p>
                              <p className="font-medium text-green-600">
                                ${((aim.budgetAllocation - aim.budgetSpent) / 1000).toFixed(0)}K
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Target Date */}
                      {aim.targetDate && (
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <Calendar size={14} className="mr-1" />
                          Target: {format(new Date(aim.targetDate), 'MMM d, yyyy')}
                        </div>
                      )}

                      {/* KPIs Count */}
                      {aim.kpis && aim.kpis.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <TrendingUp size={14} className="inline mr-1" />
                          {aim.kpis.length} KPI{aim.kpis.length !== 1 ? 's' : ''} tracked
                        </div>
                      )}

                      {/* Milestones Count */}
                      {aim.milestones && aim.milestones.length > 0 && (
                        <div className="mt-1 text-sm text-gray-600">
                          <CheckCircle size={14} className="inline mr-1" />
                          {aim.milestones.filter(m => m.completed).length} / {aim.milestones.length} milestones completed
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleEditAim(aim)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteAim(aim.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Budget Allocated to Aims</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${(totalBudgetAllocated / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Average Completion</p>
                  <p className="text-lg font-bold text-green-600">{avgCompletion.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Aim Modal */}
      <Modal
        isOpen={isAimModalOpen}
        onClose={() => setIsAimModalOpen(false)}
        title={editingAim ? 'Edit Aim' : 'Add New Aim'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Aim Number"
            value={aimFormData.number}
            onChange={(e) => setAimFormData({ ...aimFormData, number: e.target.value })}
            required
            placeholder="e.g., Aim 1, Aim 5 - Re-Entry"
          />

          <Input
            label="Aim Title"
            value={aimFormData.title}
            onChange={(e) => setAimFormData({ ...aimFormData, title: e.target.value })}
            required
            placeholder="Brief title for this aim"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={aimFormData.description}
              onChange={(e) => setAimFormData({ ...aimFormData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Detailed description of this aim's objectives..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={aimFormData.status}
              onChange={(e) => setAimFormData({ ...aimFormData, status: e.target.value })}
              options={[
                { value: 'not-started', label: 'Not Started' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'at-risk', label: 'At Risk' },
                { value: 'on-hold', label: 'On Hold' }
              ]}
              required
            />

            <Input
              label="Completion %"
              type="number"
              value={aimFormData.completionPercentage}
              onChange={(e) => setAimFormData({ ...aimFormData, completionPercentage: e.target.value })}
              min="0"
              max="100"
              placeholder="0-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Budget Allocation ($)"
              type="number"
              value={aimFormData.budgetAllocation}
              onChange={(e) => setAimFormData({ ...aimFormData, budgetAllocation: e.target.value })}
              placeholder="0"
            />

            <Input
              label="Target Date"
              type="date"
              value={aimFormData.targetDate}
              onChange={(e) => setAimFormData({ ...aimFormData, targetDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsAimModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAim}>
              {editingAim ? 'Update' : 'Add'} Aim
            </Button>
          </div>
        </div>
      </Modal>

      {/* Close Button */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default GrantDetails;
