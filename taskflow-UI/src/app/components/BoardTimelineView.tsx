import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle, User } from "lucide-react";
import type { BoardColumn, BoardTask, TaskType } from "./BoardDetail";

const AV_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
function avatarColor(name: string) {
  return AV_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const TYPE_META: Record<TaskType, { bg: string; text: string; label: string }> = {
  BUG:         { bg: "bg-[#ef4444]/15", text: "text-[#ef4444]", label: "Bug"         },
  FEATURE:     { bg: "bg-[#6366f1]/15", text: "text-[#818cf8]", label: "Feature"     },
  EPIC:        { bg: "bg-[#8b5cf6]/15", text: "text-[#c084fc]", label: "Epic"        },
  IMPROVEMENT: { bg: "bg-[#10b981]/15", text: "text-[#34d399]", label: "Improvement" },
};

interface BoardTimelineViewProps {
  columns: BoardColumn[];
  onTaskClick?: (taskId: string) => void;
  matchesFilters?: (task: BoardTask) => boolean;
}

export function BoardTimelineView({ columns, onTaskClick, matchesFilters }: BoardTimelineViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  // Flat array of all tasks across columns
  const allTasksWithCol = useMemo(() => {
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

  // Generate date timeline headers (14 days centered around currentDate)
  const timelineDays = useMemo(() => {
    const days = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - 3); // 3 days before
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const todayStr = new Date().toDateString();

  const handlePrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === "day" ? 7 : 14));
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === "day" ? 7 : 14));
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#0f172a]">
      {/* ── Timeline Header Controls ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-[#334155] bg-[#1e293b]/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-[#f1f5f9] hover:bg-[#334155] transition-colors"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-[#6366f1]" />
            Hôm nay
          </button>

          <div className="flex items-center gap-1 bg-[#0f172a] border border-[#334155] rounded-lg p-0.5">
            <button
              onClick={handlePrev}
              className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#334155]/60 transition-colors"
              title="Khung thời gian trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-[#94a3b8] px-2">
              {timelineDays[0]?.toLocaleDateString("vi-VN", { month: "short", day: "numeric" })} -{" "}
              {timelineDays[timelineDays.length - 1]?.toLocaleDateString("vi-VN", { month: "short", day: "numeric" })}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#334155]/60 transition-colors"
              title="Khung thời gian tiếp"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[#334155] bg-[#0f172a] p-1 text-xs">
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                viewMode === "day" ? "bg-[#6366f1] text-white" : "text-[#94a3b8] hover:text-[#f1f5f9]"
              }`}
            >
              Theo Ngày
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                viewMode === "week" ? "bg-[#6366f1] text-white" : "text-[#94a3b8] hover:text-[#f1f5f9]"
              }`}
            >
              Theo Tuần
            </button>
          </div>
        </div>
      </div>

      {/* ── Timeline Grid Main Body ─────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <div className="min-w-[900px] flex flex-col">
          {/* Table Header: Task Info + Date Grid Header */}
          <div className="sticky top-0 z-20 flex border-b border-[#334155] bg-[#1e293b] text-xs font-semibold text-[#64748b]">
            {/* Task column title */}
            <div className="w-[280px] min-w-[280px] px-4 py-3 border-r border-[#334155] flex-shrink-0 flex items-center justify-between">
              <span>Task & Trạng thái</span>
              <span className="text-[10px] text-[#475569]">({allTasksWithCol.length} tasks)</span>
            </div>

            {/* Date columns */}
            <div className="flex-1 grid grid-cols-14 divide-x divide-[#334155]/60">
              {timelineDays.map((day) => {
                const isToday = day.toDateString() === todayStr;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div
                    key={day.toISOString()}
                    className={`flex flex-col items-center justify-center py-2 text-center select-none ${
                      isToday
                        ? "bg-[#6366f1]/20 text-[#818cf8]"
                        : isWeekend
                        ? "bg-[#0f172a]/50 text-[#64748b]"
                        : "text-[#94a3b8]"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-medium">
                      {day.toLocaleDateString("vi-VN", { weekday: "narrow" })}
                    </span>
                    <span className={`text-xs font-bold ${isToday ? "text-[#818cf8]" : ""}`}>
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Body Rows */}
          {allTasksWithCol.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#64748b]">
              Không tìm thấy task nào trong timeline
            </div>
          ) : (
            <div className="divide-y divide-[#334155]/40">
              {allTasksWithCol.map(({ task, column }) => {
                const typeMeta = TYPE_META[task.type] || TYPE_META.FEATURE;
                const taskDeadline = task.deadline ? new Date(task.deadline) : new Date();
                const isOverdue = new Date(task.deadline) < new Date();

                // Compute horizontal offset bar positioning relative to timelineDays
                const firstDay = timelineDays[0];
                const lastDay = timelineDays[timelineDays.length - 1];

                let startIdx = 0;
                let endIdx = 13;

                if (taskDeadline >= firstDay && taskDeadline <= lastDay) {
                  endIdx = Math.max(0, Math.floor((taskDeadline.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)));
                  startIdx = Math.max(0, endIdx - 2); // 3-day bar span
                } else if (taskDeadline < firstDay) {
                  startIdx = 0;
                  endIdx = 1;
                }

                const gridColStart = startIdx + 1;
                const gridColSpan = Math.max(1, endIdx - startIdx + 1);

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task.id)}
                    className="flex items-center hover:bg-[#334155]/20 transition-colors cursor-pointer group h-14"
                  >
                    {/* Left: Task Info */}
                    <div className="w-[280px] min-w-[280px] px-4 py-2 border-r border-[#334155]/60 flex items-center justify-between gap-2 flex-shrink-0">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase flex-shrink-0 ${typeMeta.bg} ${typeMeta.text}`}>
                            {typeMeta.label}
                          </span>
                          <span className="text-xs font-semibold text-[#f1f5f9] truncate group-hover:text-[#818cf8] transition-colors">
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: column.dotColor }} />
                            <span className="text-[10px] text-[#64748b] truncate">{column.title}</span>
                          </div>
                          {task.assignees.length > 0 && (
                            <div className="flex -space-x-1">
                              {task.assignees.slice(0, 2).map((a) => (
                                <div key={a} className="h-4 w-4 rounded-full text-[7px] font-bold text-white flex items-center justify-center border border-[#0f172a]" style={{ backgroundColor: avatarColor(a) }}>
                                  {initials(a)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Timeline Grid Bar */}
                    <div className="flex-1 grid grid-cols-14 divide-x divide-[#334155]/30 h-full relative items-center px-1">
                      <div
                        className={`h-7 rounded-lg px-2.5 flex items-center justify-between text-xs font-semibold text-white shadow-md transition-all group-hover:brightness-110 ${
                          column.id === "done"
                            ? "bg-emerald-600/90 border border-emerald-500/40"
                            : isOverdue
                            ? "bg-rose-600/90 border border-rose-500/40"
                            : "bg-[#6366f1]/90 border border-[#6366f1]/40"
                        }`}
                        style={{
                          gridColumnStart: gridColStart,
                          gridColumnEnd: `span ${gridColSpan}`,
                        }}
                      >
                        <span className="truncate text-[11px] font-medium">{task.title}</span>
                        {isOverdue && <AlertTriangle className="h-3 w-3 text-white flex-shrink-0 ml-1" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
