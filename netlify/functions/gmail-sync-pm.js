/**
 * Gmail sync — 2 PM EST (19:00 UTC) scheduled function.
 * Scans last 7 hours (covers the morning-to-afternoon gap).
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
    const result = await runSync(7, 20);
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
