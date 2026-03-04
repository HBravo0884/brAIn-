import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { storage } from '../utils/storage';
import { detectBudgetGrantMismatch, buildDocumentConflicts, dedupeConflicts } from '../utils/conflicts';
import { analyzeDocumentForConflicts } from '../utils/ai';
import { StudioProvider } from './StudioContext';
import { GrantSchema, BudgetSchema, MeetingSchema, TaskSchema, TodoSchema, validateSafe } from '../utils/schemas';
import { pullAllFromSupabase, mergeWithSupabase, syncEntity, isSupabaseEnabled } from '../utils/supabase';

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
  const [taskTypes, setTaskTypes] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [replyQueue, setReplyQueue] = useState([]);
  const [replyContextDocs, setReplyContextDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const analyzedDocIds = useRef(null); // initialized from storage in load effect

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      analyzedDocIds.current = storage.getAnalyzedDocIds();
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
      const storedTaskTypes = storage.getTaskTypes();
      if (storedTaskTypes.length === 0) {
        const now = new Date().toISOString();
        const defaults = [
          { id: 'builtin-travel-auth', name: 'Travel Authorization', category: 'travel', description: 'Submit travel for a conference or meeting. Covers the 4-phase SOP: Application → Spend Auth → CBT Booking → Post-Travel.', iconName: 'Plane', isBuiltIn: true, appLinks: [{ label: 'Open Travel Requests', path: '/travel-requests' }], forms: [], createdAt: now, updatedAt: now },
          { id: 'builtin-payment-request', name: 'Payment Request (PRF)', category: 'payment', description: 'Create and submit a Payment Request Form linked to a grant budget category.', iconName: 'CreditCard', isBuiltIn: true, appLinks: [{ label: 'Open Payment Requests', path: '/payment-requests' }], forms: [], createdAt: now, updatedAt: now },
          { id: 'builtin-pcard-load', name: 'P-Card Load (Transfer of Funds)', category: 'purchasing', description: 'Load the Declining Balance Card via Transfer of Funds form. Requires Nichelle\'s signature and Anjanette\'s processing.', iconName: 'DollarSign', isBuiltIn: true, appLinks: [], forms: [], createdAt: now, updatedAt: now },
          { id: 'builtin-workday-req', name: 'Workday Requisition', category: 'purchasing', description: 'Submit a Workday requisition for purchases >$3,000. Requires PI approval and procurement workflow.', iconName: 'ShoppingCart', isBuiltIn: true, appLinks: [], forms: [], createdAt: now, updatedAt: now },
        ];
        storage.setTaskTypes(defaults);
        setTaskTypes(defaults);
      } else {
        setTaskTypes(storedTaskTypes);
      }
      setConflicts(storage.getConflicts());
      setReplyQueue(storage.getReplyQueue());
      setReplyContextDocs(storage.getReplyContextDocs());
      setLoading(false);
    };
    loadData();
  }, []);

  // Pull from Supabase on mount — merge any records newer than localStorage
  useEffect(() => {
    if (loading || !isSupabaseEnabled()) return;
    setSyncStatus('syncing');
    pullAllFromSupabase().then(remote => {
      if (!remote) { setSyncStatus('error'); return; }
      if (remote.grants?.length)               setGrants(prev => mergeWithSupabase(prev, remote.grants));
      if (remote.budgets?.length)              setBudgets(prev => mergeWithSupabase(prev, remote.budgets));
      if (remote.tasks?.length)                setTasks(prev => mergeWithSupabase(prev, remote.tasks));
      if (remote.meetings?.length)             setMeetings(prev => mergeWithSupabase(prev, remote.meetings));
      if (remote.todos?.length)                setTodos(prev => mergeWithSupabase(prev, remote.todos));
      if (remote.paymentRequests?.length)      setPaymentRequests(prev => mergeWithSupabase(prev, remote.paymentRequests));
      if (remote.travelRequests?.length)       setTravelRequests(prev => mergeWithSupabase(prev, remote.travelRequests));
      if (remote.giftCardDistributions?.length) setGiftCardDistributions(prev => mergeWithSupabase(prev, remote.giftCardDistributions));
      if (remote.documents?.length)            setDocuments(prev => mergeWithSupabase(prev, remote.documents));
      if (remote.knowledgeDocs?.length)        setKnowledgeDocs(prev => mergeWithSupabase(prev, remote.knowledgeDocs));
      if (remote.personnel?.length)            setPersonnel(prev => mergeWithSupabase(prev, remote.personnel));
      if (remote.templates?.length)            setTemplates(prev => mergeWithSupabase(prev, remote.templates));
      if (remote.taskTypes?.length)            setTaskTypes(prev => mergeWithSupabase(prev, remote.taskTypes));
      setSyncStatus('synced');
    }).catch(() => setSyncStatus('error'));
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync all entities to Supabase after changes (2s debounce, background)
  useEffect(() => {
    if (loading || !isSupabaseEnabled()) return;
    const t = setTimeout(() => {
      setSyncStatus('syncing');
      Promise.all([
        syncEntity('grants', grants),
        syncEntity('budgets', budgets),
        syncEntity('tasks', tasks),
        syncEntity('meetings', meetings),
        syncEntity('todos', todos),
        syncEntity('paymentRequests', paymentRequests),
        syncEntity('travelRequests', travelRequests),
        syncEntity('giftCardDistributions', giftCardDistributions),
        syncEntity('documents', documents),
        syncEntity('knowledgeDocs', knowledgeDocs),
        syncEntity('personnel', personnel),
        syncEntity('templates', templates),
        syncEntity('taskTypes', taskTypes),
      ]).then(() => setSyncStatus('synced')).catch(() => setSyncStatus('error'));
    }, 2000);
    return () => clearTimeout(t);
  }, [grants, budgets, tasks, meetings, todos, paymentRequests, travelRequests, giftCardDistributions, documents, knowledgeDocs, personnel, templates, taskTypes, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced localStorage persistence — coalesces rapid state updates into a
  // single write 300 ms after the last change, preventing layout thrash on bulk
  // operations (e.g. AI bulk-importing 20 meetings at once).
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setGrants(grants), 300); return () => clearTimeout(t); }, [grants, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setBudgets(budgets), 300); return () => clearTimeout(t); }, [budgets, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setTemplates(templates), 300); return () => clearTimeout(t); }, [templates, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setTasks(tasks), 300); return () => clearTimeout(t); }, [tasks, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setDocuments(documents), 300); return () => clearTimeout(t); }, [documents, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setSettings(settings), 300); return () => clearTimeout(t); }, [settings, loading]);
  // Dark mode: apply theme class to <html> when settings.theme changes
  useEffect(() => {
    const applyTheme = (theme) => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // system
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    };
    applyTheme(settings.theme);
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => document.documentElement.classList.toggle('dark', e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setPaymentRequests(paymentRequests), 300); return () => clearTimeout(t); }, [paymentRequests, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setTravelRequests(travelRequests), 300); return () => clearTimeout(t); }, [travelRequests, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setGiftCardDistributions(giftCardDistributions), 300); return () => clearTimeout(t); }, [giftCardDistributions, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setMeetings(meetings), 300); return () => clearTimeout(t); }, [meetings, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setTodos(todos), 300); return () => clearTimeout(t); }, [todos, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setKnowledgeDocs(knowledgeDocs), 300); return () => clearTimeout(t); }, [knowledgeDocs, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setPersonnel(personnel), 300); return () => clearTimeout(t); }, [personnel, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setTaskTypes(taskTypes), 300); return () => clearTimeout(t); }, [taskTypes, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setConflicts(conflicts), 300); return () => clearTimeout(t); }, [conflicts, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setReplyQueue(replyQueue), 300); return () => clearTimeout(t); }, [replyQueue, loading]);
  useEffect(() => { if (loading) return; const t = setTimeout(() => storage.setReplyContextDocs(replyContextDocs), 300); return () => clearTimeout(t); }, [replyContextDocs, loading]);

  // Quota monitoring — fire custom event when storage exceeds 70%
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      const { percent } = storage.getQuotaInfo();
      if (percent >= 70) {
        window.dispatchEvent(new CustomEvent('quota_warning', { detail: percent }));
      }
    }, 500);
    return () => clearTimeout(t);
  }, [grants, budgets, tasks, documents, knowledgeDocs, meetings, todos, personnel, replyQueue, loading]);

  // Auto-detect budget ↔ grant amount mismatches
  useEffect(() => {
    if (loading) return;
    const newConflicts = [];
    for (const grant of grants) {
      if (!grant.amount) continue;
      const budget = budgets.find(b => b.grantId === grant.id);
      if (!budget) continue;
      const c = detectBudgetGrantMismatch(grant, budget);
      if (c) newConflicts.push(c);
    }
    if (newConflicts.length > 0) {
      setConflicts(prev => dedupeConflicts(prev, newConflicts));
    }
  }, [grants, budgets, loading]);

  // Auto-scan new knowledge docs for grant conflicts (background, non-blocking)
  useEffect(() => {
    if (loading || !grants.length || !analyzedDocIds.current) return;
    const unanalyzed = knowledgeDocs.filter(d => d.content && !analyzedDocIds.current.has(d.id));
    if (unanalyzed.length === 0) return;
    unanalyzed.forEach(doc => {
      analyzedDocIds.current.add(doc.id);
      storage.setAnalyzedDocIds(analyzedDocIds.current);
      analyzeDocumentForConflicts(doc.content, doc.title, grants)
        .then(extracted => {
          if (!extracted.length) return;
          const newC = buildDocumentConflicts(extracted, doc, grants);
          if (newC.length > 0) {
            setConflicts(prev => dedupeConflicts(prev, newC));
          }
        });
    });
  }, [knowledgeDocs, grants, loading]);

  // Grant operations
  const addGrant = (grant) => {
    if (!validateSafe(GrantSchema, grant, 'grant')) return;
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
    if (!validateSafe(BudgetSchema, budget, 'budget')) return;
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
    if (!validateSafe(TaskSchema, task, 'task')) return;
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
    if (!validateSafe(MeetingSchema, meeting, 'meeting')) return;
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

  // ── Data Sync & Scrub ───────────────────────────────────────────────────────
  const syncAndScrub = () => {
    // 1. Re-read all data fresh from localStorage
    const freshGrants        = storage.getGrants();
    const freshBudgets       = storage.getBudgets();
    const freshTasks         = storage.getTasks();
    const freshMeetings      = storage.getMeetings();
    const freshPayments      = storage.getPaymentRequests();
    const freshTravel        = storage.getTravelRequests();
    const freshGiftCards     = storage.getGiftCardDistributions();
    const freshPersonnel     = storage.getPersonnel();
    const freshKnowledge     = storage.getKnowledgeDocs();
    const freshTodos         = storage.getTodos();
    const freshTemplates     = storage.getTemplates();
    const freshDocuments     = storage.getDocuments();

    const grantIds = new Set(freshGrants.map(g => g.id));
    const report   = { cleaned: 0, items: [] };

    const clearGrant = (obj, label) => {
      if (obj.grantId && !grantIds.has(obj.grantId)) {
        report.cleaned++;
        report.items.push(`${label} — removed orphaned grant link`);
        return { ...obj, grantId: '' };
      }
      return obj;
    };

    // 2. Clean orphaned grantId fields
    const cleanedTasks    = freshTasks.map(t => clearGrant(t, `Task "${t.title}"`));
    const cleanedMeetings = freshMeetings.map(m => clearGrant(m, `Meeting "${m.title}"`));
    const cleanedPayments = freshPayments.map(p => clearGrant(p, `Payment "${p.vendor || p.id}"`));
    const cleanedTravel   = freshTravel.map(t => clearGrant(t, `Travel "${t.travelerName}"`));
    const cleanedGiftCards= freshGiftCards.map(g => clearGrant(g, `Gift Card "${g.recipientName}"`));
    const cleanedBudgets  = freshBudgets.map(b => clearGrant(b, `Budget "${b.id}"`));

    // Personnel can have an array of grantIds
    const cleanedPersonnel = freshPersonnel.map(p => {
      const before  = (p.grantIds || []).length;
      const cleaned = (p.grantIds || []).filter(id => grantIds.has(id));
      if (cleaned.length !== before) {
        const diff = before - cleaned.length;
        report.cleaned += diff;
        report.items.push(`Personnel "${p.firstName} ${p.lastName}" — removed ${diff} orphaned grant link${diff !== 1 ? 's' : ''}`);
      }
      return { ...p, grantIds: cleaned };
    });

    // 3. Update all React state (triggers re-render of every subscribed component)
    setGrants(freshGrants);
    setBudgets(cleanedBudgets);
    setTasks(cleanedTasks);
    setMeetings(cleanedMeetings);
    setPaymentRequests(cleanedPayments);
    setTravelRequests(cleanedTravel);
    setGiftCardDistributions(cleanedGiftCards);
    setPersonnel(cleanedPersonnel);
    setKnowledgeDocs(freshKnowledge);
    setTodos(freshTodos);
    setTemplates(freshTemplates);
    setDocuments(freshDocuments);

    // 4. Persist any cleaned data back to storage
    if (report.cleaned > 0) {
      storage.setBudgets(cleanedBudgets);
      storage.setTasks(cleanedTasks);
      storage.setMeetings(cleanedMeetings);
      storage.setPaymentRequests(cleanedPayments);
      storage.setTravelRequests(cleanedTravel);
      storage.setGiftCardDistributions(cleanedGiftCards);
      storage.setPersonnel(cleanedPersonnel);
    }

    return {
      cleaned: report.cleaned,
      items:   report.items,
      counts: {
        grants:       freshGrants.length,
        budgets:      cleanedBudgets.length,
        tasks:        cleanedTasks.length,
        meetings:     cleanedMeetings.length,
        payments:     cleanedPayments.length,
        travel:       cleanedTravel.length,
        giftCards:    cleanedGiftCards.length,
        personnel:    cleanedPersonnel.length,
        documents:    freshDocuments.length,
        todos:        freshTodos.length,
        templates:    freshTemplates.length,
        knowledgeDocs:freshKnowledge.length,
      },
    };
  };

  const addTodo = (todo) => {
    if (!validateSafe(TodoSchema, todo, 'todo')) return;
    setTodos(prev => [...prev, todo]);
  };

  const updateTodo = (id, updates) => {
    setTodos(prev => prev.map(t => t.id === id ? updates : t));
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  // Conflict operations
  const addConflicts = (newOnes) => {
    setConflicts(prev => dedupeConflicts(prev, newOnes));
  };

  const resolveConflict = (id, choice) => {
    setConflicts(prev => prev.map(c => {
      if (c.id !== id) return c;
      // Apply the value change if "B" is chosen and sectionA is a grant
      if (choice === 'B' && c.sectionA?.type === 'grant' && c.sectionA?.rawField && c.sectionB?.rawValue != null) {
        setTimeout(() => updateGrant(c.sectionA.id, { [c.sectionA.rawField]: c.sectionB.rawValue }), 0);
      }
      return { ...c, resolved: true, resolvedWith: choice, resolvedAt: new Date().toISOString() };
    }));
  };

  const clearResolvedConflicts = () => {
    setConflicts(prev => prev.filter(c => !c.resolved));
  };

  // Task type operations
  const addTaskType = (taskType) => {
    setTaskTypes(prev => [...prev, { id: crypto.randomUUID(), ...taskType, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  };

  const updateTaskType = (id, updates) => {
    setTaskTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
  };

  const deleteTaskType = (id) => {
    setTaskTypes(prev => prev.filter(t => t.id !== id));
  };

  // Reply Context Docs operations
  const addReplyContextDoc = (doc) => {
    setReplyContextDocs(prev => [...prev, { id: crypto.randomUUID(), ...doc, createdAt: new Date().toISOString() }]);
  };

  const deleteReplyContextDoc = (id) => {
    setReplyContextDocs(prev => prev.filter(d => d.id !== id));
  };

  // Reply Queue operations
  const addReplyItem = (item) => {
    setReplyQueue(prev => [...prev, { id: crypto.randomUUID(), ...item, status: 'pending', createdAt: new Date().toISOString() }]);
  };

  const updateReplyItem = (id, updates) => {
    setReplyQueue(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteReplyItem = (id) => {
    setReplyQueue(prev => prev.filter(r => r.id !== id));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({
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
    syncAndScrub,
    taskTypes,
    addTaskType,
    updateTaskType,
    deleteTaskType,
    conflicts,
    addConflicts,
    resolveConflict,
    clearResolvedConflicts,
    replyQueue,
    addReplyItem,
    updateReplyItem,
    deleteReplyItem,
    replyContextDocs,
    addReplyContextDoc,
    deleteReplyContextDoc,
    syncStatus,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [grants, budgets, templates, tasks, documents, paymentRequests, travelRequests,
    giftCardDistributions, meetings, todos, settings, loading, knowledgeDocs, personnel,
    taskTypes, conflicts, replyQueue, replyContextDocs, syncStatus]);

  return (
    <AppContext.Provider value={value}>
      <StudioProvider>
        {children}
      </StudioProvider>
    </AppContext.Provider>
  );
};
