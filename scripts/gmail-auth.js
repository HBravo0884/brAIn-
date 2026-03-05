#!/usr/bin/env node
/**
 * One-time Gmail OAuth setup script — gets a refresh token for brAIn Gmail integration.
 *
 * Prerequisites:
 *   1. In Google Cloud Console → APIs → enable Gmail API
 *   2. OAuth consent screen → add scope: https://www.googleapis.com/auth/gmail.readonly
 *   3. Create (or reuse) OAuth 2.0 Web Client credentials
 *   4. Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to mcp-server/.env
 *
 * Install googleapis (one time):
 *   npm install googleapis --save-dev
 *
 * Run:
 *   node scripts/gmail-auth.js
 */

import { google } from 'googleapis';
import readline from 'readline';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load mcp-server/.env without requiring dotenv ─────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../mcp-server/.env');
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  // mcp-server/.env not found — rely on shell env vars
}

const CLIENT_ID     = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    '\nError: GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set.\n' +
    'Add them to mcp-server/.env or export them in your shell.\n'
  );
  process.exit(1);
}

// ── OAuth2 client ──────────────────────────────────────────────────────────────
// Redirect to localhost — Google will redirect there after consent.
// The page will show an error (no server running), but the auth code is in the URL.
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost'
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',  // always return refresh token
});

console.log('\n=== brAIn Gmail OAuth Setup ===\n');
console.log('Step 1 — Open this URL in your browser (sign in as bravo0884@gmail.com):\n');
console.log(authUrl);
console.log('\nStep 2 — After granting access, the browser will redirect to localhost');
console.log('         and show a "connection refused" page. That is normal.');
console.log('         Copy the "code" parameter from the URL bar.\n');
console.log('         Example URL: http://localhost/?code=4/0ABCD...&scope=...\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Step 3 — Paste the full URL from the address bar here: ', async (input) => {
  rl.close();
  // Accept either just the code or the full URL
  let code = input.trim();
  const urlMatch = code.match(/[?&]code=([^&]+)/);
  if (urlMatch) code = decodeURIComponent(urlMatch[1]);
  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.error(
        '\nNo refresh_token returned. This usually means the account already granted\n' +
        'access. Go to https://myaccount.google.com/permissions, revoke brAIn, then re-run.\n'
      );
      process.exit(1);
    }

    console.log('\n=== SUCCESS — add these to mcp-server/.env AND Netlify env vars ===\n');
    console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\nAlso add ANTHROPIC_API_KEY to mcp-server/.env if not already present.');
    console.log('\nDone! Restart Claude Code to activate the Gmail MCP tools.\n');
  } catch (err) {
    console.error('\nFailed to exchange code for tokens:', err.message);
    console.error('Make sure you copied the full code value (it may contain URL-encoded chars).\n');
    process.exit(1);
  }
});
