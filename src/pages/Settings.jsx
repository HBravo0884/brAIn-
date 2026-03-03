import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { storage } from '../utils/storage';
import { getCostSummary } from '../utils/aiRateLimit';
import {
  isConfigured as driveIsConfigured,
  saveClientId as driveSaveClientId,
  backupToDrive,
  restoreFromDrive,
  getLastBackupTime,
  signOut as driveSignOut,
} from '../utils/googleDrive';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { User, Save, RefreshCw, Download, Upload, CheckCheck, AlertTriangle, Database, Key, Eye, EyeOff, Brain, Loader2, Wand2, FileText, Zap, Cloud, CloudOff } from 'lucide-react';
import { generateAdvisorSummary } from '../utils/ai';

const Settings = () => {
  const { settings, setSettings } = useApp();
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    title: '',
    department: '',
    institution: '',
    email: '',
    phone: '',
    defaultGrantAim: '',
    piName: '',
    piEmail: '',
  });
  const [advisorProfile, setAdvisorProfile] = useState('');
  const [advisorSummary, setAdvisorSummary] = useState('');
  const [advisorSaved, setAdvisorSaved] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const advisorFileRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // null | 'success' | 'error'
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  // Google Drive state
  const [driveClientId, setDriveClientId] = useState(() => localStorage.getItem('brain_gdrive_client_id') || '');
  const [driveStatus, setDriveStatus] = useState(null); // null | 'backing_up' | 'restoring' | 'success' | 'error'
  const [driveMsg, setDriveMsg] = useState('');
  const [lastBackup, setLastBackup] = useState(() => getLastBackupTime());

  const handleDriveSave = () => {
    driveSaveClientId(driveClientId);
    setDriveMsg('Client ID saved.');
    setTimeout(() => setDriveMsg(''), 2000);
  };

  const handleDriveBackup = async () => {
    setDriveStatus('backing_up');
    setDriveMsg('');
    try {
      const data = JSON.stringify(storage.exportAll(), null, 2);
      const ts = await backupToDrive(data);
      setLastBackup(ts);
      setDriveStatus('success');
      setDriveMsg('Backed up to Google Drive!');
    } catch (err) {
      setDriveStatus('error');
      setDriveMsg(err.message);
    }
  };

  const handleDriveRestore = async () => {
    if (!window.confirm('This will REPLACE all current data with the Google Drive backup. Are you sure?')) return;
    setDriveStatus('restoring');
    setDriveMsg('');
    try {
      const json = await restoreFromDrive();
      const data = JSON.parse(json);
      storage.importAll(data);
      setDriveStatus('success');
      setDriveMsg('Restored! Reloading…');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setDriveStatus('error');
      setDriveMsg(err.message);
    }
  };

  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('brain_anthropic_api_key') || '';
    setApiKey(stored);
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('brain_anthropic_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('brain_anthropic_api_key');
    }
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 3000);
  };

  // Load user profile and advisor profile from settings on mount
  useEffect(() => {
    if (settings.userProfile) {
      setUserProfile(settings.userProfile);
    }
    if (settings.advisorProfile !== undefined) {
      setAdvisorProfile(settings.advisorProfile);
    }
    if (settings.advisorSummary !== undefined) {
      setAdvisorSummary(settings.advisorSummary);
    }
  }, [settings]);

  const handleSave = () => {
    setSettings({
      ...settings,
      userProfile: userProfile
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveAdvisor = () => {
    setSettings({ ...settings, advisorProfile, advisorSummary });
    setAdvisorSaved(true);
    setTimeout(() => setAdvisorSaved(false), 3000);
  };

  const handleAdvisorFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setAdvisorProfile(text);
    setAdvisorSummary(''); // clear stale summary
    e.target.value = '';
  };

  const handleGenerateSummary = async () => {
    if (!advisorProfile.trim()) return;
    setGeneratingSummary(true);
    setSummaryError('');
    try {
      const summary = await generateAdvisorSummary(advisorProfile);
      setAdvisorSummary(summary);
      // Auto-save both
      setSettings({ ...settings, advisorProfile, advisorSummary: summary });
      setAdvisorSaved(true);
      setTimeout(() => setAdvisorSaved(false), 3000);
    } catch (err) {
      setSummaryError(err.message || 'Failed to generate summary. Check your API key.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleExport = () => {
    const data = storage.exportAll();
    const date = new Date().toISOString().split('T')[0];
    const filename = `brAIn_backup_${date}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!data.grants && !data.budgets && !data.tasks) {
          throw new Error('File does not appear to be a valid brAIn backup.');
        }
        if (!window.confirm('This will REPLACE all current data with the backup. Are you sure?')) {
          e.target.value = '';
          return;
        }
        storage.importAll(data);
        setImportStatus('success');
        setImportMsg(`Restored backup from ${data.exportDate ? new Date(data.exportDate).toLocaleDateString() : 'unknown date'}. Reloading…`);
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setImportStatus('error');
        setImportMsg(err.message || 'Invalid backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to clear all profile information?')) {
      setUserProfile({
        fullName: '',
        title: '',
        department: '',
        institution: '',
        email: '',
        phone: '',
        defaultGrantAim: '',
        piName: '',
        piEmail: '',
      });
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings & Profile</h1>
        <p className="text-gray-600">Configure your default information for auto-filling forms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card title="Your Profile Information">
            <p className="text-sm text-gray-600 mb-6">
              This information will automatically pre-fill in payment requests, travel forms, and other documents.
            </p>

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={userProfile.fullName}
                onChange={(e) => setUserProfile({ ...userProfile, fullName: e.target.value })}
                placeholder="e.g., Dr. John Smith"
              />

              <Input
                label="Title/Position"
                value={userProfile.title}
                onChange={(e) => setUserProfile({ ...userProfile, title: e.target.value })}
                placeholder="e.g., Program Manager, Research Coordinator"
              />

              <Input
                label="Department"
                value={userProfile.department}
                onChange={(e) => setUserProfile({ ...userProfile, department: e.target.value })}
                placeholder="e.g., College of Medicine"
              />

              <Input
                label="Institution"
                value={userProfile.institution}
                onChange={(e) => setUserProfile({ ...userProfile, institution: e.target.value })}
                placeholder="e.g., Howard University College of Medicine"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                  placeholder="your.email@howard.edu"
                />

                <Input
                  label="Phone"
                  type="tel"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  placeholder="(202) 555-0100"
                />
              </div>

              <Input
                label="Default Grant Aim (Optional)"
                value={userProfile.defaultGrantAim}
                onChange={(e) => setUserProfile({ ...userProfile, defaultGrantAim: e.target.value })}
                placeholder="e.g., Aim 5 - Re-Entry"
              />

              <div className="border-t pt-4 mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Principal Investigator Information</h3>

                <Input
                  label="PI Name"
                  value={userProfile.piName}
                  onChange={(e) => setUserProfile({ ...userProfile, piName: e.target.value })}
                  placeholder="e.g., Dr. Jane Doe"
                />

                <Input
                  label="PI Email"
                  type="email"
                  value={userProfile.piEmail}
                  onChange={(e) => setUserProfile({ ...userProfile, piEmail: e.target.value })}
                  placeholder="pi.email@howard.edu"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button
                variant="primary"
                onClick={handleSave}
                className="flex-1"
              >
                <Save size={20} className="mr-2" />
                Save Profile
              </Button>
              <Button
                variant="secondary"
                onClick={handleReset}
              >
                <RefreshCw size={20} className="mr-2" />
                Reset
              </Button>
            </div>

            {saved && (
              <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center">
                ✓ Profile saved! Your information will now auto-fill in forms.
              </div>
            )}
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          {/* Appearance Card */}
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Brain size={20} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Appearance</h3>
                <p className="text-xs text-gray-500 mt-0.5">Theme preference</p>
              </div>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
              {[['light', '☀️ Light'], ['dark', '🌙 Dark'], ['system', '💻 System']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSettings(s => ({ ...s, theme: val }))}
                  className={`flex-1 py-2 text-center transition-colors ${
                    settings.theme === val
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>

          {/* API Key Card */}
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Key size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Claude AI Key</h3>
                <p className="text-xs text-gray-500 mt-0.5">Local dev only — deployed app uses Netlify env var</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  title={showApiKey ? 'Hide key' : 'Show key'}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                onClick={handleSaveApiKey}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {apiKeySaved
                  ? <><CheckCheck size={16} /> Saved!</>
                  : <><Save size={16} /> Save API Key</>
                }
              </button>
              {apiKey && (
                <p className="text-xs text-green-600 text-center">
                  Key configured — AI features are active
                </p>
              )}
              {!apiKey && (
                <p className="text-xs text-amber-600 text-center">
                  No key set — AI features are disabled
                </p>
              )}
              <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertTriangle size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Production:</strong> The deployed app uses <code className="bg-blue-100 px-1 rounded font-mono">ANTHROPIC_API_KEY</code> set in Netlify environment variables — the key never reaches the browser. This field is only needed when running <code className="bg-blue-100 px-1 rounded font-mono">npm run dev</code> (plain Vite, no proxy). Use <code className="bg-blue-100 px-1 rounded font-mono">npm run dev:full</code> for full proxy support.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Auto-Fill Benefits</h3>
                <p className="text-sm text-gray-600">
                  Save time by pre-filling forms with your information
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Payment Request Forms</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Travel Authorization Forms</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Gift Card Distribution Logs</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>KPI Progress Reports</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Budget Justifications</span>
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Privacy Notice</h3>
            <p className="text-sm text-gray-600">
              All profile information is stored locally in your browser.
              No data is sent to external servers. You can clear this
              information at any time using the Reset button.
            </p>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Fill in all fields you commonly use</li>
              <li>• Update when your information changes</li>
              <li>• You can still edit auto-filled forms</li>
              <li>• Default Grant Aim speeds up PRF creation</li>
            </ul>
          </Card>

          {/* Data Backup Card */}
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Database size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Data Backup</h3>
                <p className="text-xs text-gray-500 mt-0.5">Grants, budgets, tasks, KB docs</p>
              </div>
            </div>

            {/* Storage Quota Bar */}
            {(() => {
              const { usedBytes, totalBytes, percent } = storage.getQuotaInfo();
              const color = percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-green-500';
              const textColor = percent >= 90 ? 'text-red-700' : percent >= 70 ? 'text-amber-700' : 'text-gray-600';
              return (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Storage used</span>
                    <span className={`font-medium ${textColor}`}>{percent}% ({(usedBytes / 1024).toFixed(0)} KB / {(totalBytes / 1024).toFixed(0)} KB)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {exportDone
                  ? <><CheckCheck size={16} /> Saved!</>
                  : <><Download size={16} /> Export All Data</>
                }
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border-2 border-gray-200 hover:border-indigo-400 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
              >
                <Upload size={16} />
                Restore from Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />

              {importStatus === 'success' && (
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 text-xs text-green-700">
                  <CheckCheck size={14} className="mt-0.5 flex-shrink-0" />
                  {importMsg}
                </div>
              )}
              {importStatus === 'error' && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  {importMsg}
                </div>
              )}

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Save backups to Google Drive or iCloud for safekeeping
              </p>
            </div>
          </Card>

          {/* AI Usage Card */}
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Zap size={20} className="text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Usage</h3>
                <p className="text-xs text-gray-500 mt-0.5">Estimated API cost</p>
              </div>
            </div>
            {(() => {
              const summary = getCostSummary();
              const fmt = (v) => `$${v.toFixed(4)}`;
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Today</span><span className="font-medium">{fmt(summary.today)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">This month</span><span className="font-medium">{fmt(summary.thisMonth)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">All time</span><span className="font-medium">{fmt(summary.allTime)}</span></div>
                  <div className="flex justify-between text-xs text-gray-400"><span>Log entries</span><span>{summary.entries}</span></div>
                  <button
                    onClick={() => { storage.setAiCostLog([]); window.location.reload(); }}
                    className="w-full mt-1 text-xs py-1.5 px-3 border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-500 rounded-lg transition-colors"
                  >
                    Clear Log
                  </button>
                  <p className="text-xs text-gray-400">Estimates only — see Anthropic console for exact billing.</p>
                </div>
              );
            })()}
          </Card>

          {/* Google Drive Backup Card */}
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Cloud size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Google Drive Backup</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {driveIsConfigured() ? 'Client ID configured' : 'Not configured'}
                  {lastBackup ? ` · Last backup: ${new Date(lastBackup).toLocaleDateString()}` : ''}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Setup accordion */}
              <details className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 list-none flex items-center gap-1">
                  Setup instructions
                </summary>
                <ol className="mt-2 space-y-1 list-decimal list-inside">
                  <li>Go to <strong>console.cloud.google.com</strong> → New project</li>
                  <li>Enable <strong>Google Drive API</strong></li>
                  <li>Create OAuth 2.0 credentials → Web app</li>
                  <li>Add your site URL as authorized JS origin</li>
                  <li>Copy the Client ID and paste below</li>
                </ol>
              </details>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={driveClientId}
                  onChange={(e) => setDriveClientId(e.target.value)}
                  placeholder="Google OAuth Client ID (*.apps.googleusercontent.com)"
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-400 outline-none bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  onClick={handleDriveSave}
                  className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors whitespace-nowrap"
                >
                  Save ID
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDriveBackup}
                  disabled={!driveIsConfigured() || driveStatus === 'backing_up' || driveStatus === 'restoring'}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  {driveStatus === 'backing_up' ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
                  {driveStatus === 'backing_up' ? 'Backing up…' : 'Backup Now'}
                </button>
                <button
                  onClick={handleDriveRestore}
                  disabled={!driveIsConfigured() || driveStatus === 'backing_up' || driveStatus === 'restoring'}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  {driveStatus === 'restoring' ? <Loader2 size={14} className="animate-spin" /> : <CloudOff size={14} />}
                  {driveStatus === 'restoring' ? 'Restoring…' : 'Restore from Drive'}
                </button>
              </div>

              {driveMsg && (
                <p className={`text-xs px-2 py-1.5 rounded ${
                  driveStatus === 'error' ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                }`}>
                  {driveMsg}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Advisor Profile — full width below */}
      <div className="mt-6">
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain size={18} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Advisor Profile — Boss &amp; Supervisor Model</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Paste or upload your boss behavioral model (any size — no limit). The app will condense it into a
                Smart Summary for fast analysis, and use the full text for deep advice calls.
              </p>
            </div>
            <button
              onClick={() => advisorFileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload size={13} /> Upload .txt / .md
            </button>
            <input ref={advisorFileRef} type="file" accept=".txt,.md,text/*" className="hidden" onChange={handleAdvisorFileUpload} />
          </div>

          {/* Full model input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Model</label>
              <span className="text-xs text-gray-400">
                {advisorProfile.length.toLocaleString()} chars
                {advisorProfile.length > 0 && (() => {
                  const words = Math.round(advisorProfile.length / 5);
                  const pages = Math.round(words / 275);
                  return ` ≈ ${words.toLocaleString()} words / ~${pages} pages`;
                })()}
              </span>
            </div>
            <textarea
              value={advisorProfile}
              onChange={e => { setAdvisorProfile(e.target.value); setAdvisorSummary(''); }}
              placeholder={`Paste your boss/supervisor behavioral model here — any length, no size limit.\n\nExamples of what to include:\n• Communication style and preferences\n• What they care most about (timely reporting, budget accuracy, etc.)\n• Red flags and frustration triggers\n• How they like to receive asks and updates\n• Meeting behavior and decision-making patterns\n• Anything generated by AI from analyzing your email threads\n\nIf you change the text, regenerate the Smart Summary below.`}
              rows={14}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono leading-relaxed"
            />
          </div>

          {/* Smart Summary section */}
          <div className="mt-4 p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 size={14} className="text-violet-600" />
                <span className="text-xs font-semibold text-violet-800">Smart Summary</span>
                <span className="text-xs text-violet-500">
                  {advisorSummary
                    ? `(${advisorSummary.length.toLocaleString()} chars — used for fast analysis)`
                    : '— used for fast message analysis; full model used for deep advice'}
                </span>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={!advisorProfile.trim() || generatingSummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {generatingSummary
                  ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                  : <><Wand2 size={12} /> {advisorSummary ? 'Regenerate' : 'Generate'} Smart Summary</>
                }
              </button>
            </div>

            {summaryError && (
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} /> {summaryError}</p>
            )}

            {advisorSummary ? (
              <textarea
                value={advisorSummary}
                onChange={e => setAdvisorSummary(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-violet-200 rounded-lg text-xs text-gray-700 resize-y focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white font-mono"
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-4 bg-white/60 rounded-lg border border-violet-100 text-xs text-violet-400">
                <FileText size={13} />
                {advisorProfile.trim()
                  ? 'Click "Generate Smart Summary" to condense your model into ~400 words for fast AI use'
                  : 'Paste your full model above first, then generate the summary'}
              </div>
            )}

            {advisorSummary && (
              <p className="text-[10px] text-violet-500">
                You can manually edit the summary. It's used as a faster proxy during routine message analysis.
                The full model is always used when you click "Get Advisor Advice" on a reply item.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              {advisorProfile && (
                <button
                  onClick={() => { if (window.confirm('Clear advisor profile and summary?')) { setAdvisorProfile(''); setAdvisorSummary(''); } }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <button
              onClick={handleSaveAdvisor}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {advisorSaved ? <><CheckCheck size={15} /> Saved!</> : <><Save size={15} /> Save Profile</>}
            </button>
          </div>

          {advisorProfile && (
            <div className="mt-3 p-2.5 bg-violet-50 border border-violet-100 rounded-lg text-xs text-violet-600 flex items-start gap-2">
              <Brain size={13} className="mt-0.5 flex-shrink-0" />
              <span>
                <strong>Profile active.</strong>{' '}
                {advisorSummary
                  ? 'Smart Summary used for fast analysis · Full model used for "Get Advisor Advice"'
                  : 'Full model used for advice calls · Generate a Smart Summary for faster routine analysis'}
              </span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Settings;
