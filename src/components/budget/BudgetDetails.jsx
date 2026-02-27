import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Lock,
  Receipt,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Link2
} from 'lucide-react';

const BudgetDetails = ({ budgetId, onClose }) => {
  const { budgets, grants, updateBudget, addDocument, addTask } = useApp();
  const budget = budgets.find(b => b.id === budgetId);
  const grant = grants.find(g => g.id === budget?.grantId);

  const [expandedMiniPools, setExpandedMiniPools] = useState({});
  const [isAddMiniPoolModalOpen, setIsAddMiniPoolModalOpen] = useState(false);
  const [isEditMiniPoolModalOpen, setIsEditMiniPoolModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMiniPool, setSelectedMiniPool] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [miniPoolFormData, setMiniPoolFormData] = useState({
    description: '',
    allocated: '',
    notes: ''
  });

  const [expenseFormData, setExpenseFormData] = useState({
    description: '',
    amount: '',
    vendor: '',
    date: '',
    notes: '',
    receipts: [],
    spent: true, // Default to spent (counts immediately)
    // Timeline/Kanban fields
    dueDate: '',
    assignee: '',
    priority: 'medium',
    addToKanban: false,
    linkedTaskId: null
  });

  const [isDragging, setIsDragging] = useState(false);

  if (!budget) return <div>Budget not found</div>;

  const toggleMiniPool = (categoryId, miniPoolId) => {
    const key = `${categoryId}-${miniPoolId}`;
    setExpandedMiniPools(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isMiniPoolExpanded = (categoryId, miniPoolId) => {
    const key = `${categoryId}-${miniPoolId}`;
    return expandedMiniPools[key] || false;
  };

  // Calculate totals - only count expenses marked as spent
  const totalSpent = budget.categories.reduce((sum, cat) => {
    const categorySpent = (cat.miniPools || []).reduce((miniSum, mini) => {
      const miniSpent = (mini.expenses || []).reduce((expSum, exp) => {
        // Only count if expense.spent is true (default to true for backward compatibility)
        return expSum + (exp.spent !== false ? exp.amount : 0);
      }, 0);
      return miniSum + miniSpent;
    }, 0);
    return sum + categorySpent;
  }, 0);

  const totalRemaining = budget.totalBudget - totalSpent;
  const percentUsed = (totalSpent / budget.totalBudget) * 100;

  // Mini-Pool Management
  const handleAddMiniPool = (categoryId) => {
    const category = budget.categories.find(c => c.id === categoryId);
    setSelectedCategory(category);
    setMiniPoolFormData({ description: '', allocated: '', notes: '' });
    setIsAddMiniPoolModalOpen(true);
  };

  const handleSaveMiniPool = () => {
    const allocated = parseFloat(miniPoolFormData.allocated);
    if (!miniPoolFormData.description || !allocated) {
      alert('Please fill in description and allocated amount');
      return;
    }

    const newMiniPool = {
      id: crypto.randomUUID(),
      description: miniPoolFormData.description,
      allocated: allocated,
      notes: miniPoolFormData.notes,
      expenses: []
    };

    const updatedCategories = budget.categories.map(cat => {
      if (cat.id === selectedCategory.id) {
        return {
          ...cat,
          miniPools: [...(cat.miniPools || []), newMiniPool]
        };
      }
      return cat;
    });

    updateBudget(budget.id, { categories: updatedCategories });
    setIsAddMiniPoolModalOpen(false);
    setSelectedCategory(null);
  };

  const handleEditMiniPool = (categoryId, miniPool) => {
    const category = budget.categories.find(c => c.id === categoryId);
    setSelectedCategory(category);
    setSelectedMiniPool(miniPool);
    setMiniPoolFormData({
      description: miniPool.description,
      allocated: miniPool.allocated.toString(),
      notes: miniPool.notes || ''
    });
    setIsEditMiniPoolModalOpen(true);
  };

  const handleUpdateMiniPool = () => {
    const allocated = parseFloat(miniPoolFormData.allocated);
    if (!miniPoolFormData.description || !allocated) {
      alert('Please fill in description and allocated amount');
      return;
    }

    const updatedCategories = budget.categories.map(cat => {
      if (cat.id === selectedCategory.id) {
        const updatedMiniPools = (cat.miniPools || []).map(mini => {
          if (mini.id === selectedMiniPool.id) {
            return {
              ...mini,
              description: miniPoolFormData.description,
              allocated: allocated,
              notes: miniPoolFormData.notes
            };
          }
          return mini;
        });
        return { ...cat, miniPools: updatedMiniPools };
      }
      return cat;
    });

    updateBudget(budget.id, { categories: updatedCategories });
    setIsEditMiniPoolModalOpen(false);
    setSelectedCategory(null);
    setSelectedMiniPool(null);
  };

  const handleDeleteMiniPool = (categoryId, miniPoolId) => {
    if (!window.confirm('Delete this budget item and all its expenses?')) return;

    const updatedCategories = budget.categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          miniPools: (cat.miniPools || []).filter(m => m.id !== miniPoolId)
        };
      }
      return cat;
    });

    updateBudget(budget.id, { categories: updatedCategories });
  };

  // Expense Management
  const handleAddExpense = (categoryId, miniPoolId) => {
    const category = budget.categories.find(c => c.id === categoryId);
    const miniPool = (category.miniPools || []).find(m => m.id === miniPoolId);

    setSelectedCategory(category);
    setSelectedMiniPool(miniPool);
    setExpenseFormData({
      description: '',
      amount: '',
      vendor: '',
      date: '',
      notes: '',
      receipts: [],
      spent: true,
      dueDate: '',
      assignee: '',
      priority: 'medium',
      addToKanban: false,
      linkedTaskId: null
    });
    setIsAddExpenseModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setExpenseFormData(prev => ({
      ...prev,
      receipts: [...prev.receipts, ...files]
    }));
  };

  const handleRemoveReceipt = (index) => {
    setExpenseFormData(prev => ({
      ...prev,
      receipts: prev.receipts.filter((_, i) => i !== index)
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    setExpenseFormData(prev => ({
      ...prev,
      receipts: [...prev.receipts, ...files]
    }));
  };

  const handleSaveExpense = () => {
    // Validate description
    if (!expenseFormData.description || expenseFormData.description.trim() === '') {
      alert('Please enter a description for the expense');
      return;
    }

    // Validate amount
    const amount = parseFloat(expenseFormData.amount);
    if (!expenseFormData.amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    // Upload receipts as documents
    const receiptDocIds = [];
    expenseFormData.receipts.forEach(file => {
      const documentData = {
        name: file.name,
        category: 'Receipt',
        description: `Receipt for ${expenseFormData.description}`,
        size: file.size,
        type: file.type,
        grantId: budget.grantId,
        uploadDate: new Date().toISOString(),
        isTemplate: false,
        fileUrl: URL.createObjectURL(file),
        file: file
      };
      const doc = addDocument(documentData);
      if (doc && doc.id) receiptDocIds.push(doc.id);
    });

    const newExpense = {
      id: crypto.randomUUID(),
      description: expenseFormData.description,
      amount: amount,
      vendor: expenseFormData.vendor,
      date: expenseFormData.date,
      notes: expenseFormData.notes,
      receiptDocIds: receiptDocIds,
      spent: expenseFormData.spent,
      dueDate: expenseFormData.dueDate,
      assignee: expenseFormData.assignee,
      priority: expenseFormData.priority,
      linkedTaskId: null,
      createdAt: new Date().toISOString()
    };

    // Create Kanban task if requested
    if (expenseFormData.addToKanban && expenseFormData.dueDate) {
      const taskData = {
        title: `Budget: ${expenseFormData.description}`,
        description: `Amount: $${amount.toLocaleString()}\nVendor: ${expenseFormData.vendor || 'N/A'}\nCategory: ${selectedCategory.name}\nBudget Item: ${selectedMiniPool.description}\n\n${expenseFormData.notes || ''}`,
        status: expenseFormData.spent ? 'Done' : 'To Do',
        priority: expenseFormData.priority,
        dueDate: expenseFormData.dueDate,
        assignee: expenseFormData.assignee,
        grantId: budget.grantId,
        sourceType: 'expense',
        sourceId: newExpense.id,
        budgetId: budget.id,
        categoryId: selectedCategory.id,
        miniPoolId: selectedMiniPool.id
      };
      const createdTask = addTask(taskData);
      if (createdTask && createdTask.id) {
        newExpense.linkedTaskId = createdTask.id;
      }
    }

    const updatedCategories = budget.categories.map(cat => {
      if (cat.id === selectedCategory.id) {
        const updatedMiniPools = (cat.miniPools || []).map(mini => {
          if (mini.id === selectedMiniPool.id) {
            return {
              ...mini,
              expenses: [...(mini.expenses || []), newExpense]
            };
          }
          return mini;
        });
        return { ...cat, miniPools: updatedMiniPools };
      }
      return cat;
    });

    updateBudget(budget.id, { categories: updatedCategories });
    setIsAddExpenseModalOpen(false);
    setSelectedCategory(null);
    setSelectedMiniPool(null);
  };

  const handleEditExpense = (categoryId, miniPoolId, expense) => {
    const category = budget.categories.find(c => c.id === categoryId);
    const miniPool = (category.miniPools || []).find(m => m.id === miniPoolId);

    setSelectedCategory(category);
    setSelectedMiniPool(miniPool);
    setSelectedExpense(expense);
    setExpenseFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      vendor: expense.vendor || '',
      date: expense.date || '',
      notes: expense.notes || '',
      receipts: [],
      spent: expense.spent !== false, // Default to true for backward compatibility
      dueDate: expense.dueDate || '',
      assignee: expense.assignee || '',
      priority: expense.priority || 'medium',
      addToKanban: false,
      linkedTaskId: expense.linkedTaskId || null
    });
    setIsEditExpenseModalOpen(true);
  };

  const handleUpdateExpense = () => {
    // Validate description
    if (!expenseFormData.description || expenseFormData.description.trim() === '') {
      alert('Please enter a description for the expense');
      return;
    }

    // Validate amount
    const amount = parseFloat(expenseFormData.amount);
    if (!expenseFormData.amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    // Upload any new receipts
    const newReceiptDocIds = [];
    expenseFormData.receipts.forEach(file => {
      const documentData = {
        name: file.name,
        category: 'Receipt',
        description: `Receipt for ${expenseFormData.description}`,
        size: file.size,
        type: file.type,
        grantId: budget.grantId,
        uploadDate: new Date().toISOString(),
        isTemplate: false,
        fileUrl: URL.createObjectURL(file),
        file: file
      };
      const doc = addDocument(documentData);
      if (doc && doc.id) newReceiptDocIds.push(doc.id);
    });

    const updatedCategories = budget.categories.map(cat => {
      if (cat.id === selectedCategory.id) {
        const updatedMiniPools = (cat.miniPools || []).map(mini => {
          if (mini.id === selectedMiniPool.id) {
            const updatedExpenses = (mini.expenses || []).map(exp => {
              if (exp.id === selectedExpense.id) {
                const updatedExpense = {
                  ...exp,
                  description: expenseFormData.description,
                  amount: amount,
                  vendor: expenseFormData.vendor,
                  date: expenseFormData.date,
                  notes: expenseFormData.notes,
                  spent: expenseFormData.spent,
                  receiptDocIds: [...(exp.receiptDocIds || []), ...newReceiptDocIds],
                  dueDate: expenseFormData.dueDate,
                  assignee: expenseFormData.assignee,
                  priority: expenseFormData.priority
                };

                // Create Kanban task if requested and doesn't exist
                if (expenseFormData.addToKanban && expenseFormData.dueDate && !updatedExpense.linkedTaskId) {
                  const taskData = {
                    title: `Budget: ${expenseFormData.description}`,
                    description: `Amount: $${amount.toLocaleString()}\nVendor: ${expenseFormData.vendor || 'N/A'}\nCategory: ${selectedCategory.name}\nBudget Item: ${selectedMiniPool.description}\n\n${expenseFormData.notes || ''}`,
                    status: expenseFormData.spent ? 'Done' : 'To Do',
                    priority: expenseFormData.priority,
                    dueDate: expenseFormData.dueDate,
                    assignee: expenseFormData.assignee,
                    grantId: budget.grantId,
                    sourceType: 'expense',
                    sourceId: exp.id,
                    budgetId: budget.id,
                    categoryId: selectedCategory.id,
                    miniPoolId: selectedMiniPool.id
                  };
                  const createdTask = addTask(taskData);
                  if (createdTask && createdTask.id) {
                    updatedExpense.linkedTaskId = createdTask.id;
                  }
                }

                return updatedExpense;
              }
              return exp;
            });
            return { ...mini, expenses: updatedExpenses };
          }
          return mini;
        });
        return { ...cat, miniPools: updatedMiniPools };
      }
      return cat;
    });

    updateBudget(budget.id, { categories: updatedCategories });
    setIsEditExpenseModalOpen(false);
    setSelectedCategory(null);
    setSelectedMiniPool(null);
    setSelectedExpense(null);
  };

  const handleDeleteExpense = (categoryId, miniPoolId, expenseId) => {
    if (!window.confirm('Delete this expense?')) return;

    const updatedCategories = budget.categories.map(cat => {
      if (cat.id === categoryId) {
        const updatedMiniPools = (cat.miniPools || []).map(mini => {
          if (mini.id === miniPoolId) {
            return {
              ...mini,
              expenses: (mini.expenses || []).filter(e => e.id !== expenseId)
            };
          }
          return mini;
        });
        return { ...cat, miniPools: updatedMiniPools };
      }
      return cat;
    });

    updateBudget(budget.id, { categories: updatedCategories });
  };

  const handleUpdateCategoryAllocated = (categoryId, newAllocated) => {
    const updatedCategories = budget.categories.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, allocated: newAllocated };
      }
      return cat;
    });
    updateBudget(budget.id, { categories: updatedCategories });
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">{grant?.title || 'Budget Details'}</h2>
          <p className="text-gray-600 text-xs leading-none mt-0.5">Fiscal Year {budget.fiscalYear}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Total Budget Summary - LOCKED */}
      <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-indigo-100 text-xs mb-0.5 flex items-center gap-1 leading-none">
              <Lock size={10} />
              Total Grant Amount (Locked)
            </p>
            <p className="text-xl font-bold leading-tight">${budget.totalBudget.toLocaleString()}</p>
          </div>
          <DollarSign size={28} className="opacity-80" />
        </div>

        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          <div>
            <p className="text-indigo-100 text-xs leading-none mb-0.5">Allocated</p>
            <p className="text-sm font-semibold leading-tight">
              ${budget.categories.reduce((sum, cat) => sum + (cat.allocated || 0), 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-indigo-100 text-xs leading-none mb-0.5">Spent</p>
            <p className="text-sm font-semibold leading-tight">${totalSpent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-indigo-100 text-xs leading-none mb-0.5">Available</p>
            <p className="text-sm font-semibold leading-tight">${totalRemaining.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-1.5">
          <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentUsed > 90 ? 'bg-red-300' :
                percentUsed > 75 ? 'bg-yellow-300' :
                'bg-green-300'
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
          <p className="text-indigo-100 text-xs mt-0.5 text-right leading-none">
            {percentUsed.toFixed(1)}% Used
          </p>
        </div>
      </Card>

      {/* Category Pools (Macro Pools) */}
      <div className="space-y-1">
        {budget.categories.map(category => {
          const categorySpent = (category.miniPools || []).reduce((sum, mini) => {
            const miniSpent = (mini.expenses || []).reduce((expSum, exp) => {
              return expSum + (exp.spent !== false ? exp.amount : 0);
            }, 0);
            return sum + miniSpent;
          }, 0);

          const categoryAvailable = (category.allocated || 0) - categorySpent;
          const categoryPercent = category.allocated > 0 ? (categorySpent / category.allocated) * 100 : 0;
          const isOverBudget = categorySpent > category.allocated;

          return (
            <Card key={category.id} className="border-l-8 border-l-blue-600 border-t-2 border-r-2 border-b-2 border-gray-200 shadow-lg p-2">
              {/* Category Header */}
              <div className="bg-blue-50 -m-2 p-1.5 mb-0.5">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold leading-none">CAT</span>
                    <h3 className="text-sm font-bold text-gray-900 leading-none">
                      {category.name}
                    </h3>
                    <div className="flex items-center gap-1 ml-auto mr-0.5">
                      <div className="text-right">
                        <div className="text-xs text-gray-600 leading-none">
                          ${categorySpent.toLocaleString()} / ${(category.allocated || 0).toLocaleString()}
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-1 mt-0.5">
                          <div
                            className={`h-full rounded-full ${
                              isOverBudget ? 'bg-red-500' :
                              categoryPercent > 90 ? 'bg-orange-500' :
                              categoryPercent > 75 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(categoryPercent, 100)}%` }}
                          />
                        </div>
                        <div className={`text-xs font-bold leading-none mt-0.5 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                          ${Math.abs(categoryAvailable).toLocaleString()} ({(100 - categoryPercent).toFixed(0)}%) {isOverBudget ? 'over' : 'left'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddMiniPool(category.id)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>

                {/* Category Pool Stats - Compact */}
                <div className="bg-gray-50 rounded px-1.5 py-0.5 flex items-center gap-1.5 text-xs">
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-600 leading-none">Budget:</label>
                    <input
                      type="number"
                      value={category.allocated || 0}
                      onChange={(e) => handleUpdateCategoryAllocated(category.id, parseFloat(e.target.value) || 0)}
                      className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs font-semibold focus:ring-2 focus:ring-primary-500 outline-none leading-none"
                    />
                  </div>
                  <div className="text-xs leading-none">
                    <span className="text-gray-600">Items: </span>
                    <span className="font-bold">{(category.miniPools || []).length}</span>
                  </div>
                  {isOverBudget && (
                    <div className="flex items-center gap-1 text-red-600 text-xs font-medium ml-auto">
                      <AlertCircle size={14} />
                      <span>Over ${Math.abs(categoryAvailable).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mini-Pools (Budget Items) */}
              {(category.miniPools || []).length > 0 ? (
                <div className="space-y-0.5 ml-2 pl-1.5 border-l-4 border-l-green-400 mt-0.5">
                  {category.miniPools.map(miniPool => {
                    const miniSpent = (miniPool.expenses || []).reduce((sum, exp) => {
                      return sum + (exp.spent !== false ? exp.amount : 0);
                    }, 0);
                    const miniAvailable = miniPool.allocated - miniSpent;
                    const miniPercent = (miniSpent / miniPool.allocated) * 100;
                    const miniOverBudget = miniSpent > miniPool.allocated;
                    const isExpanded = isMiniPoolExpanded(category.id, miniPool.id);

                    return (
                      <div key={miniPool.id} className="border-l-4 border-l-green-500 border border-gray-300 rounded p-1 bg-green-50">
                        {/* Mini-Pool Header */}
                        <div className="flex items-center justify-between mb-0.5 bg-white -mx-1 -mt-1 px-1 py-0.5 rounded-t">
                          <div className="flex items-center gap-1 flex-1">
                            <button
                              onClick={() => toggleMiniPool(category.id, miniPool.id)}
                              className="p-0.5 hover:bg-gray-100 rounded flex-shrink-0"
                            >
                              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                            <span className="text-xs bg-green-600 text-white px-1 py-0.5 rounded font-semibold leading-none">SUB</span>
                            <h4 className="font-semibold text-gray-900 text-xs leading-none">{miniPool.description}</h4>
                            <div className="flex items-center gap-1 ml-auto">
                              <div className="text-right">
                                <div className="text-xs text-gray-600 leading-none">
                                  ${miniSpent.toLocaleString()} / ${miniPool.allocated.toLocaleString()}
                                </div>
                                <div className="w-16 bg-gray-200 rounded-full h-1 mt-0.5">
                                  <div
                                    className={`h-full rounded-full ${
                                      miniOverBudget ? 'bg-red-500' :
                                      miniPercent > 90 ? 'bg-orange-500' :
                                      miniPercent > 75 ? 'bg-yellow-500' :
                                      'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(miniPercent, 100)}%` }}
                                  />
                                </div>
                                <div className={`text-xs font-bold leading-none mt-0.5 ${miniOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                                  ${Math.abs(miniAvailable).toLocaleString()} ({(100 - miniPercent).toFixed(0)}%) {miniOverBudget ? 'over' : 'left'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleEditMiniPool(category.id, miniPool)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Edit2 size={12} className="text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteMiniPool(category.id, miniPool.id)}
                              className="p-1 hover:bg-red-100 rounded"
                              title="Delete"
                            >
                              <Trash2 size={12} className="text-red-600" />
                            </button>
                          </div>
                        </div>

                        {/* Mini-Pool Stats - Compact */}
                        <div className="bg-blue-50 rounded px-1 py-0.5 mb-0.5 flex items-center gap-1.5 text-xs">
                          <div className="leading-none">
                            <span className="text-gray-600">Exp: </span>
                            <span className="font-bold">
                              {(miniPool.expenses || []).filter(e => e.spent !== false).length}/{(miniPool.expenses || []).length}
                            </span>
                          </div>
                          {miniOverBudget && (
                            <span className="text-red-600 font-medium text-xs leading-none">
                              ⚠️ Over ${Math.abs(miniAvailable).toLocaleString()}
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddExpense(category.id, miniPool.id)}
                            className="ml-auto py-0.5 px-1 text-xs h-auto leading-none"
                          >
                            <Plus size={10} className="mr-0.5" />
                            Add
                          </Button>
                        </div>

                        {/* Expenses List */}
                        {isExpanded && (miniPool.expenses || []).length > 0 && (
                          <div className="border-t pt-0.5 space-y-0.5 ml-2 pl-1 border-l-2 border-l-purple-300">
                            {miniPool.expenses.map(expense => (
                              <div
                                key={expense.id}
                                className={`flex items-center gap-1 p-0.5 rounded border-l-2 border-l-purple-500 text-xs ${
                                  expense.spent !== false ? 'bg-white border border-gray-200' : 'bg-yellow-50 border border-yellow-300'
                                }`}
                              >
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={expense.spent !== false}
                                    onChange={(e) => {
                                      const updatedCategories = budget.categories.map(cat => {
                                        if (cat.id === category.id) {
                                          const updatedMiniPools = (cat.miniPools || []).map(mini => {
                                            if (mini.id === miniPool.id) {
                                              const updatedExpenses = (mini.expenses || []).map(exp => {
                                                if (exp.id === expense.id) {
                                                  return { ...exp, spent: e.target.checked };
                                                }
                                                return exp;
                                              });
                                              return { ...mini, expenses: updatedExpenses };
                                            }
                                            return mini;
                                          });
                                          return { ...cat, miniPools: updatedMiniPools };
                                        }
                                        return cat;
                                      });
                                      updateBudget(budget.id, { categories: updatedCategories });
                                    }}
                                    className="w-3 h-3 cursor-pointer flex-shrink-0"
                                    title={expense.spent !== false ? "Mark as future expense" : "Mark as spent"}
                                  />
                                  <div className="flex-1 min-w-0 flex items-center gap-1">
                                    <span className="font-medium text-gray-900 truncate text-xs leading-none">{expense.description}</span>
                                    {expense.spent === false && (
                                      <span className="text-xs bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded font-medium flex-shrink-0 leading-none">
                                        Future
                                      </span>
                                    )}
                                    {expense.date && <span className="text-gray-500 flex-shrink-0 text-xs leading-none">• {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                    {expense.receiptDocIds && expense.receiptDocIds.length > 0 && (
                                      <Paperclip size={10} className="text-blue-600" />
                                    )}
                                    {expense.linkedTaskId && (
                                      <Link2 size={10} className="text-indigo-600" />
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
                                  <span className={`font-bold text-xs leading-none ${expense.spent !== false ? 'text-gray-900' : 'text-yellow-700'}`}>
                                    ${expense.amount.toLocaleString()}
                                  </span>
                                  <button
                                    onClick={() => handleEditExpense(category.id, miniPool.id, expense)}
                                    className="p-0.5 hover:bg-gray-200 rounded"
                                  >
                                    <Edit2 size={10} className="text-gray-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpense(category.id, miniPool.id, expense.id)}
                                    className="p-0.5 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 size={10} className="text-red-600" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {isExpanded && (miniPool.expenses || []).length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-2">
                            No expenses recorded yet
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No budget items yet. Click "Add Budget Item" to create expense pools.
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Mini-Pool Modal */}
      <Modal
        isOpen={isAddMiniPoolModalOpen}
        onClose={() => {
          setIsAddMiniPoolModalOpen(false);
          setSelectedCategory(null);
        }}
        title={`Add Budget Item - ${selectedCategory?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={miniPoolFormData.description}
              onChange={(e) => setMiniPoolFormData({ ...miniPoolFormData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g., Software Development, Training Materials"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allocated Budget *
            </label>
            <input
              type="number"
              step="0.01"
              value={miniPoolFormData.allocated}
              onChange={(e) => setMiniPoolFormData({ ...miniPoolFormData, allocated: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={miniPoolFormData.notes}
              onChange={(e) => setMiniPoolFormData({ ...miniPoolFormData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddMiniPoolModalOpen(false);
                setSelectedCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveMiniPool}>
              Add Budget Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Mini-Pool Modal */}
      <Modal
        isOpen={isEditMiniPoolModalOpen}
        onClose={() => {
          setIsEditMiniPoolModalOpen(false);
          setSelectedCategory(null);
          setSelectedMiniPool(null);
        }}
        title={`Edit Budget Item - ${selectedCategory?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={miniPoolFormData.description}
              onChange={(e) => setMiniPoolFormData({ ...miniPoolFormData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allocated Budget *
            </label>
            <input
              type="number"
              step="0.01"
              value={miniPoolFormData.allocated}
              onChange={(e) => setMiniPoolFormData({ ...miniPoolFormData, allocated: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={miniPoolFormData.notes}
              onChange={(e) => setMiniPoolFormData({ ...miniPoolFormData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditMiniPoolModalOpen(false);
                setSelectedCategory(null);
                setSelectedMiniPool(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateMiniPool}>
              Update Budget Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseModalOpen}
        onClose={() => {
          setIsAddExpenseModalOpen(false);
          setSelectedCategory(null);
          setSelectedMiniPool(null);
        }}
        title={`Add Expense - ${selectedMiniPool?.description}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <p className="font-medium text-blue-900">
              Available: ${(selectedMiniPool?.allocated || 0) - ((selectedMiniPool?.expenses || []).reduce((sum, e) => sum + (e.spent !== false ? e.amount : 0), 0)).toLocaleString()}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Only spent expenses count toward used budget
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={expenseFormData.description}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g., Microsoft Office licenses"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={expenseFormData.amount}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={expenseFormData.date}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor/Payee
            </label>
            <input
              type="text"
              value={expenseFormData.vendor}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, vendor: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g., Amazon, Staples"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={expenseFormData.notes}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Additional notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attach Receipts/Documents (PRF, Receipts, etc.)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Paperclip size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop files here, or click to browse
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-add"
              />
              <label
                htmlFor="file-upload-add"
                className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Choose Files
              </label>
            </div>
            {expenseFormData.receipts.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-700">{expenseFormData.receipts.length} file(s) attached:</p>
                {expenseFormData.receipts.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg text-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Paperclip size={16} className="text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB • {file.type || 'Unknown type'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveReceipt(index)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                      title="Remove file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={expenseFormData.spent}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, spent: e.target.checked })}
                className="w-5 h-5 cursor-pointer"
              />
              <div>
                <p className="font-medium text-blue-900">Mark as Spent</p>
                <p className="text-xs text-blue-700">
                  Check this if the expense has been paid (counts toward spent budget).
                  Uncheck to mark as future/planned expense.
                </p>
              </div>
            </label>
          </div>

          {/* Timeline & Kanban Integration */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">📅 Timeline & Task Management</h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={expenseFormData.dueDate}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={expenseFormData.priority}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <input
                type="text"
                value={expenseFormData.assignee}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, assignee: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="e.g., John Doe"
              />
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expenseFormData.addToKanban}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, addToKanban: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                  disabled={!expenseFormData.dueDate}
                />
                <div>
                  <p className="font-medium text-purple-900">Add to Kanban Board</p>
                  <p className="text-xs text-purple-700">
                    Automatically create a task card on the Kanban board for this expense.
                    {!expenseFormData.dueDate && ' (Requires due date)'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddExpenseModalOpen(false);
                setSelectedCategory(null);
                setSelectedMiniPool(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveExpense}>
              <Receipt size={16} className="mr-2" />
              Add Expense
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={isEditExpenseModalOpen}
        onClose={() => {
          setIsEditExpenseModalOpen(false);
          setSelectedCategory(null);
          setSelectedMiniPool(null);
          setSelectedExpense(null);
        }}
        title={`Edit Expense - ${selectedMiniPool?.description}`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={expenseFormData.description}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={expenseFormData.amount}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={expenseFormData.date}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor/Payee
            </label>
            <input
              type="text"
              value={expenseFormData.vendor}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, vendor: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={expenseFormData.notes}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add More Receipts/Documents (PRF, Receipts, etc.)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Paperclip size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop files here, or click to browse
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-edit"
              />
              <label
                htmlFor="file-upload-edit"
                className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Choose Files
              </label>
            </div>
            {expenseFormData.receipts.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-700">{expenseFormData.receipts.length} file(s) attached:</p>
                {expenseFormData.receipts.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg text-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Paperclip size={16} className="text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB • {file.type || 'Unknown type'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveReceipt(index)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                      title="Remove file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={expenseFormData.spent}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, spent: e.target.checked })}
                className="w-5 h-5 cursor-pointer"
              />
              <div>
                <p className="font-medium text-blue-900">Mark as Spent</p>
                <p className="text-xs text-blue-700">
                  Check this if the expense has been paid (counts toward spent budget).
                  Uncheck to mark as future/planned expense.
                </p>
              </div>
            </label>
          </div>

          {/* Timeline & Kanban Integration */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">📅 Timeline & Task Management</h4>

            {expenseFormData.linkedTaskId && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                <p className="text-green-800 font-medium">✓ Linked to Kanban task</p>
                <p className="text-green-700 text-xs mt-1">This expense is already tracked on the Kanban board</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={expenseFormData.dueDate}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={expenseFormData.priority}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To
              </label>
              <input
                type="text"
                value={expenseFormData.assignee}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, assignee: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="e.g., John Doe"
              />
            </div>

            {!expenseFormData.linkedTaskId && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expenseFormData.addToKanban}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, addToKanban: e.target.checked })}
                    className="w-5 h-5 cursor-pointer"
                    disabled={!expenseFormData.dueDate}
                  />
                  <div>
                    <p className="font-medium text-purple-900">Add to Kanban Board</p>
                    <p className="text-xs text-purple-700">
                      Automatically create a task card on the Kanban board for this expense.
                      {!expenseFormData.dueDate && ' (Requires due date)'}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditExpenseModalOpen(false);
                setSelectedCategory(null);
                setSelectedMiniPool(null);
                setSelectedExpense(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateExpense}>
              Update Expense
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BudgetDetails;
