import { useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background, Controls, Handle, Position,
  MarkerType, getBezierPath, BaseEdge, EdgeLabelRenderer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useApp } from '../../context/AppContext';
import { LayoutGrid, Network, GitBranch, Milestone } from 'lucide-react';

// ── Palette ────────────────────────────────────────────────────────────────────
const P = {
  teal:   '#097c87', tealLight: '#d0ecef',
  cyan:   '#23ced9', cyanLight:  '#cffafe',
  yellow: '#f9d779', yellowLight: '#fef9e0',
  sage:   '#a1cca6', sageLight:  '#dff0e2',
  salmon: '#fca47c', salmonLight: '#fdd0b8',
  gray:   '#9e9178', grayLight:  '#f5f0dc',
  white:  '#ffffff',
};

const STATUS_COLOR = (s) => ({
  active:        P.teal,
  'in-progress': P.teal,
  completed:     P.sage,
  pending:       P.gray,
  'not-started': P.gray,
  delayed:       P.salmon,
  rejected:      P.salmon,
}[s] || P.gray);

// ── Custom Node Types ─────────────────────────────────────────────────────────

/** Standard box node (used in Logic Model, Dependency Map, Lifecycle) */
const BoxNode = ({ data }) => (
  <div
    style={{
      background: data.bg || P.tealLight,
      border: `2px solid ${data.border || P.teal}`,
      borderRadius: 10,
      padding: '7px 12px',
      minWidth: 160,
      maxWidth: 200,
      fontSize: 11,
      textAlign: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      cursor: 'default',
    }}
  >
    <Handle type="target" position={Position.Left}  style={{ background: data.border || P.teal, width: 8, height: 8 }} />
    <Handle type="source" position={Position.Right} style={{ background: data.border || P.teal, width: 8, height: 8 }} />
    {data.icon && <div style={{ fontSize: 16, marginBottom: 2 }}>{data.icon}</div>}
    <div style={{ fontWeight: 700, color: data.border || P.teal, lineHeight: 1.3 }}>{data.label}</div>
    {data.sub && <div style={{ fontSize: 10, color: P.gray, marginTop: 2 }}>{data.sub}</div>}
    {data.pct != null && (
      <div style={{ marginTop: 4, background: '#e2e8f0', borderRadius: 4, height: 4, overflow: 'hidden' }}>
        <div style={{ width: `${data.pct}%`, height: '100%', background: data.border || P.teal }} />
      </div>
    )}
  </div>
);

/** Column header node (Logic Model) */
const HeaderNode = ({ data }) => (
  <div style={{
    background: data.color || P.teal,
    color: '#fff',
    borderRadius: 8,
    padding: '6px 16px',
    fontWeight: 800,
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: '0.05em',
    minWidth: 160,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  }}>
    {data.label}
  </div>
);

/** Diamond decision node (Approval Pipeline) */
const DiamondNode = ({ data }) => (
  <div style={{ position: 'relative', width: 110, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{
      position: 'absolute',
      width: 70, height: 70,
      background: data.bg || P.yellowLight,
      border: `2px solid ${data.border || P.yellow}`,
      transform: 'rotate(45deg)',
      borderRadius: 4,
    }} />
    <div style={{ position: 'relative', zIndex: 1, fontSize: 10, fontWeight: 700, color: data.border || '#856a00', textAlign: 'center', padding: '0 8px', lineHeight: 1.3 }}>
      {data.label}
    </div>
    <Handle type="target" position={Position.Top}    style={{ background: data.border || P.yellow, width: 8, height: 8 }} />
    <Handle type="source" position={Position.Bottom} id="yes" style={{ background: P.sage,   width: 8, height: 8 }} />
    <Handle type="source" position={Position.Right}  id="no"  style={{ background: P.salmon, width: 8, height: 8 }} />
  </div>
);

/** Oval node (Start/End in Approval Pipeline) */
const OvalNode = ({ data }) => (
  <div style={{
    background: data.bg || P.teal,
    color: '#fff',
    borderRadius: 30,
    padding: '8px 20px',
    fontWeight: 700,
    fontSize: 12,
    textAlign: 'center',
    minWidth: 130,
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  }}>
    <Handle type="target" position={Position.Top}    style={{ background: '#fff', width: 8, height: 8 }} />
    <Handle type="source" position={Position.Bottom} style={{ background: '#fff', width: 8, height: 8 }} />
    {data.label}
  </div>
);

/** Stage column header (Lifecycle) */
const StageNode = ({ data }) => (
  <div style={{
    background: data.bg || P.tealLight,
    border: `2px dashed ${data.border || P.teal}`,
    borderRadius: 8,
    padding: '6px 20px',
    fontWeight: 700,
    fontSize: 12,
    color: data.border || P.teal,
    textAlign: 'center',
    minWidth: 170,
  }}>
    <Handle type="source" position={Position.Right} style={{ background: data.border || P.teal }} />
    <Handle type="target" position={Position.Left}  style={{ background: data.border || P.teal }} />
    {data.icon && <span style={{ marginRight: 4 }}>{data.icon}</span>}
    {data.label}
  </div>
);

const nodeTypes = {
  boxNode:     BoxNode,
  headerNode:  HeaderNode,
  diamondNode: DiamondNode,
  ovalNode:    OvalNode,
  stageNode:   StageNode,
};

const edge = (id, src, tgt, opts = {}) => ({
  id,
  source: src,
  target: tgt,
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: opts.color || P.teal, width: 16, height: 16 },
  style: { stroke: opts.color || P.cyan, strokeWidth: 1.5, opacity: 0.7 },
  label: opts.label,
  labelStyle: { fontSize: 10, fill: opts.color || P.gray, fontWeight: 600 },
  sourceHandle: opts.sourceHandle,
  animated: opts.animated || false,
});

// ── 1. Program Logic Model ─────────────────────────────────────────────────────
function buildLogicModel(grant) {
  const nodes = [], edges = [];
  if (!grant) return { nodes, edges };

  const COL   = [0, 230, 460, 690, 920];
  const GAP   = 90;
  const START = 80;

  const COLS = [
    { key: 'inputs',  label: 'Inputs',              color: P.teal   },
    { key: 'acts',    label: 'Activities',           color: '#097c87' },
    { key: 'outputs', label: 'Outputs',              color: '#5a9d62' },
    { key: 'short',   label: 'Short-term Outcomes',  color: '#e8a030' },
    { key: 'long',    label: 'Long-term Impact',     color: '#c44c22' },
  ];

  COLS.forEach((col, i) => {
    nodes.push({ id: `hdr-${i}`, type: 'headerNode', position: { x: COL[i], y: 0 }, data: { label: col.label, color: col.color }, draggable: false });
  });

  // Inputs
  const amt = grant.amount ? `$${(grant.amount / 1000).toFixed(0)}K Award` : 'Funding';
  const yr1 = grant.startDate ? new Date(grant.startDate).getFullYear() : '—';
  const yr2 = grant.endDate   ? new Date(grant.endDate).getFullYear()   : '—';
  const inputItems = [
    { label: amt,                               sub: grant.fundingAgency || 'Funder'   },
    { label: grant.principalInvestigator || 'PI', sub: 'Principal Investigator'        },
    { label: grant.institution || 'Institution',  sub: 'Host Organization'             },
    { label: `${yr1} – ${yr2}`,                 sub: 'Grant Period'                   },
  ];

  // Activities — from aims
  const aims = grant.aims || [];
  const actItems = aims.length > 0
    ? aims.map(a => ({ id: a.id, label: a.title, sub: a.number || '', status: a.status, pct: a.completionPercentage }))
    : [{ id: 'act-def', label: 'Program Activities', sub: 'Add aims to your grant' }];

  // Outputs — milestones + deliverables
  const outItems = [];
  aims.forEach(aim => {
    (aim.milestones || []).slice(0, 1).forEach(ms => outItems.push({ id: `ms-${ms.id}`, label: ms.title, sub: aim.number }));
    (aim.subAims   || []).forEach(sa =>
      (sa.activities || []).slice(0, 1).forEach(ac =>
        (ac.deliverables || []).slice(0, 1).forEach(d => outItems.push({ id: `d-${ac.id}`, label: d, sub: sa.number || '' }))
      )
    );
  });
  if (outItems.length === 0) {
    [['Program Reports & Data', 'Documentation'], ['Training Materials', 'Education'], ['Community Partnerships', 'Engagement']].forEach(([l, s], i) =>
      outItems.push({ id: `out-${i}`, label: l, sub: s }));
  }

  // Short-term Outcomes
  const shortItems = [];
  aims.forEach(a => (a.kpis || []).slice(0, 1).forEach(k => shortItems.push({ id: `kpi-${k.id}`, label: k.name, sub: k.unit })));
  if (shortItems.length === 0) {
    [['Increased Knowledge & Awareness', ''], ['Improved Access to Resources', ''], ['Stronger Community Networks', '']].forEach(([l, s], i) =>
      shortItems.push({ id: `sh-${i}`, label: l, sub: s }));
  }

  // Long-term Impact (always defaults — these are hard to derive from data)
  const longItems = [
    { id: 'lt-0', label: 'Health Equity Improvements',    sub: 'Population-level' },
    { id: 'lt-1', label: 'Systems & Policy Change',       sub: 'Institutional'    },
    { id: 'lt-2', label: 'Sustained Community Capacity',  sub: 'Long-term'        },
  ];

  const bgFor = (i) => [P.tealLight, P.cyanLight, P.sageLight, P.yellowLight, P.salmonLight][i];
  const brFor = (i) => [P.teal, P.cyan, P.sage, '#e8a030', '#c44c22'][i];

  const allCols = [inputItems, actItems, outItems, shortItems, longItems];
  const idPfx   = ['inp', 'act', 'out', 'sht', 'lng'];

  allCols.forEach((items, ci) => {
    items.forEach((item, ri) => {
      nodes.push({
        id: `${idPfx[ci]}-${item.id || ri}`,
        type: 'boxNode',
        position: { x: COL[ci], y: START + ri * GAP },
        data: { label: item.label, sub: item.sub, bg: bgFor(ci), border: brFor(ci), pct: item.pct },
      });
    });
  });

  // Connect adjacent columns proportionally
  for (let ci = 0; ci < 4; ci++) {
    const srcItems = allCols[ci];
    const tgtItems = allCols[ci + 1];
    srcItems.forEach((src, si) => {
      const ti = Math.min(Math.floor(si * tgtItems.length / srcItems.length), tgtItems.length - 1);
      const tgt = tgtItems[ti];
      edges.push(edge(
        `e-${ci}-${si}`,
        `${idPfx[ci]}-${src.id || si}`,
        `${idPfx[ci+1]}-${tgt.id || ti}`,
        { color: brFor(ci) }
      ));
    });
  }

  return { nodes, edges };
}

// ── 2. Task Dependency Map ─────────────────────────────────────────────────────
function buildDependencyMap(grant) {
  const nodes = [], edges = [];
  if (!grant) return { nodes, edges };

  // Flatten all activities from aims + subAims
  const activities = [];
  (grant.aims || []).forEach((aim, ai) => {
    const aimActivities = [];
    (aim.subAims || []).forEach(sa =>
      (sa.activities || []).forEach(ac =>
        aimActivities.push({ ...ac, aimId: aim.id, aimNumber: aim.number, aimTitle: aim.title, aimIdx: ai })
      )
    );
    // Also include aim-level milestones as nodes
    (aim.milestones || []).forEach(ms =>
      aimActivities.push({
        id: ms.id, title: ms.title, status: ms.status || (ms.completed ? 'completed' : 'pending'),
        dueDate: ms.targetDate, dependencies: [], aimId: aim.id, aimNumber: aim.number, aimTitle: aim.title, aimIdx: ai,
      })
    );
    if (aimActivities.length === 0) {
      // Add the aim itself as a node if no activities
      aimActivities.push({
        id: aim.id, title: aim.title, status: aim.status, dueDate: aim.targetDate,
        dependencies: [], aimId: aim.id, aimNumber: aim.number, aimTitle: aim.title, aimIdx: ai,
      });
    }
    activities.push(...aimActivities);
  });

  if (activities.length === 0) return { nodes, edges };

  // Group by aim
  const byAim = {};
  activities.forEach(ac => {
    if (!byAim[ac.aimId]) byAim[ac.aimId] = [];
    byAim[ac.aimId].push(ac);
  });

  const titleToId = {};
  activities.forEach(ac => { titleToId[ac.title] = ac.id; });

  const aimList = Object.entries(byAim);
  const COL_W = 200, ROW_H = 120;

  aimList.forEach(([aimId, acs], ai) => {
    const aimY = ai * ROW_H;
    // Aim label node
    nodes.push({
      id: `aim-lbl-${aimId}`,
      type: 'headerNode',
      position: { x: -10, y: aimY + 15 },
      data: { label: `${acs[0].aimNumber || 'Aim'}: ${acs[0].aimTitle}`, color: P.teal },
      draggable: false,
    });

    acs.forEach((ac, ci) => {
      const col = STATUS_COLOR(ac.status);
      nodes.push({
        id: ac.id,
        type: 'boxNode',
        position: { x: 200 + ci * COL_W, y: aimY },
        data: {
          label: ac.title.length > 40 ? ac.title.slice(0, 40) + '…' : ac.title,
          sub: ac.dueDate ? `Due: ${new Date(ac.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ac.status,
          bg: col + '22',
          border: col,
        },
      });

      // Dependency edges
      (ac.dependencies || []).forEach((depTitle, di) => {
        const depId = titleToId[depTitle];
        if (depId) {
          edges.push(edge(`dep-${ac.id}-${di}`, depId, ac.id, { color: P.salmon, animated: true }));
        }
      });
    });
  });

  return { nodes, edges };
}

// ── 3. Grant Approval Pipeline ────────────────────────────────────────────────
function buildApprovalPipeline() {
  const CX = 200, DX = 430, RX = 480;
  const Y  = (n) => n * 110;

  const nodes = [
    { id: 'start',      type: 'ovalNode',    position: { x: CX, y: Y(0)  }, data: { label: '🧾  Expense / PRF Needed',    bg: P.teal } },
    { id: 'docs',       type: 'boxNode',     position: { x: CX, y: Y(1)  }, data: { label: 'Gather Supporting Documents', sub: 'Receipts, quotes, authorization forms', bg: P.tealLight, border: P.teal } },
    { id: 'pi-dec',     type: 'diamondNode', position: { x: CX - 5, y: Y(2)  }, data: { label: 'PI Review & Sign-off?', bg: P.yellowLight, border: '#b88800' } },
    { id: 'pi-rev',     type: 'boxNode',     position: { x: RX, y: Y(2)  }, data: { label: 'Revise & Resubmit', sub: 'Address PI feedback', bg: P.salmonLight, border: P.salmon } },
    { id: 'admin',      type: 'boxNode',     position: { x: CX, y: Y(3)  }, data: { label: 'Program Admin Review',        sub: 'Budget alignment check', bg: P.tealLight, border: P.teal } },
    { id: 'admin-dec',  type: 'diamondNode', position: { x: CX - 5, y: Y(4)  }, data: { label: 'Admin Approved?', bg: P.yellowLight, border: '#b88800' } },
    { id: 'admin-rev',  type: 'boxNode',     position: { x: RX, y: Y(4)  }, data: { label: 'Revise & Resubmit', sub: 'Address admin feedback', bg: P.salmonLight, border: P.salmon } },
    { id: 'finance',    type: 'boxNode',     position: { x: CX, y: Y(5)  }, data: { label: 'Grants Accounting Review',     sub: 'Budget availability & compliance', bg: P.cyanLight, border: P.cyan } },
    { id: 'budget-dec', type: 'diamondNode', position: { x: CX - 5, y: Y(6)  }, data: { label: 'Budget Available?', bg: P.yellowLight, border: '#b88800' } },
    { id: 'defer',      type: 'boxNode',     position: { x: RX, y: Y(6)  }, data: { label: 'Defer / Reallocate',          sub: 'Adjust budget or defer to next period', bg: P.salmonLight, border: P.salmon } },
    { id: 'controller', type: 'boxNode',     position: { x: CX, y: Y(7)  }, data: { label: 'Controller Authorization',    sub: 'Final institutional approval', bg: P.sageLight, border: P.sage } },
    { id: 'done',       type: 'ovalNode',    position: { x: CX, y: Y(8)  }, data: { label: '✅  Payment Processed',       bg: '#5a9d62' } },
  ];

  const edges = [
    edge('e1', 'start',     'docs',       { color: P.teal }),
    edge('e2', 'docs',      'pi-dec',     { color: P.teal }),
    edge('e3', 'pi-dec',    'admin',      { color: P.sage,   sourceHandle: 'yes', label: 'Yes ✓' }),
    edge('e4', 'pi-dec',    'pi-rev',     { color: P.salmon, sourceHandle: 'no',  label: 'No ✗'  }),
    edge('e5', 'pi-rev',    'pi-dec',     { color: P.salmon }),
    edge('e6', 'admin',     'admin-dec',  { color: P.teal }),
    edge('e7', 'admin-dec', 'finance',    { color: P.sage,   sourceHandle: 'yes', label: 'Yes ✓' }),
    edge('e8', 'admin-dec', 'admin-rev',  { color: P.salmon, sourceHandle: 'no',  label: 'No ✗'  }),
    edge('e9', 'admin-rev', 'admin-dec',  { color: P.salmon }),
    edge('e10','finance',   'budget-dec', { color: P.cyan }),
    edge('e11','budget-dec','controller', { color: P.sage,   sourceHandle: 'yes', label: 'Yes ✓' }),
    edge('e12','budget-dec','defer',      { color: P.salmon, sourceHandle: 'no',  label: 'No ✗'  }),
    edge('e13','controller','done',       { color: P.sage, animated: true }),
  ];

  return { nodes, edges };
}

// ── 4. Grant Lifecycle ─────────────────────────────────────────────────────────
function buildLifecycleFlow(grants) {
  const nodes = [], edges = [];

  const STAGES = [
    { id: 'st-pending',   label: 'Pending / Applied',  keys: ['pending'],             bg: P.yellowLight, border: '#b88800', icon: '📋' },
    { id: 'st-active',    label: 'Active / Running',   keys: ['active'],              bg: P.tealLight,   border: P.teal,    icon: '🚀' },
    { id: 'st-reporting', label: 'Reporting Period',   keys: ['reporting'],           bg: P.cyanLight,   border: P.cyan,    icon: '📊' },
    { id: 'st-completed', label: 'Completed / Closed', keys: ['completed','rejected'],bg: P.sageLight,   border: P.sage,    icon: '✅' },
  ];

  const COL_W = 220, ROW_H = 90;

  // Stage header nodes
  STAGES.forEach((st, si) => {
    nodes.push({
      id: st.id,
      type: 'stageNode',
      position: { x: si * COL_W, y: 0 },
      data: { label: `${st.icon} ${st.label}`, bg: st.bg, border: st.border },
    });
    if (si < STAGES.length - 1) {
      edges.push(edge(`st-e-${si}`, st.id, STAGES[si+1].id, { color: P.gray }));
    }
  });

  // Grant nodes in their stage column
  const colCount = [0, 0, 0, 0];
  grants.forEach(grant => {
    const si = STAGES.findIndex(st => st.keys.includes(grant.status));
    const colIdx = si === -1 ? 0 : si;
    const col = STAGES[colIdx];
    const rowN = colCount[colIdx]++;

    const pct = grant.aims?.length
      ? Math.round(grant.aims.reduce((s, a) => s + (a.completionPercentage || 0), 0) / grant.aims.length)
      : null;

    const yr1 = grant.startDate ? new Date(grant.startDate).getFullYear() : null;
    const yr2 = grant.endDate   ? new Date(grant.endDate).getFullYear()   : null;
    const period = yr1 || yr2 ? `${yr1 || '?'} – ${yr2 || '?'}` : null;

    nodes.push({
      id: `grant-${grant.id}`,
      type: 'boxNode',
      position: { x: colIdx * COL_W, y: 100 + rowN * ROW_H },
      data: {
        label: grant.title.length > 30 ? grant.title.slice(0, 30) + '…' : grant.title,
        sub: [grant.fundingAgency, period].filter(Boolean).join(' · '),
        bg: col.bg,
        border: col.border,
        pct,
      },
    });
  });

  if (grants.length === 0) {
    nodes.push({
      id: 'empty',
      type: 'boxNode',
      position: { x: 0, y: 100 },
      data: { label: 'No grants yet', sub: 'Add grants in the Grants section', bg: P.grayLight, border: P.gray },
    });
  }

  return { nodes, edges };
}

// ── Chart definitions ──────────────────────────────────────────────────────────
const CHARTS = [
  { id: 'logic',      label: 'Program Logic Model',  icon: LayoutGrid,  needsGrant: true,  tip: 'Maps your grant from inputs → activities → outputs → outcomes. Standard funder deliverable.' },
  { id: 'dependency', label: 'Task Dependencies',    icon: Network,     needsGrant: true,  tip: 'Shows how your grant activities depend on each other — spot bottlenecks at a glance.' },
  { id: 'approval',   label: 'Approval Pipeline',    icon: GitBranch,   needsGrant: false, tip: 'Your organization\'s standard approval flow for expenses and payment requests.' },
  { id: 'lifecycle',  label: 'Grant Lifecycle',      icon: Milestone,   needsGrant: false, tip: 'All grants positioned in their current lifecycle stage — your full portfolio at a glance.' },
];

// ── Main Component ─────────────────────────────────────────────────────────────
const FlowchartView = () => {
  const { grants } = useApp();
  const [activeChart, setActiveChart] = useState('logic');
  const [selectedGrantId, setSelectedGrantId] = useState(grants[0]?.id || '');

  const selectedGrant = grants.find(g => g.id === selectedGrantId) || grants[0] || null;
  const chart = CHARTS.find(c => c.id === activeChart);

  const { nodes, edges } = useMemo(() => {
    switch (activeChart) {
      case 'logic':      return buildLogicModel(selectedGrant);
      case 'dependency': return buildDependencyMap(selectedGrant);
      case 'approval':   return buildApprovalPipeline();
      case 'lifecycle':  return buildLifecycleFlow(grants);
      default:           return { nodes: [], edges: [] };
    }
  }, [activeChart, selectedGrant, grants]);

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CHARTS.map(c => {
          const Icon = c.icon;
          const active = activeChart === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveChart(c.id)}
              title={c.tip}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
                active
                  ? 'bg-primary-600 text-white border-primary-600 shadow'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-600'
              }`}
            >
              <Icon size={15} />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Description + grant selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-xs text-gray-500 italic">{chart?.tip}</p>
        {chart?.needsGrant && grants.length > 0 && (
          <select
            value={selectedGrantId}
            onChange={e => setSelectedGrantId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-400 outline-none bg-white"
          >
            {grants.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        )}
      </div>

      {/* No grants empty state */}
      {chart?.needsGrant && grants.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Network size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">No grants yet</p>
          <p className="text-sm mt-1">Add a grant in the Grants section to generate this diagram.</p>
        </div>
      )}

      {/* ReactFlow canvas */}
      {(grants.length > 0 || !chart?.needsGrant) && (
        <div
          style={{ height: 560, borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e0c8' }}
          className="bg-surface-50"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#c8bfa4" gap={24} size={1} />
            <Controls />
          </ReactFlow>
        </div>
      )}

      {/* Legend */}
      {activeChart === 'approval' && (
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: P.teal }} /> Process step</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rotate-45 inline-block" style={{ background: '#f9d779' }} /> Decision</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: P.teal }} /> Start / End</span>
          <span className="flex items-center gap-1.5 text-sage-700" style={{ color: '#5a9d62' }}>Green arrow = Approved</span>
          <span className="flex items-center gap-1.5" style={{ color: P.salmon }}>Salmon arrow = Rejected</span>
        </div>
      )}
      {activeChart === 'dependency' && (
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
          <span>Node color = activity status.</span>
          <span style={{ color: P.salmon }}>Animated salmon arrows = dependency (must complete first).</span>
          <span>Drag nodes to rearrange.</span>
        </div>
      )}
      {activeChart === 'lifecycle' && (
        <div className="mt-3 text-xs text-gray-400">
          Grant status is set in the Grants section. Move a grant between stages by changing its Status field there.
        </div>
      )}
    </div>
  );
};

export default FlowchartView;
