import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { BoardColumn, BoardTask, TaskType } from "./BoardDetail";

const AV_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
function avatarColor(name: string) {
  return AV_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const TYPE_META: Record<TaskType, { bg: string; text: string; dot: string; label: string }> = {
  BUG:         { bg: "bg-[#ef4444]/20", text: "text-[#ef4444]", dot: "#ef4444", label: "Bug"         },
  FEATURE:     { bg: "bg-[#6366f1]/20", text: "text-[#818cf8]", dot: "#6366f1", label: "Feature"     },
  EPIC:        { bg: "bg-[#8b5cf6]/20", text: "text-[#c084fc]", dot: "#8b5cf6", label: "Epic"        },
  IMPROVEMENT: { bg: "bg-[#10b981]/20", text: "text-[#34d399]", dot: "#10b981", label: "Improvement" },
};

interface BoardCalendarViewProps {
  columns: BoardColumn[];
  onTaskClick?: (taskId: string) => void;
  matchesFilters?: (task: BoardTask) => boolean;
}

export function BoardCalendarView({ columns, onTaskClick, matchesFilters }: BoardCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // All tasks flattened
  const allTasks = useMemo(() => {
    const list: { task: BoardTask; column: BoardColumn }[] = [];
    columns.forEach((col) => {
      col.tasks.forEach((t) => {
        if (!matchesFilters || matchesFilters(t)) {
          list.push({ task: t, column: col });
        }
      });
    });
    return list;
  }, [columns, matchesFilters]);

  // Calendar month days calculation
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week offset (Mon=0 ... Sun=6)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Leading days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Trailing days from next month to fill grid (multiple of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    }

    return days;
  }, [year, month]);

  const monthLabel = currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  const todayStr = new Date().toDateString();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now);
  };

  // Selected day tasks
  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const targetStr = selectedDay.toDateString();
    return allTasks.filter(({ task }) => {
      if (!task.deadline) return false;
      return new Date(task.deadline).toDateString() === targetStr;
    });
  }, [selectedDay, allTasks]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-[#0f172a] px-3 sm:px-8 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-5">

        {/* ── Calendar Header Controls ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#334155] bg-[#1e293b]/80 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-[#f1f5f9] capitalize">{monthLabel}</h2>
            <button
              onClick={handleToday}
              className="flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#0f172a] px-2.5 py-1 text-xs font-semibold text-[#818cf8] hover:bg-[#334155] transition-colors"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Tháng này
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-[#334155] bg-[#0f172a] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#334155] transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-[#334155] bg-[#0f172a] text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#334155] transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Month Grid View ─────────────────────────────────────────────────── */}
        <div className="flex flex-col rounded-2xl border border-[#334155] bg-[#1e293b]/60 overflow-hidden shadow-sm">
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 border-b border-[#334155] bg-[#1e293b] text-center text-xs font-semibold text-[#64748b] py-2.5">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span className="text-[#818cf8]">T7</span>
            <span className="text-[#818cf8]">CN</span>
          </div>

          {/* Month Days Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#334155]/40 bg-[#0f172a]">
            {calendarGrid.map(({ date, isCurrentMonth }) => {
              const dateStr = date.toDateString();
              const isToday = dateStr === todayStr;
              const isSelected = selectedDay && selectedDay.toDateString() === dateStr;

              // Find tasks matching this date's deadline
              const dayTasks = allTasks.filter(({ task }) => {
                if (!task.deadline) return false;
                return new Date(task.deadline).toDateString() === dateStr;
              });

              return (
                <div
                  key={date.toISOString()}
                  onClick={() => setSelectedDay(date)}
                  className={`min-h-[90px] sm:min-h-[120px] p-1.5 sm:p-2 transition-colors cursor-pointer flex flex-col justify-start gap-1 ${
                    !isCurrentMonth ? "bg-[#0f172a]/30 opacity-40" : "hover:bg-[#334155]/20"
                  } ${isSelected ? "ring-2 ring-[#6366f1] ring-inset bg-[#6366f1]/[0.05]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        isToday
                          ? "bg-[#6366f1] text-white font-bold"
                          : isCurrentMonth
                          ? "text-[#f1f5f9]"
                          : "text-[#64748b]"
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-[#818cf8] px-1 bg-[#6366f1]/20 rounded">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Day Tasks List (Event Pills) */}
                  <div className="flex flex-col gap-1 overflow-hidden mt-0.5">
                    {dayTasks.slice(0, 3).map(({ task, column }) => {
                      const typeMeta = TYPE_META[task.type] || TYPE_META.FEATURE;
                      const isOverdue = new Date(task.deadline) < new Date() && column.id !== "done";

                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick?.(task.id);
                          }}
                          className={`flex items-center justify-between rounded px-1.5 py-1 text-[10px] font-medium transition-all truncate hover:scale-[1.02] ${
                            isOverdue
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : column.id === "done"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-[#1e293b] text-[#f1f5f9] border border-[#334155]"
                          }`}
                          title={task.title}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: typeMeta.dot }} />
                            <span className="truncate">{task.title}</span>
                          </div>
                        </div>
                      );
                    })}

                    {dayTasks.length > 3 && (
                      <span className="text-[9px] text-[#64748b] font-semibold pl-1">
                        +{dayTasks.length - 3} task nữa...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Selected Day Schedule Details (Great for Mobile!) ──────────────── */}
        {selectedDay && (
          <div className="flex flex-col rounded-xl border border-[#334155] bg-[#1e293b] p-4 gap-3 shadow-md">
            <div className="flex items-center justify-between border-b border-[#334155] pb-2">
              <h3 className="text-sm font-semibold text-[#f1f5f9] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#818cf8]" />
                Công việc ngày {selectedDay.toLocaleDateString("vi-VN", { weekday: "long", month: "numeric", day: "numeric" })}
              </h3>
              <span className="text-xs text-[#64748b]">
                {selectedDayTasks.length} task
              </span>
            </div>

            {selectedDayTasks.length === 0 ? (
              <p className="text-xs text-[#64748b] py-2 text-center">
                Không có deadline công việc nào trong ngày này
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDayTasks.map(({ task, column }) => {
                  const typeMeta = TYPE_META[task.type] || TYPE_META.FEATURE;
                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick?.(task.id)}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#334155] bg-[#0f172a] hover:bg-[#334155]/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${typeMeta.bg} ${typeMeta.text}`}>
                          {typeMeta.label}
                        </span>
                        <span className="text-xs font-semibold text-[#f1f5f9] truncate">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-[#94a3b8] px-2 py-0.5 rounded bg-[#1e293b] border border-[#334155]">
                          {column.title}
                        </span>
                        {task.assignees.length > 0 && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: avatarColor(task.assignees[0]) }}>
                            {initials(task.assignees[0])}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
