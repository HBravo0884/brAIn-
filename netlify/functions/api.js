// Netlify Function: REST API for brAIn data
// Allows ChatGPT, NotebookLM, and other tools to read brAIn data
// Auth: Authorization: Bearer BRAIN_API_KEY header

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getAll = async (table) => {
  const { data, error } = await supabase.from(table).select('data');
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data || []).map(r => r.data);
};

exports.handler = async (event) => {
  // Auth check
  const apiKey = process.env.BRAIN_API_KEY;
  if (apiKey) {
    const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
    if (auth !== `Bearer ${apiKey}`) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const entity = event.queryStringParameters?.entity || 'summary';

  try {
    let result;

    if (entity === 'summary') {
      const [grants, tasks, meetings, todos, paymentRequests] = await Promise.all([
        getAll('grants'), getAll('tasks'), getAll('meetings'),
        getAll('todos'), getAll('payment_requests'),
      ]);
      const todayStr = new Date().toISOString().slice(0, 10);
      result = {
        summary: {
          grants: { total: grants.length, active: grants.filter(g => g.status === 'active').length },
          tasks: { total: tasks.length, urgent: tasks.filter(t => t.priority === 'high' && t.status !== 'Done').length, done: tasks.filter(t => t.status === 'Done').length },
          meetings: { total: meetings.length, today: meetings.filter(m => m.date?.slice(0, 10) === todayStr).length },
          todos: { total: todos.length, active: todos.filter(t => !t.completed).length },
          pendingPayments: paymentRequests.filter(p => p.approvalStatus === 'pending').length,
        },
        activeGrants: grants.filter(g => g.status === 'active').map(g => ({ id: g.id, title: g.title, amount: g.amount, endDate: g.endDate })),
        urgentTasks: tasks.filter(t => t.priority === 'high' && t.status !== 'Done').map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate })),
        upcomingMeetings: meetings.filter(m => m.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
        activeTodos: todos.filter(t => !t.completed),
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
      return { statusCode: 400, body: JSON.stringify({ error: `Unknown entity: ${entity}. Valid: summary, grants, tasks, meetings, todos, students, personnel, knowledge, payments, travel, budgets` }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
