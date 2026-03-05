/**
 * Gmail sync — 8 AM EST (13:00 UTC) scheduled function.
 * Also callable via POST /.netlify/functions/gmail-sync-am for manual triggers.
 * Scans last 13 hours (covers the overnight + morning gap).
 */

const { runSync } = require('./gmail-sync');

exports.handler = async () => {
  if (!process.env.GMAIL_REFRESH_TOKEN) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Gmail not configured. Set GMAIL_REFRESH_TOKEN in Netlify env vars.' }),
    };
  }

  try {
    const result = await runSync(13, 20);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, ...result }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
