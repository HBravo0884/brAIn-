// Netlify Function: Human-readable HTML/text export for NotebookLM
// NotebookLM can crawl a URL as a "Website" source — this page gives it
// a clean, structured view of your brAIn data.
//
// URL: https://YOUR-SITE.netlify.app/.netlify/functions/notebook
// Optional auth via ?key=YOUR_BRAIN_API_KEY

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getAll = async (table) => {
  const { data, error } = await supabase.from(table).select('data');
  if (error) return [];
  return (data || []).map(r => r.data);
};

const fmt = (v) => v ?? '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

exports.handler = async (event) => {
  // Optional auth
  const apiKey = process.env.BRAIN_API_KEY;
  if (apiKey) {
    const queryKey = event.queryStringParameters?.key || '';
    const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
    if (queryKey !== apiKey && auth !== `Bearer ${apiKey}`) {
      return { statusCode: 401, headers: { 'Content-Type': 'text/plain' }, body: 'Unauthorized' };
    }
  }

  const [grants, tasks, meetings, todos, personnel, knowledge, payments, travel] = await Promise.all([
    getAll('grants'), getAll('tasks'), getAll('meetings'), getAll('todos'),
    getAll('personnel'), getAll('knowledge_docs'), getAll('payment_requests'), getAll('travel_requests'),
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingMeetings = meetings
    .filter(m => m.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const lines = [];
  const h1 = (t) => lines.push(`\n${'='.repeat(60)}\n${t.toUpperCase()}\n${'='.repeat(60)}`);
  const h2 = (t) => lines.push(`\n--- ${t} ---`);
  const li = (t) => lines.push(`  • ${t}`);

  lines.push(`brAIn Program Manager — Data Export`);
  lines.push(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`);
  lines.push(`Today: ${todayStr}`);

  // GRANTS
  h1('Active Grants');
  grants.filter(g => g.status === 'active' || !g.status).forEach(g => {
    h2(`${g.title} (${fmt(g.worktag)})`);
    li(`Funding Agency: ${fmt(g.fundingAgency)}`);
    li(`Amount: $${(g.amount || 0).toLocaleString()}`);
    li(`Period: ${fmtDate(g.startDate)} – ${fmtDate(g.endDate)}`);
    li(`Status: ${fmt(g.status)}`);
    if (g.description) li(`Description: ${g.description}`);
    if (g.objectives) li(`Objectives: ${g.objectives}`);
  });

  // UPCOMING MEETINGS
  h1('Upcoming Meetings');
  if (upcomingMeetings.length === 0) {
    lines.push('No upcoming meetings.');
  } else {
    upcomingMeetings.slice(0, 20).forEach(m => {
      h2(`${m.title} — ${fmtDate(m.date)}`);
      if (m.date) li(`Date/Time: ${new Date(m.date).toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
      if (m.location) li(`Location: ${m.location}`);
      if (m.attendees) li(`Attendees: ${m.attendees}`);
      if (m.description) li(`Description: ${m.description}`);
      if (m.notes) li(`Notes: ${m.notes}`);
      if (m.actionItems?.length) {
        li('Action Items:');
        m.actionItems.forEach(a => lines.push(`      – ${a}`));
      }
    });
  }

  // TASKS
  h1('Tasks');
  const activeTasks = tasks.filter(t => t.status !== 'Done');
  if (activeTasks.length === 0) {
    lines.push('No active tasks.');
  } else {
    ['high', 'medium', 'low'].forEach(priority => {
      const group = activeTasks.filter(t => (t.priority || 'medium') === priority);
      if (!group.length) return;
      h2(`${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`);
      group.forEach(t => {
        li(`[${t.status || 'To Do'}] ${t.title}${t.dueDate ? ` (due ${fmtDate(t.dueDate)})` : ''}`);
        if (t.description) lines.push(`      ${t.description}`);
      });
    });
  }

  // TODOS
  h1('Quick To-Do List');
  const activeTodos = todos.filter(t => !t.completed);
  if (activeTodos.length === 0) {
    lines.push('No active todos.');
  } else {
    activeTodos.forEach(t => {
      li(`${t.text}${t.dueDate ? ` (due ${fmtDate(t.dueDate)})` : ''}${t.priority && t.priority !== 'normal' ? ` [${t.priority}]` : ''}`);
    });
  }

  // PERSONNEL
  h1('Personnel');
  personnel.forEach(p => {
    li(`${p.name} — ${fmt(p.role)} (${fmt(p.email)})`);
    if (p.notes) lines.push(`      ${p.notes}`);
  });

  // KNOWLEDGE BASE
  h1('Knowledge Base');
  knowledge.forEach(doc => {
    h2(doc.title);
    li(`Category: ${fmt(doc.category)}`);
    if (doc.summary) li(`Summary: ${doc.summary}`);
    if (doc.tags?.length) li(`Tags: ${doc.tags.join(', ')}`);
    if (doc.content) {
      lines.push('');
      lines.push(doc.content.slice(0, 1000) + (doc.content.length > 1000 ? '...(truncated)' : ''));
    }
  });

  // PAYMENT REQUESTS
  h1('Payment Requests');
  if (payments.length === 0) {
    lines.push('No payment requests.');
  } else {
    payments.forEach(p => {
      li(`${p.title || p.description} — $${fmt(p.amount)} [${fmt(p.approvalStatus)}]`);
      if (p.vendor) lines.push(`      Vendor: ${p.vendor}`);
      if (p.notes) lines.push(`      Notes: ${p.notes}`);
    });
  }

  // TRAVEL
  h1('Travel Requests');
  if (travel.length === 0) {
    lines.push('No travel requests.');
  } else {
    travel.forEach(t => {
      h2(`${t.destination || t.title || 'Travel'} — ${fmtDate(t.departureDate)}`);
      li(`Status: ${fmt(t.status)}`);
      if (t.purpose) li(`Purpose: ${t.purpose}`);
      if (t.estimatedCost) li(`Estimated Cost: $${t.estimatedCost}`);
    });
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
    body: lines.join('\n'),
  };
};
