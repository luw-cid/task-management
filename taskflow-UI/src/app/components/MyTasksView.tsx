import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { tasksApi } from "../../api";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Search,
  Calendar,
  Filter,
  Plus,
  ChevronDown,
  Hash,
  ClipboardList,
  MoreHorizontal,
  ArrowUpDown,
  Check,
  CheckCircle,
  Inbox,
  ShieldAlert,
  CalendarDays,
  Sparkles,
} from "lucide-react";

export type Priority = "low" | "medium" | "high" | "urgent";

export interface DashboardTask {
  id: string;
  boardId: number;
  title: string;
  board: string;
  boardColor: string;
  priority: Priority;
  deadline: string;
  assignee: string;
  done: boolean;
}

export const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-slate-500/10 text-slate-400 border-slate-500/20", text: "text-slate-400", label: "Low" },
  medium: { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", text: "text-amber-400", label: "Medium" },
  high: { bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", text: "text-indigo-400", label: "High" },
  urgent: { bg: "bg-rose-500/10 text-rose-400 border-rose-500/20", text: "text-rose-400", label: "Urgent" },
};

function getAvatarColor(name: string) {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
  return colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

type TabType = "all" | "active" | "overdue" | "completed";

interface MyTasksViewProps {
  tasks: DashboardTask[];
  onOpenTask: (task: DashboardTask) => void;
  onCreateTask: () => void;
}

export function MyTasksView({ tasks: propTasks, onOpenTask, onCreateTask }: MyTasksViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "title">("deadline");

  // Call API GET /api/tasks/me directly inside MyTasksView
  const myTasksQuery = useQuery({
    queryKey: ["my-tasks-view", activeTab, sortBy],
    queryFn: () => tasksApi.getMyTasks(activeTab === "all" ? undefined : activeTab, sortBy),
    retry: false,
  });

  const tasks = useMemo(() => {
    if (myTasksQuery.data && Array.isArray(myTasksQuery.data)) {
      return myTasksQuery.data.map((t: any) => ({
        id: String(t.id),
        boardId: t.boardId,
        title: t.title,
        board: t.boardName ?? t.board ?? "Board",
        boardColor: t.color ?? "#6366f1",
        priority: (t.priority?.toLowerCase() === "critical" ? "urgent" : t.priority?.toLowerCase() || "medium") as Priority,
        deadline: t.deadline ?? new Date().toISOString(),
        assignee: t.assigneeName ?? t.assignee ?? "Unassigned",
        done: t.status === "DONE" || t.done === true,
      }));
    }
    return propTasks;
  }, [myTasksQuery.data, propTasks]);

  // Calculate task counts
  const now = new Date();
  
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.done).length;
    const overdue = tasks.filter((t) => !t.done && new Date(t.deadline) < now).length;
    const active = tasks.filter((t) => !t.done && new Date(t.deadline) >= now).length;

    return { total, active, overdue, completed };
  }, [tasks, now]);

  // Filter tasks based on activeTab, searchQuery, priorityFilter
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Tab filter
        if (activeTab === "active") {
          if (task.done || new Date(task.deadline) < now) return false;
        } else if (activeTab === "overdue") {
          if (task.done || new Date(task.deadline) >= now) return false;
        } else if (activeTab === "completed") {
          if (!task.done) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesBoard = task.board.toLowerCase().includes(q);
          if (!matchesTitle && !matchesBoard) return false;
        }

        // Priority filter
        if (priorityFilter !== "all" && task.priority !== priorityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === "priority") {
          const priorityWeight: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [tasks, activeTab, searchQuery, priorityFilter, sortBy, now]);

  const tabsConfig: { id: TabType; label: string; count: number; icon: React.ElementType; colorClass: string; activeBadgeClass: string }[] = [
    {
      id: "all",
      label: "Tất cả (All)",
      count: metrics.total,
      icon: ClipboardList,
      colorClass: "text-foreground",
      activeBadgeClass: "bg-primary/20 text-primary border-primary/30",
    },
    {
      id: "active",
      label: "Còn hạn",
      count: metrics.active,
      icon: Clock,
      colorClass: "text-amber-400",
      activeBadgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    {
      id: "overdue",
      label: "Quá hạn",
      count: metrics.overdue,
      icon: AlertTriangle,
      colorClass: "text-rose-400",
      activeBadgeClass: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    },
    {
      id: "completed",
      label: "Đã hoàn thành",
      count: metrics.completed,
      icon: CheckCircle2,
      colorClass: "text-emerald-400",
      activeBadgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 px-3 sm:px-8 py-4 sm:py-8 w-full max-w-7xl mx-auto">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">My Tasks</h1>
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-3 w-3" /> Dashboard
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Quản lý và theo dõi tất cả các công việc được giao cho bạn
          </p>
        </div>

        <button
          onClick={onCreateTask}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/25 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo task mới</span>
        </button>
      </div>

      {/* ── Summary Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-card border-primary ring-1 ring-primary/50 shadow-md"
              : "bg-card/60 border-border hover:border-border/80 hover:bg-card"
          }`}
        >
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
            <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-foreground leading-none">{metrics.total}</p>
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-1">Tất cả task</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 transition-all cursor-pointer ${
            activeTab === "active"
              ? "bg-card border-amber-500 ring-1 ring-amber-500/50 shadow-md"
              : "bg-card/60 border-border hover:border-border/80 hover:bg-card"
          }`}
        >
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 flex-shrink-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-amber-400 leading-none">{metrics.active}</p>
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-1">Còn hạn</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("overdue")}
          className={`flex items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 transition-all cursor-pointer ${
            activeTab === "overdue"
              ? "bg-card border-rose-500 ring-1 ring-rose-500/50 shadow-md"
              : "bg-card/60 border-border hover:border-border/80 hover:bg-card"
          }`}
        >
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 flex-shrink-0">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-rose-400 leading-none">{metrics.overdue}</p>
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-1">Quá hạn</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab("completed")}
          className={`flex items-center gap-3 sm:gap-4 rounded-xl border p-3 sm:p-4 transition-all cursor-pointer ${
            activeTab === "completed"
              ? "bg-card border-emerald-500 ring-1 ring-emerald-500/50 shadow-md"
              : "bg-card/60 border-border hover:border-border/80 hover:bg-card"
          }`}
        >
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400 leading-none">{metrics.completed}</p>
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-1">Đã hoàn thành</p>
          </div>
        </div>
      </div>

      {/* ── Main Section Container ─────────────────────────────────────────────── */}
      <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 border-b border-border/80 bg-secondary/10">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/40 border border-border/60 overflow-x-auto scrollbar-none">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-card text-foreground shadow-sm border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? tab.colorClass : "text-muted-foreground"}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                      isActive
                        ? tab.activeBadgeClass
                        : tab.id === "overdue" && tab.count > 0
                        ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
                        : "bg-secondary text-muted-foreground border-border/40"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Controls: Search & Priority Filter & Sort */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm task..."
                className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-border bg-card py-1.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all"
            >
              <option value="all">Tất cả ưu tiên</option>
              <option value="urgent">Urgent (Khẩn cấp)</option>
              <option value="high">High (Cao)</option>
              <option value="medium">Medium (Trung bình)</option>
              <option value="low">Low (Thấp)</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "deadline" | "priority" | "title")}
              className="rounded-lg border border-border bg-card py-1.5 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all"
            >
              <option value="deadline">Sắp xếp: Hạn chót</option>
              <option value="priority">Sắp xếp: Độ ưu tiên</option>
              <option value="title">Sắp xếp: Tên task</option>
            </select>
          </div>
        </div>

        {/* Task Table Header */}
        <div className="hidden md:grid grid-cols-[1fr_120px_140px_130px_100px_40px] items-center gap-4 px-6 py-3 border-b border-border/60 bg-secondary/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span className="pl-9">Task Name</span>
          <span className="text-center">Độ ưu tiên</span>
          <span className="text-center">Hạn chót</span>
          <span className="text-center">Trạng thái</span>
          <span className="text-center">Người thực hiện</span>
          <span />
        </div>

        {/* Task List */}
        <div className="divide-y divide-border/40">
          <AnimatePresence mode="wait">
            {filteredTasks.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-16 px-4 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground mb-4">
                  {activeTab === "overdue" ? (
                    <ShieldAlert className="h-7 w-7 text-emerald-400" />
                  ) : activeTab === "active" ? (
                    <CalendarDays className="h-7 w-7 text-amber-400" />
                  ) : (
                    <Inbox className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {activeTab === "overdue"
                    ? "Tuyệt vời! Không có task nào quá hạn 🎉"
                    : activeTab === "active"
                    ? "Không có task nào còn hạn"
                    : activeTab === "completed"
                    ? "Chưa có task nào được hoàn thành"
                    : "Không tìm thấy task nào"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  {activeTab === "overdue"
                    ? "Tất cả các công việc của bạn đều đúng tiến độ hoặc đã hoàn thành."
                    : searchQuery || priorityFilter !== "all"
                    ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem kết quả khác."
                    : "Bạn có thể tạo task mới để bắt đầu theo dõi tiến độ công việc."}
                </p>
              </motion.div>
            ) : (
              filteredTasks.map((task) => (
                <MyTaskRow key={task.id} task={task} onOpen={onOpenTask} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Individual Task Row Component ─────────────────────────────────────────────

function MyTaskRow({ task, onOpen }: { task: DashboardTask; onOpen: (task: DashboardTask) => void }) {
  const [done, setDone] = useState(task.done);
  const p = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const isOverdue = !done && new Date(task.deadline) < new Date();
  
  // Format deadline date
  const deadlineDate = new Date(task.deadline);
  const formattedDate = deadlineDate.toLocaleDateString("vi-VN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      onClick={() => onOpen(task)}
      className={`group px-3 py-3 sm:px-6 sm:py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer ${
        done ? "opacity-60 bg-secondary/10" : ""
      }`}
    >
      {/* Mobile view (< md) */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDone(!done);
              }}
              className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
              ) : (
                <Circle className="h-4 w-4 hover:border-primary" />
              )}
            </button>
            <p className={`text-xs font-semibold truncate ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.title}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {done ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Check className="h-2.5 w-2.5" /> Hoàn thành
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="h-2.5 w-2.5" /> Quá hạn
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="h-2.5 w-2.5" /> Còn hạn
              </span>
            )}
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: getAvatarColor(task.assignee) }}
              title={task.assignee}
            >
              {getInitials(task.assignee)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-6">
          <div className="flex items-center gap-1.5 truncate">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.boardColor }} />
            <span className="truncate">{task.board}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold border ${p.bg}`}>
              {p.label}
            </span>
            <div className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-rose-400" : "text-muted-foreground"}`}>
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop view (>= md) */}
      <div className="hidden md:grid grid-cols-[1fr_120px_140px_130px_100px_40px] items-center gap-4">
        {/* Task Name & Checkbox */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDone(!done);
            }}
            className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
          >
            {done ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
            ) : (
              <Circle className="h-5 w-5 hover:border-primary" />
            )}
          </button>

          <div className="flex flex-col min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                done ? "line-through text-muted-foreground" : "text-foreground group-hover:text-primary transition-colors"
              }`}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.boardColor }}
              />
              <span className="text-xs text-muted-foreground truncate font-medium">{task.board}</span>
            </div>
          </div>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center justify-center">
          <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold border ${p.bg}`}>
            {p.label}
          </span>
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-center">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? "text-rose-400" : done ? "text-muted-foreground" : "text-foreground/80"}`}>
            {isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5 text-muted-foreground" />}
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center">
          {done ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check className="h-3 w-3" /> Hoàn thành
            </span>
          ) : isOverdue ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
              <AlertTriangle className="h-3 w-3" /> Quá hạn
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-3 w-3" /> Còn hạn
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center justify-center">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(task.assignee) }}
            title={task.assignee}
          >
            {getInitials(task.assignee)}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(task);
            }}
            className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
