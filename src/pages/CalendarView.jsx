import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { expandObligations } from '../data/obligations';

// ── constants ─────────────────────────────────────────────────────────────────
const EVENT_TYPES = {
  meeting:    { label: 'Meeting',    bg: '#d0ecef', border: '#097c87', text: '#097c87', link: '/meetings'  },
  task:       { label: 'Task',       bg: '#fdd0b8', border: '#fca47c', text: '#c44c22', link: '/workflows' },
  milestone:  { label: 'Milestone',  bg: '#dff0e2', border: '#a1cca6', text: '#3d7a42', link: '/grants'    },
  deadline:   { label: 'Deadline',   bg: '#fef9e0', border: '#f9d779', text: '#856a00', link: '/grants'    },
  obligation: { label: 'Obligation', bg: '#ede9fe', border: '#7c3aed', text: '#5b21b6', link: null        },
};

const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Time grid: 8 AM – 10 PM in 30-min slots
const GRID_START = 8;
const GRID_END   = 22;
const SLOT_MINS  = 30;
const ROW_H      = 52; // px per 30-min slot

const TIME_SLOTS = (() => {
  const s = [];
  for (let h = GRID_START; h < GRID_END; h++) {
    for (let m = 0; m < 60; m += SLOT_MINS) {
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
      s.push({ h, m, label: `${h12}:${String(m).padStart(2,'0')} ${ampm}` });
    }
  }
  return s;
})();

// ── helpers ───────────────────────────────────────────────────────────────────
const ymd = (d) => d ? d.split('T')[0] : null;

const fmt = (d) => {
  if (!d) return '';
  return new Date(d + (d.includes('T') ? '' : 'T00:00')).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtTime = (d) => {
  if (!d || !d.includes('T')) return '';
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const addDays = (d, n) => {
  const o = new Date(d + 'T00:00:00');
  o.setDate(o.getDate() + n);
  return o.toISOString().split('T')[0];
};

const getWeekStart = (d) => {
  const o = new Date(d + 'T00:00:00');
  o.setDate(o.getDate() - o.getDay());
  return o.toISOString().split('T')[0];
};

const fmtWeekRange = (ws) => {
  const s = new Date(ws + 'T00:00:00');
  const e = new Date(ws + 'T00:00:00');
  e.setDate(e.getDate() + 6);
  return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const fmtDayFull = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

// ── main component ────────────────────────────────────────────────────────────
const CalendarView = () => {
  const { meetings, tasks, grants } = useApp();
  const navigate  = useNavigate();
  const today     = new Date();
  const todayYMD  = ymd(today.toISOString());

  const [view,         setView]         = useState('month');
  const [year,         setYear]         = useState(today.getFullYear());
  const [month,        setMonth]        = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [wkStart,      setWkStart]      = useState(() => getWeekStart(todayYMD));
  const [dayDate,      setDayDate]      = useState(todayYMD);

  // ── navigation ────────────────────────────────────────────────────────────
  const prevPeriod = () => {
    if (view === 'month') {
      if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
      setSelectedDate(null);
    }
    if (view === 'week') setWkStart(ws => addDays(ws, -7));
    if (view === 'day')  setDayDate(d  => addDays(d,  -1));
  };
  const nextPeriod = () => {
    if (view === 'month') {
      if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
      setSelectedDate(null);
    }
    if (view === 'week') setWkStart(ws => addDays(ws, 7));
    if (view === 'day')  setDayDate(d  => addDays(d,  1));
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(todayYMD);
    setWkStart(getWeekStart(todayYMD));
    setDayDate(todayYMD);
  };

  // ── event aggregation ─────────────────────────────────────────────────────
  const eventsByDay = useMemo(() => {
    const map = {};
    const TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;

    const addEv = (dateStr, ev) => {
      const k = ymd(dateStr);
      if (!k) return;
      (map[k] ??= []).push(ev);
    };

    meetings.forEach(m => {
      if (!m.date) return;
      const hasTime = m.date.includes('T');
      let evH, evM;
      if (hasTime) {
        const [, t] = m.date.split('T');
        [evH, evM] = t.split(':').map(Number);
      }
      const recType = m.recurrence?.type;

      const mkEv = (ds, lbl) => ({
        type: 'meeting', label: lbl, id: m.id,
        detail: hasTime ? fmtTime(ds) + (m.attendees ? ' · ' + m.attendees.split(',').length + ' attendees' : '') : '',
        ...(hasTime ? { h: evH, m: evM } : { allDay: true }),
      });

      if (!recType || recType === 'none') {
        addEv(m.date, mkEv(m.date, m.title));
      } else {
        const endLimit = m.recurrence.endDate
          ? new Date(m.recurrence.endDate + 'T23:59:59')
          : new Date(Date.now() + TWO_YEARS);
        const tPart = hasTime ? m.date.split('T')[1] : '';
        let cur = new Date(m.date.split('T')[0] + 'T00:00:00');
        while (cur <= endLimit) {
          const ds = cur.toISOString().split('T')[0] + (tPart ? 'T' + tPart : '');
          addEv(ds, mkEv(ds, `🔁 ${m.title}`));
          if (recType === 'monthly')
            cur = new Date(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
          else {
            const d = recType === 'biweekly' ? 14 : 7;
            cur = new Date(cur.getTime() + d * 86400000);
          }
        }
      }
    });

    tasks.forEach(t => {
      if (t.dueDate)
        addEv(t.dueDate, { type: 'task', label: t.title, id: t.id, detail: `Status: ${t.status ?? 'To Do'}`, allDay: true });
    });

    grants.forEach(g => {
      if (g.endDate)
        addEv(g.endDate, { type: 'deadline', label: `${g.title} — End Date`, id: g.id, detail: g.fundingAgency ?? '', allDay: true });
      (g.aims ?? []).forEach(aim => {
        if (aim.targetDate)
          addEv(aim.targetDate, { type: 'deadline', label: `${aim.number ?? 'Aim'}: ${aim.title}`, id: aim.id, detail: g.title, allDay: true });
        (aim.milestones ?? []).forEach(ms => {
          if (ms.targetDate)
            addEv(ms.targetDate, { type: 'milestone', label: ms.title, id: ms.id, detail: `${aim.number ?? ''} · ${g.title}`, allDay: true });
        });
      });
    });

    // Recurring obligations — expand ±6 months from today
    const obStart = new Date(Date.now() - 180 * 86_400_000);
    const obEnd   = new Date(Date.now() + 180 * 86_400_000);
    expandObligations(obStart, obEnd).forEach(ob => {
      addEv(ob.date, { type: 'obligation', label: ob.title, id: ob.id, detail: ob.description, allDay: true });
    });

    return map;
  }, [meetings, tasks, grants]);

  // ── month view helpers ────────────────────────────────────────────────────
  const { weeks } = useMemo(() => {
    const fDOW = new Date(year, month, 1).getDay();
    const dim  = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < fDOW; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    const wks = [];
    for (let i = 0; i < cells.length; i += 7) wks.push(cells.slice(i, i + 7));
    return { weeks: wks };
  }, [year, month]);

  const cellDate  = (d) => d ? `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null;
  const evOnDay   = (d) => { const k = cellDate(d); return k ? (eventsByDay[k] ?? []) : []; };
  const selEvents = selectedDate ? (eventsByDay[selectedDate] ?? []) : [];
  const totalMo   = Object.entries(eventsByDay)
    .filter(([k]) => k.startsWith(`${year}-${String(month + 1).padStart(2,'0')}-`))
    .reduce((s, [, v]) => s + v.length, 0);

  // ── week/day view helpers ─────────────────────────────────────────────────
  const weekDays  = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(wkStart, i)), [wkStart]);

  const inSlot = (ds, slotH, slotM) =>
    (eventsByDay[ds] ?? []).filter(ev =>
      !ev.allDay && ev.h === slotH && typeof ev.m === 'number' &&
      Math.floor(ev.m / SLOT_MINS) * SLOT_MINS === slotM
    );

  const allDayEvs = (ds) => (eventsByDay[ds] ?? []).filter(ev => ev.allDay);

  // ── shared event card ─────────────────────────────────────────────────────
  const EvCard = ({ ev, showTime }) => {
    const et  = EVENT_TYPES[ev.type];
    const h12 = ev.h === 0 ? 12 : ev.h > 12 ? ev.h - 12 : ev.h;
    const ts  = ev.h !== undefined ? `${h12}:${String(ev.m ?? 0).padStart(2,'0')}${ev.h >= 12 ? 'pm' : 'am'}` : '';
    return (
      <button
        onClick={e => { e.stopPropagation(); navigate(et.link); }}
        title={ev.label}
        className="w-full text-left text-xs rounded px-1.5 py-0.5 truncate font-medium transition-opacity hover:opacity-80"
        style={{ background: et.bg, color: et.text, borderLeft: `3px solid ${et.border}` }}
      >
        {showTime && ts && <span className="opacity-60 mr-1">{ts}</span>}
        {ev.label}
      </button>
    );
  };

  // ── time grid (shared: week + day) ────────────────────────────────────────
  const TimeGrid = ({ dates }) => {
    const cols     = dates.length;
    const tpl      = `56px repeat(${cols}, 1fr)`;
    const hasAllDay = dates.some(d => allDayEvs(d).length > 0);

    return (
      <div
        className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col"
        style={{ height: 'calc(100vh - 230px)' }}
      >
        {/* Day headers */}
        <div className="grid flex-shrink-0 border-b border-gray-200" style={{ gridTemplateColumns: tpl }}>
          <div className="border-r border-gray-100" />
          {dates.map(d => {
            const dObj = new Date(d + 'T00:00:00');
            const isT  = d === todayYMD;
            return (
              <div key={d} className="py-2 text-center border-r border-gray-100 last:border-r-0">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {DOW_SHORT[dObj.getDay()]}
                </div>
                <button
                  onClick={() => { setView('day'); setDayDate(d); }}
                  className={`mx-auto mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors hover:bg-gray-100 ${
                    isT ? 'bg-primary-600 text-white hover:bg-primary-700' : 'text-gray-700'
                  }`}
                >
                  {dObj.getDate()}
                </button>
              </div>
            );
          })}
        </div>

        {/* All-day strip */}
        {hasAllDay && (
          <div className="grid flex-shrink-0 border-b border-gray-200" style={{ gridTemplateColumns: tpl }}>
            <div className="px-1 py-2 text-right text-xs text-gray-400 border-r border-gray-100 leading-none self-center">
              all<br />day
            </div>
            {dates.map(d => (
              <div key={d} className="px-1 py-1 space-y-0.5 border-r border-gray-100 last:border-r-0 min-h-[32px]">
                {allDayEvs(d).map((ev, i) => <EvCard key={i} ev={ev} />)}
              </div>
            ))}
          </div>
        )}

        {/* Scrollable time slots */}
        <div className="overflow-y-auto flex-1">
          {TIME_SLOTS.map(({ h, m, label }, si) => (
            <div
              key={si}
              className="grid border-b border-gray-50 last:border-0"
              style={{ gridTemplateColumns: tpl, minHeight: ROW_H }}
            >
              {/* Time label */}
              <div className="px-2 border-r border-gray-100 relative flex-shrink-0" style={{ minHeight: ROW_H }}>
                {m === 0 && (
                  <span className="absolute -top-2.5 right-2 text-xs text-gray-400 bg-white px-0.5 whitespace-nowrap">
                    {label}
                  </span>
                )}
              </div>

              {/* Day columns */}
              {dates.map(d => {
                const evs = inSlot(d, h, m);
                return (
                  <div
                    key={d}
                    className={`px-1 py-0.5 border-r border-gray-100 last:border-r-0 ${m === 0 ? 'border-t border-gray-200' : ''} ${evs.length > 1 ? 'flex gap-0.5' : ''}`}
                    style={{ minHeight: ROW_H }}
                  >
                    {evs.map((ev, i) => (
                      <div key={i} className={evs.length > 1 ? 'flex-1 min-w-0' : 'w-full'}>
                        <EvCard ev={ev} showTime={cols === 1} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── month grid ────────────────────────────────────────────────────────────
  const MonthGrid = () => (
    <>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(EVENT_TYPES).map(([key, et]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: et.text }}>
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: et.border }} />
            {et.label}
          </span>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Grid */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DOW_SHORT.map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
              {week.map((day, di) => {
                const k      = cellDate(day);
                const events = evOnDay(day);
                const isToday = k === todayYMD;
                const isSel   = k === selectedDate;
                return (
                  <div
                    key={di}
                    onClick={() => day && setSelectedDate(isSel ? null : k)}
                    className={`min-h-[88px] p-1.5 border-r border-gray-100 last:border-r-0 transition-colors ${
                      !day   ? 'bg-gray-50/50' :
                      isSel  ? 'bg-primary-50 cursor-pointer' :
                               'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                          isToday ? 'bg-primary-600 text-white' :
                          isSel   ? 'bg-primary-100 text-primary-700' :
                                    'text-gray-700'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {events.slice(0, 3).map((ev, ei) => {
                            const et = EVENT_TYPES[ev.type];
                            return (
                              <div
                                key={ei}
                                className="text-xs px-1.5 py-0.5 rounded truncate font-medium"
                                style={{ background: et.bg, color: et.text, borderLeft: `3px solid ${et.border}` }}
                              >
                                {ev.label}
                              </div>
                            );
                          })}
                          {events.length > 3 && (
                            <div className="text-xs text-gray-400 pl-1">+{events.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Day detail panel */}
        {selectedDate && (
          <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">{fmt(selectedDate)}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setView('day'); setDayDate(selectedDate); }}
                  className="text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50 font-medium transition-colors"
                >
                  Day view
                </button>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>

            {selEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
                <CalendarDays size={28} className="mb-2 text-gray-300" />
                <p className="text-sm">No events</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {[...selEvents]
                  .sort((a, b) => {
                    if (a.allDay && !b.allDay) return 1;
                    if (!a.allDay && b.allDay) return -1;
                    return (a.h ?? 0) * 60 + (a.m ?? 0) - ((b.h ?? 0) * 60 + (b.m ?? 0));
                  })
                  .map((ev, i) => {
                    const et = EVENT_TYPES[ev.type];
                    return (
                      <button
                        key={i}
                        onClick={() => navigate(et.link)}
                        className="w-full text-left rounded-lg p-3 transition-colors hover:opacity-90"
                        style={{ background: et.bg, borderLeft: `4px solid ${et.border}` }}
                      >
                        <div className="font-semibold text-xs mb-0.5" style={{ color: et.text }}>{et.label}</div>
                        <div className="text-sm font-medium text-gray-800 leading-snug">{ev.label}</div>
                        {ev.detail && <div className="text-xs text-gray-500 mt-0.5">{ev.detail}</div>}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Month stats footer */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        {Object.entries(EVENT_TYPES).map(([key, et]) => {
          const count = Object.entries(eventsByDay)
            .filter(([k]) => k.startsWith(`${year}-${String(month + 1).padStart(2,'0')}-`))
            .reduce((s, [, v]) => s + v.filter(e => e.type === key).length, 0);
          return count ? <span key={key} style={{ color: et.text }}>{count} {et.label}{count !== 1 ? 's' : ''}</span> : null;
        })}
      </div>
    </>
  );

  // ── render ────────────────────────────────────────────────────────────────
  const periodLabel = view === 'month' ? `${MONTHS[month]} ${year}` :
                      view === 'week'  ? fmtWeekRange(wkStart) :
                                         fmtDayFull(dayDate);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Calendar</h1>
          <p className="text-gray-600 text-sm">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            {['Month', 'Week', 'Day'].map(v => (
              <button
                key={v}
                onClick={() => setView(v.toLowerCase())}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  view === v.toLowerCase()
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Today
          </button>
          <button onClick={prevPeriod} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextPeriod} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {view === 'month' && <MonthGrid />}
      {view === 'week'  && <TimeGrid dates={weekDays} />}
      {view === 'day'   && <TimeGrid dates={[dayDate]} />}
    </div>
  );
};

export default CalendarView;
