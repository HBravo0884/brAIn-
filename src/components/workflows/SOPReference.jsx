import { useState } from 'react';
import {
  CreditCard, ShoppingCart, Plane, Gift, GraduationCap, FileText,
  AlertTriangle, Users, Clock, Shield, BookOpen, ChevronDown, ChevronRight,
  CheckCircle, XCircle, AlertCircle, DollarSign, Phone, Mail
} from 'lucide-react';

// ── Data ─────────────────────────────────────────────────────────────────────

const GRANT = 'GRT000937';

const personnel = [
  { name: 'Dr. Marjorie Gondré-Lewis', role: 'Principal Investigator', abbr: 'MGL', emoji: '🔬', color: 'bg-blue-700', note: 'Mandatory FIRST signature on all documents' },
  { name: 'Héctor Bravo-Rivera', role: 'Program Director · Central Coordinator', abbr: 'You', emoji: '🧑‍💼', color: 'bg-blue-500', note: 'Owns P-Card, Travel coordination, Aim 5 PRFs' },
  { name: 'Dr. John Stubbs', role: 'Dir. of Medical Student Research', abbr: 'JRS', emoji: '🏥', color: 'bg-teal-600', note: 'Co-signs HUCM Student Application (Travel only)' },
  { name: 'Sam Gaisie', role: 'Assoc. Dean of Finance · Cost Center Manager', abbr: 'SG', emoji: '📊', color: 'bg-blue-800', note: 'Step 2 Workday approver for Travel SA; Dean\'s Office fiscal tracking' },
  { name: 'Nichelle Brooks', role: 'Post-Award · Grant Manager', abbr: 'NB', emoji: '💼', color: 'bg-indigo-600', note: 'Reviews allowability; final Workday SA approver for travel' },
  { name: 'Anjanette Antonio', role: 'Procurement', abbr: 'AA', emoji: '🏛', color: 'bg-purple-600', note: 'Procurement method approval (Workflow B); P-Card issues & loading' },
  { name: 'Kisha Riddick', role: 'Aim 5 Sub-Accounts', abbr: 'KR', emoji: '🏦', color: 'bg-yellow-600', note: 'Specialized signer for Aim 5 Sub-Account transactions (Workflow D only)' },
  { name: 'CBT (Christopherson Business Travel)', role: 'University Travel Agency', abbr: 'CBT', emoji: '✈️', color: 'bg-teal-500', note: 'Only authorized agency. Books flights & hotels after SA approval.' },
];

const thresholds = [
  { range: '$0 – $2,500', label: 'Micro-purchase', route: 'P-Card (Workflow A)', velocity: 'Fast', color: 'bg-green-100 text-green-800 border-green-300' },
  { range: '$2,500 – $10K', label: 'Standard — price justification', route: 'Workday Req (Workflow B)', velocity: 'Standard', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { range: '$10K+', label: '3-QUOTE RULE required', route: 'Workday Req + 3 quotes', velocity: 'Stop & collect quotes', color: 'bg-red-100 text-red-800 border-red-300' },
  { range: '$25K', label: 'Pre-Award / Subaward F&A Cap', route: 'Check with Nichelle Brooks', velocity: 'Oversight needed', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { range: '$50K+', label: 'Controller approval required', route: 'Escalate to Controller', velocity: 'High latency', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { range: '$100K+', label: 'General Counsel review', route: 'Legal review required', velocity: 'High latency', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

const swimlane = [
  {
    person: 'Dr. John Stubbs',
    role: 'Dir. Med. Student Research',
    emoji: '🏥',
    wfA: null,
    wfB: null,
    wfC: ['P1: Reviews academic merit of travel request', 'P1: Co-signs HUCM Student Application alongside MGL — must sign before Workday SA is initiated'],
    wfD: null,
  },
  {
    person: 'Héctor (You)',
    role: 'Program Director · Central Coordinator',
    emoji: '🧑‍💼',
    wfA: [
      'Setup: Submit JP Morgan application + Transfer of Funds form (signed by Nichelle) to Anjanette Antonio. Wait 7–10 days.',
      'Verify item is allowable and under $2,500',
      'Provide Tax Exemption Certificate (DC/MD/VA) to vendor at point of sale',
      'Ship to Howard address ONLY — never residential',
      'Save itemized receipt + packing slip. Upload to PaymentNet by 15th with business purpose + Worktag GRT000937',
    ],
    wfB: [
      'Create Workday req — Worktag GRT000937, CC1500',
      'Select Punchout (known vendor) or Non-Catalog',
      'Execute "Create Receipt" immediately on delivery',
    ],
    wfC: [
      'P1: Collect fully signed HUCM Application packet (T−60 days)',
      'P2: Initiate Workday SA — add Airfare + Hotel lines, attach packet (T−30 days)',
      'P3: Receive auto-email PDF from HU Travel → call CBT with SA number',
      'P4: Submit PRF for non-employee incidentals → apgrants@howard.edu',
    ],
    wfD: [
      'Prepare Revised PRF — Spend Category: "Participant Support Costs"',
      'Attach Budget Justification Memo',
      'Route chain; track ticket # with Sam Gaisie',
    ],
  },
  {
    person: 'Dr. Gondré-Lewis',
    role: 'PI · First Signer',
    emoji: '🔬',
    wfA: null,
    wfB: ['Mandatory FIRST signature on all requisition documents'],
    wfC: ['P1: Co-signs HUCM Student Application (with Dr. Stubbs)', 'P2: Step 1 (first) electronic approval in Workday SA', 'P4: Physically signs PRFs for non-employee reimbursements'],
    wfD: ['Mandatory FIRST signature on all PRF documents'],
  },
  {
    person: 'Sam Gaisie',
    role: 'Assoc. Dean of Finance · Cost Ctr Mgr',
    emoji: '📊',
    wfA: null,
    wfB: null,
    wfC: ['P2: Step 2 approver in Workday Spend Authorization (financial allocation)'],
    wfD: ['Dean\'s Office fiscal tracking — ticket numbers for Aim 5 payments'],
  },
  {
    person: 'Nichelle Brooks',
    role: 'Post-Award · Grant Manager',
    emoji: '💼',
    wfA: ['Signs Transfer of Funds Form to load P-Card'],
    wfB: ['Reviews for budget alignment & allowability'],
    wfC: ['P2: Step 3 (final) compliance approval in Workday SA — triggers auto-email to Héctor'],
    wfD: ['Reviews for budget alignment & allowability'],
  },
  {
    person: 'Anjanette Antonio',
    role: 'Procurement',
    emoji: '🏛',
    wfA: null,
    wfB: ['Approves procurement method (Punchout vs. Non-Catalog)'],
    wfC: null,
    wfD: null,
  },
  {
    person: 'Kisha Riddick',
    role: 'Aim 5 Sub-Accounts',
    emoji: '🏦',
    wfA: null,
    wfB: null,
    wfC: null,
    wfD: ['Specialized signer for Aim 5 Sub-Account transactions'],
  },
];

const escalationSteps = [
  {
    question: 'P-Card declined, won\'t load, or rejected in PaymentNet?',
    contact: 'Anjanette Antonio',
    role: 'P-Card Program Admin & Procurement',
    anchor: 'RE: [P-Card] – [GRT000937] – [Aim 4]',
    tip: 'Check PaymentNet first to identify the specific error before emailing.',
    color: 'blue',
  },
  {
    question: 'Workday requisition stalled or stuck?',
    contact: 'Anjanette Antonio',
    role: 'Procurement',
    anchor: 'RE: [Supplies] – [GRT000937] – [Aim #]',
    tip: 'Check "My Requisitions" in Workday first to identify where it\'s stuck, then contact with the requisition ID.',
    color: 'blue',
  },
  {
    question: 'Student Travel or Spend Authorization stalled?',
    contact: 'Nudge the specific stuck approver',
    role: 'Check SA "Process History" in Workday',
    anchor: 'RE: [Travel] – [GRT000937] – [Aim #]',
    tip: 'Stuck with MGL → direct reminder. Stuck with Sam Gaisie or Nichelle → polite nudge after 48 hrs. CBT issue → call CBT or use CBT AirPortal.',
    color: 'teal',
  },
  {
    question: 'Aim 5 stipend, sub-account, or PRF issue?',
    contact: 'Kisha Riddick + Sam Gaisie (Dean\'s Office)',
    role: 'Aim 5 Sub-Accounts + Cost Center Manager',
    anchor: 'RE: [Participant Support] – [GRT000937] – [Aim 5]',
    tip: 'Kisha handles sub-account setup and specialized signing. Sam Gaisie tracks ticket numbers — no payment should be lost.',
    color: 'yellow',
  },
  {
    question: 'Budget, balance, or allowability question?',
    contact: 'Nichelle Brooks',
    role: 'Post-Award / Grant Manager',
    anchor: 'RE: [Budget] – [GRT000937] – [Aim #]',
    tip: 'Nichelle interprets Budget vs. Actuals, reviews allowability, advises on RWJF compliance.',
    color: 'indigo',
  },
  {
    question: 'Unknown issue / doesn\'t fit above?',
    contact: 'Nichelle Brooks (start here)',
    role: 'Broadest grant oversight — can route to right office',
    anchor: 'RE: [General] – [GRT000937] – [Aim #]',
    tip: 'Emmanuel Jean for digital/web needs.',
    color: 'gray',
  },
];

const recipes = [
  {
    id: 'pcard',
    emoji: '💳',
    title: 'P-Card: Issuance, Purchases & Monthly Reconciliation',
    label: 'Recipe 01 · Workflow A · DBC',
    color: 'bg-blue-700',
    wide: true,
    sections: [
      {
        phase: 'Phase 1 — Load Funds',
        note: 'Before every new purchasing cycle',
        steps: [
          'Fill out the Transfer of Funds Request Form — specify the dollar amount to move from GRT000937 onto the P-Card.',
          'Email form to Nichelle Brooks for approval and signature (she verifies available, allowable funds).',
          'Email the signed form to Anjanette Antonio to process the fund transfer.',
          'Confirm card balance in PaymentNet before beginning any purchases. The card is $0 until this step is complete.',
        ],
      },
      {
        phase: 'Phase 2 — Making Purchases',
        note: 'Every purchase',
        steps: [
          'Verify item is on the Allowable Commodities list. If not, use Workday Req instead.',
          'Confirm total is $2,500 or less. If over, use Workday Req — do NOT split the purchase.',
          'Present the Tax Exemption Certificate (DC, MD, or VA) to vendor at point of sale.',
          'Ship tangible goods to a Howard University address only. Never to a residential address.',
          'Retain itemized receipt + packing slip immediately — must show line items and proof of delivery.',
        ],
      },
      {
        phase: 'Phase 3 — Monthly Reconciliation in PaymentNet',
        note: 'DEADLINE: 15th of the month',
        deadline: true,
        steps: [
          'Log into JP Morgan PaymentNet. Pull all transactions from the previous month.',
          'For every transaction: upload the itemized receipt (and packing slip if applicable).',
          'Enter a clear Business Purpose. Example: "Food supplies for Aim 4 pantry operations for RWJF Grant."',
          'Allocate each transaction to Worktag GRT000937.',
          'Submit reconciled statement by the 15th. Routes to Sam Gaisie for final review.',
        ],
        warning: 'Missing the 15th deadline triggers warning emails and your credit limit will be reduced to $1 — effectively disabling the card.',
      },
    ],
    warnings: ['Never split a single purchase into multiple transactions to stay under $2,500. This is a severe compliance violation.'],
  },
  {
    id: 'workday',
    emoji: '📋',
    title: 'Submit a Workday Requisition',
    label: 'Recipe 02 · Workflow B',
    color: 'bg-blue-600',
    needs: ['Workday access', 'Worktag: GRT000937', 'Cost Center: CC1500', '3 vendor quotes (if ≥$10K)'],
    steps: [
      'If ≥$10,000: collect 3 vendor quotes first. Attach to requisition.',
      'Open Workday. Select Punchout (known vendor) or Non-Catalog (specialized).',
      'Enter Driver Worktag: GRT000937 and Cost Center: CC1500.',
      'Submit. Routes to Anjanette Antonio for procurement approval.',
      'When item delivered: immediately execute "Create Receipt" in Workday.',
    ],
    warnings: ['"Create Receipt" must happen the moment the item arrives — every day of delay risks vendor delinquency.'],
  },
  {
    id: 'faculty-travel',
    emoji: '✈️',
    title: 'Faculty / Staff Travel Request',
    label: 'Recipe 03 · Workflow C',
    color: 'bg-teal-700',
    needs: ['Travel dates + destination', 'Workday access', 'SA ID number', 'CBT access', 'GSA rate table'],
    steps: [
      'Confirm travel date is ≥30 days away. If not, contact Sam Gaisie or Nichelle immediately.',
      'Submit Spend Authorization (SA) in Workday. Approval chain: MGL → Sam Gaisie → Nichelle Brooks.',
      'Monitor SA Process History. Nudge after 48 hrs of inactivity at any step.',
      'After Nichelle approves: HU Travel Office auto-emails you the approved PDF. Record SA number.',
      'Book via CBT only — provide SA number. Use phone or CBT AirPortal.',
      'Post-travel: submit Expense Report with GSA rate docs + Google Maps mileage printout.',
    ],
    warnings: ['No SA ID = no booking. CBT is the ONLY authorized travel agency.'],
  },
  {
    id: 'aim5',
    emoji: '🎁',
    title: 'Issue an Aim 5 Stipend or Gift Card',
    label: 'Recipe 04 · Workflow D',
    color: 'bg-yellow-600',
    needs: ['Revised PRF (2025)', 'Budget Justification Memo', 'Kisha Riddick availability', 'Sam Gaisie · Dean\'s Office'],
    steps: [
      'Confirm this is strictly an Aim 5 expense (stipend or participant gift card).',
      'Prepare Revised PRF (2025 version). Spend Category: "Participant Support Costs."',
      'Write and attach Budget Justification Memo — prevents AP follow-up delays.',
      'Route: Dr. Gondré-Lewis → Nichelle Brooks → Kisha Riddick (Aim 5 Sub-Account).',
      'Coordinate with Sam Gaisie (Dean\'s Office) to track ticket number.',
    ],
    tips: ['"Participant Support Costs" keeps payments F&A tax exempt — wrong category loses this benefit permanently.'],
  },
  {
    id: 'student-travel',
    emoji: '🎓',
    title: 'Process Student Conference Travel Under RWJF',
    label: 'Recipe 09 · Workflow C — Student Travel',
    color: 'bg-teal-800',
    wide: true,
    needs: ['HUCM Student Application', 'Conference Invitation/Acceptance Letter', 'Student Abstract', 'Flight + Hotel Screenshots', 'Workday access', 'SA ID number', 'CBT access / AirPortal', 'Revised PRF 2025 (non-employee only)'],
    sections: [
      {
        phase: 'Phase 1 — Pre-Approval & Documentation',
        note: 'T−60 Days',
        steps: [
          'Student submits completed HUCM Student Application with: abstract, conference invitation/acceptance, and screenshots of preferred flights and hotels.',
          'Route to Dr. John Stubbs for academic merit review and signature.',
          'Route to Dr. Gondré-Lewis (MGL) for PI signature. Both signatures required before initiating Workday SA.',
        ],
      },
      {
        phase: 'Phase 2 — Workday Spend Authorization',
        note: 'T−30 Days',
        steps: [
          'In Workday, search "Create Spend Authorization." Enter travel dates and business purpose.',
          'Add separate lines for Airfare and Hotel using amounts from student\'s screenshots.',
          'Upload the fully signed HUCM Application packet (quotes + abstract) as required attachment.',
          'Submit. Monitor "Process History" tab. Approval chain: MGL → Sam Gaisie → Nichelle Brooks.',
          'If sitting at any step for 48+ hours, send a polite nudge email using the Cognitive Anchor format.',
        ],
      },
      {
        phase: 'Phase 3 — Book the Travel',
        note: 'Immediately after Workday approval',
        steps: [
          'Once Nichelle approves, the HU Travel Office automatically emails you an approved PDF. This is your green light.',
          'Contact Christopherson Business Travel (CBT) by phone or via the CBT AirPortal.',
          'Provide CBT with the SA number (e.g., SA018400) + student\'s flight/hotel screenshots. CBT purchases directly — student never pays.',
        ],
      },
      {
        phase: 'Phase 4 — Reimburse Incidentals',
        note: 'Post-travel: registration, ground transport, etc.',
        steps: [],
        split: {
          left: {
            label: 'Active Student Employee',
            color: 'bg-green-50 border-green-300',
            labelColor: 'text-green-700',
            steps: ['Student logs into Workday', 'Submits an "Expense Report"', 'Links report to the Spend Authorization number'],
          },
          right: {
            label: 'Non-Employee Student',
            color: 'bg-yellow-50 border-yellow-300',
            labelColor: 'text-yellow-700',
            steps: ['Complete Revised PRF (2025) — check "Student Travel Reimbursement"', 'Attach all receipts. Get MGL to physically sign.', 'Email single PDF packet to apgrants@howard.edu'],
          },
        },
      },
    ],
    warnings: ['Students must NEVER pay for flights or hotels out of pocket. CBT must book directly — there is no reimbursement path for these items.'],
    tips: ['Confirm student employment status (active employee vs. non-employee) before starting Phase 4 — the two tracks use completely different systems and paperwork.'],
  },
  {
    id: 'quotes',
    emoji: '📊',
    title: 'Collect 3 Vendor Quotes ($10K+)',
    label: 'Recipe 05 · Compliance',
    color: 'bg-red-600',
    steps: [
      'Identify item. Write clear specifications to send to vendors.',
      'Contact at least 3 distinct vendors. Request formal written quotes.',
      'Await all 3 responses on vendor letterhead or formal email.',
      'Compare quotes and document your selection rationale.',
      'Attach all 3 quotes to Workday requisition before submitting.',
    ],
    warnings: ['Submitting ≥$10K without 3 quotes will be rejected — hard compliance stop.'],
  },
  {
    id: 'stall',
    emoji: '🚨',
    title: 'Respond to a Stalled Payment',
    label: 'Recipe 07 · Escalation',
    color: 'bg-red-700',
    steps: [
      'Check "My Requisitions" or SA "Process History" in Workday — identify exactly where it\'s stuck.',
      'P-Card stall → contact Anjanette Antonio directly with the specific error from PaymentNet.',
      'Workday stall → contact Anjanette with the requisition ID.',
      'Travel SA stall → nudge the specific stuck approver (check Process History to see who).',
      'Aim 5 PRF stall → contact Kisha Riddick and Sam Gaisie simultaneously.',
      'Use the Cognitive Anchor email format: RE: [Category] – [GRT000937] – [Aim #].',
    ],
    tips: ['The Cognitive Anchor format in the RE: line guarantees a 24-hour response turnaround.'],
  },
];

const standingRules = [
  { icon: '⛔', title: 'Never Split P-Card Charges', desc: 'Splitting one purchase into smaller amounts to avoid the $2,500 limit is a severe compliance violation with RWJF and the university.', tag: 'Audit Risk' },
  { icon: '🎓', title: 'Students Never Pay Flights/Hotels', desc: 'University policy requires flights and hotels to be booked directly via CBT. Students must NOT pay out of pocket — there is no reimbursement path for these items.', tag: 'University Books Directly' },
  { icon: '📧', title: 'Always Use the Cognitive Anchor', desc: 'Every gatekeeper email must use the RE: line format to guarantee a 24-hour response.', tag: '[Category] – [GRT000937] – [Aim #]' },
  { icon: '📎', title: 'Attach Budget Memo to Every PRF', desc: 'A Budget Justification Memo proactively eliminates AP "Allowability" queries, reducing the approval cycle by several days.', tag: 'No Memo = Delay' },
  { icon: '💼', title: 'PI Signs First — Always', desc: 'Dr. Gondré-Lewis must be the first signature on every document, including travel applications. No downstream signatory can sign before her.', tag: 'Non-Negotiable' },
  { icon: '🏷', title: 'F&A Exemption — Aim 5 Only', desc: '"Participant Support Costs" spend category keeps Aim 5 stipends/gift cards F&A tax exempt. The wrong category loses this benefit permanently.', tag: 'Category Must Be Exact' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
        active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function SectionHeader({ number, label, title }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-blue-700">
      <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">{number}</div>
      <div>
        <div className="text-xs font-mono text-red-600 uppercase tracking-widest">{label}</div>
        <div className="font-bold text-blue-800 text-lg leading-tight">{title}</div>
      </div>
    </div>
  );
}

function StepList({ steps, color = 'bg-blue-600', numbered = true }) {
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
          {numbered ? (
            <span className={`${color} text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>{i + 1}</span>
          ) : (
            <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
          )}
          {step}
        </li>
      ))}
    </ol>
  );
}

function PhaseCard({ phase, note, steps, deadline, warning, split }) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden mb-3 last:mb-0">
      <div className="bg-teal-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
        <span className="bg-teal-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{phase.split(' ')[1]}</span>
        <span className="text-sm font-bold text-teal-800">{phase}</span>
        {note && <span className={`ml-auto text-xs font-medium ${deadline ? 'text-red-600 font-bold' : 'text-teal-600'}`}>{note}</span>}
      </div>
      <div className="p-4 bg-white">
        {steps.length > 0 && <StepList steps={steps} />}
        {split && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[split.left, split.right].map((track, i) => (
              <div key={i} className={`rounded-lg border p-3 ${track.color}`}>
                <div className={`font-bold text-sm mb-2 ${track.labelColor}`}>{track.label}</div>
                <StepList steps={track.steps} color="bg-green-600" />
              </div>
            ))}
          </div>
        )}
        {warning && (
          <div className="mt-3 bg-red-50 border-l-3 border-red-500 border rounded-r px-3 py-2 text-xs text-red-800 font-semibold">
            ⚠ {warning}
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeCard({ recipe }) {
  const [open, setOpen] = useState(false);
  const hasPhases = !!recipe.sections;

  return (
    <div className={`rounded-xl border-1.5 border-gray-200 overflow-hidden shadow-sm ${recipe.wide ? 'col-span-2' : ''}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-5 py-4 ${recipe.color} text-white text-left`}
      >
        <span className="text-2xl">{recipe.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono opacity-70 uppercase tracking-wider">{recipe.label}</div>
          <div className="font-bold text-base leading-tight">{recipe.title}</div>
        </div>
        {open ? <ChevronDown size={18} className="opacity-70 flex-shrink-0" /> : <ChevronRight size={18} className="opacity-70 flex-shrink-0" />}
      </button>

      {open && (
        <div className="p-5 bg-white space-y-4">
          {recipe.needs && (
            <div>
              <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">You'll Need</div>
              <div className="flex flex-wrap gap-2">
                {recipe.needs.map((n, i) => (
                  <span key={i} className="bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs text-gray-600">{n}</span>
                ))}
              </div>
            </div>
          )}

          {hasPhases ? (
            <div>
              {recipe.sections.map((sec, i) => (
                <PhaseCard key={i} {...sec} />
              ))}
            </div>
          ) : recipe.steps ? (
            <div>
              <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Steps</div>
              <StepList steps={recipe.steps} />
            </div>
          ) : null}

          {recipe.warnings?.map((w, i) => (
            <div key={i} className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-800 font-semibold flex gap-2">
              <span>⛔</span> {w}
            </div>
          ))}
          {recipe.tips?.map((t, i) => (
            <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-800 flex gap-2">
              <span>💡</span> {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab views ─────────────────────────────────────────────────────────────────

function SwimlanetView() {
  const wfCols = [
    { key: 'wfA', label: 'Workflow A', sub: 'P-Card · <$2,500', color: 'bg-blue-700' },
    { key: 'wfB', label: 'Workflow B', sub: 'Workday Req · >$3K', color: 'bg-blue-600' },
    { key: 'wfC', label: 'Workflow C ✦', sub: 'Travel · 4-Phase SOP', color: 'bg-teal-700' },
    { key: 'wfD', label: 'Workflow D', sub: 'Direct Payments · Aim 5', color: 'bg-yellow-600' },
  ];

  return (
    <div>
      <SectionHeader number="1" label="Map 1 · Swimlane" title="Who Does What — All 4 Workflows" />
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full min-w-[700px] text-sm border-collapse">
          <thead>
            <tr>
              <th className="bg-blue-800 text-white text-left px-4 py-3 w-40 font-semibold">Person</th>
              {wfCols.map(col => (
                <th key={col.key} className={`${col.color} text-white text-center px-4 py-3 font-semibold`}>
                  <div>{col.label}</div>
                  <div className="text-xs opacity-70 font-normal font-mono">{col.sub}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {swimlane.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="bg-blue-800 text-white px-4 py-3 align-top">
                  <div className="font-bold text-sm leading-tight">{row.emoji} {row.person}</div>
                  <div className="text-xs text-blue-200 mt-1 italic">{row.role}</div>
                </td>
                {wfCols.map(col => (
                  <td key={col.key} className="px-3 py-3 align-top border border-gray-100">
                    {row[col.key] ? (
                      <ul className="space-y-1.5">
                        {row[col.key].map((item, ii) => (
                          <li key={ii} className="flex items-start gap-1.5 text-xs text-gray-700 leading-relaxed">
                            <span className="text-blue-500 flex-shrink-0 mt-0.5">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-400 italic">— Not involved</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeadlinesView() {
  const monthlyDeadlines = [
    {
      when: '15th',
      unit: 'of month',
      title: 'PaymentNet P-Card Reconciliation',
      badge: 'DEADLINE',
      badgeColor: 'bg-red-500',
      desc: 'Log into PaymentNet. Upload itemized receipt + packing slip for every transaction. Enter business purpose. Allocate to Worktag GRT000937.',
      warning: 'Missing this deadline = warning emails + credit limit reduced to $1.',
      owner: 'Héctor · Reviewer: Sam Gaisie · Tool: JP Morgan PaymentNet',
      color: 'bg-red-50 border-red-200',
    },
    {
      when: 'Setup',
      unit: 'one-time',
      title: 'P-Card Fund Loading',
      badge: 'ONGOING',
      badgeColor: 'bg-teal-500',
      desc: 'To reload funds: submit Transfer of Funds Request Form (signed by Nichelle Brooks) to Anjanette Antonio. Initial issuance: allow 7–10 business days.',
      owner: 'Héctor → Nichelle (sign) → Anjanette Antonio (process)',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      when: 'Daily',
      unit: '',
      title: 'PaymentNet Daily Check',
      desc: 'Maintain daily compliance in PaymentNet. Reconcile charges every day to catch discrepancies early.',
      owner: 'Héctor · Tool: PaymentNet',
      color: 'bg-gray-50 border-gray-200',
    },
    {
      when: 'Daily',
      unit: '',
      title: 'Workday Dashboard Check',
      desc: 'Monitor "My Requisitions" and "Budget vs. Actuals" to track GRT000937 health.',
      owner: 'Héctor · Tool: Workday',
      color: 'bg-green-50 border-green-200',
    },
    {
      when: 'ASAP',
      unit: '',
      title: '"Create Receipt" on Delivery',
      desc: 'Execute in Workday the moment a Workflow B order arrives. Every day of delay = vendor delinquency risk.',
      owner: 'Héctor · Tool: Workday',
      color: 'bg-yellow-50 border-yellow-200',
    },
  ];

  const travelTimeline = [
    { when: 'T−60', unit: 'days', phase: 'Phase 1 · Collect HUCM Packet', desc: 'Student submits HUCM Application with abstract, invitation letter, flight/hotel screenshots. Route to Dr. Stubbs + MGL for co-signatures.', color: 'bg-teal-50 border-teal-200' },
    { when: 'T−30', unit: 'days', phase: 'Phase 2 · Workday Spend Authorization', desc: 'Initiate SA with Airfare + Hotel lines, attach packet. Chain: MGL → Sam Gaisie → Nichelle Brooks. Nudge after 48 hrs of inactivity.', color: 'bg-green-50 border-green-200' },
    { when: 'After SA', unit: '', phase: 'Phase 3 · Book via CBT', desc: "Nichelle's approval triggers auto-email PDF from HU Travel Office. Call CBT with SA number + screenshots.", color: 'bg-blue-50 border-blue-200' },
    { when: 'Post', unit: 'travel', phase: 'Phase 4 · Reimburse Incidentals', desc: 'Employee → Workday Expense Report linked to SA. Non-employee → Revised PRF (MGL-signed) to apgrants@howard.edu.', color: 'bg-yellow-50 border-yellow-200' },
  ];

  return (
    <div>
      <SectionHeader number="2" label="Map 2 · Deadline Calendar" title="All Recurring Deadlines & Time Rules" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <div className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2"><Clock size={16} /> Monthly Recurring Deadlines</div>
          <div className="space-y-3">
            {monthlyDeadlines.map((d, i) => (
              <div key={i} className={`rounded-lg border p-3 flex items-start gap-3 ${d.color}`}>
                <div className="text-center flex-shrink-0 min-w-[52px]">
                  <div className="text-xl font-black text-gray-800">{d.when}</div>
                  {d.unit && <div className="text-xs font-bold text-gray-500 uppercase">{d.unit}</div>}
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                    {d.title}
                    {d.badge && <span className={`${d.badgeColor} text-white text-xs px-2 py-0.5 rounded font-mono`}>{d.badge}</span>}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 leading-relaxed">{d.desc}</div>
                  {d.warning && <div className="text-xs text-red-700 font-bold mt-1">⚠ {d.warning}</div>}
                  <div className="text-xs text-gray-400 mt-1 font-mono">{d.owner}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-teal-800 mb-3 flex items-center gap-2"><Plane size={16} /> Student Travel Timeline</div>
          <div className="space-y-3">
            {travelTimeline.map((t, i) => (
              <div key={i} className={`rounded-lg border p-3 flex items-start gap-3 ${t.color}`}>
                <div className="text-center flex-shrink-0 min-w-[52px]">
                  <div className="text-lg font-black text-gray-800">{t.when}</div>
                  {t.unit && <div className="text-xs font-bold text-gray-500 uppercase">{t.unit}</div>}
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-800">{t.phase}</div>
                  <div className="text-xs text-gray-600 mt-1 leading-relaxed">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-mono text-red-600 uppercase tracking-wider mb-3">Standing Rules — Apply at All Times</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {standingRules.map((r, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">{r.icon}</div>
              <div className="font-bold text-sm text-blue-800 mb-1">{r.title}</div>
              <div className="text-xs text-gray-600 leading-relaxed mb-2">{r.desc}</div>
              <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold inline-block">{r.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComplianceView() {
  const signatoryChain = [
    { num: 1, name: 'Dr. Marjorie Gondré-Lewis', role: 'Principal Investigator', note: 'Mandatory FIRST signature — all documents, no exceptions', color: 'bg-blue-700' },
    { num: 2, name: 'Dr. John Stubbs', role: 'Dir. of Medical Student Research', note: 'Co-signs HUCM Student Application — Travel (Workflow C) only', color: 'bg-teal-600', badge: 'Travel Only' },
    { num: 3, name: 'Nichelle Brooks', role: 'Post-Award · Grant Manager', note: 'Reviews allowability; final Workday SA approver for travel', color: 'bg-blue-700' },
    { num: 4, name: 'Anjanette Antonio', role: 'Procurement', note: 'Approves procurement method — Workflow B only', color: 'bg-purple-700', badge: 'Workflow B' },
    { num: 5, name: 'Kisha Riddick', role: 'Aim 5 Sub-Accounts', note: 'Specialized signer — Workflow D only', color: 'bg-yellow-600', badge: 'Workflow D' },
    { num: 6, name: 'Sam Gaisie', role: 'Assoc. Dean of Finance · Cost Center Manager', note: 'Step 2 Workday approver for Travel SA; Dean\'s Office fiscal tracking', color: 'bg-blue-800', badge: 'Travel SA' },
  ];

  const breakGlass = [
    { problem: 'P-Card declined', contact: 'Anjanette Antonio' },
    { problem: 'Requisition stalled', contact: 'Anjanette Antonio' },
    { problem: 'Travel SA stuck >48 hrs', contact: 'Nudge specific approver' },
    { problem: 'Sub-account setup', contact: 'Kisha Riddick' },
    { problem: 'Aim 5 payment lost in queue', contact: 'Sam Gaisie (Dean\'s Office)' },
    { problem: 'Budget questions', contact: 'Nichelle Brooks' },
    { problem: 'Digital / web needs', contact: 'Emmanuel Jean' },
  ];

  const allowable = ['Books & publications', 'Computer peripherals', 'Food (Aim 4 pantry)', 'Conference registrations', 'Office supplies'];
  const restricted = ['Gift cards', 'Airline / hotel travel', 'Consultants', 'Furniture', 'Personal items'];

  return (
    <div>
      <SectionHeader number="3" label="Map 3 · Compliance Card" title="Dollar Thresholds + Signatory Chain" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="text-xs font-mono text-red-600 uppercase tracking-widest mb-3">Dollar Thresholds · Compliance Zones</div>
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-blue-800 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left font-mono text-xs tracking-widest">Amount</th>
                    <th className="px-4 py-2 text-left font-mono text-xs tracking-widest">Requirement</th>
                    <th className="px-4 py-2 text-left font-mono text-xs tracking-widest">Route</th>
                  </tr>
                </thead>
                <tbody>
                  {thresholds.map((t, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 font-bold font-mono text-blue-800">{t.range}</td>
                      <td className="px-4 py-2 text-gray-700">{t.label}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold border ${t.color}`}>{t.route}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-green-600 text-white px-4 py-2 text-sm font-bold">✔ Allowable P-Card Commodities</div>
              <ul className="p-3 space-y-1">
                {allowable.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-red-600 text-white px-4 py-2 text-sm font-bold">⛔ Restricted P-Card Commodities</div>
              <ul className="p-3 space-y-1">
                {restricted.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                    <XCircle size={14} className="text-red-500 flex-shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <div className="font-bold text-yellow-800 mb-1">⚓ Cognitive Anchor — All Gatekeeper Emails</div>
            <div className="font-mono text-sm text-yellow-700 bg-yellow-100 rounded px-3 py-2 mb-2">[Spend Category] – [GRT000937] – [Aim #]</div>
            <div className="text-xs text-yellow-700">Use this format in the email RE: line to guarantee a 24-hr response turnaround.</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-mono text-red-600 uppercase tracking-widest mb-3">Signatory Chain · In Sequence</div>
            <div className="space-y-0">
              {signatoryChain.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex flex-col items-center w-8 flex-shrink-0">
                    <div className={`${s.color} text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10`}>{s.num}</div>
                    {i < signatoryChain.length - 1 && <div className="w-0.5 flex-1 bg-blue-200 my-1" />}
                  </div>
                  <div className="pb-3 flex-1">
                    <div className="font-bold text-sm text-blue-800 leading-tight flex items-center gap-2 flex-wrap">
                      {s.name}
                      {s.badge && <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded font-mono font-bold">{s.badge}</span>}
                    </div>
                    <div className="text-xs text-gray-500">{s.role}</div>
                    <div className="text-xs text-blue-600 italic mt-0.5">{s.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="font-bold text-red-700 text-sm mb-3">🚨 Break Glass — When Standard Process Fails</div>
            <div className="space-y-2">
              {breakGlass.map((b, i) => (
                <div key={i} className="flex justify-between text-xs gap-2">
                  <span className="text-gray-600">{b.problem}</span>
                  <span className="font-bold text-gray-800">{b.contact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EscalationView() {
  const colorMap = {
    blue: 'border-blue-300 bg-blue-50',
    teal: 'border-teal-300 bg-teal-50',
    yellow: 'border-yellow-300 bg-yellow-50',
    indigo: 'border-indigo-300 bg-indigo-50',
    gray: 'border-gray-300 bg-gray-50',
  };
  const titleColor = {
    blue: 'text-blue-800',
    teal: 'text-teal-800',
    yellow: 'text-yellow-800',
    indigo: 'text-indigo-800',
    gray: 'text-gray-800',
  };

  return (
    <div>
      <SectionHeader number="4" label="Map 4 · Escalation Tree" title="Something Went Wrong — Who Do I Call?" />

      <div className="flex flex-col items-center mb-6">
        <div className="bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-md">🚨 Something Is Wrong / Stalled</div>
        <div className="w-0.5 h-6 bg-gray-300 mt-2" />
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        {escalationSteps.map((step, i) => (
          <div key={i}>
            <div className={`border-2 rounded-xl p-4 text-center font-bold text-base ${colorMap[step.color]} ${titleColor[step.color]}`}>
              {step.question}
            </div>
            <div className="flex gap-4 mt-3 px-2">
              <div className="flex-1 rounded-lg border-2 border-green-300 bg-green-50 p-3">
                <div className="text-xs font-mono text-green-700 font-bold mb-1">✔ YES →</div>
                <div className="font-bold text-sm text-gray-800">{step.contact}</div>
                <div className="text-xs text-gray-600 mt-0.5">{step.role}</div>
                {step.tip && <div className="text-xs text-gray-500 mt-2 italic leading-relaxed">{step.tip}</div>}
                <div className="mt-2 bg-blue-50 rounded px-2 py-1 font-mono text-xs text-blue-700">{step.anchor}</div>
              </div>
              {i < escalationSteps.length - 1 && (
                <div className="w-28 rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center justify-center">
                  <div className="text-xs text-gray-400 italic text-center">✖ NO →<br />continue ↓</div>
                </div>
              )}
            </div>
            {i < escalationSteps.length - 1 && <div className="w-0.5 h-4 bg-gray-300 mx-auto mt-3" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function CookbookView() {
  return (
    <div>
      <SectionHeader number="5" label="Map 5 · Process Cookbook" title="SOP Recipe Cards — Step-by-Step for Common Tasks" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

function PersonnelView() {
  return (
    <div>
      <SectionHeader number="0" label="Key Personnel" title={`Grant ${GRANT} Team Directory`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personnel.map((p, i) => (
          <div key={i} className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className={`${p.color} text-white w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow`}>
              {p.emoji}
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-tight">{p.name}</div>
              <div className="text-xs text-blue-600 font-mono mt-0.5">{p.role}</div>
              <div className="text-xs text-gray-500 mt-1.5 leading-relaxed italic">{p.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const tabs = [
  { id: 'compliance', label: '⚡ Quick Ref', view: <ComplianceView /> },
  { id: 'cookbook', label: '📖 Cookbook', view: <CookbookView /> },
  { id: 'escalation', label: '🚨 Escalation', view: <EscalationView /> },
  { id: 'swimlane', label: '🏊 Swimlane', view: <SwimlanetView /> },
  { id: 'deadlines', label: '📅 Deadlines', view: <DeadlinesView /> },
  { id: 'personnel', label: '👥 Personnel', view: <PersonnelView /> },
];

const SOPReference = () => {
  const [activeTab, setActiveTab] = useState('compliance');
  const active = tabs.find(t => t.id === activeTab);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs font-mono text-blue-600 uppercase tracking-widest mb-1">Howard University · RWJF</div>
          <h2 className="text-xl font-bold text-gray-900">Grant {GRANT} · Master SOP Reference</h2>
          <p className="text-sm text-gray-500 mt-0.5">5 Maps · Swimlane · Deadlines · Compliance · Escalation · Cookbook</p>
        </div>
        <div className="bg-blue-700 text-white rounded-lg px-4 py-2 text-center">
          <div className="text-xs font-mono opacity-70">Worktag</div>
          <div className="font-bold text-lg">{GRANT}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit mb-6 flex-wrap">
        {tabs.map(tab => (
          <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </TabButton>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {active?.view}
      </div>
    </div>
  );
};

export default SOPReference;
