import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { CheckCircle2, Clock, AlertTriangle, BarChart2, Calendar } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AV_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
function avatarColor(name: string) {
  return AV_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Data ────────────────────────────────────────────────────────────────────

const STATUS_DATA = [
  { name: "To Do",       value: 6,  pct: 25, color: "#64748b" },
  { name: "In Progress", value: 8,  pct: 33, color: "#6366f1" },
  { name: "In Review",   value: 4,  pct: 17, color: "#f59e0b" },
  { name: "Done",        value: 6,  pct: 25, color: "#10b981" },
];

const TYPE_DATA = [
  { name: "Bug",         count: 6, color: "#ef4444" },
  { name: "Feature",     count: 8, color: "#6366f1" },
  { name: "Improvement", count: 6, color: "#10b981" },
  { name: "Epic",        count: 4, color: "#8b5cf6" },
];

const MEMBER_PERF = [
  { name: "Alice Johnson", assigned: 7, completed: 4, inProgress: 2, overdue: 1 },
  { name: "Marcus Webb",   assigned: 5, completed: 3, inProgress: 1, overdue: 1 },
  { name: "Sarah Chen",    assigned: 4, completed: 2, inProgress: 2, overdue: 0 },
  { name: "Tom Wilson",    assigned: 5, completed: 2, inProgress: 2, overdue: 1 },
  { name: "Priya Nair",    assigned: 3, completed: 1, inProgress: 1, overdue: 1 },
];

type Priority = "low" | "medium" | "high" | "urgent";

const DUE_THIS_WEEK: {
  id: string; title: string; assignees: string[];
  deadline: string; priority: Priority; overdue: boolean; status: string;
}[] = [
  { id: "d1", title: "Fix login redirect on mobile Safari",  assignees: ["Tom Wilson"],                  deadline: "2026-05-24", priority: "urgent", overdue: true,  status: "In Progress" },
  { id: "d2", title: "Memory leak in real-time sync",        assignees: ["Marcus Webb"],                 deadline: "2026-05-25", priority: "urgent", overdue: true,  status: "In Review"   },
  { id: "d3", title: "Improve search result ranking",        assignees: ["Priya Nair", "Marcus Webb"],   deadline: "2026-05-29", priority: "medium", overdue: false, status: "To Do"       },
  { id: "d4", title: "Redesign onboarding flow",             assignees: ["Alice Johnson", "Sarah Chen"], deadline: "2026-05-30", priority: "high",   overdue: false, status: "To Do"       },
  { id: "d5", title: "Keyboard navigation for board",        assignees: ["Emily Davis"],                 deadline: "2026-06-01", priority: "low",    overdue: false, status: "In Review"   },
  { id: "d6", title: "Auth system v2 — OAuth + SSO",         assignees: ["Alex Rivera", "Tom Wilson"],   deadline: "2026-06-03", priority: "high",   overdue: false, status: "In Progress" },
];

const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  high:   { label: "High",   color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  low:    { label: "Low",    color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#f1f5f9",
  fontSize: "12px",
  boxShadow: "0 8px 32px -8px rgba(0,0,0,0.8)",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniAvatar({ name }: { name: string }) {
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0"
      style={{ backgroundColor: avatarColor(name) }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

function StatCard({
  label, value, sub, icon: Icon, iconColor, iconBg, valueColor, progress,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
  valueColor?: string; progress?: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#334155] bg-[#1e293b] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#94a3b8]">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight" style={{ color: valueColor ?? "#f1f5f9" }}>{value}</p>
        <p className="mt-1 text-xs" style={{ color: iconColor + "cc" }}>{sub}</p>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#0f172a" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, backgroundColor: iconColor }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function BoardStatistics() {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 bg-[#0f172a]">
      <div className="px-6 py-6 flex flex-col gap-5 max-w-[1200px]">

        {/* ── Section label ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#f1f5f9]">Board Statistics</h2>
            <p className="text-xs text-[#64748b] mt-0.5">Sprint 24.2 · May 2026</p>
          </div>
          <span className="text-xs text-[#475569] border border-[#334155] rounded-md px-2.5 py-1">Last updated just now</span>
        </div>

        {/* ── Row 1: Stat Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Tasks" value={24} sub="Across all columns"
            icon={BarChart2} iconColor="#6366f1" iconBg="rgba(99,102,241,0.15)"
          />
          <StatCard
            label="Completed" value={12} sub="50% completion rate"
            icon={CheckCircle2} iconColor="#10b981" iconBg="rgba(16,185,129,0.15)"
            progress={50}
          />
          <StatCard
            label="In Progress" value={8} sub="33% of total tasks"
            icon={Clock} iconColor="#6366f1" iconBg="rgba(99,102,241,0.15)"
            progress={33}
          />
          <StatCard
            label="Overdue" value={4} sub="17% — needs attention"
            icon={AlertTriangle} iconColor="#ef4444" iconBg="rgba(239,68,68,0.15)"
            valueColor="#ef4444" progress={17}
          />
        </div>

        {/* ── Row 2: Charts ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Donut: Tasks by Status */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#334155] bg-[#1e293b] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#f1f5f9]">Tasks by Status</h3>
              <span className="text-xs text-[#64748b]">24 total</span>
            </div>

            {/* Donut with center label overlay */}
            <div className="relative">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={STATUS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                  >
                    {STATUS_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#f1f5f9" }}
                    formatter={(value: number, name: string) => [`${value} tasks`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-[#f1f5f9] leading-none">24</span>
                <span className="text-[10px] text-[#64748b] mt-1">Tasks</span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {STATUS_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="flex-1 text-xs text-[#94a3b8] truncate">{d.name}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: d.color }}>
                    {d.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar: Tasks by Type */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#334155] bg-[#1e293b] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#f1f5f9]">Tasks by Type</h3>
              <span className="text-xs text-[#64748b]">24 total</span>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={TYPE_DATA} layout="vertical" barCategoryGap="32%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#334155"
                    strokeOpacity={0.4}
                  />
                  <XAxis
                    type="number"
                    stroke="transparent"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="transparent"
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#f1f5f9" }}
                    formatter={(value: number) => [`${value} tasks`, "Count"]}
                    cursor={{ fill: "rgba(99,102,241,0.07)", radius: 4 }}
                  />
                  <Bar dataKey="count" radius={[0, 5, 5, 0]} maxBarSize={18}>
                    {TYPE_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Type legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {TYPE_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color, opacity: 0.85 }} />
                  <span className="flex-1 text-xs text-[#94a3b8]">{d.name}</span>
                  <span className="text-xs font-semibold text-[#f1f5f9] tabular-nums">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Member Performance ─────────────────────────────────────── */}
        <div className="flex flex-col gap-4 rounded-xl border border-[#334155] bg-[#1e293b] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#f1f5f9]">Member Performance</h3>
            <span className="text-xs text-[#64748b]">Sprint 24.2</span>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#334155]/60">
                <th className="text-left pb-3 text-[10px] font-semibold uppercase tracking-wider text-[#475569] w-56">Member</th>
                <th className="text-center pb-3 text-[10px] font-semibold uppercase tracking-wider text-[#475569] w-24">Assigned</th>
                <th className="text-left pb-3 text-[10px] font-semibold uppercase tracking-wider text-[#475569] pl-6">Completed</th>
                <th className="text-center pb-3 text-[10px] font-semibold uppercase tracking-wider text-[#475569] w-28">In Progress</th>
                <th className="text-center pb-3 text-[10px] font-semibold uppercase tracking-wider text-[#475569] w-24">Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/30">
              {MEMBER_PERF.map((m) => {
                const pct = Math.round((m.completed / m.assigned) * 100);
                return (
                  <tr key={m.name} className="group hover:bg-[#0f172a]/50 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <MiniAvatar name={m.name} />
                        <span className="text-sm font-medium text-[#f1f5f9] truncate">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="text-sm font-semibold text-[#94a3b8] tabular-nums">{m.assigned}</span>
                    </td>
                    <td className="py-3.5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-[#0f172a] overflow-hidden min-w-[100px]">
                          <div
                            className="h-full rounded-full bg-[#10b981] transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#10b981] tabular-nums w-6 text-right">
                          {m.completed}
                        </span>
                        <span className="text-[10px] text-[#475569] tabular-nums">({pct}%)</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                        style={{ backgroundColor: "rgba(99,102,241,0.12)", color: "#6366f1" }}
                      >
                        {m.inProgress}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      {m.overdue > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                          <AlertTriangle className="h-3 w-3" />
                          {m.overdue}
                        </span>
                      ) : (
                        <span className="text-sm text-[#334155]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Row 4: Tasks Due This Week ────────────────────────────────────── */}
        <div className="flex flex-col gap-4 rounded-xl border border-[#334155] bg-[#1e293b] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#f1f5f9]">Tasks Due This Week</h3>
            <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
              <Calendar className="h-3.5 w-3.5" />
              May 28 – Jun 3, 2026
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {DUE_THIS_WEEK.map((task) => {
              const p = PRIORITY_META[task.priority];
              const dateStr = new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-lg border px-4 py-3 transition-all cursor-pointer"
                  style={
                    task.overdue
                      ? { borderColor: "rgba(239,68,68,0.25)", backgroundColor: "rgba(239,68,68,0.05)" }
                      : { borderColor: "rgba(51,65,85,0.5)", backgroundColor: "rgba(15,23,42,0.4)" }
                  }
                >
                  {/* Priority dot */}
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />

                  {/* Title */}
                  <span className="flex-1 text-sm font-medium text-[#f1f5f9] truncate min-w-0">
                    {task.title}
                  </span>

                  {/* Assignee avatars */}
                  <div className="flex -space-x-1.5 flex-shrink-0">
                    {task.assignees.slice(0, 2).map((a) => (
                      <div
                        key={a}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e293b] text-[8px] font-bold text-white"
                        style={{ backgroundColor: avatarColor(a) }}
                        title={a}
                      >
                        {initials(a)}
                      </div>
                    ))}
                    {task.assignees.length > 2 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e293b] bg-[#334155] text-[8px] font-medium text-[#94a3b8]">
                        +{task.assignees.length - 2}
                      </div>
                    )}
                  </div>

                  {/* Deadline */}
                  <div
                    className="flex items-center gap-1.5 text-xs flex-shrink-0 font-medium"
                    style={{ color: task.overdue ? "#ef4444" : "#64748b" }}
                  >
                    {task.overdue
                      ? <AlertTriangle className="h-3.5 w-3.5" />
                      : <Calendar className="h-3.5 w-3.5" />
                    }
                    <span>{dateStr}</span>
                    {task.overdue && (
                      <span className="text-[10px] font-normal opacity-70">overdue</span>
                    )}
                  </div>

                  {/* Priority badge */}
                  <span
                    className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: p.bg, color: p.color }}
                  >
                    {p.label}
                  </span>

                  {/* Status */}
                  <span className="hidden lg:block flex-shrink-0 text-[11px] text-[#475569] w-24 text-right">
                    {task.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}
