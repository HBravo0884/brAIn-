import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { storage } from '../utils/storage';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { User, Save, RefreshCw, Download, Upload, CheckCheck, AlertTriangle, Database } from 'lucide-react';

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
  const [saved, setSaved] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // null | 'success' | 'error'
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  // Load user profile from settings on mount
  useEffect(() => {
    if (settings.userProfile) {
      setUserProfile(settings.userProfile);
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
        </div>
      </div>
    </div>
  );
};

export default Settings;
