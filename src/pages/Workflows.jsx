import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import KanbanBoard from '../components/workflows/KanbanBoard';
import SOPReference from '../components/workflows/SOPReference';
import WorkflowAIChat from '../components/workflows/WorkflowAIChat';
import { Kanban, Calendar, BarChart3, Network, BookOpen } from 'lucide-react';
import GanttChart from '../components/workflows/GanttChart';
import ProgressDashboard from '../components/workflows/ProgressDashboard';
import FlowchartView from '../components/workflows/FlowchartView';

const Workflows = () => {
  const [activeView, setActiveView] = useState('kanban');
  const { tasks } = useApp();

  const views = [
    { id: 'kanban', label: 'Kanban Board', icon: Kanban },
    { id: 'sop', label: 'SOP Reference', icon: BookOpen },
    { id: 'gantt', label: 'Gantt Chart', icon: Calendar },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'flowchart', label: 'Flowchart', icon: Network },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflows</h1>
        <p className="text-gray-600">Visualize and manage your project workflows</p>
      </div>

      {/* View Selector */}
      <Card className="mb-8">
        <div className="flex gap-2">
          {views.map(view => {
            const Icon = view.icon;
            return (
              <Button
                key={view.id}
                variant={activeView === view.id ? 'primary' : 'secondary'}
                onClick={() => setActiveView(view.id)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Icon size={20} />
                {view.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* View Content */}
      {activeView === 'kanban' && (
        <>
          <Card>
            <KanbanBoard />
          </Card>
          <WorkflowAIChat />
        </>
      )}

      {activeView === 'sop' && (
        <SOPReference />
      )}

      {activeView === 'gantt' && (
        <Card>
          <GanttChart />
        </Card>
      )}

      {activeView === 'dashboard' && (
        <Card>
          <ProgressDashboard />
        </Card>
      )}

      {activeView === 'flowchart' && (
        <Card>
          <FlowchartView />
        </Card>
      )}
    </div>
  );
};

export default Workflows;
