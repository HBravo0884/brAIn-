import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

// ── event types ───────────────────────────────────────────────────────────────
const EVENT_TYPES = {
  meeting:   { label: 'Meeting',   bg: '#d0ecef', border: '#097c87', text: '#097c87', link: '/meetings'  },
  task:      { label: 'Task',      bg: '#fdd0b8', border: '#fca47c', text: '#c44c22', link: '/workflows' },
  milestone: { label: 'Milestone', bg: '#dff0e2', border: '#a1cca6', text: '#3d7a42', link: '/grants'    },
  deadline:  { label: 'Deadline',  bg: '#fef9e0', border: '#f9d779', text: '#856a00', link: '/grants'    },
};

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── helpers ───────────────────────────────────────────────────────────────────
const ymd = (dateStr) => {
  if (!dateStr) return null;
  // handle both "2026-02-15" and "2026-02-15T10:00"
  return dateStr.split('T')[0];
};

const fmt = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00'));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtTime = (dateStr) => {
  if (!dateStr || !dateStr.includes('T')) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// ── main component ────────────────────────────────────────────────────────────
const CalendarView = () => {
  const { meetings, tasks, grants } = useApp();
  const navigate = useNavigate();

  const today    = new Date();
  const todayYMD = ymd(today.toISOString());

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());   // 0-indexed
  const [selectedDate, setSelectedDate] = useState(null);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else             { setMonth(m => m - 1); }
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else              { setMonth(m => m + 1); }
    setSelectedDate(null);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(todayYMD);
  };

  // ── aggregate all events keyed by "YYYY-MM-DD" ────────────────────────────
  const eventsByDay = useMemo(() => {
    const map = {};

    const add = (dateStr, event) => {
      const k = ymd(dateStr);
      if (!k) return;
      (map[k] ??= []).push(event);
    };

    // Meetings
    meetings.forEach(m => {
      if (m.date)
        add(m.date, { type: 'meeting', label: m.title, id: m.id,
          detail: `${fmtTime(m.date)}${m.attendees ? ' · ' + m.attendees.split(',').length + ' attendees' : ''}` });
    });

    // Tasks with due dates
    tasks.forEach(t => {
      if (t.dueDate)
        add(t.dueDate, { type: 'task', label: t.title, id: t.id,
          detail: `Status: ${t.status ?? 'To Do'}` });
    });

    // Grant ends, aim target dates, milestone target dates
    grants.forEach(g => {
      if (g.endDate)
        add(g.endDate, { type: 'deadline', label: `${g.title} — End Date`, id: g.id,
          detail: g.fundingAgency ?? '' });
      (g.aims ?? []).forEach(aim => {
        if (aim.targetDate)
          add(aim.targetDate, { type: 'deadline', label: `${aim.number ?? 'Aim'}: ${aim.title}`, id: aim.id,
            detail: g.title });
        (aim.milestones ?? []).forEach(ms => {
          if (ms.targetDate)
            add(ms.targetDate, { type: 'milestone', label: ms.title, id: ms.id,
              detail: `${aim.number ?? ''} · ${g.title}` });
        });
      });
    });

    return map;
  }, [meetings, tasks, grants]);

  // ── build calendar grid ───────────────────────────────────────────────────
  const { weeks, daysInMonth } = useMemo(() => {
    const firstDOW   = new Date(year, month, 1).getDay();
    const dim        = new Date(year, month + 1, 0).getDate();
    const cells      = [];
    for (let i = 0; i < firstDOW; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const wks = [];
    for (let i = 0; i < cells.length; i += 7) wks.push(cells.slice(i, i + 7));
    return { weeks: wks, daysInMonth: dim };
  }, [year, month]);

  const cellDate = (d) => d ? `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null;

  const eventsOnDay = (d) => {
    const k = cellDate(d);
    return k ? (eventsByDay[k] ?? []) : [];
  };

  const selectedEvents = selectedDate ? (eventsByDay[selectedDate] ?? []) : [];

  // count events in current month for legend
  const totalThisMonth = Object.entries(eventsByDay).filter(([k]) =>
    k.startsWith(`${year}-${String(month + 1).padStart(2,'0')}-`)
  ).reduce((s, [, v]) => s + v.length, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Calendar</h1>
          <p className="text-gray-600">
            {totalThisMonth} event{totalThisMonth !== 1 ? 's' : ''} in {MONTHS[month]} {year}
          </p>
        </div>
        {/* Nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            title="Previous month"
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-bold text-gray-900 min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            title="Next month"
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(EVENT_TYPES).map(([key, et]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: et.text }}>
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: et.border }} />
            {et.label}
          </span>
        ))}
      </div>

      <div className={`flex gap-5 ${selectedDate ? '' : ''}`}>
        {/* Calendar grid */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DOW.map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
              {week.map((day, di) => {
                const k       = cellDate(day);
                const events  = eventsOnDay(day);
                const isToday = k === todayYMD;
                const isSel   = k === selectedDate;
                const isOther = day === null;

                return (
                  <div
                    key={di}
                    onClick={() => !isOther && setSelectedDate(isSel ? null : k)}
                    className={`min-h-[88px] p-1.5 border-r border-gray-100 last:border-r-0 transition-colors ${
                      isOther ? 'bg-gray-50/50' :
                      isSel   ? 'bg-primary-50 cursor-pointer' :
                                'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                          isToday
                            ? 'bg-primary-600 text-white'
                            : isSel
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-700'
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
              <button
                onClick={() => setSelectedDate(null)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {selectedEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
                <CalendarDays size={28} className="mb-2 text-gray-300" />
                <p className="text-sm">No events</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedEvents.map((ev, i) => {
                  const et = EVENT_TYPES[ev.type];
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(et.link)}
                      title={`Open in ${et.label}s`}
                      className="w-full text-left rounded-lg p-3 transition-colors hover:opacity-90"
                      style={{ background: et.bg, borderLeft: `4px solid ${et.border}` }}
                    >
                      <div className="font-semibold text-xs mb-0.5" style={{ color: et.text }}>
                        {et.label}
                      </div>
                      <div className="text-sm font-medium text-gray-800 leading-snug">{ev.label}</div>
                      {ev.detail && (
                        <div className="text-xs text-gray-500 mt-0.5">{ev.detail}</div>
                      )}
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
          if (!count) return null;
          return (
            <span key={key} style={{ color: et.text }}>
              {count} {et.label}{count !== 1 ? 's' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
