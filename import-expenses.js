// Import Expense Authorizations into Budget
// Run this in browser console at http://localhost:5173

const expenses = [
  {
    description: "Personnel - Marjorie Gondre-Lewis (SA018184)",
    amount: 3043.27,
    date: "2026-02-26",
    spent: true,
    authorizationNumber: "SA018184",
    receipts: []
  },
  {
    description: "Personnel - Christian Parry (SA018330)",
    amount: 1500.00,
    date: "2026-03-01",
    spent: true,
    authorizationNumber: "SA018330",
    receipts: []
  },
  {
    description: "Personnel - Hector Bravo-Rivera (SA018400)",
    amount: 1130.00,
    date: "2026-03-27",
    spent: true,
    authorizationNumber: "SA018400",
    receipts: []
  }
];

// Get current budgets from localStorage
const budgets = JSON.parse(localStorage.getItem('pm_hub_budgets') || '[]');

if (budgets.length === 0) {
  console.error('No budgets found! Please create a budget first.');
} else {
  // Add to first budget's Personnel category
  const budget = budgets[0];

  // Find Personnel category
  let personnelCategory = budget.categories.find(cat => cat.name.includes('Personnel'));

  if (!personnelCategory) {
    // Create Personnel category if it doesn't exist
    personnelCategory = {
      id: crypto.randomUUID(),
      name: 'Personnel',
      allocated: 0,
      miniPools: []
    };
    budget.categories.unshift(personnelCategory);
  }

  // Create or find Personnel mini-pool
  if (!personnelCategory.miniPools) personnelCategory.miniPools = [];
  let personnelPool = personnelCategory.miniPools.find(pool => pool.name.includes('Salaries') || pool.name.includes('Personnel'));

  if (!personnelPool) {
    personnelPool = {
      id: crypto.randomUUID(),
      name: 'Personnel Salaries',
      allocated: 0,
      expenses: []
    };
    personnelCategory.miniPools.push(personnelPool);
  }

  if (!personnelPool.expenses) personnelPool.expenses = [];

  // Add expenses
  expenses.forEach(expense => {
    const expenseId = crypto.randomUUID();
    personnelPool.expenses.push({
      id: expenseId,
      ...expense
    });
    console.log(`✅ Added: ${expense.description} - $${expense.amount}`);
  });

  // Save back to localStorage
  localStorage.setItem('pm_hub_budgets', JSON.stringify(budgets));

  console.log('✅ All expenses imported successfully!');
  console.log('💰 Total added: $' + expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2));
  console.log('🔄 Refresh the page to see updates.');
}
