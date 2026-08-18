import React, { useState } from "react";
import { ChevronDown, Calendar, AlertTriangle } from "lucide-react";
import type { BoardColumn, BoardTask, TaskType } from "./BoardDetail";

const AV_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
function avatarColor(name: string) {
  return AV_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
}
function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const TYPE_META: Record<TaskType, { bg: string; text: string; dot: string; label: string }> = {
  BUG:         { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", dot: "#ef4444", label: "Bug"         },
  FEATURE:     { bg: "bg-[#6366f1]/10", text: "text-[#6366f1]", dot: "#6366f1", label: "Feature"     },
  EPIC:        { bg: "bg-[#8b5cf6]/10", text: "text-[#8b5cf6]", dot: "#8b5cf6", label: "Epic"        },
  IMPROVEMENT: { bg: "bg-[#10b981]/10", text: "text-[#10b981]", dot: "#10b981", label: "Improvement" },
};

interface BoardListViewProps {
  columns: BoardColumn[];
  onTaskClick?: (taskId: string) => void;
  matchesFilters?: (task: BoardTask) => boolean;
}

export function BoardListView({ columns, onTaskClick, matchesFilters }: BoardListViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (colId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        {columns.map((col) => {
          const visibleTasks = matchesFilters ? col.tasks.filter(matchesFilters) : col.tasks;
          const isCollapsed = collapsedGroups[col.id];

          return (
            <div key={col.id} className="flex flex-col rounded-xl border border-[#334155] bg-[#1e293b]/60 overflow-hidden shadow-sm">
              {/* Group Header */}
              <div
                onClick={() => toggleGroup(col.id)}
                className="flex items-center justify-between px-4 py-3 bg-[#1e293b] border-b border-[#334155]/80 cursor-pointer select-none hover:bg-[#334155]/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ChevronDown className={`h-4 w-4 text-[#64748b] transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.dotColor }} />
                  <h3 className="text-sm font-semibold text-[#f1f5f9]">{col.title}</h3>
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-[10px] font-bold"
                    style={{ backgroundColor: col.dotColor + "22", color: col.dotColor }}
                  >
                    {visibleTasks.length}
                  </span>
                </div>
              </div>

              {/* Group Task List */}
              {!isCollapsed && (
                <div>
                  {visibleTasks.length === 0 ? (
                    <div className="py-6 px-4 text-center text-xs text-[#64748b]">
                      Không có task nào trong cột này
                    </div>
                  ) : (
                    <div className="divide-y divide-[#334155]/40">
                      {/* Desktop Table Header */}
                      <div className="hidden md:grid grid-cols-[1fr_110px_130px_130px_140px] items-center gap-4 px-5 py-2.5 bg-[#0f172a]/40 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                        <span>Task Name</span>
                        <span className="text-center">Priority</span>
                        <span className="text-center">Deadline</span>
                        <span className="text-center">Assignees</span>
                        <span className="text-right">Labels</span>
                      </div>

                      {/* Task Rows */}
                      {visibleTasks.map((task) => (
                        <BoardListRow key={task.id} task={task} onClick={() => onTaskClick?.(task.id)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BoardListRow({ task, onClick }: { task: BoardTask; onClick: () => void }) {
  const t = TYPE_META[task.type] || TYPE_META.FEATURE;
  const isDone = task.subtasks.total > 0 && task.subtasks.done === task.subtasks.total;
  const isOverdue = !isDone && task.deadline && new Date(task.deadline) < new Date();

  return (
    <div
      onClick={onClick}
      className="group px-4 py-3 sm:px-5 sm:py-3.5 hover:bg-[#334155]/30 transition-colors cursor-pointer"
    >
      {/* Mobile view (< md) */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${t.bg} ${t.text}`}>
              {t.label}
            </span>
            <h4 className={`text-xs font-semibold truncate ${isDone ? "line-through text-[#64748b]" : "text-[#f1f5f9]"}`}>
              {task.title}
            </h4>
          </div>
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold capitalize ${
            task.priority === "urgent" ? "bg-[#ef4444]/15 text-[#ef4444]"
            : task.priority === "high" ? "bg-[#f59e0b]/15 text-[#f59e0b]"
            : task.priority === "medium" ? "bg-[#6366f1]/15 text-[#818cf8]"
            : "bg-[#64748b]/15 text-[#94a3b8]"
          }`}>
            {task.priority}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#64748b]">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {task.assignees.slice(0, 3).map((a) => (
                <div key={a} className="flex h-5 w-5 items-center justify-center rounded-full border border-[#1e293b] text-[8px] font-bold text-white" style={{ backgroundColor: avatarColor(a) }}>
                  {initials(a)}
                </div>
              ))}
            </div>
            {task.subtasks.total > 0 && (
              <span className="text-[10px] text-[#64748b]">{task.subtasks.done}/{task.subtasks.total} subtasks</span>
            )}
          </div>

          <div className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-[#ef4444]" : "text-[#64748b]"}`}>
            <Calendar className="h-3 w-3" />
            <span>{task.deadline}</span>
          </div>
        </div>
      </div>

      {/* Desktop view (>= md) */}
      <div className="hidden md:grid grid-cols-[1fr_110px_130px_130px_140px] items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase flex-shrink-0 ${t.bg} ${t.text}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.dot }} />
            {t.label}
          </span>
          <div className="flex flex-col min-w-0">
            <h4 className={`text-sm font-semibold truncate group-hover:text-[#818cf8] transition-colors ${isDone ? "line-through text-[#64748b]" : "text-[#f1f5f9]"}`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-[#64748b] truncate mt-0.5">{task.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
            task.priority === "urgent" ? "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30"
            : task.priority === "high" ? "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30"
            : task.priority === "medium" ? "bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30"
            : "bg-[#64748b]/15 text-[#94a3b8] border border-[#64748b]/30"
          }`}>
            {task.priority}
          </span>
        </div>

        <div className="flex items-center justify-center">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? "text-[#ef4444]" : "text-[#94a3b8]"}`}>
            {isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5 text-[#64748b]" />}
            <span>{task.deadline}</span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((a) => (
              <div key={a} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e293b] text-[8px] font-bold text-white" style={{ backgroundColor: avatarColor(a) }} title={a}>
                {initials(a)}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e293b] bg-[#334155] text-[8px] font-medium text-[#94a3b8]">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 flex-wrap">
          {task.labels.slice(0, 2).map((l) => (
            <span key={l.text} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: l.color + "18", color: l.color }}>
              {l.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
