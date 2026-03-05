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
  {
    name: 'scan_gmail',
    description: 'Scan recent Gmail emails and return suggested action items (todos and tasks). Does NOT auto-add — call add_items_from_scan after user review.',
    inputSchema: {
      type: 'object',
      properties: {
        hours:     { type: 'number', description: 'How many hours back to scan (default: 24)' },
        maxEmails: { type: 'number', description: 'Maximum emails to fetch (default: 20)' },
      },
    },
  },
  {
    name: 'add_items_from_scan',
    description: 'Write approved items from a Gmail scan to brAIn as todos (personal) or tasks (grant-related).',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Items to add',
          items: {
            type: 'object',
            properties: {
              type:     { type: 'string', description: '"todo" or "task"' },
              text:     { type: 'string', description: 'Item text / title' },
              priority: { type: 'string', description: '"high", "medium", or "normal"' },
              dueDate:  { type: 'string', description: 'ISO date or null' },
              grantId:  { type: 'string', description: 'Grant ID for tasks (optional)' },
              source:   { type: 'string', description: 'Email source (sender — subject)' },
            },
            required: ['type', 'text'],
          },
        },
      },
      required: ['items'],
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

  async scan_gmail({ hours = 24, maxEmails = 20 } = {}) {
    const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, ANTHROPIC_API_KEY } = process.env;
    if (!GMAIL_REFRESH_TOKEN) throw new Error('GMAIL_REFRESH_TOKEN not set in mcp-server/.env');
    if (!ANTHROPIC_API_KEY)   throw new Error('ANTHROPIC_API_KEY not set in mcp-server/.env');

    // 1. Exchange refresh token for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        refresh_token: GMAIL_REFRESH_TOKEN,
        grant_type:    'refresh_token',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(`Gmail auth failed: ${tokenData.error_description || tokenData.error}`);
    const accessToken = tokenData.access_token;

    // 2. Fetch email list (exclude promotions/social noise)
    const query = `newer_than:${hours}h -category:promotions -category:social`;
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxEmails}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const listData = await listRes.json();
    if (!listRes.ok) throw new Error(`Gmail list failed: ${listData.error?.message}`);
    const messages = listData.messages || [];
    if (messages.length === 0) return { scanned: 0, suggestions: [] };

    // 3. Fetch metadata for each email
    const emails = await Promise.all(messages.map(async (msg) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata` +
        `&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const d = await r.json();
      const hdrs = d.payload?.headers || [];
      return {
        subject: hdrs.find(h => h.name === 'Subject')?.value || '(no subject)',
        from:    hdrs.find(h => h.name === 'From')?.value    || '',
        snippet: d.snippet || '',
      };
    }));

    // 4. Classify with Claude Haiku
    const emailList = emails.map((e, i) =>
      `${i + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   Preview: ${e.snippet}`
    ).join('\n\n');

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content:
            `You analyze emails for Héctor Bravo-Rivera, Program Director at Howard University ` +
            `College of Medicine managing an RWJF grant and a music studio.\n\n` +
            `Classify each email:\n` +
            `- ignore: newsletters, automated, no action needed, CC-only\n` +
            `- todo: personal action (reply, errand, non-grant task)\n` +
            `- task: grant/research/admin action (budgets, payments, reports, meetings, IRB, travel)\n\n` +
            `Emails:\n${emailList}\n\n` +
            `Return ONLY a JSON array with exactly ${emails.length} objects (one per email, same order):\n` +
            `[{"action":"todo"|"task"|"ignore","text":"brief action","priority":"high"|"medium"|"normal","dueDate":"YYYY-MM-DD or null","source":"sender — subject"}]`,
        }],
      }),
    });
    const aiData = await aiRes.json();
    const aiText = aiData.content?.[0]?.text || '[]';
    const jsonMatch = aiText.match(/\[[\s\S]*\]/);
    const classified = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const suggestions = classified
      .filter(c => c.action !== 'ignore')
      .map(c => ({
        type:     c.action,
        text:     c.text,
        priority: c.priority || 'normal',
        dueDate:  c.dueDate  || null,
        source:   c.source   || '',
      }));

    return { scanned: emails.length, suggestions };
  },

  async add_items_from_scan({ items = [] } = {}) {
    let added = 0;
    for (const item of items) {
      if (item.type === 'todo') {
        const todo = {
          id: randomId(), text: item.text, completed: false,
          priority: item.priority || 'normal', dueDate: item.dueDate || null,
          source: item.source || '', createdAt: now(),
        };
        await upsertOne('todos', todo);
        added++;
      } else if (item.type === 'task') {
        const task = {
          id: randomId(), title: item.text,
          priority: item.priority === 'normal' ? 'medium' : (item.priority || 'medium'),
          status: 'To Do', dueDate: item.dueDate || null,
          grantId: item.grantId || null,
          description: item.source ? `From Gmail: ${item.source}` : '',
          createdAt: now(), updatedAt: now(),
        };
        await upsertOne('tasks', task);
        added++;
      }
    }
    return { added };
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
