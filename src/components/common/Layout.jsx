import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Workflow,
  DollarSign,
  Award,
  FolderOpen,
  Settings as SettingsIcon,
  Menu,
  X,
  BookMarked,
  ClipboardList,
  FileInput,
  CalendarDays,
  CreditCard,
  FileText,
  ListTodo,
  CalendarRange,
  Users,
  Plane,
  Gift,
  RefreshCw,
  Rocket,
  AlertTriangle,
  Inbox,
  Music2,
  MoreHorizontal,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import useMediaQuery from '../../hooks/useMediaQuery';
import GlobalSearch from './GlobalSearch';
import GlobalAIEditor from '../ai/GlobalAIEditor';
import BriefingGenerator from '../ai/BriefingGenerator';
import NotebookLMImport from '../ai/NotebookLMImport';
import DataSyncModal from './DataSyncModal';
import ConflictsPanel from './ConflictsPanel';
import CaptureBar from './CaptureBar';
import { useApp } from '../../context/AppContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showNbLMImport, setShowNbLMImport] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [quotaPercent, setQuotaPercent] = useState(null);
  const [showCaptureBar, setShowCaptureBar] = useState(false);
  const { conflicts, replyQueue, addTodo, tasks, meetings, grants, todos, paymentRequests } = useApp();

  // On tablet: sidebar always collapsed (icons only). On mobile: hidden (bottom nav used).
  const effectiveSidebarOpen = isMobile ? false : (isTablet ? false : sidebarOpen);

  // Close More drawer when route changes
  useEffect(() => {
    setShowMoreDrawer(false);
  }, [location.pathname]);

  // Listen for quota warnings
  useEffect(() => {
    const handler = (e) => setQuotaPercent(e.detail);
    window.addEventListener('quota_warning', handler);
    return () => window.removeEventListener('quota_warning', handler);
  }, []);

  // Global Space-key → CaptureBar (skip when focus is in an input/textarea/select)
  useEffect(() => {
    const handler = (e) => {
      if (e.code !== 'Space') return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select', 'button', 'a'].includes(tag)) return;
      if (document.activeElement?.isContentEditable) return;
      e.preventDefault();
      setShowCaptureBar(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const unresolvedConflicts = conflicts.filter(c => !c.resolved).length;
  const pendingReplies = replyQueue.filter(r => r.status !== 'replied').length;

  // Nav badges
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekFromNow = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const navBadges = {
    '/tasks': tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length,
    '/meetings': meetings.filter(m => m.date && m.date.slice(0, 10) === todayStr).length,
    '/calendar': tasks.filter(t => t.dueDate && t.dueDate >= todayStr && t.dueDate <= weekFromNow && t.status !== 'Done').length,
    '/grants': grants.filter(g => {
      if (!g.endDate || g.status !== 'active') return false;
      const daysLeft = (new Date(g.endDate) - new Date()) / 86_400_000;
      return daysLeft >= 0 && daysLeft <= 30;
    }).length,
    '/quick-todo': todos.filter(t => !t.completed).length,
    '/payment-requests': (paymentRequests || []).filter(p => p.status === 'pending' || p.status === 'draft').length,
    '/reply-queue': pendingReplies,
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', tooltip: 'Dashboard — Overview of all grants, open tasks, budget summary, and recent activity' },
    { path: '/tasks', icon: Rocket, label: 'Tasks', tooltip: 'Grant Tasks — Start a task workflow, load associated forms, and auto-fill PI, grant, and date fields' },
    { path: '/grants', icon: Award, label: 'Grants', tooltip: 'Grants — Manage your grant portfolio: status, deliverables, reporting deadlines, and contacts' },
    { path: '/budget', icon: DollarSign, label: 'Budget', tooltip: 'Budget — Track spending against award budgets, log expenses, and import award letters' },
    { path: '/documents', icon: FolderOpen, label: 'Documents', tooltip: 'Documents — Store and organize grant documents, reports, and files' },
    { path: '/workflows', icon: Workflow, label: 'Kanban', tooltip: 'Kanban — Manage tasks on a drag-and-drop board: To Do, In Progress, Done' },
    { path: '/calendar', icon: CalendarRange, label: 'Calendar', tooltip: 'Calendar — Month view of all meetings, task deadlines, aim target dates, and grant end dates' },
    { path: '/meetings', icon: CalendarDays, label: 'Meetings', tooltip: 'Meetings — Log meeting notes, attendees, agendas, transcriptions, and action items per grant' },
    { path: '/personnel', icon: Users, label: 'Personnel', tooltip: 'Personnel — Organizational directory: team members, collaborators, and program officers with contact info and grant links' },
    { path: '/payment-requests', icon: CreditCard, label: 'Payments', tooltip: 'Payment Requests — Create and track payment request forms (PRFs) linked to grant budgets' },
    { path: '/travel-requests', icon: Plane, label: 'Travel', tooltip: 'Travel Requests — 4-phase SOP tracker: Application → Spend Auth → CBT Booking → Post-Travel expense report' },
    { path: '/gift-cards', icon: Gift, label: 'Gift Cards', tooltip: 'Gift Card Distributions — Log and track Aim 5 participant support gift cards for compliance. Always use "Participant Support Costs" spend category.' },
    { path: '/templates', icon: FileText, label: 'Templates', tooltip: 'Templates — Build and reuse document templates for grant applications, reports, and payment requests' },
    { path: '/quick-todo', icon: ListTodo, label: 'Personal To-Do', tooltip: 'Personal checklist — Quick captures that don\'t need a full grant task card' },
    { path: '/reply-queue', icon: Inbox, label: 'Reply Queue', tooltip: 'Reply Queue — Paste emails or messages and let the AI tell you what to do, what info to gather, and when to reply. Syncs to Tasks, Calendar, and Quick To-Do.' },
    { path: '/studio', icon: Music2, label: 'Studio', tooltip: 'Studio — Manage your piano students at Expressions Music Academy: roster, schedule, lesson logs, and AI-generated progress reports.' },
    { path: '/knowledge', icon: BookMarked, label: 'Knowledge', tooltip: 'Knowledge Base — Upload policies, SOPs, and email threads so the AI assistant can reference them' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings', tooltip: 'Settings — Configure your API key, app preferences, and backup/restore your data' },
  ];

  // Bottom nav items shown on mobile (5 items + More)
  const bottomNavItems = [
    navItems.find(n => n.path === '/'),
    navItems.find(n => n.path === '/grants'),
    navItems.find(n => n.path === '/calendar'),
    navItems.find(n => n.path === '/studio'),
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar — hidden on mobile, always-icon on tablet, full on desktop */}
      <aside
        className={`${
          isMobile ? 'hidden' : 'flex'
        } ${
          effectiveSidebarOpen ? 'w-60' : 'w-16'
        } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 flex-col flex-shrink-0`}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-gray-200 dark:border-gray-700 ${effectiveSidebarOpen ? 'px-4 py-4 gap-3' : 'px-0 py-4 justify-center'}`}>
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">bA</span>
          </div>
          {effectiveSidebarOpen && (
            <div className="flex-1 flex items-center justify-between min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">brAIn</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                title="Collapse sidebar"
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Expand button when collapsed (desktop only — tablet is always collapsed) */}
        {!effectiveSidebarOpen && !isTablet && (
          <button
            onClick={() => setSidebarOpen(true)}
            title="Expand sidebar"
            className="mx-auto mt-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Menu size={16} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    title={item.tooltip}
                    className={`flex items-center gap-3 rounded-lg transition-colors ${
                      effectiveSidebarOpen ? 'px-3 py-2' : 'px-0 py-2 justify-center'
                    } ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <span className="relative flex-shrink-0">
                      <Icon size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : ''} />
                      {navBadges[item.path] > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {navBadges[item.path] > 99 ? '99+' : navBadges[item.path]}
                        </span>
                      )}
                    </span>
                    {effectiveSidebarOpen && (
                      <span className={`text-sm flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {effectiveSidebarOpen && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 text-center">v1.0</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto flex flex-col min-w-0 ${isMobile ? 'pb-16' : ''}`}>
        {/* Top Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <GlobalSearch />
            </div>
            {/* Data Sync — icon only */}
            <button
              onClick={() => setShowSync(true)}
              title="Data Sync — Re-reads all data from storage, refreshes every view, and cleans any orphaned cross-references."
              className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors touch-target"
            >
              <RefreshCw size={16} />
            </button>
            {/* Conflict alert */}
            <button
              onClick={() => setShowConflicts(v => !v)}
              title="Data Conflicts — Review inconsistencies detected across sections"
              className={`relative p-2 rounded-lg transition-colors touch-target ${
                unresolvedConflicts > 0
                  ? 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 text-amber-600 dark:text-amber-400'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}
            >
              <AlertTriangle size={16} />
              {unresolvedConflicts > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unresolvedConflicts}
                </span>
              )}
            </button>
            {/* Briefing OUT → NotebookLM — hidden on mobile to save space */}
            <button
              onClick={() => setShowBriefing(true)}
              title="Briefing — Exports a full snapshot of your grants, tasks, and budget as a readable document. Copy it into NotebookLM so the AI can answer questions about your program."
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <ClipboardList size={15} />
              Briefing
            </button>
            {/* NbLM IN → brAIn — hidden on mobile */}
            <button
              onClick={() => setShowNbLMImport(true)}
              title="NbLM Import — Paste the AI response from NotebookLM here. brAIn will read it and propose updates to your tasks, grants, and knowledge base for you to review and approve."
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <FileInput size={15} />
              NbLM Import
            </button>
          </div>
        </div>

        {/* Quota Warning Banner */}
        {quotaPercent !== null && (
          <div className="sticky top-[57px] z-30 flex items-center justify-between gap-3 px-4 md:px-6 py-2.5 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              <span><strong>Storage at {quotaPercent}% full</strong> — back up your data before it fills up.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const data = JSON.stringify(storage.exportAll(), null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `brAIn_backup_${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs font-semibold px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded transition-colors"
              >
                Export Now
              </button>
              <button onClick={() => setQuotaPercent(null)} className="text-amber-500 hover:text-amber-700 p-1">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-stretch h-16 shadow-lg">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors touch-target ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setShowMoreDrawer(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 dark:text-gray-400 touch-target"
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </nav>
      )}

      {/* Mobile More Drawer — full-screen overlay with all nav items */}
      {isMobile && showMoreDrawer && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-gray-900">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">bA</span>
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">brAIn</h2>
            </div>
            <button
              onClick={() => setShowMoreDrawer(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 touch-target"
            >
              <X size={20} />
            </button>
          </div>

          {/* All nav items */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors touch-target ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="relative">
                        <Icon size={20} className={isActive ? 'text-primary-600 dark:text-primary-400' : ''} />
                        {navBadges[item.path] > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {navBadges[item.path] > 99 ? '99+' : navBadges[item.path]}
                          </span>
                        )}
                      </span>
                      <span className={`text-base ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Briefing / NbLM Import buttons in drawer */}
            <div className="mt-4 px-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <button
                onClick={() => { setShowMoreDrawer(false); setShowBriefing(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <ClipboardList size={18} />
                Briefing Export
              </button>
              <button
                onClick={() => { setShowMoreDrawer(false); setShowNbLMImport(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <FileInput size={18} />
                NbLM Import
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Global AI Assistant (floating, bottom-right) */}
      <GlobalAIEditor />

      {/* Modals */}
      {showSync && (
        <DataSyncModal onClose={() => setShowSync(false)} />
      )}
      {showBriefing && (
        <BriefingGenerator onClose={() => setShowBriefing(false)} />
      )}
      {showNbLMImport && (
        <NotebookLMImport onClose={() => setShowNbLMImport(false)} />
      )}
      {showConflicts && (
        <ConflictsPanel onClose={() => setShowConflicts(false)} />
      )}

      {/* Global Capture Bar — Space key */}
      {showCaptureBar && (
        <CaptureBar
          onClose={() => setShowCaptureBar(false)}
          onSave={({ text, dueDate }) => {
            addTodo({
              id: crypto.randomUUID(),
              text,
              completed: false,
              dueDate: dueDate || null,
              priority: 'normal',
              createdAt: new Date().toISOString(),
            });
          }}
        />
      )}
    </div>
  );
};

export default Layout;
