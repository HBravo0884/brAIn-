import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { Plus, DollarSign, Clock, CheckCircle, XCircle, Eye, Edit, FileText } from 'lucide-react';
import { format } from 'date-fns';

const PaymentRequests = () => {
  const { paymentRequests, addPaymentRequest, updatePaymentRequest, deletePaymentRequest, grants, settings } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPR, setViewingPR] = useState(null);
  const [editingPR, setEditingPR] = useState(null);

  // Get default values from user profile
  const userProfile = settings.userProfile || {};

  const [formData, setFormData] = useState({
    prfNumber: '',
    requestDate: new Date().toISOString().split('T')[0],
    requestor: userProfile.fullName || '',
    department: userProfile.department || 'College of Medicine',
    grantAim: userProfile.defaultGrantAim || '',
    expenseType: '',
    vendor: '',
    amount: '',
    budgetCategory: '',
    purpose: '',
    approvalStatus: 'pending',
    grantId: ''
  });

  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  const expenseTypes = [
    'Travel',
    'Gift Cards',
    'Equipment',
    'Supplies',
    'Participant Incentives',
    'Personnel',
    'Other Direct Costs'
  ];

  const grantAims = [
    'Aim 1',
    'Aim 2',
    'Aim 3',
    'Aim 4',
    'Aim 5 - Re-Entry',
    'Administrative',
    'Other'
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-700'
  };

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
    processing: Clock,
    completed: CheckCircle
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const prData = {
      ...formData,
      amount: parseFloat(formData.amount),
      approvals: []
    };

    if (editingPR) {
      updatePaymentRequest(editingPR.id, prData);
    } else {
      addPaymentRequest(prData);
    }

    setIsModalOpen(false);
    setEditingPR(null);
    resetForm();
  };

  const resetForm = () => {
    // Reset with user profile defaults
    const userProfile = settings.userProfile || {};
    setFormData({
      prfNumber: '',
      requestDate: new Date().toISOString().split('T')[0],
      requestor: userProfile.fullName || '',
      department: userProfile.department || 'College of Medicine',
      grantAim: userProfile.defaultGrantAim || '',
      expenseType: '',
      vendor: '',
      amount: '',
      budgetCategory: '',
      purpose: '',
      approvalStatus: 'pending',
      grantId: ''
    });
  };

  const handleEdit = (pr) => {
    setEditingPR(pr);
    setFormData({
      prfNumber: pr.prfNumber,
      requestDate: pr.requestDate,
      requestor: pr.requestor,
      department: pr.department || 'College of Medicine',
      grantAim: pr.grantAim || '',
      expenseType: pr.expenseType,
      vendor: pr.vendor,
      amount: pr.amount.toString(),
      budgetCategory: pr.budgetCategory,
      purpose: pr.purpose,
      approvalStatus: pr.approvalStatus,
      grantId: pr.grantId || ''
    });
    setIsModalOpen(true);
  };

  const handleApprove = (id) => {
    updatePaymentRequest(id, {
      approvalStatus: 'approved',
      approvals: [{
        approverName: 'Current User',
        approvalDate: new Date().toISOString(),
        status: 'approved'
      }]
    });
  };

  const handleReject = (id) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason) {
      updatePaymentRequest(id, {
        approvalStatus: 'rejected',
        approvals: [{
          approverName: 'Current User',
          approvalDate: new Date().toISOString(),
          status: 'rejected',
          comments: reason
        }]
      });
    }
  };

  const filteredRequests = paymentRequests.filter(pr => {
    if (filter === 'all') return true;
    return pr.approvalStatus === filter;
  });

  // Calculate totals
  const totalAmount = paymentRequests.reduce((sum, pr) => sum + pr.amount, 0);
  const pendingAmount = paymentRequests.filter(pr => pr.approvalStatus === 'pending').reduce((sum, pr) => sum + pr.amount, 0);
  const approvedAmount = paymentRequests.filter(pr => pr.approvalStatus === 'approved' || pr.approvalStatus === 'completed').reduce((sum, pr) => sum + pr.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Requests (PRF)</h1>
          <p className="text-gray-600">Manage RWJF grant payment request forms and approvals</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingPR(null);
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus size={20} className="mr-2" />
          New Payment Request
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Requests</p>
              <p className="text-3xl font-bold">{paymentRequests.length}</p>
            </div>
            <FileText size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold">{paymentRequests.filter(pr => pr.approvalStatus === 'pending').length}</p>
              <p className="text-xs text-yellow-100 mt-1">${(pendingAmount / 1000).toFixed(1)}K</p>
            </div>
            <Clock size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Approved</p>
              <p className="text-3xl font-bold">{paymentRequests.filter(pr => pr.approvalStatus === 'approved' || pr.approvalStatus === 'completed').length}</p>
              <p className="text-xs text-green-100 mt-1">${(approvedAmount / 1000).toFixed(1)}K</p>
            </div>
            <CheckCircle size={40} className="opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Total Amount</p>
              <p className="text-3xl font-bold">${(totalAmount / 1000).toFixed(1)}K</p>
            </div>
            <DollarSign size={40} className="opacity-80" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="mb-6">
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-30 rounded-full text-xs">
                  {paymentRequests.filter(pr => pr.approvalStatus === status).length}
                </span>
              )}
            </Button>
          ))}
        </div>
      </Card>

      {/* Payment Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <DollarSign size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No payment requests</h3>
            <p className="text-gray-500 mb-6">Create your first payment request form</p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} className="mr-2" />
              New Payment Request
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(pr => {
            const StatusIcon = statusIcons[pr.approvalStatus];
            const grant = grants.find(g => g.id === pr.grantId);

            return (
              <Card key={pr.id} className="hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <DollarSign size={24} className="text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            PRF #{pr.prfNumber || pr.id.slice(0, 8)}
                          </h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${statusColors[pr.approvalStatus]}`}>
                            <StatusIcon size={14} />
                            {pr.approvalStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Requestor</p>
                            <p className="font-medium text-gray-900">{pr.requestor}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Expense Type</p>
                            <p className="font-medium text-gray-900">{pr.expenseType}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium text-green-600">${pr.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-medium text-gray-900">{format(new Date(pr.requestDate), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        {pr.grantAim && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {pr.grantAim}
                            </span>
                            {grant && (
                              <span className="inline-block ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {grant.title}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{pr.purpose}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingPR(pr)}
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </Button>
                    {pr.approvalStatus === 'pending' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(pr.id)}
                        >
                          <CheckCircle size={16} className="mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(pr.id)}
                        >
                          <XCircle size={16} className="mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(pr)}
                    >
                      <Edit size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPR(null);
        }}
        title={editingPR ? 'Edit Payment Request' : 'New Payment Request'}
        size="xl"
      >
        {!editingPR && userProfile.fullName && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            ℹ️ Auto-filled with your profile information. You can edit any field.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="PRF Number"
              value={formData.prfNumber}
              onChange={(e) => setFormData({ ...formData, prfNumber: e.target.value })}
              placeholder="Auto-generated if left empty"
            />
            <Input
              label="Request Date"
              type="date"
              value={formData.requestDate}
              onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Requestor Name"
              value={formData.requestor}
              onChange={(e) => setFormData({ ...formData, requestor: e.target.value })}
              required
              placeholder="Your name"
            />
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Grant Aim"
              value={formData.grantAim}
              onChange={(e) => setFormData({ ...formData, grantAim: e.target.value })}
              options={grantAims.map(aim => ({ value: aim, label: aim }))}
              required
            />
            <Select
              label="Expense Type"
              value={formData.expenseType}
              onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
              options={expenseTypes.map(type => ({ value: type, label: type }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vendor/Payee"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              required
              placeholder="Vendor or payee name"
            />
            <Input
              label="Amount ($)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              placeholder="0.00"
            />
          </div>

          <Input
            label="Budget Category"
            value={formData.budgetCategory}
            onChange={(e) => setFormData({ ...formData, budgetCategory: e.target.value })}
            required
            placeholder="e.g., Travel, Personnel, Supplies"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose/Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={4}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              placeholder="Explain the purpose and justification for this expense..."
            />
          </div>

          {grants.length > 0 && (
            <Select
              label="Link to Grant (Optional)"
              value={formData.grantId}
              onChange={(e) => setFormData({ ...formData, grantId: e.target.value })}
              options={grants.map(g => ({ value: g.id, label: g.title }))}
            />
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingPR ? 'Update' : 'Create'} Payment Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      {viewingPR && (
        <Modal
          isOpen={!!viewingPR}
          onClose={() => setViewingPR(null)}
          title={`Payment Request #${viewingPR.prfNumber || viewingPR.id.slice(0, 8)}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${statusColors[viewingPR.approvalStatus]}`}>
                  {viewingPR.approvalStatus}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Amount</p>
                <p className="text-2xl font-bold text-green-600">${viewingPR.amount.toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Request Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Requestor</p>
                  <p className="font-medium">{viewingPR.requestor}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Department</p>
                  <p className="font-medium">{viewingPR.department}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Grant Aim</p>
                  <p className="font-medium">{viewingPR.grantAim}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Expense Type</p>
                  <p className="font-medium">{viewingPR.expenseType}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Vendor/Payee</p>
                  <p className="font-medium">{viewingPR.vendor}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Budget Category</p>
                  <p className="font-medium">{viewingPR.budgetCategory}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Request Date</p>
                  <p className="font-medium">{format(new Date(viewingPR.requestDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Purpose/Justification</h4>
              <p className="text-sm text-gray-700">{viewingPR.purpose}</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setViewingPR(null)}>
                Close
              </Button>
              {viewingPR.approvalStatus === 'pending' && (
                <>
                  <Button
                    variant="success"
                    onClick={() => {
                      handleApprove(viewingPR.id);
                      setViewingPR(null);
                    }}
                  >
                    <CheckCircle size={16} className="mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      handleReject(viewingPR.id);
                      setViewingPR(null);
                    }}
                  >
                    <XCircle size={16} className="mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PaymentRequests;
