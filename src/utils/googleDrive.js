/**
 * Google Drive backup/restore using the browser-side Google Identity Services (GIS)
 * OAuth 2.0 PKCE flow — no server needed.
 *
 * Setup steps (one-time):
 * 1. Create a project at https://console.cloud.google.com
 * 2. Enable "Google Drive API"
 * 3. Create OAuth 2.0 credentials → Web application
 * 4. Add authorized JS origins: https://your-site.netlify.app (and http://localhost:8888 for dev)
 * 5. Copy the Client ID and paste it in Settings → Google Drive
 */

const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const FOLDER_NAME = 'brAIn Backups';
const FILE_NAME   = 'brAIn_backup.json';

// localStorage key for client ID and last backup timestamp
const CLIENT_ID_KEY     = 'brain_gdrive_client_id';
const LAST_BACKUP_KEY   = 'brain_gdrive_last_backup';
const ACCESS_TOKEN_KEY  = 'brain_gdrive_access_token';
const TOKEN_EXPIRY_KEY  = 'brain_gdrive_token_expiry';

// ── Token management ──────────────────────────────────────────────────────────

let _tokenClient = null;
let _tokenResolve = null;

const getStoredToken = () => {
  const token  = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = parseInt(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || '0', 10);
  if (token && Date.now() < expiry) return token;
  return null;
};

const storeToken = (token, expiresIn = 3600) => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + (expiresIn - 60) * 1000));
};

export const clearToken = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// ── GAPI loader ───────────────────────────────────────────────────────────────

const loadGsi = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.oauth2) { resolve(); return; }
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.onload = resolve;
  s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
  document.head.appendChild(s);
});

const loadGapi = () => new Promise((resolve, reject) => {
  if (window.gapi?.client) { resolve(); return; }
  const s = document.createElement('script');
  s.src = 'https://apis.google.com/js/api.js';
  s.onload = () => {
    window.gapi.load('client', {
      callback: () => window.gapi.client.init({}).then(resolve, reject),
      onerror: reject,
    });
  };
  s.onerror = () => reject(new Error('Failed to load Google API'));
  document.head.appendChild(s);
});

// ── Auth ──────────────────────────────────────────────────────────────────────

const getClientId = () => localStorage.getItem(CLIENT_ID_KEY) || '';

export const saveClientId = (id) => localStorage.setItem(CLIENT_ID_KEY, id.trim());

export const isConfigured = () => !!getClientId();

export const getLastBackupTime = () => localStorage.getItem(LAST_BACKUP_KEY);

/**
 * Request a fresh access token via GIS implicit flow.
 * Returns the token string.
 */
const requestToken = () => new Promise(async (resolve, reject) => {
  const clientId = getClientId();
  if (!clientId) { reject(new Error('No Google Client ID configured. Set it in Settings → Google Drive.')); return; }

  await loadGsi();

  if (!_tokenClient) {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          if (_tokenResolve) { _tokenResolve.reject(new Error(response.error)); _tokenResolve = null; }
          return;
        }
        storeToken(response.access_token, response.expires_in);
        if (_tokenResolve) { _tokenResolve.resolve(response.access_token); _tokenResolve = null; }
      },
    });
  }

  _tokenResolve = { resolve, reject };
  _tokenClient.requestAccessToken({ prompt: '' });
});

const getToken = async () => {
  const stored = getStoredToken();
  if (stored) return stored;
  return requestToken();
};

// ── Drive API helpers ─────────────────────────────────────────────────────────

const driveRequest = async (url, options = {}) => {
  const token = await getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || `Drive API error ${res.status}`);
  }
  return res;
};

/** Find or create the brAIn Backups folder in Drive. Returns folder ID. */
const getOrCreateFolder = async () => {
  const token = await getToken();
  // Search for existing folder
  const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchRes = await driveRequest(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`);
  const { files } = await searchRes.json();
  if (files?.length) return files[0].id;

  // Create folder
  const createRes = await driveRequest('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const folder = await createRes.json();
  return folder.id;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Back up all brAIn data to Google Drive.
 * Overwrites the previous backup file in the brAIn Backups folder.
 */
export const backupToDrive = async (jsonData) => {
  const folderId = await getOrCreateFolder();

  // Check if backup file already exists
  const q = encodeURIComponent(`name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`);
  const searchRes = await driveRequest(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`);
  const { files } = await searchRes.json();
  const fileId = files?.[0]?.id;

  const token = await getToken();
  const blob = new Blob([jsonData], { type: 'application/json' });

  if (fileId) {
    // Update existing file
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: blob,
    });
  } else {
    // Create new file with multipart upload
    const metadata = JSON.stringify({ name: FILE_NAME, parents: [folderId] });
    const boundary = '-------314159265358979323846';
    const body = [
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n`,
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonData}\r\n`,
      `--${boundary}--`,
    ].join('');
    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
  }

  const ts = new Date().toISOString();
  localStorage.setItem(LAST_BACKUP_KEY, ts);
  return ts;
};

/**
 * Restore brAIn data from the latest backup in Google Drive.
 * Returns the raw JSON string (caller handles import).
 */
export const restoreFromDrive = async () => {
  const folderId = await getOrCreateFolder();
  const q = encodeURIComponent(`name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`);
  const searchRes = await driveRequest(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,modifiedTime)`);
  const { files } = await searchRes.json();

  if (!files?.length) throw new Error('No backup found in Google Drive. Back up first.');

  const fileId = files[0].id;
  const token = await getToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Could not download backup: ${res.statusText}`);
  return res.text();
};

export const signOut = () => {
  clearToken();
  _tokenClient = null;
  _tokenResolve = null;
};
