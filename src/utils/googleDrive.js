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

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
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

const ENV_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const getClientId = () => localStorage.getItem(CLIENT_ID_KEY) || ENV_CLIENT_ID;

export const saveClientId = (id) => localStorage.setItem(CLIENT_ID_KEY, id.trim());

// Auto-seed localStorage from env on first load so user never has to paste it manually
if (ENV_CLIENT_ID && !localStorage.getItem(CLIENT_ID_KEY)) {
  localStorage.setItem(CLIENT_ID_KEY, ENV_CLIENT_ID);
}

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

// ── Knowledge Doc file storage ─────────────────────────────────────────────────

const KB_FOLDER_NAME = 'brAIn Knowledge';

/** Find or create the brAIn Knowledge folder. Returns folder ID. */
const getOrCreateKbFolder = async () => {
  const q = encodeURIComponent(`name='${KB_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchRes = await driveRequest(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`);
  const { files } = await searchRes.json();
  if (files?.length) return files[0].id;

  const createRes = await driveRequest('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    body: JSON.stringify({ name: KB_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const folder = await createRes.json();
  return folder.id;
};

// ── Structured Folder Architecture ────────────────────────────────────────────

export const BRAIN_ROOT_FOLDER = 'brAIn';

export const DRIVE_FOLDER_DEFS = [
  {
    key: 'grant_root', label: '01 — RWJF Grant GRT000937',
    path: ['01_RWJF_Grant_GRT000937'], isParent: true,
    color: 'green', icon: 'Award',
    children: [
      { key: 'financial', label: 'Financial & Procurement',
        path: ['01_RWJF_Grant_GRT000937', '01_Financial_and_Procurement'],
        description: 'PRFs, P-Card receipts (<$2,500 limit), Requisitions (>$3,000), PSC logs (F&A exempt)',
        accepts: ['pdf','jpg','png','xlsx','csv'], namingHint: 'YYYY-MM-DD__GRT000937__Vendor__PCARD__Amount', color: 'green' },
      { key: 'aim5', label: 'Aim 5 — Faculty Re-Entry',
        path: ['01_RWJF_Grant_GRT000937', '02_Aim_5_Faculty_ReEntry'],
        description: 'RFA, Strategic Priority Matrix, applicant budgets ($15K–$20K max, $3K travel/pub caps)',
        accepts: ['pdf','docx','xlsx'], color: 'blue' },
      { key: 'aim4', label: 'Aim 4 — Student Support',
        path: ['01_RWJF_Grant_GRT000937', '03_Aim_4_Student_Support'],
        description: 'Hardship grant requests, Food Pantry logs ($8K/yr), travel stipends ($2K/student max)',
        accepts: ['pdf','docx','xlsx','csv'], color: 'teal' },
      { key: 'aim2', label: 'Aim 2 — Mini-Med Pipeline',
        path: ['01_RWJF_Grant_GRT000937', '04_Aim_2_MiniMed_Pipeline'],
        description: 'Title I school outreach (Harriet Tubman ES, Dunbar HS), mentor training materials',
        accepts: ['pdf','docx','pptx'], color: 'cyan' },
      { key: 'aims13', label: 'Aims 1 & 3 — DEI / HUIPP',
        path: ['01_RWJF_Grant_GRT000937', '05_Aims_1_and_3'],
        description: 'DEI self-study metrics, dashboard designs, HUIPP materials',
        accepts: ['pdf','docx','xlsx'], color: 'indigo' },
    ]
  },
  {
    key: 'ofd_root', label: '02 — OFD / JEDI Operations',
    path: ['02_OFD_JEDI_Operations'], isParent: true,
    color: 'purple', icon: 'Briefcase',
    children: [
      { key: 'newsletter', label: 'Faculty Focus Newsletter',
        path: ['02_OFD_JEDI_Operations', '01_Faculty_Focus_Newsletter'],
        description: 'Constant Contact drafts, publication lists, "Living Legends" features',
        accepts: ['pdf','docx','png','jpg'], color: 'purple' },
      { key: 'web', label: 'Web & Digital Assets',
        path: ['02_OFD_JEDI_Operations', '02_Web_and_Digital_Assets'],
        description: 'Drupal/Next.js updates, HU standard templates',
        accepts: ['pdf','png','jpg','zip'], color: 'violet' },
      { key: 'workshops', label: 'Faculty Tools & Workshops',
        path: ['02_OFD_JEDI_Operations', '03_Faculty_Tools_Workshops'],
        description: 'Workshop materials, Poll Everywhere presentation, budget training',
        accepts: ['pdf','pptx','docx'], color: 'fuchsia' },
    ]
  },
  {
    key: 'lab_root', label: '03 — NPP Lab Research',
    path: ['03_NPP_Lab_Research'], isParent: true,
    color: 'orange', icon: 'FlaskConical',
    children: [
      { key: 'aou', label: 'All of Us Comorbidity Study',
        path: ['03_NPP_Lab_Research', '01_All_of_Us_Comorbidity_Study'],
        description: 'Python/Hail scripts, demographic tables, VCF extraction logs (HIV/SUD cohorts)',
        accepts: ['py','csv','txt','pdf'], color: 'orange' },
      { key: 'prats', label: "P-Rats Manuscript",
        path: ['03_NPP_Lab_Research', '02_P_Rats_Manuscript'],
        description: "Phil's operant data logs, Cyclo 3PPC files, BioRender figures",
        accepts: ['pdf','png','xlsx','docx'], color: 'amber' },
    ]
  },
  {
    key: 'context_root', label: '04 — brAIn Context Wall',
    path: ['04_brAIn_Context_Wall_System'], isParent: true,
    color: 'indigo', icon: 'Brain',
    children: [
      { key: 'context_docs', label: 'Context Documents (CW-01–14)',
        path: ['04_brAIn_Context_Wall_System', '01_Context_Documents'],
        description: 'Canonical .txt files powering AI routing engine + stakeholder rosters, contact CSVs',
        accepts: ['txt','csv','pdf'], color: 'indigo' },
      { key: 'mgl_oracle', label: 'MGL Oracle Model',
        path: ['04_brAIn_Context_Wall_System', '02_MGL_Oracle_Model'],
        description: 'MGL v2.0 AI persona prompt — authoritative brevity and budget trimming rules',
        accepts: ['txt','pdf','docx'], color: 'slate' },
    ]
  },
  {
    key: 'transcripts_root', label: '05 — Meeting Transcripts',
    path: ['05_Meeting_Transcripts'], isParent: true,
    color: 'rose', icon: 'Mic',
    children: [
      { key: 'transcripts_rwjf', label: 'RWJF Grant Meetings',
        path: ['05_Meeting_Transcripts', '01_RWJF_Grant_Meetings'],
        description: 'PI syncs, budget reviews, steering committee, RWJF check-ins',
        accepts: ['txt','pdf','docx','vtt','srt','md'], color: 'rose' },
      { key: 'transcripts_ofd', label: 'OFD / JEDI Meetings',
        path: ['05_Meeting_Transcripts', '02_OFD_JEDI_Meetings'],
        description: 'Faculty Focus planning, DEI committee, OFD leadership meetings',
        accepts: ['txt','pdf','docx','vtt','srt','md'], color: 'pink' },
      { key: 'transcripts_lab', label: 'Lab Meetings',
        path: ['05_Meeting_Transcripts', '03_Lab_Meetings'],
        description: 'NPP lab meetings, All of Us working group, manuscript discussions',
        accepts: ['txt','pdf','docx','vtt','srt','md'], color: 'fuchsia' },
      { key: 'transcripts_general', label: 'General / Other',
        path: ['05_Meeting_Transcripts', '04_General'],
        description: 'Howard admin, cross-program meetings, external partner calls',
        accepts: ['txt','pdf','docx','vtt','srt','md'], color: 'purple' },
    ]
  },
];

const FOLDER_IDS_KEY = 'brain_gdrive_folder_ids';
const RECENT_UPLOADS_KEY = 'brain_gdrive_recent_uploads';

/**
 * Find or create a folder by name under an optional parentId.
 * Returns the folder ID.
 */
const findOrCreateFolder = async (name, parentId) => {
  const parentClause = parentId ? ` and '${parentId}' in parents` : '';
  const q = encodeURIComponent(`name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`);
  const searchRes = await driveRequest(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`);
  const { files } = await searchRes.json();
  if (files?.length) return { id: files[0].id, webViewLink: files[0].webViewLink };

  const body = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) body.parents = [parentId];
  const createRes = await driveRequest('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return createRes.json();
};

/**
 * Recursively creates a folder path (array of names), returns leaf { id, webViewLink }.
 */
export const getOrCreateNestedFolder = async (names, parentId = null) => {
  let current = { id: parentId, webViewLink: null };
  for (const name of names) {
    current = await findOrCreateFolder(name, current.id);
  }
  return current;
};

/**
 * Creates all 14 folders defined in DRIVE_FOLDER_DEFS.
 * Caches { [key]: { id, webViewLink } } in localStorage.
 * Calls onProgress({ done, total, label }) for UI feedback.
 */
export const initializeDriveFolders = async (onProgress) => {
  const ids = {};
  let done = 0;

  // +1 for the brAIn root folder itself
  const total = 1 + DRIVE_FOLDER_DEFS.reduce((acc, def) => acc + 1 + (def.children?.length || 0), 0);

  // Create the top-level brAIn parent folder first
  onProgress?.({ done, total, label: `Creating ${BRAIN_ROOT_FOLDER}…` });
  const rootResult = await findOrCreateFolder(BRAIN_ROOT_FOLDER);
  ids['brain_root'] = { id: rootResult.id, webViewLink: rootResult.webViewLink };
  done++;

  // Create each domain folder inside brAIn root
  for (const def of DRIVE_FOLDER_DEFS) {
    onProgress?.({ done, total, label: `Creating ${def.path[0]}…` });
    const domainResult = await findOrCreateFolder(def.path[0], rootResult.id);
    ids[def.key] = { id: domainResult.id, webViewLink: domainResult.webViewLink };
    done++;

    for (const child of (def.children || [])) {
      onProgress?.({ done, total, label: `Creating ${child.path[child.path.length - 1]}…` });
      const childResult = await findOrCreateFolder(child.path[child.path.length - 1], domainResult.id);
      ids[child.key] = { id: childResult.id, webViewLink: childResult.webViewLink };
      done++;
    }
  }

  localStorage.setItem(FOLDER_IDS_KEY, JSON.stringify(ids));
  onProgress?.({ done: total, total, label: 'Done' });
  return ids;
};

/** Returns cached { [key]: { id, webViewLink } } or {} */
export const getStoredFolderLinks = () => {
  try {
    return JSON.parse(localStorage.getItem(FOLDER_IDS_KEY) || '{}');
  } catch {
    return {};
  }
};

/**
 * Upload a file to a folder identified by its DRIVE_FOLDER_DEFS key.
 * Resolves the cached folder ID (or creates the folder if missing).
 * Returns { fileId, webViewLink, fileName }.
 * Also prepends to brain_gdrive_recent_uploads (max 20 entries).
 */
export const uploadToFolderKey = async (file, folderKey, suggestedName) => {
  // Find the folder def
  let folderDef = null;
  for (const def of DRIVE_FOLDER_DEFS) {
    if (def.key === folderKey) { folderDef = def; break; }
    const child = def.children?.find(c => c.key === folderKey);
    if (child) { folderDef = child; break; }
  }
  if (!folderDef) throw new Error(`Unknown folder key: ${folderKey}`);

  // Resolve folder ID
  let folderId;
  const cached = getStoredFolderLinks();
  if (cached[folderKey]?.id) {
    folderId = cached[folderKey].id;
  } else {
    const result = await getOrCreateNestedFolder(folderDef.path);
    folderId = result.id;
    // Persist the newly created ID
    cached[folderKey] = { id: result.id, webViewLink: result.webViewLink };
    localStorage.setItem(FOLDER_IDS_KEY, JSON.stringify(cached));
  }

  // Upload
  const token = await getToken();
  const uploadName = suggestedName || file.name;
  const metadata = JSON.stringify({ name: uploadName, parents: [folderId] });
  const form = new FormData();
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive upload failed: ${res.status}`);
  }
  const data = await res.json();
  const result = { fileId: data.id, webViewLink: data.webViewLink, fileName: data.name };

  // Append to recent uploads (max 20)
  const recent = getRecentUploads();
  recent.unshift({
    fileId: data.id,
    fileName: data.name,
    webViewLink: data.webViewLink,
    folderKey,
    folderLabel: folderDef.label,
    uploadedAt: new Date().toISOString(),
  });
  localStorage.setItem(RECENT_UPLOADS_KEY, JSON.stringify(recent.slice(0, 20)));

  return result;
};

// ── NotebookLM Persistent Briefing Doc ────────────────────────────────────────

const NBLM_DOC_KEY = 'brain_nblm_doc'; // { [type]: { fileId, webViewLink } }

const getNblmDocs = () => {
  try { return JSON.parse(localStorage.getItem(NBLM_DOC_KEY) || '{}'); } catch { return {}; }
};

/**
 * Push a briefing text to a PERSISTENT Google Drive plain-text file.
 * First call creates the file. Subsequent calls update the same file.
 * NbLM users add this file once as a source, then just click "Sync".
 * Returns { fileId, webViewLink, wasUpdated }
 */
export const uploadBriefingDoc = async (text, briefingType = 'full') => {
  const token = await getToken();
  const FILENAMES = {
    full:      'brAIn Full Data Snapshot — GRT000937.txt',
    financial: 'brAIn Financial Snapshot — GRT000937.txt',
    tasks:     'brAIn Tasks & Deadlines — GRT000937.txt',
    people:    'brAIn People & Meetings — GRT000937.txt',
    knowledge: 'brAIn Knowledge Base — GRT000937.txt',
  };
  const fileName = FILENAMES[briefingType] || `brAIn ${briefingType} Snapshot — GRT000937.txt`;

  const docs = getNblmDocs();
  const existing = docs[briefingType];

  const blob = new Blob([text], { type: 'text/plain' });

  if (existing?.fileId) {
    // Update existing file content
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existing.fileId}?uploadType=media&fields=id,webViewLink`,
      { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' }, body: blob }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Drive update failed: ${res.status}`);
    }
    return { fileId: existing.fileId, webViewLink: existing.webViewLink, wasUpdated: true };
  }

  // Create new file — prefer context_docs folder if initialized, else brAIn root folder
  let parentId = null;
  try {
    const stored = getStoredFolderLinks();
    if (stored?.context_docs?.id) {
      parentId = stored.context_docs.id; // 04_brAIn_Context_Wall_System/01_Context_Documents
    } else if (stored?.brain_root?.id) {
      parentId = stored.brain_root.id; // brAIn root folder
    } else {
      const root = await findOrCreateFolder(BRAIN_ROOT_FOLDER);
      parentId = root.id;
    }
  } catch { /* if it fails just upload to Drive root */ }

  const metadata = JSON.stringify({
    name: fileName,
    mimeType: 'text/plain',
    ...(parentId ? { parents: [parentId] } : {}),
  });
  const form = new FormData();
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive upload failed: ${res.status}`);
  }
  const data = await res.json();

  // Persist the file ID so future calls update the same file
  docs[briefingType] = { fileId: data.id, webViewLink: data.webViewLink };
  localStorage.setItem(NBLM_DOC_KEY, JSON.stringify(docs));

  return { fileId: data.id, webViewLink: data.webViewLink, wasUpdated: false };
};

/** Returns { [type]: { fileId, webViewLink } } for all saved NbLM docs */
export const getNblmBriefingLinks = () => getNblmDocs();

/** Returns recent upload array from localStorage (max 20) */
export const getRecentUploads = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_UPLOADS_KEY) || '[]');
  } catch {
    return [];
  }
};

// ── AI Classification ──────────────────────────────────────────────────────────

/**
 * Read up to `maxBytes` of text from a File object.
 * Works for plain text (.txt, .csv, .py). Returns empty string for binary files.
 */
const peekFileText = (file, maxBytes = 2000) => new Promise((resolve) => {
  const isText = file.type.startsWith('text/') ||
    /\.(txt|csv|py|md|json|xml|html|js|ts|jsx|tsx)$/i.test(file.name);
  if (!isText) { resolve(''); return; }
  const reader = new FileReader();
  reader.onload = (e) => resolve((e.target.result || '').slice(0, maxBytes));
  reader.onerror = () => resolve('');
  reader.readAsText(file.slice(0, maxBytes));
});

/**
 * Use Claude Haiku to suggest the best DRIVE_FOLDER_DEFS child key for a file.
 * Returns { key, label, confidence, reason }
 */
export const classifyFileForFolder = async (file) => {
  const { askClaude } = await import('./ai.js');
  const snippet = await peekFileText(file);

  // Build a compact folder list for the prompt
  const folderList = DRIVE_FOLDER_DEFS.flatMap(def =>
    (def.children || []).map(c => `- key="${c.key}" | "${c.label}" | ${c.description}`)
  ).join('\n');

  const prompt = `You are a file routing assistant for a program manager at Howard University.
Given a file, choose the single best destination folder from the list below.

FILE:
  Name: ${file.name}
  Type: ${file.type || 'unknown'}
  Size: ${(file.size / 1024).toFixed(1)} KB
  Content preview (first 2000 chars):
${snippet ? `\`\`\`\n${snippet}\n\`\`\`` : '(binary or unreadable)'}

FOLDERS:
${folderList}

Respond with ONLY valid JSON (no markdown), example:
{"key":"financial","confidence":0.92,"reason":"Filename contains GRT000937 and PCARD suggesting a procurement receipt"}`;

  const raw = await askClaude(prompt, { model: 'claude-haiku-4-5-20251001', max_tokens: 200 });

  try {
    const parsed = JSON.parse(raw.trim());
    // Find the label for the key
    let label = parsed.key;
    for (const def of DRIVE_FOLDER_DEFS) {
      const child = def.children?.find(c => c.key === parsed.key);
      if (child) { label = child.label; break; }
    }
    return { key: parsed.key, label, confidence: parsed.confidence ?? 0.8, reason: parsed.reason ?? '' };
  } catch {
    return null;
  }
};

// ── Drive Search ───────────────────────────────────────────────────────────────

/**
 * Search Google Drive for files matching a keyword query.
 * If scopeToOurFolders=true, restricts search to initialized brAIn folders.
 * Returns array of { id, name, webViewLink, modifiedTime, folderKey, folderLabel, parentId }.
 */
export const searchDriveFiles = async (query, scopeToOurFolders = true) => {
  const cachedIds = getStoredFolderLinks();
  const ourFolderIds = Object.values(cachedIds).map(f => f.id).filter(Boolean);

  let q = `fullText contains '${query.replace(/'/g, "\\'")}' and trashed=false and mimeType != 'application/vnd.google-apps.folder'`;

  // Scope to our folders if possible
  if (scopeToOurFolders && ourFolderIds.length > 0) {
    const parentClauses = ourFolderIds.map(id => `'${id}' in parents`).join(' or ');
    q += ` and (${parentClauses})`;
  }

  const fields = 'files(id,name,webViewLink,modifiedTime,parents,mimeType)';
  const res = await driveRequest(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=50&orderBy=modifiedTime desc`
  );
  const { files = [] } = await res.json();

  // Reverse-map parent IDs to our folder keys
  const idToKey = {};
  for (const [key, val] of Object.entries(cachedIds)) {
    if (val?.id) idToKey[val.id] = key;
  }
  const keyToLabel = {};
  for (const def of DRIVE_FOLDER_DEFS) {
    keyToLabel[def.key] = def.label;
    for (const child of (def.children || [])) keyToLabel[child.key] = child.label;
  }

  return files.map(f => {
    const parentId = f.parents?.[0] || null;
    const folderKey = parentId ? idToKey[parentId] : null;
    return {
      id: f.id,
      name: f.name,
      webViewLink: f.webViewLink,
      modifiedTime: f.modifiedTime,
      mimeType: f.mimeType,
      parentId,
      folderKey,
      folderLabel: folderKey ? keyToLabel[folderKey] : null,
    };
  });
};

/**
 * Upload a File object to the brAIn Knowledge folder in Drive.
 * Returns { fileId, webViewLink, fileName }
 */
export const uploadKnowledgeFileToDrive = async (file) => {
  const folderId = await getOrCreateKbFolder();
  const token = await getToken();

  const metadata = JSON.stringify({ name: file.name, parents: [folderId] });
  const form = new FormData();
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive upload failed: ${res.status}`);
  }
  const data = await res.json();
  return { fileId: data.id, webViewLink: data.webViewLink, fileName: data.name };
};

// ── Transcript Upload ──────────────────────────────────────────────────────────

/** Returns true if a Google Client ID has been saved in Settings */
export const isDriveConfigured = () => !!localStorage.getItem(CLIENT_ID_KEY);

/**
 * Upload a meeting transcript as a .txt file to the appropriate transcript subfolder.
 * folderKey: 'transcripts_rwjf' | 'transcripts_ofd' | 'transcripts_lab' | 'transcripts_general'
 * Returns { fileId, webViewLink, fileName } or throws.
 */
export const uploadTranscriptToDrive = async (transcriptText, meetingTitle, meetingDate, folderKey = 'transcripts_general') => {
  const safeTitle = (meetingTitle || 'Meeting').replace(/[^\w\s\-–]/g, '').replace(/\s+/g, '_').slice(0, 60);
  const safeDate  = (meetingDate || new Date().toISOString().split('T')[0]).slice(0, 10);
  const fileName  = `${safeDate}__${safeTitle}__transcript.txt`;
  const blob      = new Blob([transcriptText], { type: 'text/plain' });
  const file      = new File([blob], fileName, { type: 'text/plain' });
  return uploadToFolderKey(file, folderKey, fileName);
};
