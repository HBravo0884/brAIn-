import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [grants, setGrants] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [travelRequests, setTravelRequests] = useState([]);
  const [giftCardDistributions, setGiftCardDistributions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [todos, setTodos] = useState([]);
  const [settings, setSettings] = useState({ theme: 'light', notifications: true });
  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      setGrants(storage.getGrants());
      setBudgets(storage.getBudgets());
      setTemplates(storage.getTemplates());
      setTasks(storage.getTasks());
      setDocuments(storage.getDocuments());
      setPaymentRequests(storage.getPaymentRequests());
      setTravelRequests(storage.getTravelRequests());
      setGiftCardDistributions(storage.getGiftCardDistributions());
      setMeetings(storage.getMeetings());
      setTodos(storage.getTodos());
      setSettings(storage.getSettings());
      setKnowledgeDocs(storage.getKnowledgeDocs());
      setPersonnel(storage.getPersonnel());
      setLoading(false);
    };
    loadData();
  }, []);

  // Persist grants to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setGrants(grants);
    }
  }, [grants, loading]);

  // Persist budgets to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setBudgets(budgets);
    }
  }, [budgets, loading]);

  // Persist templates to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setTemplates(templates);
    }
  }, [templates, loading]);

  // Persist tasks to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setTasks(tasks);
    }
  }, [tasks, loading]);

  // Persist documents to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setDocuments(documents);
    }
  }, [documents, loading]);

  // Persist settings to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setSettings(settings);
    }
  }, [settings, loading]);

  // Persist payment requests to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setPaymentRequests(paymentRequests);
    }
  }, [paymentRequests, loading]);

  // Persist travel requests to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setTravelRequests(travelRequests);
    }
  }, [travelRequests, loading]);

  // Persist gift card distributions to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setGiftCardDistributions(giftCardDistributions);
    }
  }, [giftCardDistributions, loading]);

  // Persist meetings to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setMeetings(meetings);
    }
  }, [meetings, loading]);

  // Persist todos to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setTodos(todos);
    }
  }, [todos, loading]);

  // Persist knowledge docs to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setKnowledgeDocs(knowledgeDocs);
    }
  }, [knowledgeDocs, loading]);

  // Persist personnel to localStorage
  useEffect(() => {
    if (!loading) {
      storage.setPersonnel(personnel);
    }
  }, [personnel, loading]);

  // Grant operations
  const addGrant = (grant) => {
    // id can be pre-specified (e.g. when linking a budget at creation time)
    setGrants(prev => [...prev, { id: crypto.randomUUID(), ...grant, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updateGrant = (id, updates) => {
    setGrants(prev => prev.map(g => g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g));
  };

  const deleteGrant = (id) => {
    setGrants(prev => prev.filter(g => g.id !== id));
  };

  // Budget operations
  const addBudget = (budget) => {
    setBudgets(prev => [...prev, { ...budget, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updateBudget = (id, updates) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b));
  };

  const deleteBudget = (id) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  // Budget-Grant syncing functions
  const updateGrantAimBudget = (grantId, aimNumber, newBudgetAllocation) => {
    // Update grant aim
    setGrants(prev => prev.map(grant => {
      if (grant.id === grantId) {
        const updatedAims = grant.aims.map(aim => {
          if (aim.number === aimNumber) {
            return { ...aim, budgetAllocation: newBudgetAllocation };
          }
          return aim;
        });
        return { ...grant, aims: updatedAims, updatedAt: new Date().toISOString() };
      }
      return grant;
    }));

    // Update corresponding budget category
    setBudgets(prev => prev.map(budget => {
      if (budget.grantId === grantId) {
        const updatedCategories = budget.categories.map(category => {
          // Match category by aim number in name
          if (category.name.includes(aimNumber)) {
            return { ...category, allocated: newBudgetAllocation };
          }
          return category;
        });
        return { ...budget, categories: updatedCategories, updatedAt: new Date().toISOString() };
      }
      return budget;
    }));
  };

  const updateBudgetCategoryWithGrantSync = (budgetId, categoryId, newAllocated) => {
    // Get the budget and category
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return;

    const category = budget.categories.find(c => c.id === categoryId);
    if (!category) return;

    // Update budget category
    setBudgets(prev => prev.map(b => {
      if (b.id === budgetId) {
        const updatedCategories = b.categories.map(cat => {
          if (cat.id === categoryId) {
            return { ...cat, allocated: newAllocated };
          }
          return cat;
        });
        return { ...b, categories: updatedCategories, updatedAt: new Date().toISOString() };
      }
      return b;
    }));

    // Update corresponding grant aim if category name includes "Aim"
    if (category.name.includes('Aim')) {
      // Extract aim number from category name (e.g., "Aim 1 - ..." -> "Aim 1")
      const aimMatch = category.name.match(/Aim \d+/);
      if (aimMatch) {
        const aimNumber = aimMatch[0];
        setGrants(prev => prev.map(grant => {
          if (grant.id === budget.grantId) {
            const updatedAims = grant.aims.map(aim => {
              if (aim.number === aimNumber) {
                return { ...aim, budgetAllocation: newAllocated };
              }
              return aim;
            });
            return { ...grant, aims: updatedAims, updatedAt: new Date().toISOString() };
          }
          return grant;
        }));
      }
    }
  };

  // Template operations
  const addTemplate = (template) => {
    setTemplates(prev => [...prev, { ...template, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updateTemplate = (id, updates) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
  };

  const deleteTemplate = (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  // Task operations
  const addTask = (task) => {
    setTasks(prev => [...prev, { id: crypto.randomUUID(), ...task, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updateTask = (id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Document operations
  const addDocument = (document) => {
    setDocuments(prev => [...prev, { ...document, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updateDocument = (id, updates) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d));
  };

  const deleteDocument = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Payment Request operations
  const addPaymentRequest = (pr) => {
    setPaymentRequests(prev => [...prev, { ...pr, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updatePaymentRequest = (id, updates) => {
    setPaymentRequests(prev => prev.map(pr => pr.id === id ? { ...pr, ...updates, updatedAt: new Date().toISOString() } : pr));
  };

  const deletePaymentRequest = (id) => {
    setPaymentRequests(prev => prev.filter(pr => pr.id !== id));
  };

  // Travel Request operations
  const addTravelRequest = (tr) => {
    setTravelRequests(prev => [...prev, { ...tr, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updateTravelRequest = (id, updates) => {
    setTravelRequests(prev => prev.map(tr => tr.id === id ? { ...tr, ...updates, updatedAt: new Date().toISOString() } : tr));
  };

  const deleteTravelRequest = (id) => {
    setTravelRequests(prev => prev.filter(tr => tr.id !== id));
  };

  // Gift Card Distribution operations
  const addGiftCardDistribution = (gcd) => {
    setGiftCardDistributions(prev => [...prev, { ...gcd, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updateGiftCardDistribution = (id, updates) => {
    setGiftCardDistributions(prev => prev.map(gcd => gcd.id === id ? { ...gcd, ...updates, updatedAt: new Date().toISOString() } : gcd));
  };

  const deleteGiftCardDistribution = (id) => {
    setGiftCardDistributions(prev => prev.filter(gcd => gcd.id !== id));
  };

  // Meeting operations
  const addMeeting = (meeting) => {
    setMeetings(prev => [...prev, { ...meeting, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updateMeeting = (id, updates) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m));
  };

  const deleteMeeting = (id) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  // Todo operations
  // Knowledge doc operations
  const addKnowledgeDoc = (doc) => {
    setKnowledgeDocs(prev => [...prev, { id: crypto.randomUUID(), ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updateKnowledgeDoc = (id, updates) => {
    setKnowledgeDocs(prev => prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d));
  };

  const deleteKnowledgeDoc = (id) => {
    setKnowledgeDocs(prev => prev.filter(d => d.id !== id));
  };

  // Personnel operations
  const addPerson = (person) => {
    setPersonnel(prev => [...prev, { id: crypto.randomUUID(), ...person, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updatePerson = (id, updates) => {
    setPersonnel(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  };

  const deletePerson = (id) => {
    setPersonnel(prev => prev.filter(p => p.id !== id));
  };

  const addTodo = (todo) => {
    setTodos(prev => [...prev, todo]);
  };

  const updateTodo = (id, updates) => {
    setTodos(prev => prev.map(t => t.id === id ? updates : t));
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const value = {
    grants,
    budgets,
    templates,
    tasks,
    documents,
    paymentRequests,
    travelRequests,
    giftCardDistributions,
    meetings,
    todos,
    settings,
    loading,
    addGrant,
    updateGrant,
    deleteGrant,
    addBudget,
    updateBudget,
    deleteBudget,
    updateGrantAimBudget,
    updateBudgetCategoryWithGrantSync,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addTask,
    updateTask,
    deleteTask,
    addDocument,
    updateDocument,
    deleteDocument,
    addPaymentRequest,
    updatePaymentRequest,
    deletePaymentRequest,
    addTravelRequest,
    updateTravelRequest,
    deleteTravelRequest,
    addGiftCardDistribution,
    updateGiftCardDistribution,
    deleteGiftCardDistribution,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    addTodo,
    updateTodo,
    deleteTodo,
    knowledgeDocs,
    addKnowledgeDoc,
    updateKnowledgeDoc,
    deleteKnowledgeDoc,
    personnel,
    addPerson,
    updatePerson,
    deletePerson,
    setSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
