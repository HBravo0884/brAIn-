import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronDown, ChevronRight, Calendar, AlertCircle,
  CheckCircle2, Clock, Circle, Minus,
} from 'lucide-react';

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS = {
  completed:     { bar: '#5a9d62', light: '#dff0e2', label: 'Completed' },
  active:        { bar: '#097c87', light: '#d0ecef', label: 'Active' },
  'in-progress': { bar: '#097c87', light: '#d0ecef', label: 'In Progress' },
  pending:       { bar: '#c8bfa4', light: '#f5f0dc', label: 'Pending' },
  'not-started': { bar: '#c8bfa4', light: '#f5f0dc', label: 'Not Started' },
  delayed:       { bar: '#e86535', light: '#fdd0b8', label: 'Delayed' },
  rejected:      { bar: '#dc2626', light: '#fee2e2', label: 'Rejected' },
};
const getStatus = (key) => STATUS[key] || STATUS.pending;

// ── Helpers ────────────────────────────────────────────────────────────────────
const parseDate = (str) => {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d) ? null : d;
};
const fmt = (date) =>
  date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// Snap to first day of month
const snapStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
// Snap to last day of month
const snapEnd   = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

// ── Legend ─────────────────────────────────────────────────────────────────────
const LEGEND = [
  { color: '#097c87', label: 'Active / In-Progress' },
  { color: '#5a9d62', label: 'Completed' },
  { color: '#c8bfa4', label: 'Not Started / Pending' },
  { color: '#e86535', label: 'Delayed' },
];

// ── Tooltip ────────────────────────────────────────────────────────────────────
function Tooltip({ data, style }) {
  if (!data) return null;
  return (
    <div
      className="fixed z-50 bg-gray-900 text-white text-xs rounded-xl shadow-xl px-3 py-2 pointer-events-none max-w-xs"
      style={style}
    >
      <p className="font-semibold mb-0.5 leading-snug">{data.label}</p>
      {data.lines.map((l, i) => <p key={i} className="text-gray-300">{l}</p>)}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const GanttChart = () => {
  const { grants } = useApp();
  const [collapsed,  setCollapsed]  = useState({});
  const [zoom,       setZoom]       = useState('year'); // 6mo | year | all
  const [tooltip,    setTooltip]    = useState(null);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Grants that have at least a start or end date
  const activeGrants = grants.filter(g => g.startDate || g.endDate);

  // ── Date range ──────────────────────────────────────────────────────────────
  const { minDate, maxDate } = useMemo(() => {
    if (zoom === '6mo') {
      const s = new Date(today); s.setMonth(s.getMonth() - 1);
      const e = new Date(today); e.setMonth(e.getMonth() + 5);
      return { minDate: snapStart(s), maxDate: snapEnd(e) };
    }
    if (zoom === 'year') {
      const s = new Date(today); s.setMonth(s.getMonth() - 2);
      const e = new Date(today); e.setFullYear(e.getFullYear() + 1);
      return { minDate: snapStart(s), maxDate: snapEnd(e) };
    }
    // 'all' — span all grant dates
    const dates = [];
    activeGrants.forEach(g => {
      if (g.startDate) dates.push(parseDate(g.startDate));
      if (g.endDate)   dates.push(parseDate(g.endDate));
      (g.aims || []).forEach(a => {
        if (a.targetDate) dates.push(parseDate(a.targetDate));
        (a.milestones || []).forEach(m => {
          if (m.targetDate) dates.push(parseDate(m.targetDate));
        });
      });
    });
    const valid = dates.filter(Boolean);
    if (!valid.length) {
      const s = new Date(today); s.setMonth(s.getMonth() - 2);
      const e = new Date(today); e.setFullYear(e.getFullYear() + 1);
      return { minDate: snapStart(s), maxDate: snapEnd(e) };
    }
    const minD = new Date(Math.min(...valid));
    const maxD = new Date(Math.max(...valid));
    // add 1 month padding
    minD.setMonth(minD.getMonth() - 1);
    maxD.setMonth(maxD.getMonth() + 1);
    return { minDate: snapStart(minD), maxDate: snapEnd(maxD) };
  }, [zoom, activeGrants, today]);

  const totalMs = maxDate - minDate;
  const toPct = (date) => {
    if (!date) return null;
    const pct = (date - minDate) / totalMs * 100;
    return Math.max(0, Math.min(100, pct));
  };

  // ── Month columns ───────────────────────────────────────────────────────────
  const months = useMemo(() => {
    const arr = [];
    const c = new Date(minDate);
    while (c <= maxDate) {
      arr.push(new Date(c));
      c.setMonth(c.getMonth() + 1);
    }
    return arr;
  }, [minDate, maxDate]);

  const COL_W = Math.max(60, Math.min(120, Math.floor(900 / months.length)));
  const CHART_W = months.length * COL_W;
  const LABEL_W = 240;
  const ROW_H = 42;
  const HEADER_H = 56;

  const todayPct = toPct(today);

  // ── Build rows ──────────────────────────────────────────────────────────────
  const rows = useMemo(() => {
    const result = [];
    for (const grant of grants) {
      const gStart = parseDate(grant.startDate);
      const gEnd   = parseDate(grant.endDate);
      result.push({ type: 'grant', id: grant.id, grant, start: gStart, end: gEnd });

      if (collapsed[grant.id]) continue;

      for (const aim of (grant.aims || [])) {
        const aEnd = parseDate(aim.targetDate);
        result.push({ type: 'aim', id: aim.id, aim, grant, start: gStart, end: aEnd });

        for (const ms of (aim.milestones || [])) {
          const msDate = parseDate(ms.targetDate);
          result.push({ type: 'milestone', id: ms.id, ms, aim, grant, date: msDate });
        }
      }
    }
    return result;
  }, [grants, collapsed]);

  // ── Tooltip handlers ────────────────────────────────────────────────────────
  const showTooltip = (e, data) => {
    setTooltip({ data, x: e.clientX + 14, y: e.clientY - 10 });
  };
  const hideTooltip = () => setTooltip(null);

  // ── Empty states ─────────────────────────────────────────────────────────────
  if (grants.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-600 mb-1">No grants yet</h3>
        <p className="text-gray-400 text-sm">Add grants in the Grants section to see them on the timeline.</p>
      </div>
    );
  }

  if (activeGrants.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={48} className="mx-auto text-amber-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-600 mb-1">No dates set on grants</h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Open a grant and set its Start Date and End Date — then come back here to see the Gantt chart.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">Grant Timeline</h3>
          <p className="text-xs text-gray-500">
            {grants.length} grant{grants.length !== 1 ? 's' : ''} · click ▶ to expand aims and milestones
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3">
            {LEGEND.map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
          {/* Zoom */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[['6mo','6 Months'],['year','1 Year'],['all','All']].map(([v, lbl]) => (
              <button
                key={v}
                onClick={() => setZoom(v)}
                title={`Show ${lbl} of timeline`}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  zoom === v ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <div style={{ display: 'flex', minWidth: LABEL_W + CHART_W }}>

            {/* ── Left: label column ───────────────────────────────────────── */}
            <div style={{ width: LABEL_W, flexShrink: 0 }} className="bg-white border-r border-gray-200 z-10">
              {/* Header */}
              <div style={{ height: HEADER_H }} className="border-b border-gray-200 flex items-end px-3 pb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Grant / Aim / Milestone</span>
              </div>
              {/* Rows */}
              {rows.map((row) => (
                <div
                  key={row.type + row.id}
                  style={{ height: ROW_H }}
                  className={`flex items-center border-b border-gray-100 ${
                    row.type === 'grant' ? 'bg-surface-50' :
                    row.type === 'aim' ? 'pl-5' : 'pl-10'
                  }`}
                >
                  {row.type === 'grant' && (
                    <button
                      onClick={() => setCollapsed(c => ({ ...c, [row.id]: !c[row.id] }))}
                      title={collapsed[row.id] ? 'Expand to show aims and milestones' : 'Collapse'}
                      className="ml-2 mr-1 flex-shrink-0 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      {collapsed[row.id]
                        ? <ChevronRight size={14} />
                        : <ChevronDown  size={14} />
                      }
                    </button>
                  )}
                  {row.type === 'milestone' && (
                    <span className="mr-1 text-gray-400 flex-shrink-0">◇</span>
                  )}
                  {row.type === 'aim' && (
                    <span className="w-2 h-2 rounded-sm flex-shrink-0 mr-2"
                      style={{ backgroundColor: getStatus(row.aim.status).bar }} />
                  )}
                  <span
                    className={`text-xs truncate ${
                      row.type === 'grant'     ? 'font-semibold text-gray-800' :
                      row.type === 'aim'       ? 'text-gray-700' :
                                                 'text-gray-500'
                    }`}
                    title={
                      row.type === 'grant'
                        ? `${row.grant.title}${row.grant.fundingAgency ? ' · ' + row.grant.fundingAgency : ''}`
                        : row.type === 'aim'
                        ? `${row.aim.number ? row.aim.number + ': ' : ''}${row.aim.title}`
                        : row.ms.title
                    }
                  >
                    {row.type === 'grant'
                      ? row.grant.title
                      : row.type === 'aim'
                      ? `${row.aim.number ? row.aim.number + ': ' : ''}${row.aim.title}`
                      : row.ms.title
                    }
                  </span>
                </div>
              ))}
            </div>

            {/* ── Right: timeline ──────────────────────────────────────────── */}
            <div style={{ width: CHART_W, flexShrink: 0, position: 'relative' }}>

              {/* Month headers */}
              <div
                style={{ height: HEADER_H, display: 'flex', position: 'sticky', top: 0, zIndex: 5, background: '#fff' }}
                className="border-b border-gray-200"
              >
                {months.map((month, i) => {
                  const isNewYear = month.getMonth() === 0;
                  return (
                    <div
                      key={i}
                      style={{ width: COL_W, flexShrink: 0 }}
                      className={`border-r border-gray-100 flex flex-col justify-end pb-1.5 px-2 ${
                        isNewYear ? 'border-l-2 border-l-primary-300' : ''
                      }`}
                    >
                      {isNewYear && (
                        <span className="text-xs font-bold text-primary-600">{month.getFullYear()}</span>
                      )}
                      <span className={`text-xs ${isNewYear ? 'text-primary-500 font-medium' : 'text-gray-400'}`}>
                        {month.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Grid columns */}
              <div style={{ position: 'absolute', inset: `${HEADER_H}px 0 0 0`, display: 'flex', pointerEvents: 'none' }}>
                {months.map((month, i) => (
                  <div
                    key={i}
                    style={{ width: COL_W, flexShrink: 0 }}
                    className={`border-r border-gray-100 h-full ${month.getMonth() === 0 ? 'border-l-2 border-l-primary-200' : ''}`}
                  />
                ))}
              </div>

              {/* Today line */}
              {todayPct >= 0 && todayPct <= 100 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${todayPct}%`,
                    width: 2,
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                  className="bg-red-400 opacity-80"
                >
                  <div
                    className="absolute top-1 -translate-x-1/2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap font-medium"
                    style={{ fontSize: 10 }}
                  >
                    Today
                  </div>
                </div>
              )}

              {/* Rows */}
              {rows.map((row) => {
                const top  = /* header */ 0;
                const cfg  = row.type === 'grant'
                  ? getStatus(row.grant.status)
                  : row.type === 'aim'
                  ? getStatus(row.aim.status)
                  : getStatus(row.ms?.status || (row.ms?.completed ? 'completed' : 'pending'));

                if (row.type === 'milestone') {
                  const datePct = toPct(row.date);
                  if (datePct === null) return (
                    <div key={row.type + row.id} style={{ height: ROW_H }} className="border-b border-gray-100" />
                  );
                  return (
                    <div key={row.type + row.id} style={{ height: ROW_H, position: 'relative' }} className="border-b border-gray-100">
                      <div
                        style={{
                          position: 'absolute',
                          left: `${datePct}%`,
                          top: '50%',
                          transform: 'translate(-50%,-50%) rotate(45deg)',
                          width: 12,
                          height: 12,
                          backgroundColor: cfg.bar,
                          border: '2px solid white',
                          borderRadius: 2,
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                        onMouseEnter={e => showTooltip(e, {
                          label: row.ms.title,
                          lines: [
                            `Status: ${cfg.label}`,
                            `Due: ${fmt(row.date)}`,
                            row.ms.completed && row.ms.completedDate ? `Completed: ${fmt(parseDate(row.ms.completedDate))}` : null,
                            row.ms.description ? row.ms.description : null,
                          ].filter(Boolean),
                        })}
                        onMouseLeave={hideTooltip}
                      />
                    </div>
                  );
                }

                // Bar row (grant or aim)
                const barStart = row.start;
                const barEnd   = row.end;
                const startPct = barStart ? toPct(barStart) : null;
                const endPct   = barEnd   ? toPct(barEnd)   : null;

                const barH    = row.type === 'grant' ? 20 : 14;
                const barTop  = (ROW_H - barH) / 2;
                const completion = row.type === 'aim' ? (row.aim.completionPercentage || 0) : null;

                return (
                  <div key={row.type + row.id} style={{ height: ROW_H, position: 'relative' }} className="border-b border-gray-100">
                    {startPct !== null && endPct !== null && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${startPct}%`,
                          width: `${Math.max(0.8, endPct - startPct)}%`,
                          top: barTop,
                          height: barH,
                          borderRadius: 6,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}
                        onMouseEnter={e => showTooltip(e, {
                          label: row.type === 'grant'
                            ? row.grant.title
                            : `${row.aim.number ? row.aim.number + ': ' : ''}${row.aim.title}`,
                          lines: [
                            `Status: ${cfg.label}`,
                            `${fmt(barStart)} → ${fmt(barEnd)}`,
                            completion !== null ? `Progress: ${completion}%` : null,
                            row.type === 'grant' && row.grant.fundingAgency ? `Funder: ${row.grant.fundingAgency}` : null,
                            row.type === 'grant' && row.grant.amount ? `Amount: $${row.grant.amount.toLocaleString()}` : null,
                            row.type === 'aim' && row.aim.description ? row.aim.description : null,
                          ].filter(Boolean),
                        })}
                        onMouseLeave={hideTooltip}
                      >
                        {/* Track (light bg) */}
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: cfg.light }} />
                        {/* Fill (progress or full) */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0, bottom: 0, left: 0,
                            width: completion !== null ? `${completion}%` : '100%',
                            backgroundColor: cfg.bar,
                            opacity: completion !== null ? 1 : 0.7,
                          }}
                        />
                        {/* % label inside bar */}
                        {completion !== null && completion > 10 && (
                          <span
                            style={{
                              position: 'absolute', right: 4, top: 0, bottom: 0,
                              display: 'flex', alignItems: 'center',
                              fontSize: 9, fontWeight: 700, color: '#fff',
                              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                            }}
                          >
                            {completion}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* If only one date available, show a small indicator */}
                    {startPct !== null && endPct === null && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${startPct}%`,
                          top: barTop,
                          height: barH,
                          width: barH,
                          borderRadius: '50%',
                          backgroundColor: cfg.bar,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => showTooltip(e, {
                          label: row.type === 'grant' ? row.grant.title : row.aim.title,
                          lines: [`Start: ${fmt(barStart)}`, 'End date not set'],
                        })}
                        onMouseLeave={hideTooltip}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status key (mobile) */}
      <div className="flex sm:hidden flex-wrap gap-3 mt-3">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
            <span className="text-xs text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <Tooltip
          data={tooltip.data}
          style={{ top: tooltip.y, left: tooltip.x }}
        />
      )}
    </div>
  );
};

export default GanttChart;
