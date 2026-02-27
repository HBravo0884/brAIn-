import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Upload,
  TrendingUp,
  Award,
  Calendar,
  X,
  Check,
  Download,
  Link2,
  BarChart3
} from 'lucide-react';

const Dashboard = () => {
  const { grants, budgets, documents, tasks, todos, addDocument, addTodo, updateTodo, updateBudget } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [quickExpense, setQuickExpense] = useState({ desc: '', amount: '', budget: '' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({ byAim: true, byCategory: true, withDocs: false });

  // Calculate totals
  const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalSpent = budgets.reduce((sum, b) => {
    const spent = b.categories.reduce((catSum, cat) => {
      return catSum + (cat.miniPools || []).reduce((miniSum, mini) => {
        return miniSum + (mini.expenses || []).reduce((expSum, exp) => {
          return expSum + (exp.spent !== false ? exp.amount : 0);
        }, 0);
      }, 0);
    }, 0);
    return sum + spent;
  }, 0);
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Active items
  const activeGrants = grants.filter(g => g.status === 'active');
  const activeTasks = tasks.filter(t => t.status !== 'Done');
  const activeTodos = todos.filter(t => !t.completed);
  const recentDocs = documents.slice(-5).reverse();

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      addDocument({
        name: file.name,
        type: 'uploaded',
        size: file.size,
        category: 'General',
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    });
  };

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodo({
        id: crypto.randomUUID(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      });
      setNewTodo('');
    }
  };

  const toggleTodo = (todo) => {
    updateTodo(todo.id, { ...todo, completed: !todo.completed });
  };

  const importExpenseAuthorizations = () => {
    const expensesToImport = [
      {
        description: "Salary - Marjorie Gondre-Lewis (PI)",
        amount: 3043.27,
        date: "2026-02-26",
        spent: true,
        authorizationNumber: "SA018184",
        category: "Personnel",
        miniPool: "Salaries"
      },
      {
        description: "Salary - Christian Parry",
        amount: 1500.00,
        date: "2026-03-01",
        spent: true,
        authorizationNumber: "SA018330",
        category: "Aim 4",
        miniPool: "Aim 4 Personnel"
      },
      {
        description: "Travel - Taylor Bell",
        amount: 1130.00,
        date: "2026-03-27",
        spent: true,
        authorizationNumber: "SA018400",
        category: "Aim 4",
        miniPool: "Aim 4 Travel"
      }
    ];

    // Add any MGL travel expenses here
    const mglTravelExpenses = [
      // Example format - add your MGL travel expenses:
      // {
      //   description: "PI Travel - AAMC Conference (Dr. Gondre-Lewis)",
      //   amount: 1200.00,
      //   date: "2026-04-15",
      //   spent: true,
      //   authorizationNumber: "SA018XXX",
      //   category: "Travel",
      //   miniPool: "PI Professional Development - National Conferences"
      // }
    ];

    const allExpenses = [...expensesToImport, ...mglTravelExpenses];

    if (budgets.length === 0) {
      alert('Please create a budget first!');
      return;
    }

    const budget = budgets[0]; // Use first budget (RWJF)
    const updatedCategories = [...budget.categories];

    // Add each expense to its appropriate category
    allExpenses.forEach(exp => {
      // Find the target category
      let targetCat = updatedCategories.find(cat => cat.name.includes(exp.category));

      if (!targetCat) {
        targetCat = {
          id: crypto.randomUUID(),
          name: exp.category,
          allocated: 0,
          miniPools: []
        };
        updatedCategories.push(targetCat);
      }

      // Create or find mini pool
      if (!targetCat.miniPools) targetCat.miniPools = [];
      let pool = targetCat.miniPools.find(p => p.name && p.name.includes(exp.miniPool || exp.category));

      if (!pool) {
        pool = {
          id: crypto.randomUUID(),
          name: exp.miniPool || (exp.category === 'Personnel' ? 'Salaries' : exp.category + ' Expenses'),
          allocated: 0,
          expenses: []
        };
        targetCat.miniPools.push(pool);
      }

      if (!pool.expenses) pool.expenses = [];

      // Add expense
      pool.expenses.push({
        id: crypto.randomUUID(),
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        spent: exp.spent,
        authorizationNumber: exp.authorizationNumber,
        receipts: []
      });
    });

    updateBudget(budget.id, { categories: updatedCategories });

    const total = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const summary = expensesToImport.map(e => `• ${e.description}: $${e.amount.toLocaleString()}`).join('\n');
    const mglTravelSummary = mglTravelExpenses.length > 0
      ? '\n\nMGL Travel:\n' + mglTravelExpenses.map(e => `• ${e.description}: $${e.amount.toLocaleString()}`).join('\n')
      : '';

    alert(`✅ Imported ${allExpenses.length} expenses:\n\n${summary}${mglTravelSummary}\n\nTotal: $${total.toLocaleString()}`);
  };

  // Smart Document Linker - detects SA# and auto-categorizes
  const handleSmartDocumentDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const fileName = file.name;

      // Detect SA number
      const saMatch = fileName.match(/SA(\d+)/i);
      const saNumber = saMatch ? `SA${saMatch[1]}` : null;

      // Detect document type
      let docType = 'General';
      if (fileName.toLowerCase().includes('spend_authorization') || saNumber) {
        docType = 'Expense Authorization';
      } else if (fileName.toLowerCase().includes('receipt')) {
        docType = 'Receipt';
      } else if (fileName.toLowerCase().includes('prf') || fileName.toLowerCase().includes('payment')) {
        docType = 'Payment Request';
      }

      addDocument({
        name: file.name,
        type: 'uploaded',
        category: docType,
        size: file.size,
        authorizationNumber: saNumber,
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      // Show notification
      const msg = saNumber
        ? `✅ ${docType} detected\n📎 Linked to ${saNumber}`
        : `✅ ${docType} uploaded`;
      console.log(msg);
    });

    alert(`✅ Uploaded ${files.length} document(s) with smart detection!`);
  };

  // Export Budget Report
  const handleExportBudget = () => {
    const budget = budgets[0];
    if (!budget) {
      alert('No budget to export!');
      return;
    }

    // Calculate spending by aim
    const aimSpending = {};
    budget.categories?.forEach(cat => {
      const aimMatch = cat.name.match(/Aim (\d+)/);
      const aimKey = aimMatch ? `Aim ${aimMatch[1]}` : 'Other';

      const spent = (cat.miniPools || []).reduce((sum, pool) => {
        return sum + (pool.expenses || []).reduce((expSum, exp) => {
          return expSum + (exp.spent !== false ? exp.amount : 0);
        }, 0);
      }, 0);

      aimSpending[aimKey] = (aimSpending[aimKey] || 0) + spent;
    });

    // Generate report text
    let report = `BUDGET REPORT - ${new Date().toLocaleDateString()}\n`;
    report += `=`.repeat(50) + '\n\n';
    report += `Total Budget: $${(budget.totalBudget || 0).toLocaleString()}\n`;
    report += `Total Spent: $${totalSpent.toLocaleString()}\n`;
    report += `Remaining: $${remaining.toLocaleString()}\n`;
    report += `Percentage Used: ${percentUsed.toFixed(1)}%\n\n`;

    if (exportOptions.byAim) {
      report += `SPENDING BY AIM:\n`;
      report += `-`.repeat(50) + '\n';
      Object.entries(aimSpending).sort().forEach(([aim, amount]) => {
        const percent = budget.totalBudget > 0 ? (amount / budget.totalBudget * 100).toFixed(1) : 0;
        report += `${aim}: $${amount.toLocaleString()} (${percent}%)\n`;
      });
      report += '\n';
    }

    if (exportOptions.byCategory) {
      report += `SPENDING BY CATEGORY:\n`;
      report += `-`.repeat(50) + '\n';
      budget.categories?.forEach(cat => {
        const spent = (cat.miniPools || []).reduce((sum, pool) => {
          return sum + (pool.expenses || []).reduce((expSum, exp) => {
            return expSum + (exp.spent !== false ? exp.amount : 0);
          }, 0);
        }, 0);
        report += `${cat.name}: $${spent.toLocaleString()}\n`;
      });
    }

    // Download as text file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Budget_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportModal(false);
    alert('✅ Budget report downloaded!');
  };

  // Calculate spending by aim for visualization
  const getAimSpending = () => {
    if (!budgets.length) return [];

    const budget = budgets[0];
    const aimData = {};

    budget.categories?.forEach(cat => {
      const aimMatch = cat.name.match(/Aim (\d+)/);
      if (aimMatch) {
        const aimKey = `Aim ${aimMatch[1]}`;
        const spent = (cat.miniPools || []).reduce((sum, pool) => {
          return sum + (pool.expenses || []).reduce((expSum, exp) => {
            return expSum + (exp.spent !== false ? exp.amount : 0);
          }, 0);
        }, 0);

        aimData[aimKey] = (aimData[aimKey] || 0) + spent;
      }
    });

    // Convert to array with percentages
    const totalAimBudget = totalBudget * 0.8; // Assuming 80% goes to aims
    return Object.entries(aimData).map(([aim, spent]) => ({
      aim,
      spent,
      percent: totalAimBudget > 0 ? (spent / totalAimBudget * 100) : 0
    })).sort((a, b) => a.aim.localeCompare(b.aim));
  };

  const handleQuickExpense = () => {
    if (!quickExpense.desc || !quickExpense.amount || !quickExpense.budget) {
      alert('Please fill all fields');
      return;
    }

    const budget = budgets.find(b => b.id === quickExpense.budget);
    if (!budget || !budget.categories.length) return;

    // Add to first category's first mini pool or create one
    const updatedCategories = [...budget.categories];
    if (!updatedCategories[0].miniPools) updatedCategories[0].miniPools = [];
    if (!updatedCategories[0].miniPools.length) {
      updatedCategories[0].miniPools.push({
        id: crypto.randomUUID(),
        name: 'Quick Expenses',
        allocated: 0,
        expenses: []
      });
    }

    updatedCategories[0].miniPools[0].expenses = updatedCategories[0].miniPools[0].expenses || [];
    updatedCategories[0].miniPools[0].expenses.push({
      id: crypto.randomUUID(),
      description: quickExpense.desc,
      amount: parseFloat(quickExpense.amount),
      spent: true,
      date: new Date().toISOString()
    });

    updateBudget(budget.id, { categories: updatedCategories });
    setQuickExpense({ desc: '', amount: '', budget: '' });
    alert('Expense added!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Program Manager Hub</h1>
          <p className="text-gray-600">Everything at a glance • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Button variant="primary" onClick={importExpenseAuthorizations}>
          <Upload size={16} className="mr-2" />
          Import Expense Authorizations
        </Button>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs mb-1">Total Budget</p>
              <p className="text-2xl font-bold">${(totalBudget / 1000).toFixed(0)}K</p>
            </div>
            <DollarSign size={32} className="opacity-80" />
          </div>
        </Card>

        <Card className={`bg-gradient-to-br text-white ${percentUsed > 90 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs mb-1 ${percentUsed > 90 ? 'text-red-100' : 'text-green-100'}`}>Remaining</p>
              <p className="text-2xl font-bold">${(remaining / 1000).toFixed(0)}K</p>
              <p className="text-xs opacity-90">{(100 - percentUsed).toFixed(0)}% left</p>
            </div>
            <TrendingUp size={32} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs mb-1">Active Grants</p>
              <p className="text-2xl font-bold">{activeGrants.length}</p>
            </div>
            <Award size={32} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs mb-1">To-Do Items</p>
              <p className="text-2xl font-bold">{activeTodos.length + activeTasks.length}</p>
            </div>
            <Clock size={32} className="opacity-80" />
          </div>
        </Card>
      </div>

      {/* Budget Alert */}
      {percentUsed > 85 && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-red-900">Budget Alert</h3>
              <p className="text-sm text-red-700">
                You've used {percentUsed.toFixed(0)}% of your budget. Only ${(remaining / 1000).toFixed(1)}K remaining!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Active Grants */}
          <Card title={`Active Grants (${activeGrants.length})`} className="h-fit">
            {activeGrants.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No active grants</p>
            ) : (
              <div className="space-y-2">
                {activeGrants.map(grant => (
                  <div key={grant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{grant.title}</h4>
                      <p className="text-xs text-gray-600">{grant.fundingAgency}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">${(grant.amount / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Expense Entry */}
          <Card title="Quick Expense Entry" className="h-fit">
            <div className="space-y-3">
              <select
                value={quickExpense.budget}
                onChange={(e) => setQuickExpense({ ...quickExpense, budget: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">Select Budget...</option>
                {budgets.map(b => {
                  const grant = grants.find(g => g.id === b.grantId);
                  return (
                    <option key={b.id} value={b.id}>
                      {grant?.title || 'Budget'} - ${(b.totalBudget / 1000).toFixed(0)}K
                    </option>
                  );
                })}
              </select>
              <input
                type="text"
                value={quickExpense.desc}
                onChange={(e) => setQuickExpense({ ...quickExpense, desc: e.target.value })}
                placeholder="Description..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={quickExpense.amount}
                  onChange={(e) => setQuickExpense({ ...quickExpense, amount: e.target.value })}
                  placeholder="Amount ($)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <Button variant="primary" size="sm" onClick={handleQuickExpense}>
                  <Plus size={16} className="mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick To-Do */}
          <Card title={`Quick To-Do (${activeTodos.length})`} className="h-fit">
            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
              {activeTodos.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">All caught up! ✨</p>
              ) : (
                activeTodos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <button
                      onClick={() => toggleTodo(todo)}
                      className="flex-shrink-0 w-5 h-5 border-2 border-gray-400 rounded hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center"
                    >
                      {todo.completed && <Check size={14} className="text-green-600" />}
                    </button>
                    <span className="text-sm text-gray-700 flex-1">{todo.text}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a quick task..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTodo();
                }}
              />
              <Button variant="primary" size="sm" onClick={handleAddTodo}>
                <Plus size={16} />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Smart Document Linker */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <Link2 size={18} />
                <span>Smart Document Linker ({documents.length})</span>
              </div>
            }
            className={`h-fit transition-all ${isDragging ? 'border-2 border-primary-500 bg-primary-50' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleSmartDocumentDrop}
          >
            <div className={`text-center py-6 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-primary-500 bg-primary-100' : 'border-gray-300 hover:border-primary-400'}`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Upload size={32} className={`${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
                <Link2 size={24} className={`${isDragging ? 'text-primary-600' : 'text-green-500'}`} />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Smart Auto-Detection</p>
              <p className="text-xs text-gray-500">Auto-detects SA#, receipts, PRFs</p>
              <p className="text-xs text-gray-400 mt-1">Links documents to expenses automatically</p>
            </div>
            {recentDocs.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Recent Files</p>
                {recentDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                    <FileText size={14} className="text-gray-500 flex-shrink-0" />
                    <span className="flex-1 truncate text-gray-700 text-xs">{doc.name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active Tasks */}
          <Card title={`Active Tasks (${activeTasks.length})`} className="h-fit">
            {activeTasks.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                <p className="text-sm text-gray-600">No active tasks</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {activeTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-xs text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                      task.status === 'To Do' ? 'bg-gray-200 text-gray-700' :
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Budget by Aim Visual */}
      {budgets.length > 0 && getAimSpending().length > 0 && (
        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} />
                <span>Budget by Aim</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
                <Download size={16} className="mr-2" />
                Export Report
              </Button>
            </div>
          }
          className="mt-6"
        >
          <div className="space-y-4">
            {getAimSpending().map(({ aim, spent, percent }) => (
              <div key={aim}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{aim}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">${spent.toLocaleString()}</span>
                    <span className={`ml-2 text-xs ${
                      percent > 90 ? 'text-red-600' :
                      percent > 75 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percent > 90 ? 'bg-red-500' :
                      percent > 75 ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Export Budget Report</h3>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.byAim}
                  onChange={(e) => setExportOptions({...exportOptions, byAim: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Include spending by Aim</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.byCategory}
                  onChange={(e) => setExportOptions({...exportOptions, byCategory: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Include spending by Category</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.withDocs}
                  onChange={(e) => setExportOptions({...exportOptions, withDocs: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Include SA# documentation list</span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowExportModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleExportBudget}>
                <Download size={16} className="mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
