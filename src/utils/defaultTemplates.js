// Pre-built template definitions for common form types

export const defaultTemplates = [
  {
    name: 'Grant Application Form',
    category: 'grant-application',
    description: 'Standard grant application template with project details, budget overview, and objectives',
    fields: [
      {
        id: 'project-title',
        label: 'Project Title',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'pi-name',
        label: 'Principal Investigator Name',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'institution',
        label: 'Institution/Organization',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'funding-agency',
        label: 'Funding Agency',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'amount-requested',
        label: 'Amount Requested ($)',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'project-period',
        label: 'Project Period',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'abstract',
        label: 'Project Abstract',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'specific-aims',
        label: 'Specific Aims',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'significance',
        label: 'Significance',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'innovation',
        label: 'Innovation',
        type: 'textarea',
        required: false,
        validation: {}
      }
    ]
  },
  {
    name: 'Progress Report',
    category: 'progress-report',
    description: 'Template for reporting project progress, milestones achieved, and upcoming activities',
    fields: [
      {
        id: 'report-period',
        label: 'Reporting Period',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'project-name',
        label: 'Project Name',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'grant-number',
        label: 'Grant Number',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'accomplishments',
        label: 'Major Accomplishments',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'milestones',
        label: 'Milestones Achieved',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'challenges',
        label: 'Challenges Encountered',
        type: 'textarea',
        required: false,
        validation: {}
      },
      {
        id: 'next-steps',
        label: 'Next Steps',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'budget-status',
        label: 'Budget Status',
        type: 'textarea',
        required: true,
        validation: {}
      }
    ]
  },
  {
    name: 'Budget Summary',
    category: 'budget-summary',
    description: 'Comprehensive budget summary with category breakdowns and justifications',
    fields: [
      {
        id: 'project-name',
        label: 'Project Name',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'total-budget',
        label: 'Total Budget ($)',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'personnel',
        label: 'Personnel Costs ($)',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'equipment',
        label: 'Equipment ($)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'travel',
        label: 'Travel ($)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'supplies',
        label: 'Supplies ($)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'other-direct',
        label: 'Other Direct Costs ($)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'indirect',
        label: 'Indirect Costs ($)',
        type: 'number',
        required: false,
        validation: { min: 0 }
      },
      {
        id: 'justification',
        label: 'Budget Justification',
        type: 'textarea',
        required: true,
        validation: {}
      }
    ]
  },
  {
    name: 'Payment Request Form',
    category: 'payment-request',
    description: 'Request form for processing payments and reimbursements',
    fields: [
      {
        id: 'requestor-name',
        label: 'Requestor Name',
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
        id: 'grant-project',
        label: 'Grant/Project Name',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'grant-number',
        label: 'Grant Number',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'vendor-name',
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
        id: 'category',
        label: 'Budget Category',
        type: 'select',
        required: true,
        options: ['Personnel', 'Equipment', 'Travel', 'Supplies', 'Other Direct Costs'],
        validation: {}
      },
      {
        id: 'purpose',
        label: 'Purpose of Payment',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'invoice-attached',
        label: 'Invoice Attached',
        type: 'checkbox',
        required: false,
        validation: {}
      }
    ]
  },
  {
    name: 'Meeting Report',
    category: 'meeting-report',
    description: 'Documentation template for meetings, including attendees, agenda, and action items',
    fields: [
      {
        id: 'meeting-title',
        label: 'Meeting Title',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'meeting-date',
        label: 'Meeting Date',
        type: 'date',
        required: true,
        validation: {}
      },
      {
        id: 'location',
        label: 'Location/Platform',
        type: 'text',
        required: false,
        validation: {}
      },
      {
        id: 'attendees',
        label: 'Attendees',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'agenda',
        label: 'Agenda',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'discussion-summary',
        label: 'Discussion Summary',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'decisions',
        label: 'Decisions Made',
        type: 'textarea',
        required: false,
        validation: {}
      },
      {
        id: 'action-items',
        label: 'Action Items',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'next-meeting',
        label: 'Next Meeting Date',
        type: 'date',
        required: false,
        validation: {}
      }
    ]
  },
  {
    name: 'Budget Justification',
    category: 'budget-justification',
    description: 'Detailed justification for budget items and expenditures',
    fields: [
      {
        id: 'project-title',
        label: 'Project Title',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'category',
        label: 'Budget Category',
        type: 'select',
        required: true,
        options: ['Personnel', 'Equipment', 'Travel', 'Supplies', 'Other Direct Costs', 'Indirect Costs'],
        validation: {}
      },
      {
        id: 'item-description',
        label: 'Item Description',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'cost',
        label: 'Total Cost ($)',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'justification',
        label: 'Justification',
        type: 'textarea',
        required: true,
        validation: {}
      },
      {
        id: 'relevance',
        label: 'Relevance to Project',
        type: 'textarea',
        required: true,
        validation: {}
      }
    ]
  },
  {
    name: 'Award Notification',
    category: 'notification',
    description: 'Template for notifying team members about grant awards',
    fields: [
      {
        id: 'recipient-name',
        label: 'Recipient Name',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'notification-date',
        label: 'Date',
        type: 'date',
        required: true,
        validation: {}
      },
      {
        id: 'grant-title',
        label: 'Grant Title',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'funding-agency',
        label: 'Funding Agency',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'award-amount',
        label: 'Award Amount ($)',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        id: 'project-period',
        label: 'Project Period',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'start-date',
        label: 'Project Start Date',
        type: 'date',
        required: true,
        validation: {}
      },
      {
        id: 'message',
        label: 'Additional Message',
        type: 'textarea',
        required: false,
        validation: {}
      }
    ]
  },
  {
    name: 'Rejection Notification',
    category: 'notification',
    description: 'Template for communicating grant rejection with constructive feedback',
    fields: [
      {
        id: 'recipient-name',
        label: 'Recipient Name',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'notification-date',
        label: 'Date',
        type: 'date',
        required: true,
        validation: {}
      },
      {
        id: 'grant-title',
        label: 'Grant Title',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'funding-agency',
        label: 'Funding Agency',
        type: 'text',
        required: true,
        validation: {}
      },
      {
        id: 'reviewer-comments',
        label: 'Reviewer Comments/Feedback',
        type: 'textarea',
        required: false,
        validation: {}
      },
      {
        id: 'next-steps',
        label: 'Recommended Next Steps',
        type: 'textarea',
        required: false,
        validation: {}
      },
      {
        id: 'resubmission-eligible',
        label: 'Eligible for Resubmission',
        type: 'checkbox',
        required: false,
        validation: {}
      }
    ]
  }
];
