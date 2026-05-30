import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart2, Calendar, CheckCircle2, Clock } from "lucide-react";
import { statisticsApi } from "../../api";

const CHART_COLORS = {
  TODO: "#64748b",
  IN_PROGRESS: "#6366f1",
  IN_REVIEW: "#f59e0b",
  DONE: "#10b981",
  BUG: "#ef4444",
  FEATURE: "#6366f1",
  IMPROVEMENT: "#10b981",
  EPIC: "#8b5cf6",
};

type PriorityTone = "low" | "medium" | "high" | "urgent";

const PRIORITY_META: Record<PriorityTone, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  high: { label: "High", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  low: { label: "Low", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
};

function avatarColor(name: string) {
  const palette = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
  return palette[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

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
    <div className="flex min-h-[150px] flex-col gap-3 rounded-xl border border-[#334155] bg-[#1e293b] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#94a3b8]">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight" style={{ color: valueColor ?? "#f1f5f9" }}>{value}</p>
        <p className="mt-1 text-xs" style={{ color: `${iconColor}cc` }}>{sub}</p>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#0f172a" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: iconColor }} />
        </div>
      )}
    </div>
  );
}

function mapPriority(priority: string): PriorityTone {
  switch (priority) {
    case "CRITICAL":
      return "urgent";
    case "HIGH":
      return "high";
    case "MEDIUM":
      return "medium";
    default:
      return "low";
  }
}

interface BoardStatisticsProps {
  boardId: number | null;
}

export function BoardStatistics({ boardId }: BoardStatisticsProps) {
  const statisticsQuery = useQuery({
    queryKey: ["board-statistics", boardId],
    queryFn: () => statisticsApi.getByBoard(boardId!),
    enabled: boardId !== null,
  });

  if (statisticsQuery.isLoading) {
    return <div className="flex flex-1 items-center justify-center text-sm text-[#64748b]">Loading statistics...</div>;
  }

  if (statisticsQuery.isError || !statisticsQuery.data) {
    return <div className="flex flex-1 items-center justify-center text-sm text-[#ef4444]">Unable to load statistics.</div>;
  }

  const statistics = statisticsQuery.data;
  const statusData = Object.entries(statistics.tasksByStatus).map(([name, value]) => ({
    name,
    value,
    pct: statistics.totalTasks > 0 ? Math.round((value / statistics.totalTasks) * 100) : 0,
    color: CHART_COLORS[name as keyof typeof CHART_COLORS] ?? "#94a3b8",
  }));
  const typeData = Object.entries(statistics.tasksByType).map(([name, count]) => ({
    name,
    count,
    color: CHART_COLORS[name as keyof typeof CHART_COLORS] ?? "#94a3b8",
  }));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[#0f172a]">
      <div className="flex w-full flex-col gap-5 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#f1f5f9]">Board Statistics</h2>
            <p className="text-xs text-[#64748b] mt-0.5">Live data from the current board</p>
          </div>
          <span className="text-xs text-[#475569] border border-[#334155] rounded-md px-2.5 py-1">Updated from API</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Tasks"
            value={statistics.totalTasks}
            sub="Across all columns"
            icon={BarChart2}
            iconColor="#6366f1"
            iconBg="rgba(99,102,241,0.15)"
          />
          <StatCard
            label="Completed"
            value={statistics.completedTasks}
            sub={`${statistics.completionRate.toFixed(0)}% completion rate`}
            icon={CheckCircle2}
            iconColor="#10b981"
            iconBg="rgba(16,185,129,0.15)"
            progress={statistics.completionRate}
          />
          <StatCard
            label="In Progress"
            value={statistics.inProgressTasks}
            sub="Currently active"
            icon={Clock}
            iconColor="#6366f1"
            iconBg="rgba(99,102,241,0.15)"
            progress={statistics.totalTasks > 0 ? (statistics.inProgressTasks / statistics.totalTasks) * 100 : 0}
          />
          <StatCard
            label="Overdue"
            value={statistics.overdueTasks}
            sub="Needs attention"
            icon={AlertTriangle}
            iconColor="#ef4444"
            iconBg="rgba(239,68,68,0.15)"
            valueColor="#ef4444"
            progress={statistics.totalTasks > 0 ? (statistics.overdueTasks / statistics.totalTasks) * 100 : 0}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          <div className="flex min-h-[340px] flex-col gap-4 rounded-xl border border-[#334155] bg-[#1e293b] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#f1f5f9]">Tasks by Status</h3>
              <span className="text-xs text-[#64748b]">{statistics.totalTasks} total</span>
            </div>
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={58} outerRadius={85} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "12px" }}
                    formatter={(value: number, name: string) => [`${value} tasks`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-[#f1f5f9] leading-none">{statistics.totalTasks}</span>
                <span className="text-[10px] text-[#64748b] mt-1">Tasks</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 text-xs text-[#94a3b8] truncate">{item.name}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: item.color }}>{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-[340px] flex-col gap-4 rounded-xl border border-[#334155] bg-[#1e293b] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#f1f5f9]">Tasks by Type</h3>
              <span className="text-xs text-[#64748b]">{statistics.totalTasks} total</span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={typeData} layout="vertical" barCategoryGap="32%">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" strokeOpacity={0.4} />
                  <XAxis type="number" stroke="transparent" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="transparent" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "12px" }}
                    formatter={(value: number) => [`${value} tasks`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[0, 5, 5, 0]} maxBarSize={18}>
                    {typeData.map((entry) => <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {typeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color, opacity: 0.85 }} />
                  <span className="flex-1 text-xs text-[#94a3b8]">{item.name}</span>
                  <span className="text-xs font-semibold text-[#f1f5f9] tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-[#334155] bg-[#1e293b] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#f1f5f9]">Member Performance</h3>
            <span className="text-xs text-[#64748b]">Live board workload</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-collapse">
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
                {statistics.memberStats.map((member) => (
                  <tr key={member.userId} className="group hover:bg-[#0f172a]/50 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <MiniAvatar name={member.fullName} />
                        <span className="text-sm font-medium text-[#f1f5f9] truncate">{member.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center"><span className="text-sm font-semibold text-[#94a3b8] tabular-nums">{member.assigned}</span></td>
                    <td className="py-3.5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-[#0f172a] overflow-hidden min-w-[100px]">
                          <div className="h-full rounded-full bg-[#10b981] transition-all duration-700" style={{ width: `${member.completionRate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-[#10b981] tabular-nums w-6 text-right">{member.completed}</span>
                        <span className="text-[10px] text-[#475569] tabular-nums">({member.completionRate.toFixed(0)}%)</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums" style={{ backgroundColor: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
                        {member.inProgress}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      {member.overdue > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                          <AlertTriangle className="h-3 w-3" />
                          {member.overdue}
                        </span>
                      ) : (
                        <span className="text-sm text-[#334155]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-[#334155] bg-[#1e293b] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#f1f5f9]">Upcoming and Overdue Tasks</h3>
            <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
              <Calendar className="h-3.5 w-3.5" />
              From live board deadlines
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {[...statistics.overdueTasks2, ...statistics.upcomingDeadlines].map((task) => {
              const tone = PRIORITY_META[mapPriority(task.priority)];
              const overdue = statistics.overdueTasks2.some((item) => item.id === task.id);
              const dateStr = task.deadline ? new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No deadline";
              const assignees = task.assigneeName ? [task.assigneeName] : [];

              return (
                <div
                  key={task.id}
                  className="group flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 transition-all lg:flex-nowrap"
                  style={
                    overdue
                      ? { borderColor: "rgba(239,68,68,0.25)", backgroundColor: "rgba(239,68,68,0.05)" }
                      : { borderColor: "rgba(51,65,85,0.5)", backgroundColor: "rgba(15,23,42,0.4)" }
                  }
                >
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: tone.color }} />
                  <span className="min-w-[220px] flex-1 text-sm font-medium text-[#f1f5f9] lg:min-w-0 lg:truncate">{task.title}</span>
                  <div className="flex -space-x-1.5 flex-shrink-0">
                    {assignees.length > 0 ? assignees.map((name) => (
                      <div key={name} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e293b] text-[8px] font-bold text-white" style={{ backgroundColor: avatarColor(name) }} title={name}>
                        {initials(name)}
                      </div>
                    )) : (
                      <div className="flex h-6 items-center rounded-full border border-[#334155] px-2 text-[10px] text-[#64748b]">Unassigned</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs flex-shrink-0 font-medium" style={{ color: overdue ? "#ef4444" : "#64748b" }}>
                    {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                    <span>{dateStr}</span>
                  </div>
                  <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: tone.bg, color: tone.color }}>
                    {tone.label}
                  </span>
                  <span className="hidden lg:block flex-shrink-0 text-[11px] text-[#475569] w-24 text-right">{task.status}</span>
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
