/**
 * Shared Gmail scan + write logic for brAIn scheduled functions.
 * Not meant to be invoked directly as an HTTP endpoint.
 *
 * Exports: runSync(hoursBack, maxEmails) → { scanned, added }
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Gmail helpers ──────────────────────────────────────────────────────────────

async function getGmailAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gmail auth failed: ${data.error_description || data.error}`);
  return data.access_token;
}

async function fetchEmailMetadata(accessToken, hoursBack, maxEmails) {
  const query = `newer_than:${hoursBack}h -category:promotions -category:social`;
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxEmails}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  if (!listRes.ok) throw new Error(`Gmail list failed: ${listData.error?.message}`);

  const messages = listData.messages || [];
  if (messages.length === 0) return [];

  return Promise.all(messages.map(async (msg) => {
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
}

async function classifyEmails(emails) {
  const emailList = emails.map((e, i) =>
    `${i + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   Preview: ${e.snippet}`
  ).join('\n\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
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

  const data = await res.json();
  const text = data.content?.[0]?.text || '[]';
  const match = text.match(/\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : [];
}

// ── Supabase write helpers ─────────────────────────────────────────────────────

const nowIso = () => new Date().toISOString();
const newId  = () => crypto.randomUUID();

async function upsertRow(table, item) {
  const { error } = await supabase
    .from(table)
    .upsert({ id: item.id, data: item, updated_at: item.updatedAt || item.createdAt }, { onConflict: 'id' });
  if (error) throw new Error(`Supabase ${table} upsert: ${error.message}`);
}

// ── Main export ────────────────────────────────────────────────────────────────

async function runSync(hoursBack = 13, maxEmails = 20) {
  const accessToken = await getGmailAccessToken();
  const emails = await fetchEmailMetadata(accessToken, hoursBack, maxEmails);

  if (emails.length === 0) {
    await logScan(0, 0);
    return { scanned: 0, added: 0 };
  }

  const classified = await classifyEmails(emails);
  let added = 0;

  for (const item of classified) {
    if (item.action === 'ignore') continue;

    if (item.action === 'todo') {
      await upsertRow('todos', {
        id: newId(), text: item.text, completed: false,
        priority: item.priority || 'normal',
        dueDate: item.dueDate || null,
        source: item.source || '',
        createdAt: nowIso(),
      });
      added++;
    } else if (item.action === 'task') {
      const pri = item.priority === 'normal' ? 'medium' : (item.priority || 'medium');
      await upsertRow('tasks', {
        id: newId(), title: item.text,
        priority: pri, status: 'To Do',
        dueDate: item.dueDate || null,
        description: item.source ? `From Gmail: ${item.source}` : '',
        createdAt: nowIso(), updatedAt: nowIso(),
      });
      added++;
    }
  }

  await logScan(emails.length, added);
  return { scanned: emails.length, added };
}

async function logScan(scanned, added) {
  const ts = nowIso();
  const logEntry = {
    id: 'gmail-scan-log',
    title: 'Gmail Scan Log',
    content: JSON.stringify({ lastScan: ts, scanned, added }),
    source: 'gmail-sync',
    uploadedDate: ts, createdAt: ts, updatedAt: ts,
  };
  // Best-effort — don't throw if log fails
  await supabase.from('knowledge_docs')
    .upsert({ id: logEntry.id, data: logEntry, updated_at: ts }, { onConflict: 'id' })
    .catch(() => {});
}

module.exports = { runSync };
