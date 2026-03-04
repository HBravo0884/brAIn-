// Netlify Function: REST API for brAIn data
// Allows ChatGPT and other tools to read AND write brAIn data
// Auth: Authorization: Bearer BRAIN_API_KEY header (or ?key= query param)

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ENTITY_TABLE = {
  meetings: 'meetings',
  tasks:    'tasks',
  todos:    'todos',
};

const VALID_READ_ENTITIES = ['summary', 'grants', 'tasks', 'meetings', 'todos', 'students', 'personnel', 'knowledge', 'payments', 'travel', 'budgets'];

const getAll = async (table) => {
  const { data, error } = await supabase.from(table).select('data');
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data || []).map(r => r.data);
};

const upsertRecord = async (table, record) => {
  const { error } = await supabase
    .from(table)
    .upsert({ id: record.id, data: record }, { onConflict: 'id' });
  if (error) throw new Error(`upsert ${table}: ${error.message}`);
};

const deleteRecord = async (table, id) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(`delete ${table}: ${error.message}`);
};

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Auth check — accept key via header OR query param (for ChatGPT browsing)
  const apiKey = process.env.BRAIN_API_KEY;
  if (apiKey) {
    const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
    const queryKey = event.queryStringParameters?.key || '';
    if (auth !== `Bearer ${apiKey}` && queryKey !== apiKey) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
  }

  const method = event.httpMethod;
  const entity = event.queryStringParameters?.entity || 'summary';
  const id     = event.queryStringParameters?.id;

  try {
    // ── READ ──────────────────────────────────────────────────────────────────
    if (method === 'GET') {
      let result;

      if (entity === 'summary') {
        const [grants, tasks, meetings, todos, paymentRequests] = await Promise.all([
          getAll('grants'), getAll('tasks'), getAll('meetings'),
          getAll('todos'), getAll('payment_requests'),
        ]);
        const todayStr = new Date().toISOString().slice(0, 10);
        result = {
          summary: {
            grants:   { total: grants.length,   active: grants.filter(g => g.status === 'active').length },
            tasks:    { total: tasks.length,     urgent: tasks.filter(t => t.priority === 'high' && t.status !== 'Done').length, done: tasks.filter(t => t.status === 'Done').length },
            meetings: { total: meetings.length,  today: meetings.filter(m => m.date?.slice(0, 10) === todayStr).length },
            todos:    { total: todos.length,     active: todos.filter(t => !t.completed).length },
            pendingPayments: paymentRequests.filter(p => p.approvalStatus === 'pending').length,
          },
          activeGrants:     grants.filter(g => g.status === 'active').map(g => ({ id: g.id, title: g.title, amount: g.amount, endDate: g.endDate })),
          urgentTasks:      tasks.filter(t => t.priority === 'high' && t.status !== 'Done').map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate })),
          upcomingMeetings: meetings.filter(m => m.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
          activeTodos:      todos.filter(t => !t.completed),
        };
      } else if (entity === 'grants')    { result = await getAll('grants'); }
      else if (entity === 'tasks')       { result = await getAll('tasks'); }
      else if (entity === 'meetings')    { result = await getAll('meetings'); }
      else if (entity === 'todos')       { result = await getAll('todos'); }
      else if (entity === 'students')    { result = await getAll('students'); }
      else if (entity === 'personnel')   { result = await getAll('personnel'); }
      else if (entity === 'knowledge')   { result = await getAll('knowledge_docs'); }
      else if (entity === 'payments')    { result = await getAll('payment_requests'); }
      else if (entity === 'travel')      { result = await getAll('travel_requests'); }
      else if (entity === 'budgets')     { result = await getAll('budgets'); }
      else {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown entity. Valid: ${VALID_READ_ENTITIES.join(', ')}` }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    // ── CREATE ────────────────────────────────────────────────────────────────
    if (method === 'POST') {
      const table = ENTITY_TABLE[entity];
      if (!table) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Cannot create entity '${entity}'. Writable: meetings, tasks, todos` }) };
      }

      let body;
      try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

      const now = new Date().toISOString();
      const record = { id: crypto.randomUUID(), createdAt: now, updatedAt: now, ...body };

      await upsertRecord(table, record);
      return { statusCode: 201, headers, body: JSON.stringify(record) };
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    if (method === 'PATCH') {
      const table = ENTITY_TABLE[entity];
      if (!table) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Cannot update entity '${entity}'. Writable: meetings, tasks, todos` }) };
      }
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing ?id= query parameter' }) };
      }

      let body;
      try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

      // Fetch existing record, merge updates
      const { data, error } = await supabase.from(table).select('data').eq('id', id).single();
      if (error || !data) return { statusCode: 404, headers, body: JSON.stringify({ error: `Record ${id} not found in ${table}` }) };

      const updated = { ...data.data, ...body, id, updatedAt: new Date().toISOString() };
      await upsertRecord(table, updated);
      return { statusCode: 200, headers, body: JSON.stringify(updated) };
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (method === 'DELETE') {
      const table = ENTITY_TABLE[entity];
      if (!table) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Cannot delete entity '${entity}'. Writable: meetings, tasks, todos` }) };
      }
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing ?id= query parameter' }) };
      }

      await deleteRecord(table, id);
      return { statusCode: 200, headers, body: JSON.stringify({ deleted: true, id }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
