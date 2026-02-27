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
      exportDate: new Date().toISOString(),
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
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },
};

export default storage;
