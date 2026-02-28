import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, { Background, Controls, Handle, Position, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { useApp } from '../../context/AppContext';
import { LayoutGrid, Network, GitBranch, Milestone } from 'lucide-react';

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  teal:       '#097c87', tealLight:   '#d0ecef',
  cyan:       '#23ced9', cyanLight:   '#cffafe',
  yellow:     '#f9d779', yellowLight: '#fef9e0',
  sage:       '#a1cca6', sageLight:   '#dff0e2',
  salmon:     '#fca47c', salmonLight: '#fdd0b8',
  gray:       '#9e9178', grayLight:   '#f5f0dc',
};

const STATUS_COLOR = (s) => ({
  active:        P.teal,
  'in-progress': P.teal,
  completed:     P.sage,
  pending:       P.gray,
  'not-started': P.gray,
  delayed:       P.salmon,
  rejected:      P.salmon,
}[s] ?? P.gray);

// ── Shared node styles ────────────────────────────────────────────────────────
const HANDLE_STYLE = (color) => ({
  background: color,
  width: 9,
  height: 9,
  border: '2px solid #fff',
});

// ── BoxNode ───────────────────────────────────────────────────────────────────
// Fixed 190 px wide so columns never overlap.
const BoxNode = ({ data }) => {
  const navigate = useNavigate();
  const clickable = !!data.link;

  return (
    <div
      onClick={() => clickable && navigate(data.link)}
      title={clickable ? `Open ${data.linkLabel || 'page'} →` : undefined}
      style={{
        width: 190,
        background: data.bg   ?? P.tealLight,
        border:     `2px solid ${data.border ?? P.teal}`,
        borderRadius: 10,
        padding: '9px 14px',
        fontSize: 11,
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
        cursor: clickable ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'opacity 0.15s',
      }}
    >
      <Handle type="target" position={Position.Left}  style={HANDLE_STYLE(data.border ?? P.teal)} />
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE(data.border ?? P.teal)} />
      {data.icon && (
        <div style={{ fontSize: 16, marginBottom: 3 }}>{data.icon}</div>
      )}
      <div style={{ fontWeight: 700, color: data.border ?? P.teal, lineHeight: 1.35 }}>
        {data.label}
      </div>
      {data.sub && (
        <div style={{ fontSize: 10, color: P.gray, marginTop: 2, lineHeight: 1.3 }}>
          {data.sub}
        </div>
      )}
      {data.pct != null && (
        <div style={{ marginTop: 5, background: '#e2e8f0', borderRadius: 4, height: 4, overflow: 'hidden' }}>
          <div style={{ width: `${data.pct}%`, height: '100%', background: data.border ?? P.teal }} />
        </div>
      )}
      {clickable && (
        <div style={{ fontSize: 9, color: data.border, marginTop: 4, opacity: 0.6, fontStyle: 'italic' }}>
          click to view →
        </div>
      )}
    </div>
  );
};

// ── HeaderNode ────────────────────────────────────────────────────────────────
const HeaderNode = ({ data }) => (
  <div style={{
    width: 190,
    background: data.color ?? P.teal,
    color: '#fff',
    borderRadius: 8,
    padding: '8px 14px',
    fontWeight: 800,
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: '0.04em',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    userSelect: 'none',
  }}>
    {data.label}
  </div>
);

// ── DiamondNode ───────────────────────────────────────────────────────────────
// SVG-based diamond so handles sit precisely at the four visual points.
// Outer div = 160 × 90. SVG polygon: top=(80,4) right=(156,45) bottom=(80,86) left=(4,45)
// ReactFlow places handles at the div's edges — the ±4 px offset is imperceptible.
const DiamondNode = ({ data }) => {
  const navigate = useNavigate();
  const clickable = !!data.link;
  const border    = data.border ?? '#b88800';

  return (
    <div
      onClick={() => clickable && navigate(data.link)}
      style={{ position: 'relative', width: 160, height: 90, cursor: clickable ? 'pointer' : 'default' }}
    >
      <svg
        width="160" height="90"
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
      >
        <polygon
          points="80,4 156,45 80,86 4,45"
          fill={data.bg ?? P.yellowLight}
          stroke={border}
          strokeWidth="2"
        />
      </svg>

      {/* Label centered over the diamond */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700,
        color: border,
        textAlign: 'center',
        padding: '0 28px',
        lineHeight: 1.3, zIndex: 1,
        userSelect: 'none',
      }}>
        {data.label}
      </div>

      {/* Handles at the four diamond points */}
      <Handle type="target" position={Position.Top}    style={HANDLE_STYLE(border)} />
      <Handle type="source" position={Position.Bottom} id="yes" style={HANDLE_STYLE(P.sage)} />
      <Handle type="source" position={Position.Right}  id="no"  style={HANDLE_STYLE(P.salmon)} />
    </div>
  );
};

// ── OvalNode ──────────────────────────────────────────────────────────────────
const OvalNode = ({ data }) => {
  const navigate = useNavigate();
  const clickable = !!data.link;

  return (
    <div
      onClick={() => clickable && navigate(data.link)}
      title={clickable ? `Open ${data.linkLabel ?? 'page'} →` : undefined}
      style={{
        minWidth: 190,
        background: data.bg ?? P.teal,
        color: '#fff',
        borderRadius: 40,
        padding: '10px 24px',
        fontWeight: 700,
        fontSize: 12,
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        cursor: clickable ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <Handle type="target" position={Position.Top}    style={HANDLE_STYLE('#fff')} />
      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE('#fff')} />
      {data.label}
    </div>
  );
};

// ── StageNode ─────────────────────────────────────────────────────────────────
const StageNode = ({ data }) => (
  <div style={{
    width: 190,
    background: data.bg ?? P.tealLight,
    border: `2px dashed ${data.border ?? P.teal}`,
    borderRadius: 8,
    padding: '8px 14px',
    fontWeight: 700,
    fontSize: 12,
    color: data.border ?? P.teal,
    textAlign: 'center',
    userSelect: 'none',
  }}>
    <Handle type="target" position={Position.Left}  style={HANDLE_STYLE(data.border ?? P.teal)} />
    <Handle type="source" position={Position.Right} style={HANDLE_STYLE(data.border ?? P.teal)} />
    {data.label}
  </div>
);

// nodeTypes must live outside the component to keep reference stable
const nodeTypes = {
  boxNode:     BoxNode,
  headerNode:  HeaderNode,
  diamondNode: DiamondNode,
  ovalNode:    OvalNode,
  stageNode:   StageNode,
};

// ── Edge factory ──────────────────────────────────────────────────────────────
const edge = (id, src, tgt, opts = {}) => ({
  id,
  source: src,
  target: tgt,
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: opts.color ?? P.teal,
    width: 14, height: 14,
  },
  style:      { stroke: opts.color ?? P.cyan, strokeWidth: 1.5, opacity: 0.75 },
  label:       opts.label,
  labelStyle:  { fontSize: 10, fill: opts.color ?? P.gray, fontWeight: 600 },
  labelBgStyle:{ fill: '#fff', fillOpacity: 0.85, borderRadius: 3 },
  sourceHandle: opts.sourceHandle,
  animated:     opts.animated ?? false,
});

// ── 1. Program Logic Model ────────────────────────────────────────────────────
function buildLogicModel(grant) {
  const nodes = [], edges = [];
  if (!grant) return { nodes, edges };

  // Column centres: 190 px box + 50 px gap = 240 px stride
  const COL   = [0, 240, 480, 720, 960];
  const ROW_H = 110;
  const TOP   = 80;

  const COLS = [
    { label: 'Inputs',             color: P.teal    },
    { label: 'Activities',         color: '#097c87' },
    { label: 'Outputs',            color: '#5a9d62' },
    { label: 'Short-term Outcomes',color: '#e8a030' },
    { label: 'Long-term Impact',   color: '#c44c22' },
  ];

  COLS.forEach((col, i) =>
    nodes.push({
      id: `hdr-${i}`, type: 'headerNode',
      position: { x: COL[i], y: 0 },
      data: { label: col.label, color: col.color },
      draggable: false,
    })
  );

  const amt = grant.amount
    ? `$${(grant.amount / 1000).toFixed(0)}K Award`
    : 'Funding';
  const yr1 = grant.startDate ? new Date(grant.startDate).getFullYear() : '—';
  const yr2 = grant.endDate   ? new Date(grant.endDate).getFullYear()   : '—';

  const inputItems = [
    { label: amt,                                 sub: grant.fundingAgency ?? 'Funder'    },
    { label: grant.principalInvestigator ?? 'PI', sub: 'Principal Investigator'           },
    { label: grant.institution ?? 'Institution',  sub: 'Host Organization'                },
    { label: `${yr1} – ${yr2}`,                   sub: 'Grant Period'                     },
  ];

  const aims     = grant.aims ?? [];
  const actItems = aims.length
    ? aims.map(a => ({
        id: a.id, label: a.title, sub: a.number ?? '',
        status: a.status, pct: a.completionPercentage,
        link: '/grants', linkLabel: 'Grants',
      }))
    : [{ id: 'act-def', label: 'Program Activities', sub: 'Add aims to your grant' }];

  const outItems = [];
  aims.forEach(aim => {
    (aim.milestones ?? []).slice(0, 1).forEach(ms =>
      outItems.push({ id: `ms-${ms.id}`, label: ms.title, sub: aim.number, link: '/grants', linkLabel: 'Grants' })
    );
    (aim.subAims ?? []).forEach(sa =>
      (sa.activities ?? []).slice(0, 1).forEach(ac =>
        (ac.deliverables ?? []).slice(0, 1).forEach(d =>
          outItems.push({ id: `d-${ac.id}`, label: d, sub: sa.number ?? '', link: '/grants', linkLabel: 'Grants' })
        )
      )
    );
  });
  if (!outItems.length) {
    [['Program Reports & Data','Documentation'],['Training Materials','Education'],['Community Partnerships','Engagement']]
      .forEach(([l, s], i) => outItems.push({ id: `out-${i}`, label: l, sub: s }));
  }

  const shortItems = [];
  aims.forEach(a =>
    (a.kpis ?? []).slice(0, 1).forEach(k =>
      shortItems.push({ id: `kpi-${k.id}`, label: k.name, sub: k.unit })
    )
  );
  if (!shortItems.length) {
    [['Increased Knowledge & Awareness',''],['Improved Access to Resources',''],['Stronger Community Networks','']]
      .forEach(([l, s], i) => shortItems.push({ id: `sh-${i}`, label: l, sub: s }));
  }

  const longItems = [
    { id: 'lt-0', label: 'Health Equity Improvements',   sub: 'Population-level' },
    { id: 'lt-1', label: 'Systems & Policy Change',       sub: 'Institutional'    },
    { id: 'lt-2', label: 'Sustained Community Capacity',  sub: 'Long-term'        },
  ];

  const bgFor = (i) => [P.tealLight, P.cyanLight, P.sageLight, P.yellowLight, P.salmonLight][i];
  const brFor = (i) => [P.teal, P.cyan, P.sage, '#e8a030', '#c44c22'][i];

  const allCols = [inputItems, actItems, outItems, shortItems, longItems];
  const idPfx   = ['inp', 'act', 'out', 'sht', 'lng'];

  allCols.forEach((items, ci) =>
    items.forEach((item, ri) =>
      nodes.push({
        id: `${idPfx[ci]}-${item.id ?? ri}`,
        type: 'boxNode',
        position: { x: COL[ci], y: TOP + ri * ROW_H },
        data: {
          label: item.label, sub: item.sub,
          bg: bgFor(ci), border: brFor(ci),
          pct: item.pct,
          link: item.link, linkLabel: item.linkLabel,
        },
      })
    )
  );

  // Connect adjacent columns proportionally
  for (let ci = 0; ci < 4; ci++) {
    const src = allCols[ci];
    const tgt = allCols[ci + 1];
    src.forEach((s, si) => {
      const ti  = Math.min(Math.floor(si * tgt.length / src.length), tgt.length - 1);
      const t   = tgt[ti];
      edges.push(edge(
        `e-${ci}-${si}`,
        `${idPfx[ci]}-${s.id ?? si}`,
        `${idPfx[ci+1]}-${t.id ?? ti}`,
        { color: brFor(ci) }
      ));
    });
  }

  return { nodes, edges };
}

// ── 2. Task Dependency Map ────────────────────────────────────────────────────
function buildDependencyMap(grant) {
  const nodes = [], edges = [];
  if (!grant) return { nodes, edges };

  const activities = [];
  (grant.aims ?? []).forEach((aim, ai) => {
    const aimActs = [];
    (aim.subAims ?? []).forEach(sa =>
      (sa.activities ?? []).forEach(ac =>
        aimActs.push({ ...ac, aimId: aim.id, aimNumber: aim.number, aimTitle: aim.title, aimIdx: ai })
      )
    );
    (aim.milestones ?? []).forEach(ms =>
      aimActs.push({
        id: ms.id, title: ms.title,
        status: ms.status ?? (ms.completed ? 'completed' : 'pending'),
        dueDate: ms.targetDate, dependencies: [],
        aimId: aim.id, aimNumber: aim.number, aimTitle: aim.title, aimIdx: ai,
      })
    );
    if (!aimActs.length) {
      aimActs.push({
        id: aim.id, title: aim.title, status: aim.status, dueDate: aim.targetDate,
        dependencies: [], aimId: aim.id, aimNumber: aim.number, aimTitle: aim.title, aimIdx: ai,
      });
    }
    activities.push(...aimActs);
  });

  if (!activities.length) return { nodes, edges };

  const byAim    = {};
  const titleToId = {};
  activities.forEach(ac => {
    (byAim[ac.aimId] ??= []).push(ac);
    titleToId[ac.title] = ac.id;
  });

  const COL_W = 250, ROW_H = 140;

  Object.entries(byAim).forEach(([aimId, acs], ai) => {
    const aimY = ai * ROW_H;
    nodes.push({
      id: `aim-lbl-${aimId}`, type: 'headerNode',
      position: { x: 0, y: aimY + 22 },
      data: { label: `${acs[0].aimNumber ?? 'Aim'}: ${acs[0].aimTitle}`, color: P.teal },
      draggable: false,
    });

    acs.forEach((ac, ci) => {
      const col = STATUS_COLOR(ac.status);
      nodes.push({
        id: ac.id, type: 'boxNode',
        position: { x: 220 + ci * COL_W, y: aimY },
        data: {
          label: ac.title.length > 38 ? ac.title.slice(0, 38) + '…' : ac.title,
          sub: ac.dueDate
            ? `Due: ${new Date(ac.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : ac.status,
          bg: col + '22', border: col,
          link: '/grants', linkLabel: 'Grants',
        },
      });

      (ac.dependencies ?? []).forEach((depTitle, di) => {
        const depId = titleToId[depTitle];
        if (depId)
          edges.push(edge(`dep-${ac.id}-${di}`, depId, ac.id, { color: P.salmon, animated: true }));
      });
    });
  });

  return { nodes, edges };
}

// ── 3. Grant Approval Pipeline ────────────────────────────────────────────────
function buildApprovalPipeline() {
  // Every node is centred at x = 120.
  // BoxNode    : width=190, so x = 120 - 95 = 25
  // DiamondNode: width=160, so x = 120 - 80 = 40
  // OvalNode   : minWidth=190, so x = 120 - 95 = 25
  // Rejection column at REJ (starts 80 px to the right of main column right edge)
  const BX  = 25;
  const DX  = 40;
  const OX  = 25;
  const REJ = 290;   // x start for rejection/loop-back boxes
  const Y   = (n) => n * 130;

  const nodes = [
    { id: 'start',     type: 'ovalNode',    position: { x: OX, y: Y(0) },
      data: { label: '🧾 Expense / PRF Needed', bg: P.teal, link: '/payment-requests', linkLabel: 'Payments' } },

    { id: 'docs',      type: 'boxNode',     position: { x: BX, y: Y(1) },
      data: { label: 'Gather Supporting Docs', sub: 'Receipts · quotes · auth forms', bg: P.tealLight, border: P.teal } },

    { id: 'pi-dec',    type: 'diamondNode', position: { x: DX, y: Y(2) },
      data: { label: 'PI Sign-off?', bg: P.yellowLight, border: '#b88800' } },
    { id: 'pi-rev',    type: 'boxNode',     position: { x: REJ, y: Y(2) },
      data: { label: 'Revise & Resubmit', sub: 'Address PI feedback', bg: P.salmonLight, border: P.salmon } },

    { id: 'admin',     type: 'boxNode',     position: { x: BX, y: Y(3) },
      data: { label: 'Program Admin Review', sub: 'Budget alignment check', bg: P.tealLight, border: P.teal } },

    { id: 'admin-dec', type: 'diamondNode', position: { x: DX, y: Y(4) },
      data: { label: 'Admin Approved?', bg: P.yellowLight, border: '#b88800' } },
    { id: 'admin-rev', type: 'boxNode',     position: { x: REJ, y: Y(4) },
      data: { label: 'Revise & Resubmit', sub: 'Address admin feedback', bg: P.salmonLight, border: P.salmon } },

    { id: 'finance',   type: 'boxNode',     position: { x: BX, y: Y(5) },
      data: { label: 'Grants Accounting', sub: 'Budget & compliance check', bg: P.cyanLight, border: P.cyan } },

    { id: 'budget-dec',type: 'diamondNode', position: { x: DX, y: Y(6) },
      data: { label: 'Budget Available?', bg: P.yellowLight, border: '#b88800' } },
    { id: 'defer',     type: 'boxNode',     position: { x: REJ, y: Y(6) },
      data: { label: 'Defer / Reallocate', sub: 'Adjust or defer to next period', bg: P.salmonLight, border: P.salmon } },

    { id: 'controller',type: 'boxNode',     position: { x: BX, y: Y(7) },
      data: { label: 'Controller Authorization', sub: 'Final institutional approval', bg: P.sageLight, border: P.sage } },

    { id: 'done',      type: 'ovalNode',    position: { x: OX, y: Y(8) },
      data: { label: '✅ Payment Processed', bg: '#5a9d62', link: '/payment-requests', linkLabel: 'Payments' } },
  ];

  const edges = [
    edge('e1',  'start',      'docs',        { color: P.teal }),
    edge('e2',  'docs',       'pi-dec',      { color: P.teal }),
    edge('e3',  'pi-dec',     'admin',       { color: P.sage,   sourceHandle: 'yes', label: '✓ Yes' }),
    edge('e4',  'pi-dec',     'pi-rev',      { color: P.salmon, sourceHandle: 'no',  label: '✗ No'  }),
    edge('e5',  'pi-rev',     'pi-dec',      { color: P.salmon }),
    edge('e6',  'admin',      'admin-dec',   { color: P.teal }),
    edge('e7',  'admin-dec',  'finance',     { color: P.sage,   sourceHandle: 'yes', label: '✓ Yes' }),
    edge('e8',  'admin-dec',  'admin-rev',   { color: P.salmon, sourceHandle: 'no',  label: '✗ No'  }),
    edge('e9',  'admin-rev',  'admin-dec',   { color: P.salmon }),
    edge('e10', 'finance',    'budget-dec',  { color: P.cyan }),
    edge('e11', 'budget-dec', 'controller',  { color: P.sage,   sourceHandle: 'yes', label: '✓ Yes' }),
    edge('e12', 'budget-dec', 'defer',       { color: P.salmon, sourceHandle: 'no',  label: '✗ No'  }),
    edge('e13', 'controller', 'done',        { color: P.sage, animated: true }),
  ];

  return { nodes, edges };
}

// ── 4. Grant Lifecycle ────────────────────────────────────────────────────────
function buildLifecycleFlow(grants) {
  const nodes = [], edges = [];

  const STAGES = [
    { id: 'st-pending',   label: '📋 Pending / Applied',  keys: ['pending'],              bg: P.yellowLight, border: '#b88800' },
    { id: 'st-active',    label: '🚀 Active / Running',   keys: ['active'],               bg: P.tealLight,   border: P.teal    },
    { id: 'st-reporting', label: '📊 Reporting Period',   keys: ['reporting'],            bg: P.cyanLight,   border: P.cyan    },
    { id: 'st-completed', label: '✅ Completed / Closed', keys: ['completed','rejected'], bg: P.sageLight,   border: P.sage    },
  ];

  const COL_W = 250, ROW_H = 110;

  STAGES.forEach((st, si) => {
    nodes.push({
      id: st.id, type: 'stageNode',
      position: { x: si * COL_W, y: 0 },
      data: { label: st.label, bg: st.bg, border: st.border },
    });
    if (si < STAGES.length - 1)
      edges.push(edge(`st-e-${si}`, st.id, STAGES[si + 1].id, { color: P.gray }));
  });

  const colCount = [0, 0, 0, 0];
  grants.forEach(grant => {
    const si     = STAGES.findIndex(st => st.keys.includes(grant.status));
    const colIdx = si === -1 ? 0 : si;
    const col    = STAGES[colIdx];
    const rowN   = colCount[colIdx]++;

    const pct = grant.aims?.length
      ? Math.round(grant.aims.reduce((s, a) => s + (a.completionPercentage ?? 0), 0) / grant.aims.length)
      : null;

    const yr1    = grant.startDate ? new Date(grant.startDate).getFullYear() : null;
    const yr2    = grant.endDate   ? new Date(grant.endDate).getFullYear()   : null;
    const period = yr1 || yr2 ? `${yr1 ?? '?'} – ${yr2 ?? '?'}` : null;

    nodes.push({
      id: `grant-${grant.id}`, type: 'boxNode',
      position: { x: colIdx * COL_W, y: 90 + rowN * ROW_H },
      data: {
        label: grant.title.length > 28 ? grant.title.slice(0, 28) + '…' : grant.title,
        sub: [grant.fundingAgency, period].filter(Boolean).join(' · '),
        bg: col.bg, border: col.border, pct,
        link: '/grants', linkLabel: 'Grants',
      },
    });
  });

  if (!grants.length) {
    nodes.push({
      id: 'empty', type: 'boxNode',
      position: { x: 0, y: 90 },
      data: { label: 'No grants yet', sub: 'Add grants in the Grants section', bg: P.grayLight, border: P.gray },
    });
  }

  return { nodes, edges };
}

// ── Chart definitions ─────────────────────────────────────────────────────────
const CHARTS = [
  { id: 'logic',      label: 'Program Logic Model', icon: LayoutGrid, needsGrant: true,
    tip: 'Maps your grant from inputs → activities → outputs → outcomes. Click nodes to open the Grants page.' },
  { id: 'dependency', label: 'Task Dependencies',   icon: Network,    needsGrant: true,
    tip: 'How grant activities depend on each other — spot bottlenecks. Click a node to open Grants.' },
  { id: 'approval',   label: 'Approval Pipeline',   icon: GitBranch,  needsGrant: false,
    tip: 'Standard approval flow for expenses and payment requests. Click Start / End to open Payments.' },
  { id: 'lifecycle',  label: 'Grant Lifecycle',     icon: Milestone,  needsGrant: false,
    tip: 'All grants in their current stage. Click any grant card to open the Grants page.' },
];

// ── Main Component ────────────────────────────────────────────────────────────
const FlowchartView = () => {
  const { grants } = useApp();
  const [activeChart, setActiveChart]       = useState('logic');
  const [selectedGrantId, setSelectedGrantId] = useState(grants[0]?.id ?? '');

  const selectedGrant = grants.find(g => g.id === selectedGrantId) ?? grants[0] ?? null;
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
          const Icon   = c.icon;
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
      {chart?.needsGrant && !grants.length && (
        <div className="text-center py-16 text-gray-400">
          <Network size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">No grants yet</p>
          <p className="text-sm mt-1">Add a grant in the Grants section to generate this diagram.</p>
        </div>
      )}

      {/* ReactFlow canvas */}
      {(grants.length > 0 || !chart?.needsGrant) && (
        <div
          style={{ height: 640, borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e0c8' }}
          className="bg-surface-50"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.12}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#c8bfa4" gap={24} size={1} />
            <Controls />
          </ReactFlow>
        </div>
      )}

      {/* Per-chart legends */}
      {activeChart === 'approval' && (
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: P.teal }} /> Process step
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 inline-block rotate-45" style={{ background: '#f9d779' }} /> Decision
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: P.teal }} /> Start / End
          </span>
          <span style={{ color: '#5a9d62' }}>Green arrow = approved path</span>
          <span style={{ color: P.salmon }}>Salmon arrow = rejected / loop back</span>
          <span style={{ color: P.teal, fontStyle: 'italic' }}>Click Start or End to open Payments</span>
        </div>
      )}
      {activeChart === 'dependency' && (
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
          <span>Node color = activity status.</span>
          <span style={{ color: P.salmon }}>Animated arrows = must complete first.</span>
          <span style={{ color: P.teal, fontStyle: 'italic' }}>Click a node to open Grants. Drag to rearrange.</span>
        </div>
      )}
      {activeChart === 'lifecycle' && (
        <div className="mt-3 text-xs text-gray-400 italic">
          Click any grant card to open Grants. Change stage by updating grant Status in the Grants section.
        </div>
      )}
      {activeChart === 'logic' && (
        <div className="mt-3 text-xs text-gray-400 italic">
          Click activity or output nodes to open Grants.
        </div>
      )}
    </div>
  );
};

export default FlowchartView;
