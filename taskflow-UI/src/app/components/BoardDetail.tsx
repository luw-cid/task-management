import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import {
  ArrowLeft, Star, Filter, ChevronDown, Plus,
  MoreHorizontal, Paperclip, Calendar, CheckSquare, AlertTriangle,
  Grip, UserPlus, LayoutGrid, List,
  GitBranch, CalendarDays, TrendingUp, Settings, Tag,
  Pencil, Trash2, Check, X,
} from "lucide-react";
import { BoardMembersModal } from "./BoardMembersModal";
import { BoardStatistics } from "./BoardStatistics";
import { FilterSearchPanel, type FilterState } from "./FilterSearchPanel";
import { BoardChatWidget } from "./BoardChatWidget";
import { BoardListView } from "./BoardListView";
import { BoardTimelineView } from "./BoardTimelineView";
import { BoardCalendarView } from "./BoardCalendarView";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskType = "BUG" | "FEATURE" | "EPIC" | "IMPROVEMENT";
type Priority  = "low" | "medium" | "high" | "urgent";

interface TaskLabel { text: string; color: string; }

export interface BoardTask {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  labels: TaskLabel[];
  assignees: string[];
  priority: Priority;
  deadline: string;
  subtasks: { done: number; total: number };
  attachments: number;
  comments: number;
  isDragging?: boolean;
}

export interface BoardColumn {
  id: string;
  title: string;
  dotColor: string;
  accentBg?: string;
  accentBorder?: string;
  tasks: BoardTask[];
  isDone?: boolean;
}

type DraggedTask = { taskId: string; sourceColumnId: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AV_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
function avatarColor(name: string) {
  return AV_COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function moveTaskBetweenColumns(
  columns: BoardColumn[],
  taskId: string,
  sourceColumnId: string,
  targetColumnId: string
) {
  if (sourceColumnId === targetColumnId) return null;

  const next = columns.map((col) => ({ ...col, tasks: [...col.tasks] }));
  const sourceColumn = next.find((col) => col.id === sourceColumnId);
  const targetColumn = next.find((col) => col.id === targetColumnId);
  if (!sourceColumn || !targetColumn) return null;

  const taskIndex = sourceColumn.tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) return null;

  const [task] = sourceColumn.tasks.splice(taskIndex, 1);
  targetColumn.tasks.push(task);

  return {
    columns: next,
    targetIndex: targetColumn.tasks.length - 1,
  };
}

async function persistTaskMove(taskId: string, targetColumnId: string, targetIndex: number) {
  // Replace with Spring Boot API call when the move endpoint is available.
  await Promise.resolve({ taskId, targetColumnId, targetIndex });
}

const TODAY = new Date();

// ─── Type metadata ────────────────────────────────────────────────────────────

const TYPE_META: Record<TaskType, { bg: string; text: string; dot: string; label: string }> = {
  BUG:         { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", dot: "#ef4444", label: "Bug"         },
  FEATURE:     { bg: "bg-[#6366f1]/10", text: "text-[#6366f1]", dot: "#6366f1", label: "Feature"     },
  EPIC:        { bg: "bg-[#8b5cf6]/10", text: "text-[#8b5cf6]", dot: "#8b5cf6", label: "Epic"        },
  IMPROVEMENT: { bg: "bg-[#10b981]/10", text: "text-[#10b981]", dot: "#10b981", label: "Improvement" },
};

// ─── Board data ───────────────────────────────────────────────────────────────

const MEMBERS = ["Alice Johnson", "Marcus Webb", "Sarah Chen", "Tom Wilson", "Priya Nair", "Emily Davis", "Alex Rivera"];

const COLUMNS: BoardColumn[] = [
  {
    id: "todo", title: "To Do", dotColor: "#64748b",
    tasks: [
      {
        id: "c1", type: "FEATURE",
        title: "Redesign onboarding flow",
        description: "Rework the 5-step onboarding into a streamlined 3-step wizard with live progress tracking and contextual tooltips.",
        labels: [{ text: "UX", color: "#6366f1" }, { text: "Frontend", color: "#3b82f6" }],
        assignees: ["Alice Johnson", "Sarah Chen"],
        priority: "high", deadline: "2026-06-05",
        subtasks: { done: 2, total: 5 }, attachments: 3, comments: 4,
      },
      {
        id: "c2", type: "BUG",
        title: "Fix login redirect on mobile Safari",
        description: "Auth redirect fails silently on iOS Safari 17 when third-party cookies are blocked by the browser.",
        labels: [{ text: "Mobile", color: "#f59e0b" }, { text: "Auth", color: "#ef4444" }],
        assignees: ["Tom Wilson"],
        priority: "urgent", deadline: "2026-05-24",
        subtasks: { done: 0, total: 2 }, attachments: 1, comments: 2,
      },
      {
        id: "c3", type: "IMPROVEMENT",
        title: "Improve search result ranking",
        description: "Replace simple string match with weighted fuzzy search using TF-IDF relevance scoring algorithms.",
        labels: [{ text: "Backend", color: "#8b5cf6" }, { text: "Search", color: "#10b981" }],
        assignees: ["Priya Nair", "Marcus Webb"],
        priority: "medium", deadline: "2026-06-10",
        subtasks: { done: 1, total: 3 }, attachments: 2, comments: 5,
      },
    ],
  },
  {
    id: "in-progress", title: "In Progress", dotColor: "#6366f1",
    accentBg: "bg-[#6366f1]/5", accentBorder: "border-[#6366f1]/25",
    tasks: [
      {
        id: "c4", type: "EPIC",
        title: "Auth system v2 — OAuth + SSO",
        description: "Implement OAuth 2.0 with Google and GitHub, plus enterprise SSO via SAML 2.0 federation protocol.",
        labels: [{ text: "Auth", color: "#ef4444" }, { text: "Backend", color: "#8b5cf6" }, { text: "Security", color: "#f59e0b" }],
        assignees: ["Alex Rivera", "Tom Wilson", "Priya Nair"],
        priority: "high", deadline: "2026-06-03",
        subtasks: { done: 3, total: 6 }, attachments: 5, comments: 8,
      },
      {
        id: "c5", type: "FEATURE",
        title: "Dashboard analytics widgets",
        description: "Add burndown chart, velocity tracker, and cycle time histogram to the sprint overview panel.",
        labels: [{ text: "Analytics", color: "#6366f1" }, { text: "Charts", color: "#06b6d4" }],
        assignees: ["Sarah Chen"],
        priority: "medium", deadline: "2026-06-08",
        subtasks: { done: 4, total: 4 }, attachments: 2, comments: 3,
      },
    ],
  },
  {
    id: "in-review", title: "In Review", dotColor: "#f59e0b",
    tasks: [
      {
        id: "c6", type: "BUG",
        title: "Memory leak in real-time sync",
        description: "WebSocket listeners are not cleaned up on route change, causing steady heap growth over time.",
        labels: [{ text: "Performance", color: "#f97316" }, { text: "WebSocket", color: "#8b5cf6" }],
        assignees: ["Marcus Webb"],
        priority: "urgent", deadline: "2026-05-23",
        subtasks: { done: 1, total: 1 }, attachments: 3, comments: 6,
      },
      {
        id: "c7", type: "IMPROVEMENT",
        title: "Keyboard navigation for board",
        description: "Full keyboard support — arrow keys to move focus between cards and columns, Enter to open detail.",
        labels: [{ text: "A11y", color: "#10b981" }, { text: "Frontend", color: "#3b82f6" }],
        assignees: ["Emily Davis"],
        priority: "low", deadline: "2026-06-01",
        subtasks: { done: 3, total: 3 }, attachments: 0, comments: 2,
      },
    ],
  },
  {
    id: "done", title: "Done", dotColor: "#10b981", isDone: true,
    tasks: [
      {
        id: "c8", type: "FEATURE",
        title: "CSV export for task lists",
        description: "One-click export of filtered task views to CSV with all metadata columns included.",
        labels: [{ text: "Export", color: "#10b981" }, { text: "Backend", color: "#8b5cf6" }],
        assignees: ["Alex Rivera"],
        priority: "medium", deadline: "2026-05-22",
        subtasks: { done: 3, total: 3 }, attachments: 1, comments: 3,
      },
      {
        id: "c9", type: "BUG",
        title: "Notification bell missing on mobile",
        description: "The bell icon was clipped by the hamburger overflow container on viewports under 375px.",
        labels: [{ text: "Mobile", color: "#f59e0b" }, { text: "UI", color: "#6366f1" }],
        assignees: ["Emily Davis"],
        priority: "high", deadline: "2026-05-20",
        subtasks: { done: 2, total: 2 }, attachments: 2, comments: 1,
      },
      {
        id: "c10", type: "EPIC",
        title: "Initial project setup & CI/CD",
        description: "Repository scaffold, GitHub Actions pipelines, staging and production deployment config.",
        labels: [{ text: "DevOps", color: "#06b6d4" }, { text: "Infra", color: "#94a3b8" }],
        assignees: ["Alex Rivera", "Tom Wilson"],
        priority: "high", deadline: "2026-05-15",
        subtasks: { done: 6, total: 6 }, attachments: 4, comments: 7,
      },
      {
        id: "c11", type: "FEATURE",
        title: "Dark mode implementation",
        description: "System-level dark mode toggle with smooth CSS variable transitions across all components.",
        labels: [{ text: "UI", color: "#6366f1" }, { text: "Frontend", color: "#3b82f6" }],
        assignees: ["Sarah Chen"],
        priority: "medium", deadline: "2026-05-10",
        subtasks: { done: 5, total: 5 }, attachments: 1, comments: 4,
      },
      {
        id: "c12", type: "IMPROVEMENT",
        title: "User permission roles system",
        description: "Granular RBAC with Admin, Member, and Viewer roles across all board operations.",
        labels: [{ text: "Auth", color: "#ef4444" }, { text: "Backend", color: "#8b5cf6" }],
        assignees: ["Priya Nair", "Marcus Webb"],
        priority: "high", deadline: "2026-05-05",
        subtasks: { done: 4, total: 4 }, attachments: 3, comments: 5,
      },
    ],
  },
];

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  isDone,
  onClick,
  onDragStart,
  onDragEnd,
  isDragSource = false,
  filterState = "none",
}: {
  task: BoardTask;
  isDone?: boolean;
  onClick?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  isDragSource?: boolean;
  filterState?: "none" | "match" | "dimmed";
}) {
  const t = TYPE_META[task.type];
  const isOverdue = !isDone && new Date(task.deadline) < TODAY;
  const pct = task.subtasks.total > 0 ? (task.subtasks.done / task.subtasks.total) * 100 : 0;
  const deadlineLabel = new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const allDone = task.subtasks.done === task.subtasks.total && task.subtasks.total > 0;
  const filterClass =
    filterState === "match"
      ? "ring-1 ring-[#6366f1]/45 shadow-[0_0_0_1px_rgba(99,102,241,0.14),0_14px_36px_-24px_rgba(99,102,241,0.9)]"
      : filterState === "dimmed"
        ? "opacity-45 saturate-50 hover:opacity-60"
        : "";

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={task.isDragging ? {
        transform: "rotate(1.5deg) scale(1.03)",
        boxShadow: "0 28px 70px -12px rgba(0,0,0,0.9), 0 0 0 2px rgba(99,102,241,0.5)",
        zIndex: 20,
        position: "relative",
      } : undefined}
      className={[
        "group relative flex flex-col gap-2.5 sm:gap-3 rounded-lg border p-3 sm:p-4 select-none transition-all duration-200",
        filterClass,
        isDragSource ? "opacity-45 scale-[0.98]" : "",
        task.isDragging
          ? "border-[#6366f1]/50 bg-[#1e293b] ring-1 ring-[#6366f1]/25 cursor-grabbing"
          : isDone
            ? "border-[#334155]/50 bg-[#1e293b]/60 opacity-60 hover:opacity-80 hover:border-[#334155] cursor-pointer"
            : "border-[#334155] bg-[#1e293b] hover:border-[#475569] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing",
      ].join(" ")}
    >
      {/* Drag handle — visible on hover */}
      {!task.isDragging && (
        <div className="absolute top-3.5 right-9 opacity-0 group-hover:opacity-100 transition-opacity">
          <Grip className="h-3.5 w-3.5 text-[#475569]" />
        </div>
      )}

      {/* Top row: type badge + ⋯ */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${t.bg} ${t.text}`}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.dot }} />
          {t.label}
        </span>
        <button
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded text-[#475569] hover:text-[#94a3b8] hover:bg-[#334155]/80 transition-all flex-shrink-0"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Title */}
      <div>
        <h4 className={`text-sm font-semibold leading-snug ${isDone ? "line-through text-[#64748b]" : "text-[#f1f5f9]"}`}>
          {task.title}
        </h4>
        <p className="mt-1.5 text-[11px] text-[#64748b] leading-relaxed line-clamp-2">{task.description}</p>
      </div>

      {/* Label pills */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {task.labels.map((l) => (
            <span
              key={l.text}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: l.color + "18", color: l.color }}
            >
              {l.text}
            </span>
          ))}
        </div>
      )}

      {/* Subtask progress bar */}
      {task.subtasks.total > 0 && (
        <div className="h-[3px] w-full rounded-full bg-[#334155]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: allDone ? "#10b981" : "#6366f1" }}
          />
        </div>
      )}

      {/* Bottom meta row */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* Assignee avatars */}
        <div className="flex -space-x-1.5">
          {task.assignees.slice(0, 3).map((a) => (
            <div
              key={a}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e293b] text-[8px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: avatarColor(a) }}
              title={a}
            >
              {initials(a)}
            </div>
          ))}
          {task.assignees.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1e293b] bg-[#334155] text-[8px] font-medium text-[#94a3b8]">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>

        {/* Right meta chips */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Subtask count */}
          <span className={`flex items-center gap-1 text-[10px] font-medium ${allDone ? "text-[#10b981]" : "text-[#64748b]"}`}>
            <CheckSquare className="h-3 w-3" />
            {task.subtasks.done}/{task.subtasks.total}
          </span>

          {/* Attachments */}
          {task.attachments > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[#64748b]">
              <Paperclip className="h-3 w-3" />
              {task.attachments}
            </span>
          )}

          {/* Deadline badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              isOverdue
                ? "bg-[#ef4444]/12 text-[#ef4444]"
                : isDone
                  ? "text-[#64748b]"
                  : "text-[#64748b]"
            }`}
          >
            {isOverdue ? <AlertTriangle className="h-2.5 w-2.5" /> : <Calendar className="h-2.5 w-2.5" />}
            {deadlineLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  draggedTask,
  dragOverColumnId,
  onCardClick,
  onTaskDragStart,
  onTaskDragEnd,
  onColumnDragOver,
  onColumnDragLeave,
  onTaskDrop,
  isTaskMatch,
  onUpdateColumn,
  onDeleteColumn,
}: {
  col: BoardColumn;
  draggedTask: DraggedTask | null;
  dragOverColumnId: string | null;
  onCardClick: (taskId: string) => void;
  onTaskDragStart: (taskId: string, sourceColumnId: string, event: React.DragEvent<HTMLDivElement>) => void;
  onTaskDragEnd: () => void;
  onColumnDragOver: (columnId: string) => void;
  onColumnDragLeave: () => void;
  onTaskDrop: (targetColumnId: string) => void;
  isTaskMatch?: (task: BoardTask) => boolean;
  onUpdateColumn?: (columnId: string, name: string) => void;
  onDeleteColumn?: (columnId: string) => void;
}) {
  const isActive = col.id === "in-progress";
  const isDropTarget = dragOverColumnId === col.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(col.title);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== col.title) {
      onUpdateColumn?.(col.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col w-[85vw] max-w-[320px] sm:w-[300px] sm:min-w-[300px] snap-center flex-shrink-0 h-full min-h-0 transition-transform duration-200">
      {/* Column header */}
      <div
        className={`flex items-center justify-between rounded-t-xl px-4 py-3 border border-b-0 flex-shrink-0 ${
          isDropTarget
            ? "border-[#6366f1]/60 bg-[#6366f1]/10"
            : isActive
              ? "border-[#6366f1]/30 bg-[#6366f1]/10"
              : "border-[#334155] bg-[#1e293b]/50"
        }`}
      >
        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") {
                  setEditTitle(col.title);
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="w-full rounded bg-[#0f172a] border border-[#6366f1] px-2 py-0.5 text-xs text-[#f1f5f9] focus:outline-none"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
              title="Save"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setEditTitle(col.title);
                setIsEditing(false);
              }}
              className="p-1 text-[#64748b] hover:text-[#94a3b8] transition-colors flex-shrink-0"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.dotColor }} />
              <span className={`text-sm font-semibold truncate ${isActive ? "text-[#6366f1]" : "text-[#f1f5f9]"}`}>
                {col.title}
              </span>
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold flex-shrink-0"
                style={{ backgroundColor: col.dotColor + "22", color: col.dotColor }}
              >
                {col.tasks.length}
              </span>
            </div>

            {isConfirmDelete ? (
              <div className="flex items-center gap-1 text-xs flex-shrink-0">
                <button
                  onClick={() => {
                    onDeleteColumn?.(col.id);
                    setIsConfirmDelete(false);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-500 transition-colors"
                  title="Confirm delete column"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsConfirmDelete(false)}
                  className="px-1.5 py-0.5 rounded bg-[#334155] text-[#94a3b8] text-[10px] hover:text-white transition-colors"
                  title="Cancel"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[#64748b] hover:text-[#818cf8] hover:bg-[#334155]/60 transition-colors"
                  title="Edit column"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsConfirmDelete(true)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[#64748b] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete column"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drop zone + cards (scrollable) */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          onColumnDragOver(col.id);
        }}
        onDragLeave={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) onColumnDragLeave();
        }}
        onDrop={(event) => {
          event.preventDefault();
          onTaskDrop(col.id);
        }}
        className={`flex flex-col gap-2.5 flex-1 rounded-b-xl border border-t-0 p-3 overflow-y-auto min-h-0 ${
          isDropTarget
            ? "border-[#6366f1]/60 bg-[#6366f1]/10 shadow-[0_0_0_1px_rgba(99,102,241,0.2),0_16px_44px_-28px_rgba(99,102,241,0.9)]"
            : isActive
              ? "border-[#6366f1]/30 bg-[#6366f1]/10"
              : "border-[#334155] bg-[#0f172a]/50"
        }`}
      >
        {col.tasks.map((task) => {
          const taskMatches = isTaskMatch?.(task);
          return (
            <TaskCard
              key={task.id}
              task={task}
              isDone={col.isDone}
              onClick={() => onCardClick(task.id)}
              onDragStart={(event) => onTaskDragStart(task.id, col.id, event)}
              onDragEnd={onTaskDragEnd}
              isDragSource={draggedTask?.taskId === task.id}
              filterState={isTaskMatch ? (taskMatches ? "match" : "dimmed") : "none"}
            />
          );
        })}

        {/* Add task row */}
        <button className="flex items-center gap-2 mt-0.5 rounded-lg border border-dashed border-[#334155]/60 px-3 py-2.5 text-[11px] font-medium text-[#475569] hover:border-[#6366f1]/40 hover:text-[#6366f1] hover:bg-[#6366f1]/5 transition-all flex-shrink-0">
          <Plus className="h-3.5 w-3.5" />
          Add task
        </button>
      </div>
    </div>
  );
}

// ─── Column color palette ─────────────────────────────────────────────────────

const COL_COLORS = [
  { hex: "#64748b", label: "Slate"  },
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#10b981", label: "Green"  },
  { hex: "#f59e0b", label: "Amber"  },
  { hex: "#ef4444", label: "Red"    },
  { hex: "#8b5cf6", label: "Purple" },
  { hex: "#ec4899", label: "Pink"   },
  { hex: "#06b6d4", label: "Cyan"   },
];

// ─── Style 2: Create Column Form ──────────────────────────────────────────────

function CreateColumnForm({
  onAdd,
  onCancel,
  initialName  = "",
  initialColor = "#64748b",
  externalRef,
}: {
  onAdd: (name: string, color: string) => void;
  onCancel: () => void;
  initialName?:  string;
  initialColor?: string;
  externalRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [name,  setName]  = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? localRef;

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleAdd() {
    if (!name.trim()) { inputRef.current?.focus(); return; }
    onAdd(name.trim(), color);
    setName("");
    inputRef.current?.focus();
  }

  function handleCancel() {
    if (name) { setName(""); inputRef.current?.focus(); }
    else onCancel();
  }

  const charColor =
    name.length > 95 ? "text-[#ef4444]" :
    name.length > 80 ? "text-[#f59e0b]" :
                       "text-[#475569]";

  return (
    <div className="flex flex-col w-[85vw] max-w-[320px] sm:w-[280px] sm:min-w-[280px] snap-center flex-shrink-0 h-full min-h-0">

      {/* ── Column header area ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 rounded-t-xl border border-b-0 border-[#334155] bg-[#1e293b]/80 overflow-hidden">
        {/* Colour accent stripe */}
        <div
          className="h-[3px] w-full transition-colors duration-200"
          style={{ backgroundColor: color }}
        />

        <div className="px-4 pt-3.5 pb-4 flex flex-col gap-3">
          {/* Label + char count */}
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
              Column name
            </label>
            <span className={`text-[10px] tabular-nums transition-colors ${charColor}`}>
              {name.length}/100
            </span>
          </div>

          {/* Name input */}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={name}
            maxLength={100}
            placeholder="Column name"
            onChange={(e) => setName(e.target.value.slice(0, 100))}
            onKeyDown={(e) => {
              if (e.key === "Enter")  handleAdd();
              if (e.key === "Escape") handleCancel();
            }}
            className="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/40 focus:border-[#6366f1]/70 transition-all"
          />

          {/* Color dot picker */}
          <div className="flex items-center gap-2">
            {COL_COLORS.map(({ hex, label }) => {
              const selected = color === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  title={label}
                  onClick={() => setColor(hex)}
                  className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full flex-shrink-0 transition-all hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: hex,
                    transform:  selected ? "scale(1.25)" : undefined,
                    boxShadow:  selected ? `0 0 0 2px #1e293b, 0 0 0 3.5px ${hex}` : undefined,
                  }}
                >
                  {selected && (
                    <span className="block h-[6px] w-[6px] rounded-full bg-white/90 shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Column body area ───────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0 rounded-b-xl border border-t-0 border-[#334155] bg-[#0f172a]/50 px-4 py-3.5">

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5558e8] active:scale-[0.98] transition-all shadow shadow-[#6366f1]/25 flex-shrink-0"
          >
            <Plus className="h-3 w-3" />
            Add Column
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-2 py-1.5 text-xs font-medium text-[#64748b] hover:text-[#94a3b8] transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="mt-3 text-[11px] text-[#334155] leading-relaxed">
          <kbd className="rounded px-1 py-0.5 text-[10px] bg-[#1e293b] border border-[#334155] text-[#475569] font-mono">↵</kbd>
          {" "}to confirm &nbsp;·&nbsp;{" "}
          <kbd className="rounded px-1 py-0.5 text-[10px] bg-[#1e293b] border border-[#334155] text-[#475569] font-mono">Esc</kbd>
          {" "}to cancel
        </p>
      </div>
    </div>
  );
}

// ─── Style 1: Add Column Button ───────────────────────────────────────────────

function AddColumnButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center w-[85vw] max-w-[320px] sm:w-[280px] sm:min-w-[280px] snap-center flex-shrink-0 h-full rounded-xl border-2 border-dashed border-[#334155]/50 bg-transparent hover:border-[#6366f1]/35 hover:bg-[#6366f1]/[0.04] transition-all duration-200"
    >
      <div className="flex flex-col items-center gap-3.5 p-8">
        {/* Icon container */}
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-dashed border-[#475569]/50 group-hover:border-[#6366f1]/50 group-hover:bg-[#6366f1]/10 transition-all duration-200">
          <Plus className="h-5 w-5 text-[#475569] group-hover:text-[#6366f1] transition-colors duration-200" />
        </div>

        {/* Labels */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-sm font-medium text-[#475569] group-hover:text-[#6366f1] transition-colors duration-200">
            Add Column
          </span>
          <span className="text-[11px] text-[#334155] group-hover:text-[#6366f1]/50 transition-colors duration-200 leading-relaxed">
            Click to create a<br />new status column
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Board Detail (root export) ───────────────────────────────────────────────

const VIEW_TABS = [
  { label: "Board",      icon: LayoutGrid  },
  { label: "List",       icon: List        },
  { label: "Timeline",   icon: GitBranch   },
  { label: "Calendar",   icon: CalendarDays},
  { label: "Statistics", icon: TrendingUp  },
];

export function BoardDetail({
  onBack,
  onCreateTask,
  onInvite,
  onManageLabels,
  onTaskClick,
  onBoardSettings,
  initialActiveTab = 0,
  onTabChange,
  boardId,
  boardName,
  members = [],
  columnsData = COLUMNS,
  isLoading = false,
  onCreateColumn,
  onUpdateColumn,
  onDeleteColumn,
  onMoveTask,
}: {
  onBack: () => void;
  onCreateTask?: () => void;
  onInvite?: () => void;
  onManageLabels?: () => void;
  onTaskClick?: (taskId: string) => void;
  onBoardSettings?: () => void;
  initialActiveTab?: number;
  onTabChange?: (tabIndex: number) => void;
  boardId?: number | null;
  boardName?: string;
  members?: string[];
  columnsData?: BoardColumn[];
  isLoading?: boolean;
  onCreateColumn?: (name: string, color: string) => Promise<void>;
  onUpdateColumn?: (columnId: string, name: string) => Promise<void> | void;
  onDeleteColumn?: (columnId: string) => Promise<void> | void;
  onMoveTask?: (taskId: string, targetColumnId: string) => Promise<void>;
}) {
  const [activeTab,    setActiveTab]    = useState(initialActiveTab);
  const [starred,      setStarred]      = useState(false);
  const [membersOpen,  setMembersOpen]  = useState(false);
  const [columns,      setColumns]      = useState<BoardColumn[]>(columnsData);
  const [draggedTask,  setDraggedTask]  = useState<DraggedTask | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [btnFormOpen,  setBtnFormOpen]  = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    types: [],
    priorities: [],
    assignees: [],
    deadlines: [],
    labels: [],
  });

  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

  useEffect(() => {
    setColumns(columnsData);
  }, [columnsData]);

  const boardMembers = members.length > 0 ? members : MEMBERS;
  const visibleMembers = boardMembers.slice(0, 4);
  const extraCount     = boardMembers.length - visibleMembers.length;

  async function handleAddColumn(name: string, color: string) {
    if (onCreateColumn) {
      await onCreateColumn(name, color);
      return;
    }

    setColumns((prev) => [
      ...prev,
      { id: `col-${Date.now()}`, title: name, dotColor: color, tasks: [] },
    ]);
  }

  async function handleUpdateColumn(columnId: string, name: string) {
    setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, title: name } : c)));
    if (onUpdateColumn) {
      await onUpdateColumn(columnId, name);
    }
  }

  async function handleDeleteColumn(columnId: string) {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    if (onDeleteColumn) {
      await onDeleteColumn(columnId);
    }
  }

  function handleTaskDragStart(taskId: string, sourceColumnId: string, event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    setDraggedTask({ taskId, sourceColumnId });
  }

  function handleTaskDragEnd() {
    setDraggedTask(null);
    setDragOverColumnId(null);
  }

  async function handleTaskDrop(targetColumnId: string) {
    if (!draggedTask) return;

    const previousColumns = columns;
    const moveResult = moveTaskBetweenColumns(
      columns,
      draggedTask.taskId,
      draggedTask.sourceColumnId,
      targetColumnId
    );

    setDraggedTask(null);
    setDragOverColumnId(null);
    if (!moveResult) return;

    setColumns(moveResult.columns);

    try {
      if (onMoveTask) {
        await onMoveTask(draggedTask.taskId, targetColumnId);
      } else {
        await persistTaskMove(draggedTask.taskId, targetColumnId, moveResult.targetIndex);
      }
    } catch {
      setColumns(previousColumns);
    }
  }

  // ─── Filter logic ───────────────────────────────────────────────────────────

  const allColumns = columns;

  const allMembers = Array.from(
    new Set(allColumns.flatMap((col) => col.tasks.flatMap((t) => t.assignees)))
  );
  const allLabels = Array.from(
    new Set(allColumns.flatMap((col) => col.tasks.flatMap((t) => t.labels.map((l) => JSON.stringify({ label: l.text, color: l.color })))))
  ).map((str) => JSON.parse(str) as { label: string; color: string });

  const matchesFilters = (task: BoardTask): boolean => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.types.length > 0 && !filters.types.includes(task.type)) return false;
    if (filters.priorities.length > 0) {
      const pMap: Record<string, string> = { low: "LOW", medium: "MEDIUM", high: "HIGH", urgent: "CRITICAL" };
      if (!filters.priorities.includes(pMap[task.priority] as any)) return false;
    }
    if (filters.assignees.length > 0 && !filters.assignees.some((a) => task.assignees.includes(a))) return false;
    if (filters.deadlines.length > 0) {
      const taskDate = new Date(task.deadline);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
      const monthEnd = new Date(today); monthEnd.setDate(today.getDate() + 30);
      const matches = filters.deadlines.some((d) => {
        if (d === "This week") return taskDate >= today && taskDate <= weekEnd;
        if (d === "This month") return taskDate >= today && taskDate <= monthEnd;
        if (d === "Overdue") return taskDate < today;
        return false;
      });
      if (!matches) return false;
    }
    if (filters.labels.length > 0 && !filters.labels.some((label) => task.labels.some((l) => l.text === label))) return false;
    return true;
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.types.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assignees.length > 0 ||
    filters.deadlines.length > 0 ||
    filters.labels.length > 0
  );

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    [filters.types.length, filters.priorities.length, filters.assignees.length, filters.deadlines.length, filters.labels.length].reduce((a, b) => a + b, 0);

  const totalTasks = allColumns.reduce((s, c) => s + c.tasks.length, 0);
  const matchingTasks = allColumns.reduce((s, c) => s + c.tasks.filter(matchesFilters).length, 0);

  return (
    <div className="flex flex-col h-full bg-[#0f172a] overflow-hidden">

      {/* ── Board Header ───────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-[#334155]">

        {/* Row 1: breadcrumb · title · star ── search · filter · settings · add task */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 pt-3 pb-2.5 sm:px-6 sm:pt-5 sm:pb-3">
          {/* Left: back + title + members */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={onBack} className="group flex items-center gap-1 text-[#64748b] hover:text-[#94a3b8] transition-colors flex-shrink-0" title="Back to Dashboard">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-medium hidden sm:inline">Dashboard</span>
            </button>
            <span className="text-[#334155] text-sm flex-shrink-0 select-none hidden sm:inline">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[#6366f1]/20 flex-shrink-0">
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#6366f1]" />
              </div>
              <h1 className="text-sm sm:text-base font-semibold text-[#f1f5f9] truncate">{boardName ?? "Project Alpha"}</h1>
              <button onClick={() => setStarred((s) => !s)} className="flex-shrink-0 hover:scale-110 transition-transform" title={starred ? "Remove from favourites" : "Add to favourites"}>
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors" style={{ color: starred ? "#f59e0b" : "#475569", fill: starred ? "#f59e0b" : "none" }} />
              </button>
            </div>
            <div className="w-px h-4 bg-[#334155] flex-shrink-0 hidden sm:block" />
            <button onClick={() => setMembersOpen(true)} className="hidden sm:flex -space-x-2 hover:opacity-90 transition-opacity flex-shrink-0">
              {visibleMembers.map((m) => (
                <div key={m} className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-[#0f172a] text-[8px] sm:text-[9px] font-bold text-white flex-shrink-0" style={{ backgroundColor: avatarColor(m) }} title={m}>
                  {initials(m)}
                </div>
              ))}
              {extraCount > 0 && (
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-[#0f172a] bg-[#334155] text-[8px] sm:text-[9px] font-semibold text-[#94a3b8]">+{extraCount}</div>
              )}
            </button>
          </div>

          {/* Right: filter + board actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {activeTab !== 4 && (
              <button
                onClick={() => setFilterPanelOpen((v) => !v)}
                className={`flex items-center gap-1 sm:gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  filterPanelOpen || hasActiveFilters
                    ? "border-[#6366f1]/50 bg-[#6366f1]/10 text-[#818cf8]"
                    : "border-[#334155] bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155] hover:text-[#f1f5f9]"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && activeFilterCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6366f1] text-[10px] font-semibold text-white px-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={onManageLabels}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#334155] bg-[#1e293b] text-[#64748b] hover:bg-[#334155] hover:text-[#94a3b8] transition-colors"
              title="Manage labels"
            >
              <Tag className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onBoardSettings}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#334155] bg-[#1e293b] text-[#64748b] hover:bg-[#334155] hover:text-[#94a3b8] transition-colors"
              title="Board settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            <button onClick={onCreateTask} className="flex items-center gap-1 sm:gap-1.5 rounded-lg bg-[#6366f1] px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#5558e8] active:scale-[0.98] transition-all shadow shadow-[#6366f1]/30">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </div>

        {/* Row 2: view tabs */}
        <div className="flex items-end gap-0.5 overflow-x-auto px-3 sm:px-6">
          {VIEW_TABS.map(({ label, icon: Icon }, i) => (
            <button
              key={label}
              onClick={() => {
                setActiveTab(i);
                onTabChange?.(i);
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === i
                  ? "border-[#6366f1] text-[#6366f1]"
                  : "border-transparent text-[#64748b] hover:text-[#94a3b8] hover:border-[#475569]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Filter Panel ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {filterPanelOpen && activeTab !== 4 && (
          <FilterSearchPanel
            isOpen={filterPanelOpen}
            filters={filters}
            onFiltersChange={setFilters}
            availableMembers={allMembers}
            availableLabels={allLabels}
            resultCount={{ showing: matchingTasks, total: totalTasks }}
          />
        )}
      </AnimatePresence>

      {/* ── Board Views Area (Board, List, Timeline, Calendar, Statistics) ── */}
      {activeTab === 4 ? (
        <BoardStatistics boardId={boardId ?? null} />
      ) : activeTab === 1 ? (
        <BoardListView
          columns={allColumns}
          onTaskClick={onTaskClick}
          matchesFilters={hasActiveFilters ? matchesFilters : undefined}
        />
      ) : activeTab === 2 ? (
        <BoardTimelineView
          columns={allColumns}
          onTaskClick={onTaskClick}
          matchesFilters={hasActiveFilters ? matchesFilters : undefined}
        />
      ) : activeTab === 3 ? (
        <BoardCalendarView
          columns={allColumns}
          onTaskClick={onTaskClick}
          matchesFilters={hasActiveFilters ? matchesFilters : undefined}
        />
      ) : isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-[#64748b]">
          Loading board...
        </div>
      ) : (
        <main className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden snap-x snap-proximity scroll-smooth">
          <div className="flex gap-3 sm:gap-4 h-full px-3 py-3 sm:px-6 sm:py-5 min-w-max items-stretch pr-8 sm:pr-12">

            {allColumns.map((col) => (
              <KanbanColumn
                key={col.id}
                col={col}
                draggedTask={draggedTask}
                dragOverColumnId={dragOverColumnId}
                onCardClick={(taskId) => onTaskClick?.(taskId)}
                onTaskDragStart={handleTaskDragStart}
                onTaskDragEnd={handleTaskDragEnd}
                onColumnDragOver={setDragOverColumnId}
                onColumnDragLeave={() => setDragOverColumnId(null)}
                onTaskDrop={handleTaskDrop}
                isTaskMatch={hasActiveFilters ? matchesFilters : undefined}
                onUpdateColumn={handleUpdateColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            {/* Style 1: Add Column Button — or toggled form */}
            {btnFormOpen ? (
              <CreateColumnForm
                onAdd={async (name, color) => { await handleAddColumn(name, color); setBtnFormOpen(false); }}
                onCancel={() => setBtnFormOpen(false)}
              />
            ) : (
              <AddColumnButton onClick={() => setBtnFormOpen(true)} />
            )}

          </div>
        </main>
      )}

      {/* Modals */}
      {membersOpen && <BoardMembersModal onClose={() => setMembersOpen(false)} />}

      {/* Floating Board Chat Drawer (Real-time Team Chat) */}
      {boardId && <BoardChatWidget boardId={boardId} boardName={boardName || "Project"} />}
    </div>
  );
}
