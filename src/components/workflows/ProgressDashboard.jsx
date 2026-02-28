import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import {
  Award, ListChecks, DollarSign, Target, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, CalendarClock,
} from 'lucide-react';

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  teal:   '#097c87',
  cyan:   '#23ced9',
  yellow: '#f9d779',
  sage:   '#a1cca6',
  salmon: '#fca47c',
  gray:   '#c8bfa4',
  red:    '#dc2626',
  darkTeal: '#054e57',
};

// Status colors
const GRANT_STATUS_COLORS  = { active: C.teal, pending: C.yellow, completed: C.sage, rejected: C.salmon };
const TASK_STATUS_COLORS   = { 'To Do': C.gray, 'In Progress': C.cyan, 'Review': C.yellow, 'Done': C.sage };
const PRIORITY_COLORS      = { high: C.salmon, medium: C.yellow, low: C.sage };

// ── Helpers ────────────────────────────────────────────────────────────────────
const parseDate = (s) => { if (!s) return null; const d = new Date(s); return isNaN(d) ? null : d; };
const fmt       = (d) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const fmtMoney  = (n) => n >= 1_000_000
  ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

/** Recursively sum spent expenses in a budget */
const calcBudgetSpent = (budget) =>
  (budget.categories || []).reduce((s, cat) =>
    s + (cat.miniPools || []).reduce((s2, pool) =>
      s2 + (pool.expenses || []).reduce((s3, exp) =>
        s3 + (exp.spent !== false ? (exp.amount || 0) : 0), 0), 0), 0);

const daysUntil = (date) => {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((date - today) / 86400000);
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent, icon: Icon, alert }) => (
  <div className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col gap-1 ${alert ? 'border-salmon-300' : 'border-gray-200'}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      {Icon && <Icon size={15} style={{ color: accent }} />}
    </div>
    <div className="text-2xl font-bold" style={{ color: accent }}>{value}</div>
    {sub && <div className="text-xs text-gray-400">{sub}</div>}
  </div>
);

// ── Section ───────────────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div>
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</h3>
    {children}
  </div>
);

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#fff' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? fmtMoney(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ProgressDashboard = () => {
  const { grants, tasks, budgets } = useApp();

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // ── KPI calculations ────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalGrants   = grants.length;
    const activeGrants  = grants.filter(g => g.status === 'active').length;

    const openTasks  = tasks.filter(t => t.status !== 'Done').length;
    const doneTasks  = tasks.filter(t => t.status === 'Done').length;
    const overdue    = tasks.filter(t => {
      if (t.status === 'Done') return false;
      const d = parseDate(t.dueDate);
      return d && d < today;
    }).length;

    const totalBudget = budgets.reduce((s, b) => s + (b.totalBudget || 0), 0);
    const totalSpent  = budgets.reduce((s, b) => s + calcBudgetSpent(b), 0);
    const spentPct    = totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0;

    const allAims     = grants.flatMap(g => g.aims || []);
    const aimsOnTrack = allAims.filter(a => a.status === 'completed' || a.status === 'in-progress').length;

    return { totalGrants, activeGrants, openTasks, doneTasks, overdue, totalBudget, totalSpent, spentPct, allAims, aimsOnTrack };
  }, [grants, tasks, budgets, today]);

  // ── Grant status pie ─────────────────────────────────────────────────────────
  const grantStatusData = useMemo(() => {
    const counts = {};
    grants.forEach(g => { counts[g.status] = (counts[g.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      key: name,
    }));
  }, [grants]);

  // ── Task status bar ──────────────────────────────────────────────────────────
  const taskStatusData = useMemo(() => {
    const statuses = ['To Do', 'In Progress', 'Review', 'Done'];
    return statuses.map(s => ({
      name: s,
      count: tasks.filter(t => t.status === s).length,
    }));
  }, [tasks]);

  // ── Task priority pie ────────────────────────────────────────────────────────
  const taskPriorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.filter(t => t.status !== 'Done').forEach(t => {
      if (t.priority in counts) counts[t.priority]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        key: name,
      }));
  }, [tasks]);

  // ── Budget per grant ─────────────────────────────────────────────────────────
  const budgetData = useMemo(() => {
    return grants
      .map(grant => {
        const gBudgets = budgets.filter(b => b.grantId === grant.id);
        const allocated = gBudgets.reduce((s, b) => s + (b.totalBudget || 0), 0);
        const spent     = gBudgets.reduce((s, b) => s + calcBudgetSpent(b), 0);
        if (allocated === 0 && spent === 0) return null;
        return {
          name: grant.title.length > 18 ? grant.title.slice(0, 18) + '…' : grant.title,
          fullName: grant.title,
          Allocated: allocated,
          Spent: spent,
        };
      })
      .filter(Boolean);
  }, [grants, budgets]);

  // ── Aim progress ─────────────────────────────────────────────────────────────
  const aimProgress = useMemo(() => {
    const rows = [];
    grants.forEach(grant => {
      (grant.aims || []).forEach(aim => {
        rows.push({
          id: aim.id,
          label: `${aim.number ? aim.number + ': ' : ''}${aim.title}`,
          grant: grant.title,
          pct: aim.completionPercentage || 0,
          status: aim.status || 'not-started',
          targetDate: parseDate(aim.targetDate),
        });
      });
    });
    return rows.sort((a, b) => b.pct - a.pct);
  }, [grants]);

  // ── Upcoming deadlines (next 45 days) ────────────────────────────────────────
  const deadlines = useMemo(() => {
    const items = [];
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + 45);

    // Aims
    grants.forEach(g => {
      (g.aims || []).forEach(a => {
        const d = parseDate(a.targetDate);
        if (d && d >= today && d <= cutoff && a.status !== 'completed') {
          items.push({ label: `${a.number || 'Aim'}: ${a.title}`, sub: g.title, date: d, type: 'aim' });
        }
        (a.milestones || []).forEach(m => {
          const md = parseDate(m.targetDate);
          if (md && md >= today && md <= cutoff && !m.completed) {
            items.push({ label: m.title, sub: `${g.title} · ${a.number || ''}`, date: md, type: 'milestone' });
          }
        });
      });
    });

    // Tasks
    tasks.filter(t => t.status !== 'Done').forEach(t => {
      const d = parseDate(t.dueDate);
      if (d && d >= today && d <= cutoff) {
        items.push({ label: t.title, sub: `Task · ${t.priority || 'medium'} priority`, date: d, type: 'task', priority: t.priority });
      }
    });

    return items.sort((a, b) => a.date - b.date).slice(0, 8);
  }, [grants, tasks, today]);

  // ── Overdue items ────────────────────────────────────────────────────────────
  const overdueItems = useMemo(() => {
    const items = [];
    tasks.filter(t => t.status !== 'Done').forEach(t => {
      const d = parseDate(t.dueDate);
      if (d && d < today) {
        items.push({ label: t.title, sub: `Task · ${daysUntil(d) * -1}d overdue`, priority: t.priority });
      }
    });
    grants.forEach(g => {
      (g.aims || []).forEach(a => {
        const d = parseDate(a.targetDate);
        if (d && d < today && a.status !== 'completed') {
          items.push({ label: `${a.number || 'Aim'}: ${a.title}`, sub: `${g.title} · ${Math.abs(daysUntil(d))}d overdue`, priority: 'high' });
        }
      });
    });
    return items.slice(0, 5);
  }, [grants, tasks, today]);

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (grants.length === 0 && tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <TrendingUp size={48} className="mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-600 mb-1">No data yet</h3>
        <p className="text-gray-400 text-sm">Add grants and tasks to see your progress dashboard.</p>
      </div>
    );
  }

  const statusColor = (s) => {
    if (s === 'completed') return C.sage;
    if (s === 'in-progress') return C.teal;
    if (s === 'delayed') return C.salmon;
    return C.gray;
  };

  return (
    <div className="space-y-8">

      {/* ── KPI Row ───────────────────────────────────────────────────────── */}
      <Section title="At a Glance">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Active Grants"
            value={kpis.activeGrants}
            sub={`${kpis.totalGrants} total`}
            accent={C.teal}
            icon={Award}
          />
          <KpiCard
            label="Open Tasks"
            value={kpis.openTasks}
            sub={`${kpis.doneTasks} completed`}
            accent={C.cyan}
            icon={ListChecks}
          />
          <KpiCard
            label="Budget Used"
            value={`${kpis.spentPct}%`}
            sub={`${fmtMoney(kpis.totalSpent)} of ${fmtMoney(kpis.totalBudget)}`}
            accent={kpis.spentPct > 85 ? C.salmon : C.teal}
            icon={DollarSign}
            alert={kpis.spentPct > 85}
          />
          <KpiCard
            label="Overdue Items"
            value={kpis.overdue}
            sub={kpis.overdue === 0 ? 'All on track!' : 'need attention'}
            accent={kpis.overdue > 0 ? C.salmon : C.sage}
            icon={kpis.overdue > 0 ? AlertTriangle : CheckCircle2}
            alert={kpis.overdue > 0}
          />
        </div>
      </Section>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Grant status pie */}
        {grantStatusData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Grant Status</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={grantStatusData}
                  cx="50%" cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                >
                  {grantStatusData.map((entry) => (
                    <Cell key={entry.key} fill={GRANT_STATUS_COLORS[entry.key] || C.gray} />
                  ))}
                </Pie>
                <ReTooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Task status bar */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Tasks by Status</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taskStatusData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede4" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9e9178' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9e9178' }} axisLine={false} tickLine={false} />
                <ReTooltip content={<ChartTip />} />
                <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                  {taskStatusData.map((entry) => (
                    <Cell key={entry.name} fill={TASK_STATUS_COLORS[entry.name] || C.gray} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Budget per grant */}
        {budgetData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Budget: Allocated vs. Spent</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetData} barCategoryGap="30%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede4" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9e9178' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtMoney} tick={{ fontSize: 10, fill: '#9e9178' }} axisLine={false} tickLine={false} />
                <ReTooltip content={<ChartTip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Allocated" fill={C.cyan}   radius={[3, 3, 0, 0]} />
                <Bar dataKey="Spent"     fill={C.teal}   radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Task priority pie */}
        {taskPriorityData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Open Tasks by Priority</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={taskPriorityData}
                  cx="50%" cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="value"
                >
                  {taskPriorityData.map((entry) => (
                    <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key] || C.gray} />
                  ))}
                </Pie>
                <ReTooltip content={<ChartTip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Aim Progress ─────────────────────────────────────────────────── */}
      {aimProgress.length > 0 && (
        <Section title="Aim Completion">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            {aimProgress.map((aim) => (
              <div key={aim.id}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-gray-700 truncate block">{aim.label}</span>
                    <span className="text-xs text-gray-400">{aim.grant}{aim.targetDate ? ` · due ${fmt(aim.targetDate)}` : ''}</span>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: statusColor(aim.status) }}>
                    {aim.pct}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${aim.pct}%`,
                      backgroundColor: statusColor(aim.status),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Bottom row: Deadlines + Overdue ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Deadlines */}
        <Section title="Upcoming (Next 45 Days)">
          {deadlines.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-sage-400" style={{ color: C.sage }} />
              Nothing due in the next 45 days
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm overflow-hidden">
              {deadlines.map((item, i) => {
                const days = daysUntil(item.date);
                const urgent = days <= 7;
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center text-center"
                      style={{ backgroundColor: urgent ? '#fdd0b8' : '#d0ecef' }}
                    >
                      <span className="text-xs font-bold leading-tight" style={{ color: urgent ? C.salmon : C.teal }}>
                        {item.date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-sm font-black leading-tight" style={{ color: urgent ? C.salmon : C.teal }}>
                        {item.date.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
                      <p className="text-xs text-gray-400 truncate">{item.sub}</p>
                    </div>
                    <span
                      className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: urgent ? '#fdd0b8' : '#f5f0dc',
                        color: urgent ? C.salmon : C.gray,
                      }}
                    >
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Overdue */}
        <Section title="Overdue Items">
          {overdueItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
              <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: C.sage }} />
              Nothing overdue — great work!
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-red-200 divide-y divide-red-50 shadow-sm overflow-hidden">
              {overdueItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors">
                  <AlertTriangle size={14} className="flex-shrink-0" style={{ color: C.salmon }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                  <span
                    className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#fdd0b8', color: C.salmon }}
                  >
                    {item.priority || 'medium'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

    </div>
  );
};

export default ProgressDashboard;
