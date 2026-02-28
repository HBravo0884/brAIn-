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
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/grants', icon: Award, label: 'Grants' },
    { path: '/budget', icon: DollarSign, label: 'Budget' },
    { path: '/documents', icon: FolderOpen, label: 'Documents' },
    { path: '/workflows', icon: Workflow, label: 'Kanban' },
    { path: '/knowledge', icon: BookMarked, label: 'Knowledge' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-primary-600">brAIn</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all transform hover:scale-105 ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
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
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              brAIn v1.0
            </p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <GlobalSearch />
            </div>
            {/* Briefing OUT → NotebookLM */}
            <button
              onClick={() => setShowBriefing(true)}
              title="Generate status briefing for NotebookLM"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm whitespace-nowrap"
            >
              <ClipboardList size={16} />
              Briefing
            </button>
            {/* NbLM IN → brAIn */}
            <button
              onClick={() => setShowNbLMImport(true)}
              title="Import NotebookLM output into brAIn"
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
