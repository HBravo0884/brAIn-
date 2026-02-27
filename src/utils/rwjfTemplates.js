// RWJF-specific template definitions

export const rwjfTemplates = [
  {
    name: 'RWJF Payment Request Form (PRF)',
    category: 'payment-request',
    description: 'Standardized payment request form for RWJF grant expenses including travel, gift cards, and other direct costs',
    fields: [
      {
        id: 'prf-number',
        label: 'PRF Number',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'request-date',
        label: 'Request Date',
        type: 'date',
        required: true,
        validation: {}
      },
      {
        id: 'requestor-name',
        label: 'Requestor Name',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'department',
        label: 'Department',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'grant-aim',
        label: 'RWJF Grant Aim',
        type: 'select',
        required: true,
        options: ['Aim 1', 'Aim 2', 'Aim 3', 'Aim 4', 'Aim 5 - Re-Entry', 'Other'],
        validation: {}
      },
      {
        id: 'expense-type',
        label: 'Expense Type',
        type: 'select',
        required: true,
        options: ['Travel', 'Gift Cards', 'Equipment', 'Supplies', 'Participant Incentives', 'Personnel', 'Other Direct Costs'],
        validation: {}
      },
      {
        id: 'vendor-payee',
        label: 'Vendor/Payee Name',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'amount',
        label: 'Amount ($)',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'budget-category',
        label: 'Budget Category',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'purpose',
        label: 'Purpose/Justification',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'invoice-attached',
        label: 'Invoice/Receipt Attached',
        type: 'checkbox',
        required: false,
        validation: {}
      },
      {
        id: 'approval-status',
        label: 'Approval Status',
        type: 'select',
        required: false,
        options: ['Pending', 'Approved', 'Rejected', 'Processing'],
        validation: {}
      },
      {
        id: 'approver-name',
        label: 'Approver Name',
        type: 'text',
        required: false,
        validation: {}
      },
      {
        id: 'approval-date',
        label: 'Approval Date',
        type: 'date',
        required: false,
        validation: {}
      }
    ]
  },
  {
    name: 'RWJF Travel Authorization Form',
    category: 'travel-request',
    description: 'Travel request and authorization form for RWJF-funded conference and meeting attendance',
    fields: [
      {
        id: 'traveler-name',
        label: 'Traveler Name',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'traveler-title',
        label: 'Title/Position',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'department',
        label: 'Department',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'grant-aim',
        label: 'RWJF Grant Aim',
        type: 'select',
        required: true,
        options: ['Aim 1', 'Aim 2', 'Aim 3', 'Aim 4', 'Aim 5 - Re-Entry', 'Other'],
        validation: {}
      },
      {
        id: 'conference-name',
        label: 'Conference/Meeting Name',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'conference-location',
        label: 'Location (City, State)',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'departure-date',
        label: 'Departure Date',
        type: 'date',
        required: true,
        validation: {}
      },
      {
        id: 'return-date',
        label: 'Return Date',
        type: 'date',
        required: true,
        validation: {}
      },
      {
        id: 'estimated-airfare',
        label: 'Estimated Airfare ($)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'estimated-hotel',
        label: 'Estimated Hotel ($)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'estimated-meals',
        label: 'Estimated Meals ($)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'estimated-ground',
        label: 'Estimated Ground Transportation ($)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'estimated-registration',
        label: 'Conference Registration Fee ($)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'total-estimated',
        label: 'Total Estimated Cost ($)',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'business-purpose',
        label: 'Business Purpose/Justification',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'approval-status',
        label: 'Approval Status',
        type: 'select',
        required: false,
        options: ['Pending', 'Approved by PI', 'Approved by Finance', 'Final Approval', 'Rejected'],
        validation: {}
      },
      {
        id: 'pi-signature',
        label: 'PI/Supervisor Signature',
        type: 'text',
        required: false,
        validation: {}
      },
      {
        id: 'pi-signature-date',
        label: 'PI Signature Date',
        type: 'date',
        required: false,
        validation: {}
      },
      {
        id: 'finance-signature',
        label: 'Finance Approver',
        type: 'text',
        required: false,
        validation: {}
      },
      {
        id: 'finance-date',
        label: 'Finance Approval Date',
        type: 'date',
        required: false,
        validation: {}
      }
    ]
  },
  {
    name: 'Gift Card Distribution Log',
    category: 'gift-card-tracking',
    description: 'Track distribution of gift cards to participants for RWJF Aim 5 Re-Entry Program',
    fields: [
      {
        id: 'distribution-date',
        label: 'Distribution Date',
        type: 'date',
        required: true,
        validation: {}
      },
      {
        id: 'participant-id',
        label: 'Participant ID/Code',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'participant-name',
        label: 'Participant Name (if applicable)',
        type: 'text',
        required: false,
        validation: {}
      },
      {
        id: 'grant-aim',
        label: 'Grant Aim',
        type: 'select',
        required: true,
        options: ['Aim 5 - Re-Entry', 'Other'],
        validation: {}
      },
      {
        id: 'card-type',
        label: 'Gift Card Type',
        type: 'select',
        required: true,
        options: ['Visa', 'Mastercard', 'Amazon', 'Target', 'Walmart', 'Other'],
        validation: {}
      },
      {
        id: 'card-amount',
        label: 'Card Amount ($)',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'card-number-last4',
        label: 'Card Number (Last 4 digits)',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'purpose',
        label: 'Purpose/Milestone',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'distributed-by',
        label: 'Distributed By',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'participant-signature',
        label: 'Participant Signature/Acknowledgment',
        type: 'text',
        required: false,
        validation: {}
      },
      {
        id: 'signature-date',
        label: 'Signature Date',
        type: 'date',
        required: false,
        validation: {}
      },
      {
        id: 'prf-number',
        label: 'Related PRF Number',
        type: 'text',
        required: false,
        validation: {}
      }
    ]
  },
  {
    name: 'RWJF KPI Progress Report',
    category: 'progress-report',
    description: 'Key Performance Indicator progress report for RWJF grant aims',
    fields: [
      {
        id: 'reporting-period',
        label: 'Reporting Period',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'report-date',
        label: 'Report Date',
        type: 'date',
        required: true,
        validation: {}
      },
      {
        id: 'grant-aim',
        label: 'Grant Aim',
        type: 'select',
        required: true,
        options: ['Aim 1', 'Aim 2', 'Aim 3', 'Aim 4', 'Aim 5 - Re-Entry', 'Overall'],
        validation: {}
      },
      {
        id: 'kpi-name',
        label: 'KPI Name/Metric',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'target-value',
        label: 'Target Value',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'current-value',
        label: 'Current Value',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'percent-complete',
        label: 'Percent Complete (%)',
        type: 'number',
        required: true,
        validation: { min: 0, max: 100 }
      },
      {
        id: 'progress-summary',
        label: 'Progress Summary',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'milestones-achieved',
        label: 'Milestones Achieved',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'challenges',
        label: 'Challenges/Barriers',
        type: 'textarea',
        required: false,
        validation: {}
      },
      {
        id: 'mitigation-strategies',
        label: 'Mitigation Strategies',
        type: 'textarea',
        required: false,
        validation: {}
      },
      {
        id: 'next-period-goals',
        label: 'Goals for Next Period',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'budget-impact',
        label: 'Budget Impact/Concerns',
        type: 'textarea',
        required: false,
        validation: {}
      }
    ]
  },
  {
    name: 'RWJF Aim Budget Justification',
    category: 'budget-justification',
    description: 'Detailed budget justification for specific RWJF grant aim expenses',
    fields: [
      {
        id: 'grant-aim',
        label: 'Grant Aim',
        type: 'select',
        required: true,
        options: ['Aim 1', 'Aim 2', 'Aim 3', 'Aim 4', 'Aim 5 - Re-Entry', 'Administrative'],
        validation: {}
      },
      {
        id: 'budget-period',
        label: 'Budget Period',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'category',
        label: 'Budget Category',
        type: 'select',
        required: true,
        options: ['Personnel', 'Travel', 'Gift Cards/Incentives', 'Equipment', 'Supplies', 'Other Direct Costs', 'Indirect Costs'],
        validation: {}
      },
      {
        id: 'item-description',
        label: 'Item/Expense Description',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'total-cost',
        label: 'Total Cost ($)',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'cost-breakdown',
        label: 'Cost Breakdown/Calculation',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'justification',
        label: 'Justification',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'relevance-to-aim',
        label: 'Relevance to Aim Objectives',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'kpi-impact',
        label: 'Expected Impact on KPIs',
        type: 'textarea',
        required: false,
        validation: {}
      },
      {
        id: 'alternative-considered',
        label: 'Alternatives Considered',
        type: 'textarea',
        required: false,
        validation: {}
      }
    ]
  }
];
