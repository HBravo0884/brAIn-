import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { User, Save, RefreshCw } from 'lucide-react';

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
        </div>
      </div>
    </div>
  );
};

export default Settings;
