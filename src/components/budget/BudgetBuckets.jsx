import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronRight, Home, Droplets, ArrowLeft } from 'lucide-react';

// Module-level unique ID generator (avoids SSR issues with useId)
let _uid = 0;
const useUID = () => {
  const ref = useRef(null);
  if (ref.current === null) ref.current = `bkt${++_uid}`;
  return ref.current;
};

// ─── Bucket SVG Visual ────────────────────────────────────────────────────────
const BucketVisual = ({ percentRemaining, size = 'md' }) => {
  const uid = useUID();

  const dims = { sm: { w: 72, h: 86 }, md: { w: 92, h: 114 }, lg: { w: 110, h: 138 } };
  const { w, h } = dims[size] ?? dims.md;
  const padTop = 18;
  const inset = w * 0.11; // bucket narrows by this much at the bottom on each side

  // Bucket trapezoid: wider at top, narrower at bottom
  const bucketPts = `0,${padTop} ${w},${padTop} ${w - inset},${padTop + h} ${inset},${padTop + h}`;

  const clamped = Math.min(Math.max(percentRemaining, 0), 100);
  const fillH  = (clamped / 100) * h;          // liquid height (remaining %)
  const fillY  = padTop + h - fillH;            // top of liquid surface (y)
  const tEdge  = 1 - clamped / 100;            // fraction from top → used for edge x calc
  const fLx    = tEdge * inset;                 // left x of liquid surface
  const fRx    = w - tEdge * inset;             // right x of liquid surface
  const fillPts = `${fLx},${fillY} ${fRx},${fillY} ${w - inset},${padTop + h} ${inset},${padTop + h}`;

  // Color: blue=healthy → amber=caution → orange=low → red=critical
  const color =
    clamped > 55 ? '#2563eb' :
    clamped > 30 ? '#d97706' :
    clamped > 15 ? '#ea580c' :
    '#dc2626';

  // Text sits at vertical center of bucket; detect if that's inside the liquid
  const cx = w / 2;
  const cy = padTop + h / 2;
  const textInLiquid = clamped > 50;
  const textFill      = textInLiquid ? 'white'                   : '#1f2937';
  const subTextFill   = textInLiquid ? 'rgba(255,255,255,0.75)' : '#6b7280';
  const fs = size === 'sm' ? 11 : 13;

  return (
    <svg width={w} height={padTop + h + 6} viewBox={`0 0 ${w} ${padTop + h + 6}`}>
      <defs>
        <clipPath id={`${uid}c`}>
          <polygon points={bucketPts} />
        </clipPath>
        <linearGradient id={`${uid}g`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.70" />
          <stop offset="100%" stopColor={color} stopOpacity="0.94" />
        </linearGradient>
        {/* Shine overlay on liquid */}
        <linearGradient id={`${uid}s`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%"   stopColor="white" stopOpacity="0.18" />
          <stop offset="50%"  stopColor="white" stopOpacity="0.06" />
          <stop offset="100%" stopColor="white" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* Bucket background */}
      <polygon points={bucketPts} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="3" strokeLinejoin="round" />

      {/* Liquid fill */}
      {fillH > 0 && (
        <>
          <polygon points={fillPts} fill={`url(#${uid}g)`} clipPath={`url(#${uid}c)`} />
          {/* Shine on liquid */}
          <polygon points={fillPts} fill={`url(#${uid}s)`} clipPath={`url(#${uid}c)`} />
        </>
      )}

      {/* Wave at liquid surface */}
      {fillH > 5 && clamped < 97 && (
        <path
          d={`M${fLx},${fillY}
              Q${fLx + (fRx - fLx) * 0.25},${fillY - 4}
               ${fLx + (fRx - fLx) * 0.50},${fillY}
              Q${fLx + (fRx - fLx) * 0.75},${fillY + 4}
               ${fRx},${fillY}`}
          fill="none" stroke="white" strokeWidth="1.5" opacity="0.5"
          clipPath={`url(#${uid}c)`}
        />
      )}

      {/* Percentage remaining text */}
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
        fill={textFill} fontSize={fs} fontWeight="700" fontFamily="system-ui, sans-serif">
        {clamped.toFixed(0)}%
      </text>
      <text x={cx} y={cy + fs} textAnchor="middle" dominantBaseline="middle"
        fill={subTextFill} fontSize={size === 'sm' ? 8 : 9} fontFamily="system-ui, sans-serif">
        remaining
      </text>

      {/* Bucket handle arc */}
      <path
        d={`M${w * 0.22},${padTop + 1} A${w * 0.28},${padTop * 0.85} 0 0,1 ${w * 0.78},${padTop + 1}`}
        fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
      />
    </svg>
  );
};

// ─── Individual Bucket Card ───────────────────────────────────────────────────
const BucketCard = ({ title, subtitle, allocated, spent, onClick, clickable = true, size = 'md', dimmed = false }) => {
  const remaining       = allocated - spent;
  const percentRemaining = allocated > 0 ? Math.max((remaining / allocated) * 100, 0) : 100;

  const borderColor =
    percentRemaining > 55 ? 'border-blue-200'   :
    percentRemaining > 30 ? 'border-amber-300'  :
    percentRemaining > 15 ? 'border-orange-300' :
    'border-red-400';

  const fmt = (n) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` :
    n >= 1_000     ? `$${(n / 1_000).toFixed(0)}K`      :
    `$${n.toLocaleString()}`;

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`flex flex-col items-center p-5 rounded-2xl bg-white shadow-md border-2 ${borderColor}
        transition-all duration-200 select-none
        ${clickable ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03]' : 'cursor-default'}
        ${dimmed ? 'opacity-60' : ''}`}
    >
      <BucketVisual percentRemaining={percentRemaining} size={size} />

      <div className="mt-3 w-full text-center">
        <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">{subtitle}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-3 w-full grid grid-cols-3 gap-1 border-t border-gray-100 pt-2 text-center">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Budget</p>
          <p className="text-xs font-bold text-gray-700">{fmt(allocated)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Spent</p>
          <p className="text-xs font-bold text-orange-600">{fmt(spent)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Left</p>
          <p className="text-xs font-bold text-green-600">{fmt(Math.max(remaining, 0))}</p>
        </div>
      </div>

      {clickable && (
        <p className="text-[10px] text-primary-500 mt-2 font-semibold tracking-wide uppercase">
          Drill Down →
        </p>
      )}
    </div>
  );
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
const Breadcrumb = ({ crumbs, onNavigate }) => (
  <nav className="flex items-center flex-wrap gap-1 text-sm mb-6">
    {crumbs.map((crumb, i) => {
      const isLast = i === crumbs.length - 1;
      return (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-gray-400" />}
          {isLast ? (
            <span className="flex items-center gap-1 font-semibold text-gray-800">
              {i === 0 && <Home size={14} />}
              {crumb.label}
            </span>
          ) : (
            <button
              onClick={() => onNavigate(i)}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium hover:underline"
            >
              {i === 0 && <Home size={14} />}
              {crumb.label}
            </button>
          )}
        </span>
      );
    })}
  </nav>
);

// ─── Color Legend ─────────────────────────────────────────────────────────────
const Legend = () => (
  <div className="flex items-center gap-4 text-xs text-gray-500 mb-6 flex-wrap">
    <span className="font-medium text-gray-600">Budget health:</span>
    {[
      { color: 'bg-blue-500',   label: '>55% left' },
      { color: 'bg-amber-500',  label: '30–55% left' },
      { color: 'bg-orange-500', label: '15–30% left' },
      { color: 'bg-red-500',    label: '<15% left' },
    ].map(({ color, label }) => (
      <span key={label} className="flex items-center gap-1.5">
        <span className={`inline-block w-3 h-3 rounded-full ${color}`} />
        {label}
      </span>
    ))}
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Match a budget category name to an aim number (e.g. "Aim 1")
const categoryMatchesAim = (catName, aimNumber) => {
  const cat  = (catName  || '').toLowerCase().trim();
  const aim  = (aimNumber || '').toLowerCase().trim(); // e.g. "aim 1"
  const compact = aim.replace(/\s+/g, '');             // "aim1"
  return (
    cat === aim            ||
    cat === compact        ||
    cat.startsWith(aim + ' ')  ||
    cat.startsWith(aim + '-')  ||
    cat.startsWith(aim + ':')  ||
    cat.startsWith(compact + '-')
  );
};

// Sum actual expenses for an aim from all budget categories
const calcAimSpent = (aimNumber, budgets) => {
  let spent = 0;
  budgets.forEach(budget => {
    (budget.categories || []).forEach(cat => {
      if (categoryMatchesAim(cat.name, aimNumber)) {
        (cat.miniPools || []).forEach(pool => {
          (pool.expenses || []).forEach(exp => {
            if (exp.spent !== false) spent += exp.amount || 0;
          });
        });
      }
    });
  });
  return spent;
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ message, sub }) => (
  <div className="text-center py-20">
    <Droplets size={56} className="mx-auto text-gray-300 mb-4" />
    <p className="text-gray-600 text-lg font-medium">{message}</p>
    {sub && <p className="text-gray-400 text-sm mt-1">{sub}</p>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const BudgetBuckets = () => {
  const { grants, budgets } = useApp();

  // Navigation stack: each entry describes the current view
  const [nav, setNav] = useState([{ level: 'aims', label: 'All Aims' }]);
  const current = nav[nav.length - 1];

  const navigateTo = (index) => setNav(nav.slice(0, index + 1));
  const goBack     = ()      => setNav(nav.slice(0, -1));

  const drillToSubAims = (grant, aim) => {
    if (!(aim.subAims || []).length) return;
    setNav([...nav, { level: 'subAims', label: aim.number, grant, aim }]);
  };

  const drillToActivities = (grant, aim, subAim) => {
    if (!(subAim.activities || []).length) return;
    setNav([...nav, { level: 'activities', label: subAim.title, grant, aim, subAim }]);
  };

  // ── Level 1: Aims ────────────────────────────────────────────────────────
  const renderAims = () => {
    const buckets = grants.flatMap(grant =>
      (grant.aims || []).map(aim => ({
        key: aim.id,
        title: aim.number,
        subtitle: aim.title?.replace(/^Aim \d+\s*[-–]\s*/, '') || '',
        allocated: aim.budgetAllocation || 0,
        spent: calcAimSpent(aim.number, budgets),
        clickable: (aim.subAims || []).length > 0,
        onDrill: () => drillToSubAims(grant, aim),
      }))
    );

    if (!buckets.length) {
      return (
        <EmptyState
          message="No aims found"
          sub="Create a grant with aims and a budget to see bucket visualization"
        />
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {buckets.map(b => (
          <BucketCard
            key={b.key}
            title={b.title}
            subtitle={b.subtitle}
            allocated={b.allocated}
            spent={b.spent}
            clickable={b.clickable}
            onClick={b.onDrill}
          />
        ))}
      </div>
    );
  };

  // ── Level 2: Sub-Aims ────────────────────────────────────────────────────
  const renderSubAims = () => {
    const { aim, grant } = current;
    const subAims = aim.subAims || [];

    if (!subAims.length) {
      return <EmptyState message={`No sub-aims for ${aim.number}`} />;
    }

    // Proportionally distribute aim's actual spending across sub-aims by allocation
    const aimSpent      = calcAimSpent(aim.number, budgets);
    const totalAlloc    = subAims.reduce((s, sa) => s + (sa.budgetAllocation || 0), 0);

    return (
      <>
        {/* Parent aim context banner */}
        <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
          <Droplets size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">{aim.number}: {aim.title}</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Total allocated: ${(aim.budgetAllocation || 0).toLocaleString()} · Actual spent: ${aimSpent.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {subAims.map(sa => {
            const allocated = sa.budgetAllocation || 0;
            const proportion = totalAlloc > 0 ? allocated / totalAlloc : 0;
            const spent = Math.round(aimSpent * proportion);
            const hasActivities = (sa.activities || []).length > 0;

            return (
              <BucketCard
                key={sa.id}
                title={`${sa.number ? `${sa.number} — ` : ''}${sa.title}`}
                allocated={allocated}
                spent={spent}
                clickable={hasActivities}
                onClick={() => drillToActivities(grant, aim, sa)}
              />
            );
          })}
        </div>
      </>
    );
  };

  // ── Level 3: Activities ──────────────────────────────────────────────────
  const renderActivities = () => {
    const { subAim, aim } = current;
    const activities = subAim.activities || [];

    if (!activities.length) {
      return <EmptyState message="No activities for this sub-aim" />;
    }

    return (
      <>
        {/* Sub-aim context banner */}
        <div className="mb-5 p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-start gap-3">
          <Droplets size={20} className="text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-800">
              {aim.number}{subAim.number ? ` · Sub-Aim ${subAim.number}` : ''}: {subAim.title}
            </p>
            <p className="text-xs text-purple-600 mt-0.5">
              Budget allocated: ${(subAim.budgetAllocation || 0).toLocaleString()} · {activities.length} activities
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {activities.map(act => (
            <BucketCard
              key={act.id}
              title={act.title}
              subtitle={act.owner || ''}
              allocated={act.budgetAmount || 0}
              spent={0}
              clickable={false}
              size="sm"
            />
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Activity buckets show allocated budget. Spending is tracked at the Aim level.
        </p>
      </>
    );
  };

  return (
    <div>
      {/* Breadcrumb + Back */}
      <div className="flex items-center justify-between mb-2">
        <Breadcrumb crumbs={nav.map(n => ({ label: n.label }))} onNavigate={navigateTo} />
        {nav.length > 1 && (
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </button>
        )}
      </div>

      <Legend />

      {current.level === 'aims'       && renderAims()}
      {current.level === 'subAims'    && renderSubAims()}
      {current.level === 'activities' && renderActivities()}
    </div>
  );
};

export default BudgetBuckets;
