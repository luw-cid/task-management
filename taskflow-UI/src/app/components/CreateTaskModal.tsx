import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  X, Bug, Star, ArrowUp, Zap, Flame, ChevronUp, Minus, ChevronDown,
  Calendar, Search, Plus, Check, Tag, User,
} from "lucide-react";
import { columnsApi, labelsApi } from "../../api";
import type { Board } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskTypeOption = "FEATURE" | "BUG" | "IMPROVEMENT" | "EPIC";
type PriorityOption = "critical" | "high" | "medium" | "low";

export interface NewTask {
  boardId: number;
  type: TaskTypeOption;
  title: string;
  description: string;
  column: string;
  priority: PriorityOption;
  assignee: string | null;
  deadline: string;
  labels: { label: string; color: string }[];
}

interface Props {
  onClose: () => void;
  onCreate?: (task: NewTask) => Promise<void>;
  boards?: Board[];
  initialBoardId?: number | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  TaskTypeOption,
  { label: string; Icon: React.ElementType; color: string; defaultPriority: PriorityOption }
> = {
  FEATURE:     { label: "Feature",     Icon: Star,    color: "#6366f1", defaultPriority: "high"     },
  BUG:         { label: "Bug",         Icon: Bug,     color: "#ef4444", defaultPriority: "critical"  },
  IMPROVEMENT: { label: "Improvement", Icon: ArrowUp, color: "#10b981", defaultPriority: "medium"   },
  EPIC:        { label: "Epic",        Icon: Zap,     color: "#8b5cf6", defaultPriority: "high"      },
};

const PRIORITY_CONFIG: Record<
  PriorityOption,
  { label: string; Icon: React.ElementType; color: string }
> = {
  critical: { label: "Critical", Icon: Flame,      color: "#ef4444" },
  high:     { label: "High",     Icon: ChevronUp,  color: "#f97316" },
  medium:   { label: "Medium",   Icon: Minus,      color: "#f59e0b" },
  low:      { label: "Low",      Icon: ChevronDown, color: "#94a3b8" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarColor(name: string) {
  const palette = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
  return palette[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function getColumnColor(name: string) {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes("review")) return "#f59e0b";
  if (normalized.includes("progress") || normalized.includes("doing")) return "#6366f1";
  if (normalized.includes("done") || normalized.includes("complete")) return "#10b981";
  return "#64748b";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DropdownChevron({ open }: { open: boolean }) {
  return (
    <ChevronDown
      className="h-3.5 w-3.5 text-[#64748b] flex-shrink-0 transition-transform duration-150"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateTaskModal({ onClose, onCreate, boards = [], initialBoardId = null }: Props) {
  // Task type & priority
  const [taskType, setTaskType]   = useState<TaskTypeOption>("FEATURE");
  const [priority, setPriority]   = useState<PriorityOption>("high");
  const [autoSetBy, setAutoSetBy] = useState<TaskTypeOption>("FEATURE");

  // Form fields
  const [boardId, setBoardId]           = useState<number | null>(initialBoardId ?? boards[0]?.id ?? null);
  const [title, setTitle]               = useState("");
  const [titleError, setTitleError]     = useState("");
  const [description, setDescription]   = useState("");
  const [column, setColumn]             = useState("todo");
  const [assignee, setAssignee]         = useState<string | null>(null);
  const [deadline, setDeadline]         = useState("");
  const [labels, setLabels]             = useState<{ label: string; color: string }[]>([]);
  const [submitError, setSubmitError]   = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown states
  const [boardOpen, setBoardOpen]       = useState(false);
  const [columnOpen, setColumnOpen]     = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [labelOpen, setLabelOpen]       = useState(false);

  // Refs
  const overlayRef    = useRef<HTMLDivElement>(null);
  const titleRef      = useRef<HTMLInputElement>(null);
  const boardRef      = useRef<HTMLDivElement>(null);
  const columnRef     = useRef<HTMLDivElement>(null);
  const priorityRef   = useRef<HTMLDivElement>(null);
  const assigneeRef   = useRef<HTMLDivElement>(null);
  const labelRef      = useRef<HTMLDivElement>(null);

  // Focus title on mount
  useEffect(() => { titleRef.current?.focus(); }, []);

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Click-outside closes all dropdowns
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boardRef.current    && !boardRef.current.contains(e.target as Node))    setBoardOpen(false);
      if (columnRef.current   && !columnRef.current.contains(e.target as Node))   setColumnOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setPriorityOpen(false);
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) { setAssigneeOpen(false); setAssigneeSearch(""); }
      if (labelRef.current    && !labelRef.current.contains(e.target as Node))    setLabelOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (initialBoardId && boards.some((board) => board.id === initialBoardId)) {
      setBoardId(initialBoardId);
      return;
    }

    if (boards.length > 0 && !boards.some((board) => board.id === boardId)) {
      setBoardId(boards[0].id);
    }
  }, [boardId, boards, initialBoardId]);

  const selectedBoard = boards.find((board) => board.id === boardId) ?? null;
  const boardColumnsQuery = useQuery({
    queryKey: ["create-task-columns", boardId],
    queryFn: () => columnsApi.getByBoard(boardId!),
    enabled: boardId !== null,
  });
  const boardLabelsQuery = useQuery({
    queryKey: ["create-task-labels", boardId],
    queryFn: () => labelsApi.getByBoard(boardId!),
    enabled: boardId !== null,
  });

  // Auto-set priority on type change (Factory Pattern)
  function handleTypeSelect(type: TaskTypeOption) {
    setTaskType(type);
    setPriority(TYPE_CONFIG[type].defaultPriority);
    setAutoSetBy(type);
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!boardId) {
      setSubmitError("Please select a board.");
      return;
    }
    if (!title.trim()) {
      setTitleError("Title is required.");
      titleRef.current?.focus();
      return;
    }
    if (!column) {
      setSubmitError("Please select a column.");
      return;
    }
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await onCreate?.({ boardId, type: taskType, title: title.trim(), description: description.trim(), column, priority, assignee, deadline, labels });
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleLabel(l: { label: string; color: string }) {
    setLabels((prev) =>
      prev.some((x) => x.label === l.label)
        ? prev.filter((x) => x.label !== l.label)
        : [...prev, l]
    );
  }

  const columnOptions = (boardColumnsQuery.data ?? []).map((item) => ({
    id: String(item.id),
    label: item.name,
    color: getColumnColor(item.name),
  }));
  const memberOptions = selectedBoard?.members.map((member) => member.fullName) ?? [];
  const labelOptions = (boardLabelsQuery.data ?? []).map((label) => ({ label: label.name, color: label.color }));
  const currentCol = columnOptions.find((c) => c.id === column) ?? columnOptions[0] ?? null;
  const currentPriority = PRIORITY_CONFIG[priority];
  const PIcon          = currentPriority.Icon;
  const filteredMembers = memberOptions.filter((m) =>
    m.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  useEffect(() => {
    if (columnOptions.length > 0 && !columnOptions.some((option) => option.id === column)) {
      setColumn(columnOptions[0].id);
      return;
    }
    if (columnOptions.length === 0) {
      setColumn("");
    }
  }, [column, columnOptions]);

  useEffect(() => {
    setAssignee(null);
    setLabels([]);
    setSubmitError("");
  }, [boardId]);

  return (
    <motion.div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative flex flex-col w-full max-w-[560px] max-h-[92vh] rounded-2xl border border-[#334155] bg-[#1e293b] shadow-2xl shadow-black/70 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#334155] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1]/15 flex-shrink-0">
              <Plus className="h-4.5 w-4.5 text-[#6366f1]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f1f5f9]">Create New Task</h2>
              <p className="text-xs text-[#64748b] mt-0.5">Add a task to your board</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#334155]/60 hover:text-[#94a3b8] transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable form body ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#f1f5f9]">
                Board
                <span className="text-[#ef4444] ml-0.5">*</span>
              </label>
              <div ref={boardRef} className="relative">
                <button
                  type="button"
                  onClick={() => boards.length > 0 && setBoardOpen((v) => !v)}
                  disabled={boards.length === 0}
                  className="flex items-center gap-2 w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3.5 py-2.5 text-sm text-[#f1f5f9] hover:border-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6366f1] flex-shrink-0" />
                  <span className={`flex-1 text-left truncate ${selectedBoard ? "text-[#f1f5f9]" : "text-[#475569]"}`}>
                    {selectedBoard?.name ?? "No board available"}
                  </span>
                  <DropdownChevron open={boardOpen} />
                </button>
                {boardOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-[#334155] bg-[#1e293b] shadow-xl shadow-black/50 overflow-hidden">
                    {boards.map((board) => (
                      <button
                        key={board.id}
                        type="button"
                        onClick={() => { setBoardId(board.id); setBoardOpen(false); }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-left hover:bg-[#334155]/60 transition-colors"
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-[#6366f1] flex-shrink-0" />
                        <span className={`flex-1 truncate ${boardId === board.id ? "text-[#f1f5f9] font-medium" : "text-[#94a3b8]"}`}>
                          {board.name}
                        </span>
                        {boardId === board.id && <Check className="h-3.5 w-3.5 text-[#6366f1] flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* ── Task Type ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-medium text-[#f1f5f9]">Task Type</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(TYPE_CONFIG) as TaskTypeOption[]).map((type) => {
                  const { label, Icon, color } = TYPE_CONFIG[type];
                  const isSelected = taskType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeSelect(type)}
                      className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-[0.97]"
                      style={
                        isSelected
                          ? { backgroundColor: color, color: "#fff", boxShadow: `0 2px 10px -2px ${color}66` }
                          : { backgroundColor: color + "14", color, border: `1.5px solid ${color}30` }
                      }
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={isSelected ? 2.5 : 2} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Title ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#f1f5f9]">
                Title
                <span className="text-[#ef4444] ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value.slice(0, 255));
                    if (titleError) setTitleError("");
                  }}
                  placeholder="Enter task title"
                  maxLength={255}
                  className={[
                    "w-full rounded-lg border bg-[#0f172a] px-3.5 py-2.5 pb-5 text-sm text-[#f1f5f9]",
                    "placeholder:text-[#475569] focus:outline-none transition-all",
                    titleError
                      ? "border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/25"
                      : "border-[#334155] focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]",
                  ].join(" ")}
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-[#475569] pointer-events-none select-none">
                  {title.length}/255
                </span>
              </div>
              {titleError && <p className="text-xs text-[#ef4444]">{titleError}</p>}
            </div>

            {/* ── Description ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#f1f5f9]">Description</label>
                <span className="text-[10px] text-[#475569]">Optional</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task in detail..."
                rows={4}
                className="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all resize-none leading-relaxed"
              />
            </div>

            {/* ── Column + Priority ────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              {/* Column */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#f1f5f9]">Column</label>
                <div ref={columnRef} className="relative">
                  <button
                    type="button"
                    disabled={columnOptions.length === 0}
                    onClick={() => setColumnOpen((v) => !v)}
                    className="flex items-center gap-2 w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3.5 py-2.5 text-sm text-[#f1f5f9] hover:border-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {currentCol ? (
                      <>
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: currentCol.color }}
                        />
                        <span className="flex-1 text-left truncate">{currentCol.label}</span>
                      </>
                    ) : (
                      <span className="flex-1 text-left truncate text-[#475569]">
                        {boardColumnsQuery.isLoading ? "Loading columns..." : "This board has no columns"}
                      </span>
                    )}
                    <DropdownChevron open={columnOpen} />
                  </button>
                  {columnOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-[#334155] bg-[#1e293b] shadow-xl shadow-black/50 overflow-hidden">
                      {columnOptions.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => { setColumn(col.id); setColumnOpen(false); }}
                          className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-left hover:bg-[#334155]/60 transition-colors"
                        >
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                          <span className={`flex-1 ${column === col.id ? "text-[#f1f5f9] font-medium" : "text-[#94a3b8]"}`}>
                            {col.label}
                          </span>
                          {column === col.id && <Check className="h-3.5 w-3.5 text-[#6366f1] flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedBoard && !boardColumnsQuery.isLoading && columnOptions.length === 0 && (
                  <p className="text-xs text-[#f59e0b]">Board này chưa có cột, nên chưa thể tạo task.</p>
                )}
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#f1f5f9]">Priority</label>
                <div ref={priorityRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setPriorityOpen((v) => !v)}
                    className="flex items-center gap-2 w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3.5 py-2.5 text-sm text-[#f1f5f9] hover:border-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
                  >
                    <PIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: currentPriority.color }} />
                    <span className="flex-1 text-left" style={{ color: currentPriority.color }}>
                      {currentPriority.label}
                    </span>
                    <DropdownChevron open={priorityOpen} />
                  </button>
                  {priorityOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-[#334155] bg-[#1e293b] shadow-xl shadow-black/50 overflow-hidden">
                      {(Object.keys(PRIORITY_CONFIG) as PriorityOption[]).map((p) => {
                        const { label, Icon: PIco, color } = PRIORITY_CONFIG[p];
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => { setPriority(p); setPriorityOpen(false); }}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-left hover:bg-[#334155]/60 transition-colors"
                          >
                            <PIco className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
                            <span className={`flex-1 font-medium ${priority === p ? "text-[#f1f5f9]" : "text-[#94a3b8]"}`} style={{ color: priority === p ? color : undefined }}>
                              {label}
                            </span>
                            {priority === p && <Check className="h-3.5 w-3.5 text-[#6366f1] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Auto-set hint */}
                <p className="flex items-center gap-1.5 text-[11px] text-[#64748b] leading-relaxed">
                  <span
                    className="inline-flex h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: TYPE_CONFIG[autoSetBy].color }}
                  />
                  Auto-set · {TYPE_CONFIG[autoSetBy].label} → {PRIORITY_CONFIG[TYPE_CONFIG[autoSetBy].defaultPriority].label}
                </p>
              </div>
            </div>

            {/* ── Assignee + Deadline ──────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              {/* Assignee */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#f1f5f9]">Assignee</label>
                <div ref={assigneeRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAssigneeOpen((v) => !v)}
                    className="flex items-center gap-2 w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3.5 py-2.5 text-sm text-[#f1f5f9] hover:border-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
                  >
                    {assignee ? (
                      <>
                        <div
                          className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: avatarColor(assignee) }}
                        >
                          {initials(assignee)}
                        </div>
                        <span className="flex-1 text-left truncate">{assignee.split(" ")[0]}</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3.5 w-3.5 text-[#475569] flex-shrink-0" />
                        <span className="flex-1 text-left text-[#475569]">Unassigned</span>
                      </>
                    )}
                    <DropdownChevron open={assigneeOpen} />
                  </button>
                  {assigneeOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-[#334155] bg-[#1e293b] shadow-xl shadow-black/50 overflow-hidden">
                      {/* Search */}
                      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#334155]">
                        <Search className="h-3.5 w-3.5 text-[#475569] flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="Search members..."
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-transparent text-xs text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none"
                          autoFocus
                        />
                      </div>
                      {/* Unassigned option */}
                      <button
                        type="button"
                        onClick={() => { setAssignee(null); setAssigneeOpen(false); setAssigneeSearch(""); }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm text-left hover:bg-[#334155]/60 transition-colors"
                      >
                        <div className="h-5 w-5 rounded-full border border-dashed border-[#475569] flex items-center justify-center flex-shrink-0">
                          <User className="h-2.5 w-2.5 text-[#475569]" />
                        </div>
                        <span className={`flex-1 text-xs ${assignee === null ? "text-[#f1f5f9] font-medium" : "text-[#94a3b8]"}`}>
                          Unassigned
                        </span>
                        {assignee === null && <Check className="h-3 w-3 text-[#6366f1] flex-shrink-0" />}
                      </button>
                      {/* Member list */}
                      <div className="max-h-[160px] overflow-y-auto">
                        {filteredMembers.length === 0 ? (
                          <p className="px-3.5 py-3 text-xs text-[#475569]">
                            {selectedBoard ? "No members found" : "Select a board first"}
                          </p>
                        ) : filteredMembers.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => { setAssignee(m); setAssigneeOpen(false); setAssigneeSearch(""); }}
                            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-left hover:bg-[#334155]/60 transition-colors"
                          >
                            <div
                              className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: avatarColor(m) }}
                            >
                              {initials(m)}
                            </div>
                            <span className={`flex-1 text-xs truncate ${assignee === m ? "text-[#f1f5f9] font-medium" : "text-[#94a3b8]"}`}>
                              {m}
                            </span>
                            {assignee === m && <Check className="h-3 w-3 text-[#6366f1] flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Deadline */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#f1f5f9]">Deadline</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3.5 py-2.5 pr-10 text-sm text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all [color-scheme:dark]"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#475569] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ── Labels ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#f1f5f9]">Labels</label>
              <div ref={labelRef} className="relative">
                <div className="flex flex-wrap items-center gap-2 min-h-[40px] rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2">
                  {labels.map((l) => (
                    <span
                      key={l.label}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: l.color + "18", color: l.color }}
                    >
                      {l.label}
                      <button
                        type="button"
                        onClick={() => toggleLabel(l)}
                        className="ml-0.5 hover:opacity-70 transition-opacity leading-none"
                        aria-label={`Remove ${l.label}`}
                      >
                        <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLabelOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#475569] px-2.5 py-0.5 text-xs font-medium text-[#64748b] hover:border-[#6366f1]/50 hover:text-[#6366f1] hover:bg-[#6366f1]/5 transition-all"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    Add Label
                  </button>
                </div>

                {/* Label picker dropdown */}
                {labelOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-[#334155] bg-[#1e293b] shadow-xl shadow-black/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#475569] mb-2.5 flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      Preset Labels
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {labelOptions.map((l) => {
                        const isActive = labels.some((x) => x.label === l.label);
                        return (
                          <button
                            key={l.label}
                            type="button"
                            onClick={() => toggleLabel(l)}
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all"
                            style={
                              isActive
                                ? { backgroundColor: l.color, color: "#fff" }
                                : { backgroundColor: l.color + "18", color: l.color, border: `1px solid ${l.color}30` }
                            }
                          >
                            {isActive && <Check className="h-2.5 w-2.5" strokeWidth={2.5} />}
                            {l.label}
                          </button>
                        );
                      })}
                      {labelOptions.length === 0 && (
                        <p className="text-xs text-[#475569]">Board này chưa có label nào.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {submitError && <p className="text-xs text-[#ef4444]">{submitError}</p>}
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#334155] flex-shrink-0 bg-[#1e293b]">
            {/* Task type preview badge */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold opacity-80"
              style={{
                backgroundColor: TYPE_CONFIG[taskType].color + "18",
                color: TYPE_CONFIG[taskType].color,
              }}
            >
              {(() => { const { Icon } = TYPE_CONFIG[taskType]; return <Icon className="h-3 w-3" />; })()}
              {TYPE_CONFIG[taskType].label}
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#334155] px-4 py-2 text-sm font-medium text-[#94a3b8] hover:bg-[#334155]/40 hover:text-[#f1f5f9] transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || !boardId || columnOptions.length === 0}
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-[#6366f1] px-5 py-2 text-sm font-medium text-white hover:bg-[#5254cc] active:scale-[0.98] transition-all shadow shadow-[#6366f1]/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Plus className="h-3.5 w-3.5" />
                {isSubmitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
