import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const getAll = async (table) => {
  const { data, error } = await supabase.from(table).select('data');
  if (error) throw new Error(`Supabase error (${table}): ${error.message}`);
  return (data || []).map(r => r.data);
};

const upsertOne = async (table, item) => {
  const { error } = await supabase.from(table).upsert(
    { id: item.id, data: item, updated_at: item.updatedAt || new Date().toISOString() },
    { onConflict: 'id' }
  );
  if (error) throw new Error(`Supabase upsert error (${table}): ${error.message}`);
  return item;
};

const randomId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_summary',
    description: 'Get a high-level snapshot of all brAIn data — counts, urgent items, budget totals, today\'s meetings, and active todos.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_tasks',
    description: 'List grant workflow tasks. Optionally filter by status (To Do, In Progress, Review, Done), priority (low, medium, high), or grantId.',
    inputSchema: {
      type: 'object',
      properties: {
        status:   { type: 'string', description: 'Filter by status: "To Do", "In Progress", "Review", "Done"' },
        priority: { type: 'string', description: 'Filter by priority: "low", "medium", "high"' },
        grantId:  { type: 'string', description: 'Filter by grant ID' },
      },
    },
  },
  {
    name: 'get_grants',
    description: 'List all grants with their status, amount, aims, and budget summary.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status: "pending", "active", "completed", "rejected"' },
      },
    },
  },
  {
    name: 'get_meetings',
    description: 'List meetings. Optionally filter by date range or grantId.',
    inputSchema: {
      type: 'object',
      properties: {
        from:    { type: 'string', description: 'ISO date string — return meetings on or after this date' },
        to:      { type: 'string', description: 'ISO date string — return meetings on or before this date' },
        grantId: { type: 'string', description: 'Filter by grant ID' },
      },
    },
  },
  {
    name: 'get_todos',
    description: 'List personal quick-capture todos.',
    inputSchema: {
      type: 'object',
      properties: {
        activeOnly: { type: 'boolean', description: 'If true, only return incomplete todos' },
      },
    },
  },
  {
    name: 'get_budget',
    description: 'Get the full budget breakdown for a specific grant.',
    inputSchema: {
      type: 'object',
      properties: {
        grantId: { type: 'string', description: 'Grant ID to get budget for' },
      },
      required: ['grantId'],
    },
  },
  {
    name: 'get_students',
    description: 'List music studio students with their pedagogical profiles and lesson logs.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status: "Active" or "Discontinued"' },
      },
    },
  },
  {
    name: 'get_knowledge_docs',
    description: 'List knowledge base documents (SOPs, grant rules, reference materials).',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_personnel',
    description: 'List team members and their roles.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'add_task',
    description: 'Create a new grant workflow task.',
    inputSchema: {
      type: 'object',
      properties: {
        title:    { type: 'string', description: 'Task title (required)' },
        priority: { type: 'string', description: 'Priority: "low", "medium", "high". Default: "medium"' },
        status:   { type: 'string', description: 'Status: "To Do", "In Progress", "Review", "Done". Default: "To Do"' },
        dueDate:  { type: 'string', description: 'Due date as ISO date string (optional)' },
        grantId:  { type: 'string', description: 'Grant ID to link this task to (optional)' },
        description: { type: 'string', description: 'Task description (optional)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task — change status, priority, due date, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        id:       { type: 'string', description: 'Task ID (required)' },
        title:    { type: 'string' },
        status:   { type: 'string', description: '"To Do", "In Progress", "Review", "Done"' },
        priority: { type: 'string', description: '"low", "medium", "high"' },
        dueDate:  { type: 'string' },
        description: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_todo',
    description: 'Add a quick personal to-do item.',
    inputSchema: {
      type: 'object',
      properties: {
        text:     { type: 'string', description: 'Todo text (required)' },
        priority: { type: 'string', description: '"high", "medium", "normal". Default: "normal"' },
        dueDate:  { type: 'string', description: 'Due date as ISO date string (optional)' },
      },
      required: ['text'],
    },
  },
  {
    name: 'complete_todo',
    description: 'Mark a todo as completed.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Todo ID (required)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_meeting',
    description: 'Schedule a new meeting.',
    inputSchema: {
      type: 'object',
      properties: {
        title:     { type: 'string', description: 'Meeting title (required)' },
        date:      { type: 'string', description: 'ISO datetime string (required)' },
        location:  { type: 'string' },
        attendees: { type: 'string' },
        notes:     { type: 'string' },
        grantId:   { type: 'string', description: 'Grant ID to link to (optional)' },
      },
      required: ['title', 'date'],
    },
  },
  {
    name: 'update_grant',
    description: 'Update grant fields (status, description, notes, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        id:     { type: 'string', description: 'Grant ID (required)' },
        status: { type: 'string', description: '"pending", "active", "completed", "rejected"' },
        description: { type: 'string' },
        notes:  { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_knowledge_doc',
    description: 'Add a document to the knowledge base.',
    inputSchema: {
      type: 'object',
      properties: {
        title:   { type: 'string', description: 'Document title (required)' },
        content: { type: 'string', description: 'Document content (required)' },
        source:  { type: 'string', description: 'Source reference (optional)' },
      },
      required: ['title', 'content'],
    },
  },
];

// ── Tool handlers ─────────────────────────────────────────────────────────────

const handlers = {
  async get_summary() {
    const [grants, tasks, meetings, todos, paymentRequests] = await Promise.all([
      getAll('grants'), getAll('tasks'), getAll('meetings'),
      getAll('todos'), getAll('payment_requests'),
    ]);
    const todayStr = new Date().toISOString().slice(0, 10);
    const urgentTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'Done');
    const todayMeetings = meetings.filter(m => m.date?.slice(0, 10) === todayStr);
    const activeTodos = todos.filter(t => !t.completed);
    const pendingPRs = paymentRequests.filter(p => p.approvalStatus === 'pending');
    const activeGrants = grants.filter(g => g.status === 'active');

    return {
      counts: {
        grants: grants.length, activeGrants: activeGrants.length,
        tasks: tasks.length, urgentTasks: urgentTasks.length,
        meetings: meetings.length, todayMeetings: todayMeetings.length,
        todos: todos.length, activeTodos: activeTodos.length,
        pendingPaymentRequests: pendingPRs.length,
      },
      urgentTasks: urgentTasks.slice(0, 5).map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate })),
      todayMeetings: todayMeetings.map(m => ({ id: m.id, title: m.title, date: m.date })),
      activeTodos: activeTodos.slice(0, 5).map(t => ({ id: t.id, text: t.text, priority: t.priority })),
    };
  },

  async get_tasks({ status, priority, grantId } = {}) {
    let items = await getAll('tasks');
    if (status)   items = items.filter(t => t.status === status);
    if (priority) items = items.filter(t => t.priority === priority);
    if (grantId)  items = items.filter(t => t.grantId === grantId);
    return items;
  },

  async get_grants({ status } = {}) {
    let items = await getAll('grants');
    if (status) items = items.filter(g => g.status === status);
    return items.map(g => ({
      id: g.id, title: g.title, fundingAgency: g.fundingAgency,
      amount: g.amount, status: g.status, startDate: g.startDate,
      endDate: g.endDate, worktag: g.worktag,
      aimsCount: g.aims?.length || 0,
      aims: (g.aims || []).map(a => ({ number: a.number, title: a.title, status: a.status, completionPercentage: a.completionPercentage })),
    }));
  },

  async get_meetings({ from, to, grantId } = {}) {
    let items = await getAll('meetings');
    if (from)    items = items.filter(m => m.date >= from);
    if (to)      items = items.filter(m => m.date <= to);
    if (grantId) items = items.filter(m => m.grantId === grantId);
    return items.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  },

  async get_todos({ activeOnly } = {}) {
    let items = await getAll('todos');
    if (activeOnly) items = items.filter(t => !t.completed);
    return items;
  },

  async get_budget({ grantId }) {
    const budgets = await getAll('budgets');
    return budgets.find(b => b.grantId === grantId) || null;
  },

  async get_students({ status } = {}) {
    let items = await getAll('students');
    if (status) items = items.filter(s => s.status === status);
    return items.map(s => ({
      id: s.id, name: s.name, status: s.status, age: s.age,
      day: s.day, time: s.time, location: s.location,
      experienceLevel: s.experienceLevel, dragonMusic: s.dragonMusic,
      currentGoal: s.currentGoal, lessonLogsCount: s.lessonLogs?.length || 0,
    }));
  },

  async get_knowledge_docs() {
    return getAll('knowledge_docs');
  },

  async get_personnel() {
    return getAll('personnel');
  },

  async add_task({ title, priority = 'medium', status = 'To Do', dueDate, grantId, description }) {
    const task = { id: randomId(), title, priority, status, dueDate: dueDate || null, grantId: grantId || null, description: description || '', createdAt: now(), updatedAt: now() };
    await upsertOne('tasks', task);
    return task;
  },

  async update_task({ id, ...updates }) {
    const tasks = await getAll('tasks');
    const existing = tasks.find(t => t.id === id);
    if (!existing) throw new Error(`Task ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: now() };
    await upsertOne('tasks', updated);
    return updated;
  },

  async add_todo({ text, priority = 'normal', dueDate }) {
    const todo = { id: randomId(), text, completed: false, priority, dueDate: dueDate || null, createdAt: now() };
    await upsertOne('todos', todo);
    return todo;
  },

  async complete_todo({ id }) {
    const todos = await getAll('todos');
    const existing = todos.find(t => t.id === id);
    if (!existing) throw new Error(`Todo ${id} not found`);
    const updated = { ...existing, completed: true, updatedAt: now() };
    await upsertOne('todos', updated);
    return updated;
  },

  async add_meeting({ title, date, location, attendees, notes, grantId }) {
    const meeting = { id: randomId(), title, date, location: location || '', attendees: attendees || '', notes: notes || '', grantId: grantId || null, createdAt: now(), updatedAt: now() };
    await upsertOne('meetings', meeting);
    return meeting;
  },

  async update_grant({ id, ...updates }) {
    const grants = await getAll('grants');
    const existing = grants.find(g => g.id === id);
    if (!existing) throw new Error(`Grant ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: now() };
    await upsertOne('grants', updated);
    return updated;
  },

  async add_knowledge_doc({ title, content, source }) {
    const doc = { id: randomId(), title, content, source: source || '', uploadedDate: now(), createdAt: now(), updatedAt: now() };
    await upsertOne('knowledge_docs', doc);
    return doc;
  },
};

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'brain', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = handlers[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  try {
    const result = await handler(args || {});
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
