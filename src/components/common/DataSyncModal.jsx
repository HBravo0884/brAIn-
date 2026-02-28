import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  RefreshCw, X, CheckCircle, AlertCircle, Loader2,
  Database, ClipboardList, DollarSign, Users, CalendarDays,
  Plane, Gift, FileText, BookMarked, ListTodo,
} from 'lucide-react';

const SECTION_ICONS = {
  grants:       { icon: FileText,      label: 'Grants'               },
  budgets:      { icon: DollarSign,    label: 'Budgets'              },
  tasks:        { icon: ClipboardList, label: 'Kanban Tasks'         },
  meetings:     { icon: CalendarDays,  label: 'Meetings'             },
  payments:     { icon: FileText,      label: 'Payment Requests'     },
  travel:       { icon: Plane,         label: 'Travel Requests'      },
  giftCards:    { icon: Gift,          label: 'Gift Card Records'    },
  personnel:    { icon: Users,         label: 'Personnel'            },
  documents:    { icon: FileText,      label: 'Documents'            },
  todos:        { icon: ListTodo,      label: 'Quick To-Dos'         },
  templates:    { icon: FileText,      label: 'Templates'            },
  knowledgeDocs:{ icon: BookMarked,    label: 'Knowledge Docs'       },
};

const DataSyncModal = ({ onClose }) => {
  const { syncAndScrub } = useApp();
  const [step, setStep]     = useState('confirm'); // 'confirm' | 'running' | 'done'
  const [result, setResult] = useState(null);

  const runSync = async () => {
    setStep('running');
    // Small delay so the spinner renders before blocking JS
    await new Promise(r => setTimeout(r, 80));
    const report = syncAndScrub();
    setResult(report);
    setStep('done');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Database size={20} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Data Sync &amp; Refresh</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* ── Step 1: Confirm ─────────────────────────────────────────────── */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <p className="text-gray-700 text-sm leading-relaxed">
                This will <strong>re-read all data from storage</strong> and refresh every section of the app — Dashboard, Budget, Kanban, Calendar, Flowchart, Payments, Travel, Gift Cards, Meetings, and Personnel.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  <AlertCircle size={16} />
                  What happens during sync
                </div>
                <ul className="text-xs text-amber-700 space-y-1 ml-5 list-disc">
                  <li>All data is re-read from local storage</li>
                  <li>Orphaned grant links are removed from tasks, meetings, payments, travel, gift cards, and personnel</li>
                  <li>All views (Dashboard, Budget, Calendar, etc.) re-render with fresh data</li>
                  <li>No data will be deleted — only broken cross-references are cleared</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={runSync}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                >
                  <RefreshCw size={16} />
                  Run Data Sync
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Running ─────────────────────────────────────────────── */}
          {step === 'running' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 size={40} className="text-primary-600 animate-spin" />
              <p className="text-gray-700 font-medium">Syncing all data…</p>
              <p className="text-xs text-gray-400">Re-reading storage and checking cross-references</p>
            </div>
          )}

          {/* ── Step 3: Done ────────────────────────────────────────────────── */}
          {step === 'done' && result && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">Sync complete!</p>
                  <p className="text-sm text-green-700">
                    All views refreshed
                    {result.cleaned > 0
                      ? ` · ${result.cleaned} orphaned reference${result.cleaned !== 1 ? 's' : ''} cleaned`
                      : ' · No issues found'}
                  </p>
                </div>
              </div>

              {/* Record counts */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current record counts</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(result.counts).map(([key, count]) => {
                    const meta = SECTION_ICONS[key];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <div key={key} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                        <Icon size={13} className="text-gray-400" />
                        <span className="text-gray-600 flex-1">{meta.label}</span>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cleaned items */}
              {result.items && result.items.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Fixed references</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {result.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-amber-50 rounded px-2.5 py-1.5">
                        <AlertCircle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataSyncModal;
