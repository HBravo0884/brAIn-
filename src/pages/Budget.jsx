import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import BudgetDetails from '../components/budget/BudgetDetails';
import BudgetBuckets from '../components/budget/BudgetBuckets';
import AwardLetterImport from '../components/budget/AwardLetterImport';
import AIAssistant from '../components/ai/AIAssistant';
import { DollarSign, Plus, TrendingUp, TrendingDown, Upload, Droplets, LayoutList, FileCheck } from 'lucide-react';
import { createRWJFBudget } from '../utils/rwjfGrantSetup';

const Budget = () => {
  const { budgets, grants, addBudget } = useApp();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAwardImportOpen, setIsAwardImportOpen] = useState(false);
  const [selectedGrantId, setSelectedGrantId] = useState('');
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [view, setView] = useState('overview'); // 'overview' | 'buckets'

  const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalSpent = budgets.reduce((sum, b) => {
    const categorySpent = b.categories.reduce((catSum, cat) => {
      const miniPoolSpent = (cat.miniPools || []).reduce((miniSum, mini) => {
        const expenseSpent = (mini.expenses || []).reduce((expSum, exp) => {
          // Only count expenses marked as spent (spent !== false)
          return expSum + (exp.spent !== false ? exp.amount : 0);
        }, 0);
        return miniSum + expenseSpent;
      }, 0);
      return catSum + miniPoolSpent;
    }, 0);
    return sum + categorySpent;
  }, 0);
  const budgetRemaining = totalBudget - totalSpent;
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Get grants that don't have budgets yet
  const grantsWithoutBudgets = grants.filter(grant =>
    !budgets.some(budget => budget.grantId === grant.id)
  );

  const handleImportBudget = () => {
    if (!selectedGrantId) {
      alert('Please select a grant');
      return;
    }

    const selectedGrant = grants.find(g => g.id === selectedGrantId);

    // Check if it's the RWJF grant (has specific title)
    if (selectedGrant && selectedGrant.title.includes('RWJF')) {
      // Use the pre-populated RWJF budget
      const rwjfBudget = createRWJFBudget(selectedGrantId);
      addBudget(rwjfBudget);
    } else {
      // Create a basic budget structure from grant aims
      const budgetCategories = [];

      // Add personnel as first category
      budgetCategories.push({
        id: crypto.randomUUID(),
        name: 'Personnel',
        allocated: 0,
        miniPools: [],
        description: 'Salaries, wages, and fringe benefits'
      });

      // Create categories from aims if they exist
      if (selectedGrant.aims && selectedGrant.aims.length > 0) {
        selectedGrant.aims.forEach(aim => {
          budgetCategories.push({
            id: crypto.randomUUID(),
            name: `${aim.number} - ${aim.title}`,
            allocated: aim.budgetAllocation || 0,
            miniPools: [],
            description: aim.description?.substring(0, 100) || ''
          });
        });
      }

      // Add general categories
      budgetCategories.push({
        id: crypto.randomUUID(),
        name: 'Travel',
        allocated: 0,
        miniPools: [],
        description: 'Conference travel, professional development'
      });

      budgetCategories.push({
        id: crypto.randomUUID(),
        name: 'Supplies',
        allocated: 0,
        miniPools: [],
        description: 'Office supplies, equipment, materials'
      });

      const totalAllocated = budgetCategories.reduce((sum, cat) => sum + cat.allocated, 0);

      const newBudget = {
        id: crypto.randomUUID(),
        grantId: selectedGrantId,
        totalBudget: selectedGrant.amount || totalAllocated,
        fiscalYear: new Date().getFullYear(),
        categories: budgetCategories,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      addBudget(newBudget);
    }

    // Reset and close modal
    setSelectedGrantId('');
    setIsImportModalOpen(false);
    alert('Budget imported successfully!');
  };

  // Show detailed view if budget is selected
  if (selectedBudgetId) {
    return (
      <BudgetDetails
        budgetId={selectedBudgetId}
        onClose={() => setSelectedBudgetId(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Tracking</h1>
          <p className="text-gray-600">Monitor your financial allocations and spending</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            disabled={grantsWithoutBudgets.length === 0}
          >
            <Upload size={20} className="mr-2" />
            Import from Grant
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAwardImportOpen(true)}
          >
            <FileCheck size={20} className="mr-2" />
            Import Award Letter
          </Button>
          <Button variant="primary">
            <Plus size={20} className="mr-2" />
            New Budget
          </Button>
        </div>
      </div>

      {/* View Toggle Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-8">
        <button
          onClick={() => setView('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutList size={16} />
          Overview
        </button>
        <button
          onClick={() => setView('buckets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'buckets'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Droplets size={16} />
          Aim Buckets
        </button>
      </div>

      {/* Bucket View */}
      {view === 'buckets' && (
        <BudgetBuckets />
      )}

      {/* Overview View */}
      {view === 'overview' && (
      <>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Budget</p>
              <p className="text-3xl font-bold">${(totalBudget / 1000).toFixed(1)}K</p>
            </div>
            <DollarSign size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Total Spent</p>
              <p className="text-3xl font-bold">${(totalSpent / 1000).toFixed(1)}K</p>
            </div>
            <TrendingDown size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Remaining</p>
              <p className="text-3xl font-bold">${(budgetRemaining / 1000).toFixed(1)}K</p>
            </div>
            <TrendingUp size={40} className="opacity-80" />
          </div>
        </Card>
      </div>

      {/* Budget Progress */}
      {totalBudget > 0 && (
        <Card title="Overall Budget Progress" className="mb-8">
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentageUsed > 90 ? 'bg-red-500' :
                  percentageUsed > 75 ? 'bg-orange-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{percentageUsed.toFixed(1)}% Used</span>
              <span>{(100 - percentageUsed).toFixed(1)}% Available</span>
            </div>
          </div>
        </Card>
      )}

      {/* Budget by Grant */}
      {budgets.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <DollarSign size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No budgets yet</h3>
            <p className="text-gray-500 mb-6">Create your first budget to start tracking expenses</p>
            <Button variant="primary">
              <Plus size={20} className="mr-2" />
              Create Budget
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {budgets.map(budget => {
            const grant = grants.find(g => g.id === budget.grantId);
            const spent = budget.categories.reduce((sum, cat) => {
              const miniPoolSpent = (cat.miniPools || []).reduce((miniSum, mini) => {
                const expenseSpent = (mini.expenses || []).reduce((expSum, exp) => {
                  // Only count expenses marked as spent (spent !== false)
                  return expSum + (exp.spent !== false ? exp.amount : 0);
                }, 0);
                return miniSum + expenseSpent;
              }, 0);
              return sum + miniPoolSpent;
            }, 0);
            const remaining = budget.totalBudget - spent;
            const percentUsed = (spent / budget.totalBudget) * 100;

            return (
              <Card key={budget.id} title={grant?.title || 'Budget'}>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Allocated</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${(budget.totalBudget / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Spent</p>
                      <p className="text-xl font-bold text-orange-600">
                        ${(spent / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Remaining</p>
                      <p className="text-xl font-bold text-green-600">
                        ${(remaining / 1000).toFixed(1)}K
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentUsed > 90 ? 'bg-red-500' :
                        percentUsed > 75 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedBudgetId(budget.id)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Import Budget Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setSelectedGrantId('');
        }}
        title="Import Budget from Grant"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Select a grant to import its budget structure. For RWJF grants, detailed budget line items will be automatically populated.
          </p>

          {grantsWithoutBudgets.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                All grants already have budgets. Delete an existing budget to re-import.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Grant
                </label>
                <select
                  value={selectedGrantId}
                  onChange={(e) => setSelectedGrantId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">-- Choose a grant --</option>
                  {grantsWithoutBudgets.map(grant => (
                    <option key={grant.id} value={grant.id}>
                      {grant.title} - ${(grant.amount / 1000).toFixed(0)}K
                    </option>
                  ))}
                </select>
              </div>

              {selectedGrantId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm font-medium mb-2">
                    What will be imported:
                  </p>
                  <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                    {grants.find(g => g.id === selectedGrantId)?.title.includes('RWJF') ? (
                      <>
                        <li>Complete RWJF budget with 8 categories</li>
                        <li>Detailed line items for all aims</li>
                        <li>Personnel costs with fringe benefits</li>
                        <li>Pre-populated expense entries</li>
                      </>
                    ) : (
                      <>
                        <li>Budget categories based on grant aims</li>
                        <li>Personnel, Travel, and Supplies categories</li>
                        <li>Budget allocations from aim structure</li>
                        <li>Empty line items ready for your entries</li>
                      </>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setSelectedGrantId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImportBudget}
                  disabled={!selectedGrantId}
                >
                  <Upload size={16} className="mr-2" />
                  Import Budget
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Award Letter Import Modal */}
      <Modal
        isOpen={isAwardImportOpen}
        onClose={() => setIsAwardImportOpen(false)}
        title="Import Expenses from Document"
        size="lg"
      >
        <AwardLetterImport onClose={() => setIsAwardImportOpen(false)} />
      </Modal>

      {/* AI Assistant */}
      {budgets.length > 0 ? (
        <AIAssistant
          budgetId={selectedBudgetId || budgets[0].id}
          grantId={budgets.find(b => b.id === (selectedBudgetId || budgets[0].id))?.grantId}
        />
      ) : (
        <div className="fixed bottom-6 right-6 bg-red-500 text-white p-4 rounded-lg z-50">
          No budgets found - AI disabled
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default Budget;
