// Netlify serverless function: proxies Claude API calls.
// ANTHROPIC_API_KEY is set in Netlify environment variables — never exposed to the browser.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY environment variable not set on server.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body.' }),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 24000); // 24s — under Netlify's 26s limit

  let anthropicRes;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return {
      statusCode: 504,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Claude API request timed out. Try a shorter prompt or switch to Sonnet.' }),
    };
  }
  clearTimeout(timer);

  const data = await anthropicRes.json();
  return {
    statusCode: anthropicRes.status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
};
