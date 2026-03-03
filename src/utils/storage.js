// localStorage wrapper with error handling and JSON parsing

const STORAGE_KEYS = {
  GRANTS: 'pm_hub_grants',
  BUDGETS: 'pm_hub_budgets',
  TEMPLATES: 'pm_hub_templates',
  TASKS: 'pm_hub_tasks',
  DOCUMENTS: 'pm_hub_documents',
  PAYMENT_REQUESTS: 'pm_hub_payment_requests',
  TRAVEL_REQUESTS: 'pm_hub_travel_requests',
  GIFT_CARD_DISTRIBUTIONS: 'pm_hub_gift_card_distributions',
  MEETINGS: 'pm_hub_meetings',
  TODOS: 'pm_hub_todos',
  SETTINGS: 'pm_hub_settings',
  KNOWLEDGE_DOCS: 'pm_hub_knowledge_docs',
  PERSONNEL: 'pm_hub_personnel',
  TASK_TYPES: 'pm_hub_task_types',
  CONFLICTS: 'pm_hub_conflicts',
  REPLY_QUEUE: 'pm_hub_reply_queue',
  REPLY_CONTEXT_DOCS: 'pm_hub_reply_context_docs',
  STUDENTS: 'studio_students',
  ANALYZED_DOC_IDS: 'pm_hub_analyzed_doc_ids',
  AI_COST_LOG: 'pm_hub_ai_cost_log',
};

export const storage = {
  // Generic get/set methods
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  },

  // Specific data methods
  getGrants() {
    return this.get(STORAGE_KEYS.GRANTS) || [];
  },

  setGrants(grants) {
    return this.set(STORAGE_KEYS.GRANTS, grants);
  },

  getBudgets() {
    return this.get(STORAGE_KEYS.BUDGETS) || [];
  },

  setBudgets(budgets) {
    return this.set(STORAGE_KEYS.BUDGETS, budgets);
  },

  getTemplates() {
    return this.get(STORAGE_KEYS.TEMPLATES) || [];
  },

  setTemplates(templates) {
    return this.set(STORAGE_KEYS.TEMPLATES, templates);
  },

  getTasks() {
    return this.get(STORAGE_KEYS.TASKS) || [];
  },

  setTasks(tasks) {
    return this.set(STORAGE_KEYS.TASKS, tasks);
  },

  getDocuments() {
    return this.get(STORAGE_KEYS.DOCUMENTS) || [];
  },

  setDocuments(documents) {
    return this.set(STORAGE_KEYS.DOCUMENTS, documents);
  },

  getPaymentRequests() {
    return this.get(STORAGE_KEYS.PAYMENT_REQUESTS) || [];
  },

  setPaymentRequests(paymentRequests) {
    return this.set(STORAGE_KEYS.PAYMENT_REQUESTS, paymentRequests);
  },

  getTravelRequests() {
    return this.get(STORAGE_KEYS.TRAVEL_REQUESTS) || [];
  },

  setTravelRequests(travelRequests) {
    return this.set(STORAGE_KEYS.TRAVEL_REQUESTS, travelRequests);
  },

  getGiftCardDistributions() {
    return this.get(STORAGE_KEYS.GIFT_CARD_DISTRIBUTIONS) || [];
  },

  setGiftCardDistributions(giftCardDistributions) {
    return this.set(STORAGE_KEYS.GIFT_CARD_DISTRIBUTIONS, giftCardDistributions);
  },

  getMeetings() {
    return this.get(STORAGE_KEYS.MEETINGS) || [];
  },

  setMeetings(meetings) {
    return this.set(STORAGE_KEYS.MEETINGS, meetings);
  },

  getTodos() {
    return this.get(STORAGE_KEYS.TODOS) || [];
  },

  setTodos(todos) {
    return this.set(STORAGE_KEYS.TODOS, todos);
  },

  getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS) || {
      theme: 'light',
      notifications: true,
    };
  },

  setSettings(settings) {
    return this.set(STORAGE_KEYS.SETTINGS, settings);
  },

  getKnowledgeDocs() {
    return this.get(STORAGE_KEYS.KNOWLEDGE_DOCS) || [];
  },

  setKnowledgeDocs(docs) {
    return this.set(STORAGE_KEYS.KNOWLEDGE_DOCS, docs);
  },

  getPersonnel() {
    return this.get(STORAGE_KEYS.PERSONNEL) || [];
  },

  setPersonnel(personnel) {
    return this.set(STORAGE_KEYS.PERSONNEL, personnel);
  },

  getTaskTypes() {
    return this.get(STORAGE_KEYS.TASK_TYPES) || [];
  },

  setTaskTypes(taskTypes) {
    return this.set(STORAGE_KEYS.TASK_TYPES, taskTypes);
  },

  getConflicts() {
    return this.get(STORAGE_KEYS.CONFLICTS) || [];
  },

  setConflicts(conflicts) {
    return this.set(STORAGE_KEYS.CONFLICTS, conflicts);
  },

  getReplyQueue() {
    return this.get(STORAGE_KEYS.REPLY_QUEUE) || [];
  },

  setReplyQueue(items) {
    return this.set(STORAGE_KEYS.REPLY_QUEUE, items);
  },

  getReplyContextDocs() {
    return this.get(STORAGE_KEYS.REPLY_CONTEXT_DOCS) || [];
  },

  setReplyContextDocs(docs) {
    return this.set(STORAGE_KEYS.REPLY_CONTEXT_DOCS, docs);
  },

  getStudents() {
    return this.get(STORAGE_KEYS.STUDENTS) || [];
  },

  setStudents(students) {
    return this.set(STORAGE_KEYS.STUDENTS, students);
  },

  getAnalyzedDocIds() {
    const arr = this.get(STORAGE_KEYS.ANALYZED_DOC_IDS) || [];
    return new Set(arr);
  },

  setAnalyzedDocIds(set) {
    return this.set(STORAGE_KEYS.ANALYZED_DOC_IDS, [...set]);
  },

  getQuotaInfo() {
    try {
      const usedBytes = new Blob([JSON.stringify(localStorage)]).size;
      const totalBytes = 5_242_880; // 5 MB
      const percent = Math.round((usedBytes / totalBytes) * 100);
      return { usedBytes, totalBytes, percent };
    } catch {
      return { usedBytes: 0, totalBytes: 5_242_880, percent: 0 };
    }
  },

  getAiCostLog() {
    return this.get(STORAGE_KEYS.AI_COST_LOG) || [];
  },

  setAiCostLog(log) {
    return this.set(STORAGE_KEYS.AI_COST_LOG, log);
  },

  // Clear all data
  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => this.remove(key));
  },

  // Export all data as JSON
  exportAll() {
    return {
      grants: this.getGrants(),
      budgets: this.getBudgets(),
      templates: this.getTemplates(),
      tasks: this.getTasks(),
      documents: this.getDocuments(),
      paymentRequests: this.getPaymentRequests(),
      travelRequests: this.getTravelRequests(),
      giftCardDistributions: this.getGiftCardDistributions(),
      meetings: this.getMeetings(),
      todos: this.getTodos(),
      settings: this.getSettings(),
      knowledgeDocs: this.getKnowledgeDocs(),
      personnel: this.getPersonnel(),
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
  },

  // Import data from JSON
  importAll(data) {
    try {
      if (data.grants) this.setGrants(data.grants);
      if (data.budgets) this.setBudgets(data.budgets);
      if (data.templates) this.setTemplates(data.templates);
      if (data.tasks) this.setTasks(data.tasks);
      if (data.documents) this.setDocuments(data.documents);
      if (data.paymentRequests) this.setPaymentRequests(data.paymentRequests);
      if (data.travelRequests) this.setTravelRequests(data.travelRequests);
      if (data.giftCardDistributions) this.setGiftCardDistributions(data.giftCardDistributions);
      if (data.meetings) this.setMeetings(data.meetings);
      if (data.todos) this.setTodos(data.todos);
      if (data.settings) this.setSettings(data.settings);
      if (data.knowledgeDocs) this.setKnowledgeDocs(data.knowledgeDocs);
      if (data.personnel) this.setPersonnel(data.personnel);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },
};

export default storage;
