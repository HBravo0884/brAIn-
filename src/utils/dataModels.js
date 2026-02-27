// Enhanced data models for RWJF grant management

/**
 * Enhanced Grant Model with Sub-Aims and KPIs
 */
export const createGrant = (data) => ({
  id: crypto.randomUUID(),
  title: data.title || '',
  fundingAgency: data.fundingAgency || '',
  amount: data.amount || 0,
  status: data.status || 'pending', // pending, active, completed, rejected
  startDate: data.startDate || '',
  endDate: data.endDate || '',
  // Enhanced fields
  grantNumber: data.grantNumber || '',
  principalInvestigator: data.principalInvestigator || '',
  institution: data.institution || 'Howard University College of Medicine',
  // Sub-aims structure
  aims: data.aims || [], // Array of Aim objects
  // Budget reference
  budgetId: data.budgetId || null,
  // Documents
  documents: data.documents || [],
  // Metadata
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Aim/Sub-Aim Model
 */
export const createAim = (data) => ({
  id: crypto.randomUUID(),
  number: data.number || '', // e.g., "Aim 1", "Aim 5"
  title: data.title || '',
  description: data.description || '',
  targetDate: data.targetDate || '',
  status: data.status || 'in-progress', // not-started, in-progress, completed
  // KPIs for this aim
  kpis: data.kpis || [], // Array of KPI objects
  // Milestones
  milestones: data.milestones || [], // Array of Milestone objects
  // Budget allocation
  budgetAllocation: data.budgetAllocation || 0,
  budgetSpent: data.budgetSpent || 0,
  // Completion tracking
  completionPercentage: data.completionPercentage || 0,
  // Metadata
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * KPI (Key Performance Indicator) Model
 */
export const createKPI = (data) => ({
  id: crypto.randomUUID(),
  name: data.name || '',
  description: data.description || '',
  targetValue: data.targetValue || '',
  currentValue: data.currentValue || '',
  unit: data.unit || '', // e.g., "participants", "percentage", "count"
  measurementFrequency: data.measurementFrequency || 'quarterly', // monthly, quarterly, annually
  // Progress
  percentComplete: data.percentComplete || 0,
  status: data.status || 'on-track', // on-track, at-risk, behind, completed
  // Tracking
  lastMeasured: data.lastMeasured || '',
  nextMeasurement: data.nextMeasurement || '',
  // History
  measurements: data.measurements || [], // Array of measurement objects
  // Metadata
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Milestone Model
 */
export const createMilestone = (data) => ({
  id: crypto.randomUUID(),
  title: data.title || '',
  description: data.description || '',
  targetDate: data.targetDate || '',
  completedDate: data.completedDate || null,
  completed: data.completed || false,
  status: data.status || 'pending', // pending, in-progress, completed, delayed
  // Dependencies
  dependencies: data.dependencies || [], // Array of milestone IDs
  // Metadata
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Payment Request Model
 */
export const createPaymentRequest = (data) => ({
  id: crypto.randomUUID(),
  prfNumber: data.prfNumber || '',
  requestDate: data.requestDate || new Date().toISOString(),
  requestor: data.requestor || '',
  // Grant/Aim link
  grantId: data.grantId || '',
  aimId: data.aimId || '',
  // Payment details
  expenseType: data.expenseType || '', // travel, gift-cards, equipment, etc.
  vendor: data.vendor || '',
  amount: data.amount || 0,
  budgetCategory: data.budgetCategory || '',
  purpose: data.purpose || '',
  // Approval workflow
  approvalStatus: data.approvalStatus || 'pending', // pending, approved, rejected, processing, completed
  approvals: data.approvals || [], // Array of approval objects
  // Documents
  invoiceAttached: data.invoiceAttached || false,
  documentIds: data.documentIds || [],
  // Metadata
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Approval Model
 */
export const createApproval = (data) => ({
  id: crypto.randomUUID(),
  approverName: data.approverName || '',
  approverRole: data.approverRole || '', // PI, Finance, Administrator
  status: data.status || 'pending', // pending, approved, rejected
  approvalDate: data.approvalDate || null,
  signature: data.signature || '',
  comments: data.comments || '',
  createdAt: new Date().toISOString(),
});

/**
 * Travel Request Model
 */
export const createTravelRequest = (data) => ({
  id: crypto.randomUUID(),
  travelerName: data.travelerName || '',
  travelerTitle: data.travelerTitle || '',
  department: data.department || '',
  // Grant/Aim link
  grantId: data.grantId || '',
  aimId: data.aimId || '',
  // Travel details
  conferenceName: data.conferenceName || '',
  location: data.location || '',
  departureDate: data.departureDate || '',
  returnDate: data.returnDate || '',
  // Cost breakdown
  estimatedAirfare: data.estimatedAirfare || 0,
  estimatedHotel: data.estimatedHotel || 0,
  estimatedMeals: data.estimatedMeals || 0,
  estimatedGround: data.estimatedGround || 0,
  estimatedRegistration: data.estimatedRegistration || 0,
  totalEstimated: data.totalEstimated || 0,
  // Justification
  businessPurpose: data.businessPurpose || '',
  // Approval workflow
  approvalStatus: data.approvalStatus || 'pending',
  approvals: data.approvals || [],
  // Related PRF
  prfId: data.prfId || null,
  // Metadata
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Gift Card Distribution Model
 */
export const createGiftCardDistribution = (data) => ({
  id: crypto.randomUUID(),
  distributionDate: data.distributionDate || new Date().toISOString(),
  // Participant info
  participantId: data.participantId || '',
  participantName: data.participantName || '',
  // Grant/Aim link
  grantId: data.grantId || '',
  aimId: data.aimId || '', // Usually Aim 5
  // Card details
  cardType: data.cardType || '',
  cardAmount: data.cardAmount || 0,
  cardNumberLast4: data.cardNumberLast4 || '',
  // Purpose
  purpose: data.purpose || '',
  milestone: data.milestone || '',
  // Distribution
  distributedBy: data.distributedBy || '',
  participantSignature: data.participantSignature || '',
  signatureDate: data.signatureDate || '',
  // Related PRF
  prfNumber: data.prfNumber || '',
  prfId: data.prfId || null,
  // Metadata
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Enhanced Budget Model with Category Details
 */
export const createBudget = (data) => ({
  id: crypto.randomUUID(),
  grantId: data.grantId || '',
  aimId: data.aimId || null, // Optional: budget can be aim-specific
  totalBudget: data.totalBudget || 0,
  // Categories with detailed tracking
  categories: data.categories || [
    {
      id: crypto.randomUUID(),
      name: 'Personnel',
      allocated: 0,
      spent: 0,
      committed: 0,
      entries: []
    },
    {
      id: crypto.randomUUID(),
      name: 'Travel',
      allocated: 0,
      spent: 0,
      committed: 0,
      entries: []
    },
    {
      id: crypto.randomUUID(),
      name: 'Gift Cards/Incentives',
      allocated: 0,
      spent: 0,
      committed: 0,
      entries: []
    },
    {
      id: crypto.randomUUID(),
      name: 'Equipment',
      allocated: 0,
      spent: 0,
      committed: 0,
      entries: []
    },
    {
      id: crypto.randomUUID(),
      name: 'Supplies',
      allocated: 0,
      spent: 0,
      committed: 0,
      entries: []
    },
    {
      id: crypto.randomUUID(),
      name: 'Other Direct Costs',
      allocated: 0,
      spent: 0,
      committed: 0,
      entries: []
    },
    {
      id: crypto.randomUUID(),
      name: 'Indirect Costs',
      allocated: 0,
      spent: 0,
      committed: 0,
      entries: []
    }
  ],
  // Metadata
  fiscalYear: data.fiscalYear || new Date().getFullYear(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Budget Entry Model
 */
export const createBudgetEntry = (data) => ({
  id: crypto.randomUUID(),
  description: data.description || '',
  amount: data.amount || 0,
  date: data.date || new Date().toISOString(),
  type: data.type || 'expense', // expense, commitment, adjustment
  status: data.status || 'pending', // pending, approved, paid
  // Links
  prfId: data.prfId || null,
  invoiceNumber: data.invoiceNumber || '',
  vendor: data.vendor || '',
  // Metadata
  enteredBy: data.enteredBy || '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
