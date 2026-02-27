import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import DeliverablesSection from './DeliverablesSection';
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Target,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  FileText,
  Link as LinkIcon,
  AlertCircle,
  TrendingUp,
  Users,
  Tag,
  Link2,
  User
} from 'lucide-react';
import { format } from 'date-fns';

const EnhancedGrantDetails = ({ grant, onClose }) => {
  const {
    updateGrant,
    budgets,
    tasks,
    paymentRequests,
    documents,
    updateTask,
    updatePaymentRequest,
    updateDocument,
    addTask
  } = useApp();

  const [expandedAims, setExpandedAims] = useState({});
  const [editingAim, setEditingAim] = useState(null);
  const [editingSubAim, setEditingSubAim] = useState(null);
  const [isAimModalOpen, setIsAimModalOpen] = useState(false);
  const [isSubAimModalOpen, setIsSubAimModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedAimForLinking, setSelectedAimForLinking] = useState(null);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [editingActivity, setEditingActivity] = useState(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedSubAimForActivity, setSelectedSubAimForActivity] = useState(null);
  const [activityFormData, setActivityFormData] = useState({
    title: '',
    description: '',
    deliverables: [],
    owner: '',
    dueDate: '',
    status: 'not-started',
    budgetAmount: '',
    estimatedHours: '',
    dependencies: [],
    notes: '',
    priority: 'medium',
    addToKanban: false,
    linkedTaskId: null
  });

  const [aimFormData, setAimFormData] = useState({
    number: '',
    title: '',
    description: '',
    targetDate: '',
    status: 'in-progress',
    budgetAllocation: '',
    completionPercentage: 0,
    subAims: [],
    kpis: [],
    milestones: []
  });

  const [subAimFormData, setSubAimFormData] = useState({
    number: '',
    title: '',
    description: '',
    targetDate: '',
    status: 'not-started',
    budgetAllocation: '',
    completionPercentage: 0,
    assignedTo: '',
    dependencies: []
  });

  const grantBudget = budgets.find(b => b.grantId === grant.id);
  const aims = grant.aims || [];

  // Toggle aim expansion
  const toggleAim = (aimId) => {
    setExpandedAims(prev => ({
      ...prev,
      [aimId]: !prev[aimId]
    }));
  };

  // Get linked items for an aim
  const getLinkedTasks = (aimId) => {
    return tasks.filter(t => t.aimId === aimId || t.grantId === grant.id);
  };

  const getLinkedPaymentRequests = (aimId) => {
    return paymentRequests.filter(pr => pr.aimId === aimId || pr.grantId === grant.id);
  };

  const getLinkedDocuments = (aimId) => {
    return documents.filter(d => d.aimId === aimId || d.grantId === grant.id);
  };

  const getPendingItems = (aimId) => {
    const pendingTasks = getLinkedTasks(aimId).filter(t => t.status !== 'Done' && t.status !== 'Completed');
    const pendingPRs = getLinkedPaymentRequests(aimId).filter(pr => pr.approvalStatus === 'pending');
    return {
      tasks: pendingTasks,
      paymentRequests: pendingPRs,
      total: pendingTasks.length + pendingPRs.length
    };
  };

  // Handle Aim operations
  const handleAddAim = () => {
    setEditingAim(null);
    setAimFormData({
      number: '',
      title: '',
      description: '',
      targetDate: '',
      status: 'in-progress',
      budgetAllocation: '',
      completionPercentage: 0,
      subAims: [],
      kpis: [],
      milestones: []
    });
    setIsAimModalOpen(true);
  };

  const handleEditAim = (aim) => {
    setEditingAim(aim);
    setAimFormData({
      number: aim.number,
      title: aim.title,
      description: aim.description,
      targetDate: aim.targetDate || '',
      status: aim.status,
      budgetAllocation: aim.budgetAllocation?.toString() || '',
      completionPercentage: aim.completionPercentage || 0,
      subAims: aim.subAims || [],
      kpis: aim.kpis || [],
      milestones: aim.milestones || []
    });
    setIsAimModalOpen(true);
  };

  const handleSaveAim = () => {
    const aimData = {
      ...aimFormData,
      id: editingAim?.id || crypto.randomUUID(),
      budgetAllocation: parseFloat(aimFormData.budgetAllocation) || 0,
      completionPercentage: parseInt(aimFormData.completionPercentage) || 0,
      budgetSpent: editingAim?.budgetSpent || 0,
      subAims: editingAim?.subAims || []
    };

    let updatedAims;
    if (editingAim) {
      updatedAims = aims.map(a => a.id === editingAim.id ? aimData : a);
    } else {
      updatedAims = [...aims, aimData];
    }

    updateGrant(grant.id, { aims: updatedAims });
    setIsAimModalOpen(false);
  };

  const handleDeleteAim = (aimId) => {
    if (window.confirm('Are you sure? This will also delete all sub-aims.')) {
      const updatedAims = aims.filter(a => a.id !== aimId);
      updateGrant(grant.id, { aims: updatedAims });
    }
  };

  // Handle Sub-Aim operations
  const handleAddSubAim = (parentAimId) => {
    setEditingSubAim(null);
    setSelectedAimForLinking(parentAimId);
    setSubAimFormData({
      number: '',
      title: '',
      description: '',
      targetDate: '',
      status: 'not-started',
      budgetAllocation: '',
      completionPercentage: 0,
      assignedTo: '',
      dependencies: []
    });
    setIsSubAimModalOpen(true);
  };

  const handleEditSubAim = (parentAimId, subAim) => {
    setEditingSubAim(subAim);
    setSelectedAimForLinking(parentAimId);
    setSubAimFormData({
      number: subAim.number,
      title: subAim.title,
      description: subAim.description,
      targetDate: subAim.targetDate || '',
      status: subAim.status,
      budgetAllocation: subAim.budgetAllocation?.toString() || '',
      completionPercentage: subAim.completionPercentage || 0,
      assignedTo: subAim.assignedTo || '',
      dependencies: subAim.dependencies || []
    });
    setIsSubAimModalOpen(true);
  };

  const handleSaveSubAim = () => {
    const subAimData = {
      ...subAimFormData,
      id: editingSubAim?.id || crypto.randomUUID(),
      budgetAllocation: parseFloat(subAimFormData.budgetAllocation) || 0,
      completionPercentage: parseInt(subAimFormData.completionPercentage) || 0,
      budgetSpent: editingSubAim?.budgetSpent || 0
    };

    const updatedAims = aims.map(aim => {
      if (aim.id === selectedAimForLinking) {
        const subAims = aim.subAims || [];
        const updatedSubAims = editingSubAim
          ? subAims.map(sa => sa.id === editingSubAim.id ? subAimData : sa)
          : [...subAims, subAimData];
        return { ...aim, subAims: updatedSubAims };
      }
      return aim;
    });

    updateGrant(grant.id, { aims: updatedAims });
    setIsSubAimModalOpen(false);
  };

  const handleDeleteSubAim = (parentAimId, subAimId) => {
    if (window.confirm('Are you sure you want to delete this sub-aim?')) {
      const updatedAims = aims.map(aim => {
        if (aim.id === parentAimId) {
          return {
            ...aim,
            subAims: (aim.subAims || []).filter(sa => sa.id !== subAimId)
          };
        }
        return aim;
      });
      updateGrant(grant.id, { aims: updatedAims });
    }
  };

  // Handle Activity operations
  const toggleActivities = (subAimId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [subAimId]: !prev[subAimId]
    }));
  };

  const handleAddActivity = (aimId, subAimId) => {
    setEditingActivity(null);
    setSelectedAimForLinking(aimId);
    setSelectedSubAimForActivity(subAimId);
    setActivityFormData({
      title: '',
      description: '',
      deliverables: [],
      owner: '',
      dueDate: '',
      status: 'not-started',
      budgetAmount: '',
      estimatedHours: '',
      dependencies: [],
      notes: ''
    });
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (aimId, subAimId, activity) => {
    setEditingActivity(activity);
    setSelectedAimForLinking(aimId);
    setSelectedSubAimForActivity(subAimId);
    setActivityFormData({
      title: activity.title,
      description: activity.description,
      deliverables: activity.deliverables || [],
      owner: activity.owner || '',
      dueDate: activity.dueDate || '',
      status: activity.status,
      budgetAmount: activity.budgetAmount?.toString() || '',
      estimatedHours: activity.estimatedHours?.toString() || '',
      dependencies: activity.dependencies || [],
      notes: activity.notes || '',
      priority: activity.priority || 'medium',
      addToKanban: false,
      linkedTaskId: activity.linkedTaskId || null
    });
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = () => {
    try {
      const activityId = editingActivity?.id || crypto.randomUUID();
      const activityData = {
        ...activityFormData,
        id: activityId,
        budgetAmount: parseFloat(activityFormData.budgetAmount) || 0,
        estimatedHours: parseInt(activityFormData.estimatedHours) || 0,
        deliverables: Array.isArray(activityFormData.deliverables)
          ? activityFormData.deliverables
          : (activityFormData.deliverables || '').split('\n').filter(d => d.trim()),
        priority: activityFormData.priority || 'medium',
        linkedTaskId: activityFormData.linkedTaskId || null
      };

      // Create Kanban task if requested
      if (activityFormData.addToKanban && activityFormData.dueDate && !activityFormData.linkedTaskId) {
        const aim = aims.find(a => a.id === selectedAimForLinking);
        const subAim = aim?.subAims?.find(sa => sa.id === selectedSubAimForActivity);

        const taskData = {
          title: `Activity: ${activityFormData.title}`,
          description: `${activityFormData.description}\n\nAim: ${aim?.number} ${aim?.title}\nSub-aim: ${subAim?.number} ${subAim?.title}\n\nDeliverables:\n${Array.isArray(activityFormData.deliverables)
            ? activityFormData.deliverables.join('\n')
            : activityFormData.deliverables}\n\n${activityFormData.notes || ''}`,
          status: activityFormData.status === 'completed' ? 'Done' :
                  activityFormData.status === 'in-progress' ? 'In Progress' : 'To Do',
          priority: activityFormData.priority,
          dueDate: activityFormData.dueDate,
          assignee: activityFormData.owner,
          grantId: grant.id,
          sourceType: 'activity',
          sourceId: activityId,
          aimId: selectedAimForLinking,
          subAimId: selectedSubAimForActivity
        };
        const createdTask = addTask(taskData);
        if (createdTask && createdTask.id) {
          activityData.linkedTaskId = createdTask.id;
        }
      }

      const updatedAims = aims.map(aim => {
        if (aim.id === selectedAimForLinking) {
          const updatedSubAims = (aim.subAims || []).map(subAim => {
            if (subAim.id === selectedSubAimForActivity) {
              const activities = subAim.activities || [];
              const updatedActivities = editingActivity
                ? activities.map(a => a.id === editingActivity.id ? activityData : a)
                : [...activities, activityData];
              return { ...subAim, activities: updatedActivities };
            }
            return subAim;
          });
          return { ...aim, subAims: updatedSubAims };
        }
        return aim;
      });

      updateGrant(grant.id, { aims: updatedAims });
      setIsActivityModalOpen(false);
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity. Please check the console for details.');
    }
  };

  const handleDeleteActivity = (aimId, subAimId, activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      const updatedAims = aims.map(aim => {
        if (aim.id === aimId) {
          const updatedSubAims = (aim.subAims || []).map(subAim => {
            if (subAim.id === subAimId) {
              return {
                ...subAim,
                activities: (subAim.activities || []).filter(a => a.id !== activityId)
              };
            }
            return subAim;
          });
          return { ...aim, subAims: updatedSubAims };
        }
        return aim;
      });
      updateGrant(grant.id, { aims: updatedAims });
    }
  };

  // Handle linking items
  const handleLinkItems = (aimId) => {
    setSelectedAimForLinking(aimId);
    setIsLinkModalOpen(true);
  };

  const linkTaskToAim = (taskId) => {
    updateTask(taskId, { aimId: selectedAimForLinking, grantId: grant.id });
  };

  const linkPaymentRequestToAim = (prId) => {
    updatePaymentRequest(prId, { aimId: selectedAimForLinking, grantId: grant.id });
  };

  const linkDocumentToAim = (docId) => {
    updateDocument(docId, { aimId: selectedAimForLinking, grantId: grant.id });
  };

  const getStatusColor = (status) => {
    const colors = {
      'not-started': 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'at-risk': 'bg-red-100 text-red-700',
      'on-hold': 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || colors['in-progress'];
  };

  const totalBudgetAllocated = aims.reduce((sum, aim) => sum + (aim.budgetAllocation || 0), 0);
  const avgCompletion = aims.length > 0
    ? aims.reduce((sum, aim) => sum + (aim.completionPercentage || 0), 0) / aims.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Grant Header */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{grant.title}</h2>
            <p className="text-gray-600">{grant.fundingAgency}</p>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Back to Grants
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">
              ${(grant.amount / 1000).toFixed(0)}K
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
              grant.status === 'active' ? 'bg-green-100 text-green-700' :
              grant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              grant.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>
              {grant.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Aims</p>
            <p className="text-xl font-bold text-gray-900">{aims.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Avg Progress</p>
            <p className="text-xl font-bold text-green-600">{avgCompletion.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Budget Allocated</p>
            <p className="text-xl font-bold text-purple-600">
              ${(totalBudgetAllocated / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        {grant.startDate && (
          <div className="mt-4 pt-4 border-t flex items-center text-sm text-gray-600">
            <Calendar size={16} className="mr-2" />
            {format(new Date(grant.startDate), 'MMM d, yyyy')} - {grant.endDate ? format(new Date(grant.endDate), 'MMM d, yyyy') : 'Ongoing'}
          </div>
        )}
      </Card>

      {/* Add Aim Button */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleAddAim}>
          <Plus size={20} className="mr-2" />
          Add New Aim
        </Button>
      </div>

      {/* Aims List - Collapsible */}
      <div className="space-y-4">
        {aims.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Target size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No aims defined yet</p>
              <Button variant="primary" onClick={handleAddAim}>
                <Plus size={16} className="mr-2" />
                Add First Aim
              </Button>
            </div>
          </Card>
        ) : (
          aims.map(aim => {
            const isExpanded = expandedAims[aim.id];
            const pendingItems = getPendingItems(aim.id);
            const linkedTasks = getLinkedTasks(aim.id);
            const linkedPRs = getLinkedPaymentRequests(aim.id);
            const linkedDocs = getLinkedDocuments(aim.id);
            const subAims = aim.subAims || [];

            return (
              <Card key={aim.id} className="overflow-hidden">
                {/* Aim Header - Always Visible */}
                <div
                  className="cursor-pointer hover:bg-gray-50 transition-colors p-4 -m-4"
                  onClick={() => toggleAim(aim.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Expand/Collapse Icon */}
                      <button className="mt-1">
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-gray-600" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-600" />
                        )}
                      </button>

                      {/* Aim Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{aim.number}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(aim.status)}`}>
                            {aim.status}
                          </span>
                          {pendingItems.total > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                              <AlertCircle size={12} />
                              {pendingItems.total} pending
                            </span>
                          )}
                          {subAims.length > 0 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {subAims.length} sub-aim{subAims.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-1">{aim.title}</h4>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  aim.completionPercentage >= 75 ? 'bg-green-500' :
                                  aim.completionPercentage >= 50 ? 'bg-blue-500' :
                                  aim.completionPercentage >= 25 ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${aim.completionPercentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-600 min-w-[3rem]">
                            {aim.completionPercentage}%
                          </span>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                          {aim.budgetAllocation > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign size={12} />
                              ${(aim.budgetAllocation / 1000).toFixed(0)}K
                            </span>
                          )}
                          {linkedTasks.length > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckCircle size={12} />
                              {linkedTasks.length} task{linkedTasks.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {aim.kpis && aim.kpis.length > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp size={12} />
                              {aim.kpis.length} KPI{aim.kpis.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" onClick={() => handleEditAim(aim)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteAim(aim.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-6">
                    {/* Description */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
                      <p className="text-sm text-gray-700">{aim.description}</p>
                    </div>

                    {/* Sub-Aims */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900">Sub-Aims</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSubAim(aim.id)}
                        >
                          <Plus size={14} className="mr-1" />
                          Add Sub-Aim
                        </Button>
                      </div>

                      {subAims.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No sub-aims defined</p>
                      ) : (
                        <div className="space-y-2">
                          {subAims.map(subAim => {
                            const activities = subAim.activities || [];
                            const isActivitiesExpanded = expandedActivities[subAim.id];

                            return (
                              <Card key={subAim.id} className="bg-gray-50 p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h6 className="font-semibold text-sm text-gray-900">
                                        {subAim.number} - {subAim.title}
                                      </h6>
                                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(subAim.status)}`}>
                                        {subAim.status}
                                      </span>
                                      {activities.length > 0 && (
                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                          {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">{subAim.description}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <span>{subAim.completionPercentage}% complete</span>
                                      {subAim.assignedTo && (
                                        <span className="flex items-center gap-1">
                                          <Users size={10} />
                                          {subAim.assignedTo}
                                        </span>
                                      )}
                                      {subAim.targetDate && (
                                        <span className="flex items-center gap-1">
                                          <Calendar size={10} />
                                          {format(new Date(subAim.targetDate), 'MMM d')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditSubAim(aim.id, subAim)}
                                    >
                                      <Edit size={12} />
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleDeleteSubAim(aim.id, subAim.id)}
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                  </div>
                                </div>

                                {/* Deliverables for this Sub-Aim */}
                                {activities.length === 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <DeliverablesSection
                                      grantId={grant.id}
                                      aimId={aim.id}
                                      subAimId={subAim.id}
                                      title="Sub-Aim Deliverables"
                                      compact={true}
                                    />
                                  </div>
                                )}

                                {/* Activities Section */}
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <button
                                      className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900"
                                      onClick={() => toggleActivities(subAim.id)}
                                    >
                                      {isActivitiesExpanded ? (
                                        <ChevronDown size={14} />
                                      ) : (
                                        <ChevronRight size={14} />
                                      )}
                                      <span>Activities ({activities.length})</span>
                                    </button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddActivity(aim.id, subAim.id)}
                                    >
                                      <Plus size={10} className="mr-1" />
                                      Add Activity
                                    </Button>
                                  </div>

                                  {isActivitiesExpanded && (
                                    <div className="space-y-2 mt-2">
                                      {activities.length === 0 ? (
                                        <p className="text-xs text-gray-500 italic pl-5">No activities defined</p>
                                      ) : (
                                        activities.map(activity => (
                                          <div
                                            key={activity.id}
                                            className="bg-white border border-gray-200 rounded p-2 ml-5"
                                          >
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <h6 className="font-medium text-xs text-gray-900">
                                                    {activity.title}
                                                  </h6>
                                                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                                                    {activity.status}
                                                  </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-2">{activity.description}</p>
                                                <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                                                  {activity.owner && (
                                                    <span className="flex items-center gap-1 text-green-600">
                                                      <User size={10} />
                                                      {activity.owner}
                                                    </span>
                                                  )}
                                                  {activity.budgetAmount > 0 && (
                                                    <span className="flex items-center gap-1">
                                                      <DollarSign size={10} />
                                                      ${activity.budgetAmount.toLocaleString()}
                                                    </span>
                                                  )}
                                                  {activity.dueDate && (
                                                    <span className="flex items-center gap-1 text-purple-600 font-medium">
                                                      <Calendar size={10} />
                                                      {format(new Date(activity.dueDate), 'MMM d')}
                                                    </span>
                                                  )}
                                                  {activity.deliverables && activity.deliverables.length > 0 && (
                                                    <span className="flex items-center gap-1">
                                                      <FileText size={10} />
                                                      {activity.deliverables.length} deliverable{activity.deliverables.length !== 1 ? 's' : ''}
                                                    </span>
                                                  )}
                                                  {activity.linkedTaskId && (
                                                    <span className="flex items-center gap-1 text-indigo-600 font-medium">
                                                      <Link2 size={10} />
                                                      On Kanban
                                                    </span>
                                                  )}
                                                  {activity.priority && activity.priority !== 'medium' && (
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                      activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                      activity.priority === 'low' ? 'bg-gray-100 text-gray-700' :
                                                      ''
                                                    }`}>
                                                      {activity.priority}
                                                    </span>
                                                  )}
                                                </div>

                                                {/* Deliverables for this Activity */}
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                  <DeliverablesSection
                                                    grantId={grant.id}
                                                    aimId={aim.id}
                                                    subAimId={subAim.id}
                                                    activityId={activity.id}
                                                    title="Activity Deliverables"
                                                    compact={true}
                                                  />
                                                </div>
                                              </div>
                                              <div className="flex gap-1 ml-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleEditActivity(aim.id, subAim.id, activity)}
                                                >
                                                  <Edit size={10} />
                                                </Button>
                                                <Button
                                                  variant="danger"
                                                  size="sm"
                                                  onClick={() => handleDeleteActivity(aim.id, subAim.id, activity.id)}
                                                >
                                                  <Trash2 size={10} />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Pending Items */}
                    {pendingItems.total > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle size={18} className="text-orange-600" />
                          <h5 className="font-semibold text-gray-900">
                            Pending Items ({pendingItems.total})
                          </h5>
                        </div>

                        <div className="space-y-2">
                          {pendingItems.tasks.map(task => (
                            <div key={task.id} className="flex items-center gap-2 text-sm p-2 bg-yellow-50 rounded">
                              <Clock size={14} className="text-yellow-600" />
                              <span className="flex-1">{task.title}</span>
                              <span className="text-xs text-gray-500">{task.status}</span>
                            </div>
                          ))}

                          {pendingItems.paymentRequests.map(pr => (
                            <div key={pr.id} className="flex items-center gap-2 text-sm p-2 bg-yellow-50 rounded">
                              <DollarSign size={14} className="text-yellow-600" />
                              <span className="flex-1">PRF: {pr.vendor} - ${pr.amount}</span>
                              <span className="text-xs text-gray-500">Pending Approval</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked Items Summary */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-gray-900">Linked Items</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLinkItems(aim.id)}
                        >
                          <LinkIcon size={14} className="mr-1" />
                          Link Items
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-blue-600 font-medium">{linkedTasks.length}</p>
                          <p className="text-gray-600">Tasks</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-green-600 font-medium">{linkedPRs.length}</p>
                          <p className="text-gray-600">Payment Requests</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-purple-600 font-medium">{linkedDocs.length}</p>
                          <p className="text-gray-600">Documents</p>
                        </div>
                      </div>
                    </div>

                    {/* Deliverables for this Aim */}
                    <div>
                      <DeliverablesSection
                        grantId={grant.id}
                        aimId={aim.id}
                        title="Aim Deliverables"
                        compact={false}
                      />
                    </div>

                    {/* KPIs */}
                    {aim.kpis && aim.kpis.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">Key Performance Indicators</h5>
                        <div className="space-y-2">
                          {aim.kpis.map(kpi => (
                            <div key={kpi.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900 mb-1">{kpi.name}</p>
                                  <p className="text-xs text-gray-600 mb-2">{kpi.description}</p>
                                  <div className="flex items-center gap-4 text-xs">
                                    <span className="text-gray-600">
                                      Target: <strong>{kpi.targetValue}</strong> {kpi.unit}
                                    </span>
                                    <span className="text-gray-600">
                                      Current: <strong>{kpi.currentValue}</strong> {kpi.unit}
                                    </span>
                                    <span className={`font-medium ${
                                      kpi.status === 'on-track' ? 'text-green-600' :
                                      kpi.status === 'at-risk' ? 'text-red-600' :
                                      'text-yellow-600'
                                    }`}>
                                      {kpi.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestones */}
                    {aim.milestones && aim.milestones.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">Milestones</h5>
                        <div className="space-y-2">
                          {aim.milestones.map(milestone => (
                            <div
                              key={milestone.id}
                              className={`p-3 rounded-lg flex items-start gap-3 ${
                                milestone.completed ? 'bg-green-50' : 'bg-gray-50'
                              }`}
                            >
                              <CheckCircle
                                size={18}
                                className={milestone.completed ? 'text-green-600' : 'text-gray-400'}
                              />
                              <div className="flex-1">
                                <p className={`font-medium text-sm ${
                                  milestone.completed ? 'text-green-900 line-through' : 'text-gray-900'
                                }`}>
                                  {milestone.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">{milestone.description}</p>
                                {milestone.targetDate && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Target: {format(new Date(milestone.targetDate), 'MMM d, yyyy')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Aim Modal */}
      <Modal
        isOpen={isAimModalOpen}
        onClose={() => setIsAimModalOpen(false)}
        title={editingAim ? 'Edit Aim' : 'Add New Aim'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Aim Number"
            value={aimFormData.number}
            onChange={(e) => setAimFormData({ ...aimFormData, number: e.target.value })}
            required
            placeholder="e.g., Aim 1, Aim 5 - Re-Entry"
          />

          <Input
            label="Aim Title"
            value={aimFormData.title}
            onChange={(e) => setAimFormData({ ...aimFormData, title: e.target.value })}
            required
            placeholder="Brief title for this aim"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={aimFormData.description}
              onChange={(e) => setAimFormData({ ...aimFormData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Detailed description of this aim's objectives..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={aimFormData.status}
              onChange={(e) => setAimFormData({ ...aimFormData, status: e.target.value })}
              options={[
                { value: 'not-started', label: 'Not Started' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'at-risk', label: 'At Risk' },
                { value: 'on-hold', label: 'On Hold' }
              ]}
              required
            />

            <Input
              label="Completion %"
              type="number"
              value={aimFormData.completionPercentage}
              onChange={(e) => setAimFormData({ ...aimFormData, completionPercentage: e.target.value })}
              min="0"
              max="100"
              placeholder="0-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Budget Allocation ($)"
              type="number"
              value={aimFormData.budgetAllocation}
              onChange={(e) => setAimFormData({ ...aimFormData, budgetAllocation: e.target.value })}
              placeholder="0"
            />

            <Input
              label="Target Date"
              type="date"
              value={aimFormData.targetDate}
              onChange={(e) => setAimFormData({ ...aimFormData, targetDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsAimModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAim}>
              {editingAim ? 'Update' : 'Add'} Aim
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sub-Aim Modal */}
      <Modal
        isOpen={isSubAimModalOpen}
        onClose={() => setIsSubAimModalOpen(false)}
        title={editingSubAim ? 'Edit Sub-Aim' : 'Add Sub-Aim'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Sub-Aim Number"
            value={subAimFormData.number}
            onChange={(e) => setSubAimFormData({ ...subAimFormData, number: e.target.value })}
            required
            placeholder="e.g., 5.1, 5.2"
          />

          <Input
            label="Sub-Aim Title"
            value={subAimFormData.title}
            onChange={(e) => setSubAimFormData({ ...subAimFormData, title: e.target.value })}
            required
            placeholder="Brief title"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={subAimFormData.description}
              onChange={(e) => setSubAimFormData({ ...subAimFormData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Sub-aim description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={subAimFormData.status}
              onChange={(e) => setSubAimFormData({ ...subAimFormData, status: e.target.value })}
              options={[
                { value: 'not-started', label: 'Not Started' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'at-risk', label: 'At Risk' },
                { value: 'on-hold', label: 'On Hold' }
              ]}
              required
            />

            <Input
              label="Completion %"
              type="number"
              value={subAimFormData.completionPercentage}
              onChange={(e) => setSubAimFormData({ ...subAimFormData, completionPercentage: e.target.value })}
              min="0"
              max="100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Assigned To"
              value={subAimFormData.assignedTo}
              onChange={(e) => setSubAimFormData({ ...subAimFormData, assignedTo: e.target.value })}
              placeholder="Team member name"
            />

            <Input
              label="Target Date"
              type="date"
              value={subAimFormData.targetDate}
              onChange={(e) => setSubAimFormData({ ...subAimFormData, targetDate: e.target.value })}
            />
          </div>

          <Input
            label="Budget Allocation ($)"
            type="number"
            value={subAimFormData.budgetAllocation}
            onChange={(e) => setSubAimFormData({ ...subAimFormData, budgetAllocation: e.target.value })}
            placeholder="0"
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsSubAimModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSubAim}>
              {editingSubAim ? 'Update' : 'Add'} Sub-Aim
            </Button>
          </div>
        </div>
      </Modal>

      {/* Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title={editingActivity ? 'Edit Activity' : 'Add Activity'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Activity Title"
            value={activityFormData.title}
            onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
            required
            placeholder="Brief title for this activity"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={activityFormData.description}
              onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Detailed description of this activity..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deliverables (one per line)
            </label>
            <textarea
              value={Array.isArray(activityFormData.deliverables)
                ? activityFormData.deliverables.join('\n')
                : activityFormData.deliverables}
              onChange={(e) => setActivityFormData({ ...activityFormData, deliverables: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Training curriculum manual&#10;Participant workbook&#10;Facilitator guide"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Owner"
              value={activityFormData.owner}
              onChange={(e) => setActivityFormData({ ...activityFormData, owner: e.target.value })}
              placeholder="Team member or department"
            />

            <Input
              label="Due Date"
              type="date"
              value={activityFormData.dueDate}
              onChange={(e) => setActivityFormData({ ...activityFormData, dueDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={activityFormData.status}
              onChange={(e) => setActivityFormData({ ...activityFormData, status: e.target.value })}
              options={[
                { value: 'not-started', label: 'Not Started' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'at-risk', label: 'At Risk' },
                { value: 'on-hold', label: 'On Hold' }
              ]}
              required
            />

            <Input
              label="Budget Amount ($)"
              type="number"
              value={activityFormData.budgetAmount}
              onChange={(e) => setActivityFormData({ ...activityFormData, budgetAmount: e.target.value })}
              placeholder="0"
            />
          </div>

          <Input
            label="Estimated Hours"
            type="number"
            value={activityFormData.estimatedHours}
            onChange={(e) => setActivityFormData({ ...activityFormData, estimatedHours: e.target.value })}
            placeholder="Estimated time in hours"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dependencies (one per line)
            </label>
            <textarea
              value={Array.isArray(activityFormData.dependencies)
                ? activityFormData.dependencies.join('\n')
                : activityFormData.dependencies}
              onChange={(e) => setActivityFormData({ ...activityFormData, dependencies: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="List activities that must be completed first"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={activityFormData.notes}
              onChange={(e) => setActivityFormData({ ...activityFormData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Additional notes or context..."
            />
          </div>

          {/* Timeline & Kanban Integration */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">📅 Timeline & Task Management</h4>

            {activityFormData.linkedTaskId && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                <p className="text-green-800 font-medium">✓ Linked to Kanban task</p>
                <p className="text-green-700 text-xs mt-1">This activity is already tracked on the Kanban board</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={activityFormData.priority}
                onChange={(e) => setActivityFormData({ ...activityFormData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {!activityFormData.linkedTaskId && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activityFormData.addToKanban}
                    onChange={(e) => setActivityFormData({ ...activityFormData, addToKanban: e.target.checked })}
                    className="w-5 h-5 cursor-pointer"
                    disabled={!activityFormData.dueDate}
                  />
                  <div>
                    <p className="font-medium text-purple-900">Add to Kanban Board</p>
                    <p className="text-xs text-purple-700">
                      Automatically create a task card on the Kanban board for this activity.
                      {!activityFormData.dueDate && ' (Requires due date)'}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsActivityModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveActivity}>
              {editingActivity ? 'Update' : 'Add'} Activity
            </Button>
          </div>
        </div>
      </Modal>

      {/* Link Items Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Link Items to Aim"
        size="lg"
      >
        <div className="space-y-6">
          {/* Tasks */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Tasks</h4>
            {tasks.filter(t => !t.aimId || t.aimId === selectedAimForLinking).length === 0 ? (
              <p className="text-sm text-gray-500">No unlinked tasks available</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tasks.filter(t => !t.aimId || t.aimId === selectedAimForLinking).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{task.title}</span>
                    <Button
                      variant={task.aimId === selectedAimForLinking ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => linkTaskToAim(task.id)}
                      disabled={task.aimId === selectedAimForLinking}
                    >
                      {task.aimId === selectedAimForLinking ? 'Linked' : 'Link'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Requests */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Payment Requests</h4>
            {paymentRequests.filter(pr => !pr.aimId || pr.aimId === selectedAimForLinking).length === 0 ? (
              <p className="text-sm text-gray-500">No unlinked payment requests</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {paymentRequests.filter(pr => !pr.aimId || pr.aimId === selectedAimForLinking).map(pr => (
                  <div key={pr.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">PRF: {pr.vendor} - ${pr.amount}</span>
                    <Button
                      variant={pr.aimId === selectedAimForLinking ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => linkPaymentRequestToAim(pr.id)}
                      disabled={pr.aimId === selectedAimForLinking}
                    >
                      {pr.aimId === selectedAimForLinking ? 'Linked' : 'Link'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Documents</h4>
            {documents.filter(d => !d.aimId || d.aimId === selectedAimForLinking).length === 0 ? (
              <p className="text-sm text-gray-500">No unlinked documents</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documents.filter(d => !d.aimId || d.aimId === selectedAimForLinking).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{doc.name}</span>
                    <Button
                      variant={doc.aimId === selectedAimForLinking ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => linkDocumentToAim(doc.id)}
                      disabled={doc.aimId === selectedAimForLinking}
                    >
                      {doc.aimId === selectedAimForLinking ? 'Linked' : 'Link'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="primary" onClick={() => setIsLinkModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnhancedGrantDetails;
