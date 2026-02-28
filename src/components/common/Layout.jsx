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
} from 'lucide-react';
import { useState } from 'react';
import GlobalSearch from './GlobalSearch';
import GlobalAIEditor from '../ai/GlobalAIEditor';
import BriefingGenerator from '../ai/BriefingGenerator';
import NotebookLMImport from '../ai/NotebookLMImport';

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showNbLMImport, setShowNbLMImport] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', tooltip: 'Dashboard — Overview of all grants, open tasks, budget summary, and recent activity' },
    { path: '/grants', icon: Award, label: 'Grants', tooltip: 'Grants — Manage your grant portfolio: status, deliverables, reporting deadlines, and contacts' },
    { path: '/budget', icon: DollarSign, label: 'Budget', tooltip: 'Budget — Track spending against award budgets, log expenses, and import award letters' },
    { path: '/documents', icon: FolderOpen, label: 'Documents', tooltip: 'Documents — Store and organize grant documents, reports, and files' },
    { path: '/workflows', icon: Workflow, label: 'Kanban', tooltip: 'Kanban — Manage tasks on a drag-and-drop board: To Do, In Progress, Done' },
    { path: '/knowledge', icon: BookMarked, label: 'Knowledge', tooltip: 'Knowledge Base — Upload policies, SOPs, and email threads so the AI assistant can reference them' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings', tooltip: 'Settings — Configure your API key, app preferences, and backup/restore your data' },
  ];

  return (
    <div className="flex h-screen bg-surface-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-surface-100 shadow-lg transition-all duration-300 flex flex-col border-r border-surface-300`}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-300 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-primary-600">brAIn</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="p-2 hover:bg-surface-200 rounded-lg transition-colors text-gray-600"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    title={item.tooltip}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-surface-200'
                    }`}
                  >
                    <Icon size={20} />
                    {sidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-surface-300">
            <p className="text-xs text-primary-600 text-center font-medium">
              brAIn v1.0
            </p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Header */}
        <div className="bg-surface-100 border-b border-surface-300 px-8 py-4 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <GlobalSearch />
            </div>
            {/* Briefing OUT → NotebookLM */}
            <button
              onClick={() => setShowBriefing(true)}
              title="Briefing — Exports a full snapshot of your grants, tasks, and budget as a readable document. Copy it into NotebookLM so the AI can answer questions about your program."
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm whitespace-nowrap"
            >
              <ClipboardList size={16} />
              Briefing
            </button>
            {/* NbLM IN → brAIn */}
            <button
              onClick={() => setShowNbLMImport(true)}
              title="NbLM Import — Paste the AI response from NotebookLM here. brAIn will read it and propose updates to your tasks, grants, and knowledge base for you to review and approve."
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm whitespace-nowrap"
            >
              <FileInput size={16} />
              NbLM Import
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>

      {/* Global AI Assistant */}
      <GlobalAIEditor />

      {/* Modals */}
      {showBriefing && (
        <BriefingGenerator onClose={() => setShowBriefing(false)} />
      )}
      {showNbLMImport && (
        <NotebookLMImport onClose={() => setShowNbLMImport(false)} />
      )}
    </div>
  );
};

export default Layout;
