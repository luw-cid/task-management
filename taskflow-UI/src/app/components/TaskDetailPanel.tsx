import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Edit2, UserPlus, ArrowRightCircle, Trash2,
  ChevronDown, Calendar, Plus, Trash, Send,
  ChevronsUp, ChevronUp, Minus, Pencil,
  LayoutGrid, Flag, Tag, UserCheck,
  CheckSquare, Square, MessageSquare, Zap,
  Bold, Italic, Underline, Link2, List, Code2,
  GripVertical, Bug, Star, ArrowUp,
  AlertTriangle, Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high" | "urgent";
type TaskType = "BUG" | "FEATURE" | "EPIC" | "IMPROVEMENT";
type ActivityFilter = "all" | "task" | "comments";

interface Subtask     { id: string; title: string; done: boolean }
interface Comment     { id: string; author: string; time: string; content: string }
interface Label       { label: string; color: string }
interface ActivityItem{ type: string; desc: string; time: string; user: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<TaskType, { label: string; Icon: React.ElementType; color: string; bg: string; text: string }> = {
  BUG:         { label: "Bug",         Icon: Bug,    color: "#ef4444", bg: "bg-[#ef4444]/10", text: "text-[#ef4444]" },
  FEATURE:     { label: "Feature",     Icon: Star,   color: "#6366f1", bg: "bg-[#6366f1]/10", text: "text-[#6366f1]" },
  IMPROVEMENT: { label: "Improvement", Icon: ArrowUp,color: "#10b981", bg: "bg-[#10b981]/10", text: "text-[#10b981]" },
  EPIC:        { label: "Epic",        Icon: Zap,    color: "#8b5cf6", bg: "bg-[#8b5cf6]/10", text: "text-[#8b5cf6]" },
};

const STATUS_OPTIONS = [
  { value: "todo",        label: "To Do",       color: "#64748b" },
  { value: "in-progress", label: "In Progress", color: "#6366f1" },
  { value: "in-review",   label: "In Review",   color: "#f59e0b" },
  { value: "done",        label: "Done",        color: "#10b981" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; icon: React.ElementType; color: string }[] = [
  { value: "urgent", label: "Urgent", icon: ChevronsUp,  color: "#ef4444" },
  { value: "high",   label: "High",   icon: ChevronUp,   color: "#f97316" },
  { value: "medium", label: "Medium", icon: Minus,       color: "#f59e0b" },
  { value: "low",    label: "Low",    icon: ChevronDown, color: "#94a3b8" },
];

const TEAM_MEMBERS = [
  "Alice Johnson", "Tom Wilson", "Marcus Webb",
  "Sarah Chen",   "Priya Nair", "Alex Rivera", "Emily Davis", "Raj Patel",
];

const LABEL_PALETTE: Label[] = [
  { label: "Mobile",   color: "#f59e0b" },
  { label: "Auth",     color: "#ef4444" },
  { label: "Backend",  color: "#8b5cf6" },
  { label: "Frontend", color: "#06b6d4" },
  { label: "Security", color: "#10b981" },
  { label: "A11y",     color: "#ec4899" },
  { label: "Infra",    color: "#64748b" },
  { label: "API",      color: "#6366f1" },
];

// ─── Seed data (BUG task for edit mode showcase) ──────────────────────────────

const SEED = {
  title:    "Fix login redirect on mobile Safari",
  type:     "BUG" as TaskType,
  status:   "in-progress",
  priority: "urgent" as Priority,
  deadline: "2026-05-30",
  assignees:["Tom Wilson"],
  labels:   [{ label: "Mobile", color: "#f59e0b" }, { label: "Auth", color: "#ef4444" }],
  desc:     "Auth redirect fails silently on iOS Safari 17 when third-party cookies are blocked by default.\n\nSteps to reproduce:\n1. Open Safari on iOS 17 with 'Prevent Cross-Site Tracking' enabled\n2. Navigate to /login and authenticate with any provider\n3. Observe: redirect to /dashboard fails silently\n\nExpected: Successful redirect after auth\nActual: User remains on /login with no error message",
};

const SEED_SUBTASKS: Subtask[] = [
  { id: "s1", title: "Reproduce on iOS Safari 17.6 device",        done: true  },
  { id: "s2", title: "Trace cookie blocking in WebKit network tab", done: false },
  { id: "s3", title: "Implement server-side redirect fallback",     done: false },
  { id: "s4", title: "Add E2E test for Safari auth flow",           done: false },
];

const SEED_COMMENTS: Comment[] = [
  { id: "c1", author: "Tom Wilson",    time: "1 hour ago",  content: "Confirmed on iPhone 14 Pro with iOS 17.5. The Set-Cookie header is being dropped on the OPTIONS preflight. Might need SameSite=None + Secure fix." },
  { id: "c2", author: "Alice Johnson", time: "45 min ago",  content: "Good catch. Let's also add a localStorage fallback for the session token as a short-term workaround while we fix the cookie behavior." },
];

const SEED_ACTIVITY: ActivityItem[] = [
  { type: "COMMENT_ADDED", desc: 'added a comment: "Also check SameSite=None + Secure flags on the auth cookie."', time: "2 hours ago", user: "Tom Wilson"    },
  { type: "TASK_MOVED",    desc: "moved this task from To Do → In Progress",                                        time: "3 hours ago", user: "Tom Wilson"    },
  { type: "TASK_UPDATED",  desc: "changed priority from MEDIUM → URGENT",                                           time: "5 hours ago", user: "Alice Johnson" },
  { type: "TASK_ASSIGNED", desc: "assigned this task to Tom Wilson",                                                 time: "1 day ago",   user: "Alice Johnson" },
  { type: "TASK_DELETED",  desc: 'removed subtask "Update legacy API docs"',                                         time: "1 day ago",   user: "Marcus Webb"   },
  { type: "TASK_CREATED",  desc: "created this task",                                                                time: "2 days ago",  user: "Alice Johnson" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarBg(name: string) {
  const palette = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
  return palette[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
}
function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}
function applyFormat(
  el: HTMLTextAreaElement,
  setter: (v: string) => void,
  wrap: [string, string],
) {
  const { selectionStart: s, selectionEnd: e, value } = el;
  const selected = value.slice(s, e) || "text";
  const next = value.slice(0, s) + wrap[0] + selected + wrap[1] + value.slice(e);
  setter(next);
  setTimeout(() => {
    el.focus();
    el.setSelectionRange(s + wrap[0].length, s + wrap[0].length + selected.length);
  }, 0);
}

// ─── Primitives ───────────────────────────────────────────────────────────────

const AVATAR_CLASS: Record<number, string> = {
  5: "h-5 w-5 text-[8px]",
  6: "h-6 w-6 text-[9px]",
  7: "h-7 w-7 text-[10px]",
  8: "h-8 w-8 text-xs",
};

function Avatar({ name, size = 7 }: { name: string; size?: 5 | 6 | 7 | 8 }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0 ${AVATAR_CLASS[size]}`}
      style={{ backgroundColor: avatarBg(name) }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
      {children}
    </p>
  );
}

function Divider() { return <div className="h-px bg-[#1e3a5f]/60" style={{ background: "#1e293b" }} />; }

function ActivityBadge({ type }: { type: string }) {
  const map: Record<string, { icon: React.ElementType; color: string }> = {
    TASK_ASSIGNED: { icon: UserCheck,        color: "#10b981" },
    TASK_UPDATED:  { icon: Pencil,           color: "#6366f1" },
    TASK_MOVED:    { icon: ArrowRightCircle, color: "#f59e0b" },
    COMMENT_ADDED: { icon: MessageSquare,    color: "#8b5cf6" },
    TASK_DELETED:  { icon: Trash2,           color: "#ef4444" },
    TASK_CREATED:  { icon: Plus,             color: "#06b6d4" },
  };
  const entry = map[type] ?? map.TASK_CREATED;
  const Icon = entry.icon;
  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 z-10"
      style={{ backgroundColor: entry.color + "22", boxShadow: "0 0 0 2px #111827" }}
    >
      <Icon className="h-3 w-3" style={{ color: entry.color }} />
    </div>
  );
}

// ─── Rich Text Toolbar ────────────────────────────────────────────────────────

function RichToolbar({ textareaRef, value, onChange }: {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
}) {
  const tools = [
    { label: "Bold",      Icon: Bold,      wrap: ["**", "**"] as [string,string] },
    { label: "Italic",    Icon: Italic,    wrap: ["_", "_"]   as [string,string] },
    { label: "Underline", Icon: Underline, wrap: ["<u>", "</u>"] as [string,string] },
    { label: "Link",      Icon: Link2,     wrap: ["[", "](url)"] as [string,string] },
    { label: "List",      Icon: List,      wrap: ["\n• ", ""]    as [string,string] },
    { label: "Code",      Icon: Code2,     wrap: ["`", "`"]      as [string,string] },
  ];

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#1e293b] bg-[#0c1524]">
      {tools.map(({ label, Icon, wrap }, i) => (
        <>
          {i === 4 && <div key="sep" className="h-4 w-px bg-[#334155] mx-1 flex-shrink-0" />}
          <button
            key={label}
            type="button"
            title={label}
            onMouseDown={(e) => {
              e.preventDefault();
              if (textareaRef.current) applyFormat(textareaRef.current, onChange, wrap);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748b] hover:bg-[#1e293b] hover:text-[#94a3b8] transition-colors"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        </>
      ))}
      <span className="ml-auto text-[10px] text-[#334155] pr-1 font-mono">Markdown</span>
    </div>
  );
}

// ─── Edit Mode Metadata Fields ────────────────────────────────────────────────

function EditStatusPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {STATUS_OPTIONS.map(o => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all border"
            style={
              active
                ? { backgroundColor: o.color, color: "#fff", borderColor: o.color }
                : { backgroundColor: o.color + "0f", color: o.color, borderColor: o.color + "30" }
            }
          >
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: active ? "#fff" : o.color, opacity: active ? 0.8 : 1 }} />
            <span className="truncate">{o.label}</span>
            {active && <Check className="h-3 w-3 ml-auto flex-shrink-0 opacity-80" />}
          </button>
        );
      })}
    </div>
  );
}

function EditPriorityPicker({ value, onChange }: { value: Priority; onChange: (v: Priority) => void }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#1e293b] bg-[#0f172a] overflow-hidden p-1">
      {PRIORITY_OPTIONS.map(o => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all"
            style={
              active
                ? { backgroundColor: o.color + "18", color: o.color }
                : { color: "#64748b" }
            }
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: active ? o.color : "#475569" }} />
            <span className="flex-1 text-left">{o.label}</span>
            {active && (
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full"
                style={{ backgroundColor: o.color }}
              >
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EditAssigneePicker({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (name: string) =>
    onChange(selected.includes(name) ? selected.filter(a => a !== name) : [...selected, name]);

  return (
    <div className="flex flex-col rounded-xl border border-[#1e293b] bg-[#0f172a] overflow-hidden">
      {TEAM_MEMBERS.map((m, i) => {
        const active = selected.includes(m);
        return (
          <button
            key={m}
            type="button"
            onClick={() => toggle(m)}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${i > 0 ? "border-t border-[#1e293b]" : ""} ${active ? "bg-[#6366f1]/8" : "hover:bg-[#1e293b]"}`}
          >
            <Avatar name={m} size={6} />
            <span className={`flex-1 text-left truncate ${active ? "text-[#f1f5f9] font-medium" : "text-[#94a3b8]"}`}>{m}</span>
            {active && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#6366f1] flex-shrink-0">
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function EditLabelPicker({ selected, onChange }: { selected: Label[]; onChange: (v: Label[]) => void }) {
  const toggle = (l: Label) =>
    onChange(selected.some(x => x.label === l.label) ? selected.filter(x => x.label !== l.label) : [...selected, l]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {LABEL_PALETTE.map(l => {
        const active = selected.some(x => x.label === l.label);
        return (
          <button
            key={l.label}
            type="button"
            onClick={() => toggle(l)}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border"
            style={
              active
                ? { backgroundColor: l.color, color: "#fff", borderColor: l.color }
                : { backgroundColor: l.color + "14", color: l.color, borderColor: l.color + "30" }
            }
          >
            {active && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TaskDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailPanel({ isOpen, onClose }: TaskDetailPanelProps) {
  // ── Committed (saved) state ──
  const [title,     setTitle]     = useState(SEED.title);
  const [taskType,  setTaskType]  = useState<TaskType>(SEED.type);
  const [desc,      setDesc]      = useState(SEED.desc);
  const [status,    setStatus]    = useState(SEED.status);
  const [priority,  setPriority]  = useState<Priority>(SEED.priority);
  const [assignees, setAssignees] = useState<string[]>(SEED.assignees);
  const [deadline,  setDeadline]  = useState(SEED.deadline);
  const [labels,    setLabels]    = useState<Label[]>(SEED.labels);
  const [subtasks,  setSubtasks]  = useState<Subtask[]>(SEED_SUBTASKS);

  // ── Edit mode state ──
  const [isEditMode,    setIsEditMode]    = useState(true); // starts in edit mode per spec
  const [draftTitle,    setDraftTitle]    = useState(title);
  const [draftType,     setDraftType]     = useState<TaskType>(taskType);
  const [draftDesc,     setDraftDesc]     = useState(desc);
  const [draftStatus,   setDraftStatus]   = useState(status);
  const [draftPriority, setDraftPriority] = useState<Priority>(priority);
  const [draftAssignees,setDraftAssignees]= useState<string[]>(assignees);
  const [draftDeadline, setDraftDeadline] = useState(deadline);
  const [draftLabels,   setDraftLabels]   = useState<Label[]>(labels);
  const [draftSubtasks, setDraftSubtasks] = useState<Subtask[]>(subtasks);

  // ── Subtask add (edit mode) ──
  const [newSubtask,   setNewSub]    = useState("");
  const newSubRef                    = useRef<HTMLInputElement>(null);

  // ── View-mode interactions ──
  const [statusOpen,   setStatusOpen]   = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [labelOpen,    setLabelOpen]    = useState(false);
  const [editingDesc,  setEditDesc]     = useState(false);
  const [descDraft,    setDescDraft]    = useState(desc);

  // ── Comments ──
  const [comments,     setComments]     = useState<Comment[]>(SEED_COMMENTS);
  const [newComment,   setNewComment]   = useState("");

  // ── Activity filter ──
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  // ── Refs ──
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const descAreaRef   = useRef<HTMLTextAreaElement>(null);

  // Unsaved changes detection
  const hasChanges =
    draftTitle    !== title     ||
    draftType     !== taskType  ||
    draftDesc     !== desc      ||
    draftStatus   !== status    ||
    draftPriority !== priority  ||
    draftDeadline !== deadline  ||
    JSON.stringify(draftAssignees) !== JSON.stringify(assignees) ||
    JSON.stringify(draftLabels)    !== JSON.stringify(labels)    ||
    JSON.stringify(draftSubtasks)  !== JSON.stringify(subtasks);

  // Focus title when entering edit mode
  useEffect(() => {
    if (isEditMode) setTimeout(() => titleInputRef.current?.focus(), 50);
  }, [isEditMode]);

  // Escape closes panel (but not if in edit mode with changes — prompt instead)
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !isEditMode) onClose(); }
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, isEditMode]);

  function enterEditMode() {
    setDraftTitle(title); setDraftType(taskType); setDraftDesc(desc);
    setDraftStatus(status); setDraftPriority(priority);
    setDraftAssignees([...assignees]); setDraftDeadline(deadline);
    setDraftLabels([...labels]); setDraftSubtasks([...subtasks]);
    setIsEditMode(true);
  }

  function handleSave() {
    setTitle(draftTitle); setTaskType(draftType); setDesc(draftDesc);
    setStatus(draftStatus); setPriority(draftPriority);
    setAssignees([...draftAssignees]); setDeadline(draftDeadline);
    setLabels([...draftLabels]); setSubtasks([...draftSubtasks]);
    setIsEditMode(false);
  }

  function handleDiscard() {
    setDraftTitle(title); setDraftType(taskType); setDraftDesc(desc);
    setDraftStatus(status); setDraftPriority(priority);
    setDraftAssignees([...assignees]); setDraftDeadline(deadline);
    setDraftLabels([...labels]); setDraftSubtasks([...subtasks]);
    setIsEditMode(false);
  }

  function updateDraftSubTitle(id: string, val: string) {
    setDraftSubtasks(p => p.map(s => s.id === id ? { ...s, title: val } : s));
  }
  function toggleDraftSub(id: string) {
    setDraftSubtasks(p => p.map(s => s.id === id ? { ...s, done: !s.done } : s));
  }
  function deleteDraftSub(id: string) {
    setDraftSubtasks(p => p.filter(s => s.id !== id));
  }
  function addDraftSub() {
    if (!newSubtask.trim()) return;
    setDraftSubtasks(p => [...p, { id: `s${Date.now()}`, title: newSubtask.trim(), done: false }]);
    setNewSub("");
    setTimeout(() => newSubRef.current?.focus(), 0);
  }

  // View mode handlers
  function toggleAssignee(name: string) {
    setAssignees(p => p.includes(name) ? p.filter(a => a !== name) : [...p, name]);
  }
  function sendComment() {
    if (!newComment.trim()) return;
    setComments(p => [...p, { id: `c${Date.now()}`, author: "Alice Johnson", time: "Just now", content: newComment.trim() }]);
    setNewComment("");
  }

  // ── Computed ──
  const pOpt  = PRIORITY_OPTIONS.find(o => o.value === priority)!;
  const PIcon = pOpt.icon;
  const sOpt  = STATUS_OPTIONS.find(o => o.value === status)!;
  const doneCount  = subtasks.filter(s => s.done).length;
  const dDoneCount = draftSubtasks.filter(s => s.done).length;
  const tCfg  = TYPE_CONFIG[isEditMode ? draftType : taskType];
  const TypeIcon = tCfg.Icon;

  const inputBase = "w-full rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all leading-relaxed";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: isEditMode ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.38)" }}
            onClick={!isEditMode ? onClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 z-50 h-screen w-[600px] flex flex-col border-l shadow-2xl shadow-black/60"
            style={{
              backgroundColor: "#111827",
              borderColor: isEditMode ? "#6366f1" + "30" : "#1e293b",
              boxShadow: isEditMode ? "0 0 0 1px rgba(99,102,241,0.15), -8px 0 60px rgba(0,0,0,0.7)" : "-8px 0 60px rgba(0,0,0,0.5)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >

        {/* ── Edit mode: top accent line ──────────────────────────────────── */}
        {isEditMode && (
          <div className="h-[3px] w-full flex-shrink-0 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#6366f1] opacity-80" />
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 px-6 pt-5 pb-4 flex flex-col gap-3 border-b"
          style={{
            borderColor: isEditMode ? "#6366f1" + "20" : "#1e293b",
            backgroundColor: isEditMode ? "rgba(99,102,241,0.04)" : "transparent",
          }}
        >
          {/* Row 1: ID + type + edit status + actions */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs font-mono text-[#475569] tracking-wide flex-shrink-0">TF-2041</span>
              <span className="h-3.5 w-px bg-[#1e293b] flex-shrink-0" />

              {/* Type badge / selector */}
              {isEditMode ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(Object.keys(TYPE_CONFIG) as TaskType[]).map(type => {
                    const { label, Icon, color } = TYPE_CONFIG[type];
                    const active = draftType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDraftType(type)}
                        className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-all"
                        style={
                          active
                            ? { backgroundColor: color, color: "#fff" }
                            : { backgroundColor: color + "14", color, border: `1px solid ${color}28` }
                        }
                      >
                        <Icon className="h-2.5 w-2.5" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${tCfg.bg} ${tCfg.text}`}>
                  <TypeIcon className="h-3 w-3" />
                  {tCfg.label}
                </span>
              )}
            </div>

            {/* Right: editing badge + save/cancel + close */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isEditMode ? (
                <>
                  {/* Editing indicator */}
                  <span className="flex items-center gap-1.5 rounded-full bg-[#f59e0b]/12 border border-[#f59e0b]/25 px-2.5 py-1 text-[11px] font-semibold text-[#f59e0b]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                    Editing
                  </span>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#5254cc] active:scale-[0.98] transition-all shadow shadow-[#6366f1]/30"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleDiscard}
                    className="rounded-lg border border-[#1e293b] px-3 py-1.5 text-xs font-medium text-[#64748b] hover:bg-[#1e293b] hover:text-[#94a3b8] transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={enterEditMode}
                  className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] px-3 py-1.5 text-xs font-medium text-[#64748b] hover:bg-[#1e293b] hover:text-[#f1f5f9] transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#1e293b] hover:text-[#94a3b8] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Title */}
          {isEditMode ? (
            <textarea
              ref={titleInputRef}
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              rows={2}
              placeholder="Task title…"
              className="w-full resize-none rounded-xl border-2 border-[#6366f1]/40 bg-[#0f172a] px-3 py-2.5 text-lg font-semibold text-[#f1f5f9] placeholder:text-[#334155] focus:outline-none focus:border-[#6366f1]/70 focus:ring-0 leading-snug transition-colors"
              style={{ boxShadow: "0 0 0 3px rgba(99,102,241,0.08)" }}
            />
          ) : (
            <h2
              onClick={enterEditMode}
              className="text-lg font-semibold text-[#f1f5f9] leading-snug cursor-text hover:text-[#6366f1]/80 transition-colors flex items-start gap-2 group"
            >
              <span>{title}</span>
              <Pencil className="h-3.5 w-3.5 text-[#334155] mt-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>
          )}

          {/* Row 3: Quick actions (view mode only) */}
          {!isEditMode && (
            <div className="flex items-center gap-2">
              {(["Edit", "Assign", "Move"] as const).map((label, i) => {
                const icons = [Edit2, UserPlus, ArrowRightCircle];
                const Icon = icons[i];
                return (
                  <button
                    key={label}
                    onClick={label === "Edit" ? enterEditMode : undefined}
                    className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] px-3 py-1.5 text-xs font-medium text-[#64748b] hover:bg-[#1e293b] hover:text-[#f1f5f9] transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
              <button className="ml-auto flex items-center gap-1.5 rounded-lg border border-[#ef4444]/20 px-3 py-1.5 text-xs font-medium text-[#ef4444]/60 hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* ── Scrollable content ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-[1fr_196px] min-h-full" style={{ borderRight: "1px solid #1e293b" }}>

            {/* ── Left column ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-6 px-6 py-5 min-w-0 border-r border-[#1e293b]">

              {/* Description */}
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <SectionHeading>Description</SectionHeading>
                  {!isEditMode && (
                    <button
                      onClick={() => { setDescDraft(desc); setEditDesc(true); }}
                      className="flex items-center gap-1 text-[11px] text-[#475569] hover:text-[#6366f1] transition-colors"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>

                {isEditMode ? (
                  <div
                    className="flex flex-col rounded-xl border-2 border-[#6366f1]/35 overflow-hidden transition-colors"
                    style={{ boxShadow: "0 0 0 3px rgba(99,102,241,0.06)" }}
                  >
                    <RichToolbar
                      textareaRef={descAreaRef as React.RefObject<HTMLTextAreaElement>}
                      value={draftDesc}
                      onChange={setDraftDesc}
                    />
                    <textarea
                      ref={descAreaRef}
                      value={draftDesc}
                      onChange={e => setDraftDesc(e.target.value)}
                      rows={8}
                      placeholder="Describe the task…"
                      className="flex-1 resize-none bg-[#0c1524] px-4 py-3 text-sm text-[#cbd5e1] placeholder:text-[#334155] focus:outline-none leading-relaxed"
                    />
                  </div>
                ) : editingDesc ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={descDraft}
                      onChange={e => setDescDraft(e.target.value)}
                      rows={8}
                      className={`${inputBase} resize-none`}
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setDesc(descDraft); setEditDesc(false); }} className="rounded-lg bg-[#6366f1] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#5254cc] transition-colors">Save</button>
                      <button onClick={() => setEditDesc(false)} className="rounded-lg border border-[#1e293b] px-3.5 py-1.5 text-xs font-medium text-[#64748b] hover:bg-[#1e293b] transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => { setDescDraft(desc); setEditDesc(true); }}
                    className="text-sm text-[#94a3b8] leading-relaxed whitespace-pre-line cursor-text rounded-lg p-2 -mx-2 border border-transparent hover:border-[#1e293b] hover:bg-[#1e293b]/30 transition-all"
                  >
                    {desc}
                  </p>
                )}
              </section>

              <div className="h-px bg-[#1e293b]" />

              {/* Subtasks */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <SectionHeading>Subtasks</SectionHeading>
                  <span className="text-[11px] text-[#475569] tabular-nums">
                    {isEditMode ? dDoneCount : doneCount} / {isEditMode ? draftSubtasks.length : subtasks.length} done
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
                    {(() => {
                      const total = isEditMode ? draftSubtasks.length : subtasks.length;
                      const done  = isEditMode ? dDoneCount : doneCount;
                      const pct   = total ? (done / total) * 100 : 0;
                      return (
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#10b981" : "#6366f1" }}
                        />
                      );
                    })()}
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-[#475569] w-8 text-right">
                    {(() => {
                      const total = isEditMode ? draftSubtasks.length : subtasks.length;
                      const done  = isEditMode ? dDoneCount : doneCount;
                      return total ? Math.round((done / total) * 100) : 0;
                    })()}%
                  </span>
                </div>

                {/* Subtask list */}
                {isEditMode ? (
                  <div className="flex flex-col gap-1">
                    {draftSubtasks.map(s => (
                      <div
                        key={s.id}
                        className="group flex items-center gap-2 rounded-lg px-2 py-1.5 border border-transparent hover:border-[#1e293b] hover:bg-[#0f172a]/60 transition-all"
                      >
                        {/* Drag handle */}
                        <GripVertical className="h-4 w-4 text-[#334155] cursor-grab flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleDraftSub(s.id)}
                          className="flex-shrink-0 text-[#475569] hover:text-[#6366f1] transition-colors"
                        >
                          {s.done
                            ? <CheckSquare className="h-4 w-4 text-[#10b981]" />
                            : <Square className="h-4 w-4" />
                          }
                        </button>
                        {/* Editable title */}
                        <input
                          value={s.title}
                          onChange={e => updateDraftSubTitle(s.id, e.target.value)}
                          className={`flex-1 bg-transparent text-sm focus:outline-none rounded px-1 py-0.5 focus:bg-[#1e293b] transition-colors ${s.done ? "line-through text-[#475569]" : "text-[#f1f5f9]"}`}
                          onKeyDown={e => e.key === "Enter" && newSubRef.current?.focus()}
                        />
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => deleteDraftSub(s.id)}
                          className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md text-[#475569] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all flex-shrink-0"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add subtask input (edit mode) */}
                    <div
                      className="flex items-center gap-2 mt-1 rounded-lg border-2 border-dashed px-3 py-2 transition-all focus-within:border-[#6366f1]/50 focus-within:bg-[#6366f1]/5"
                      style={{ borderColor: "#334155" }}
                    >
                      <Plus className="h-3.5 w-3.5 text-[#475569] flex-shrink-0" />
                      <input
                        ref={newSubRef}
                        value={newSubtask}
                        onChange={e => setNewSub(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addDraftSub()}
                        placeholder="Add subtask… (Enter to add)"
                        className="flex-1 bg-transparent text-sm text-[#f1f5f9] placeholder:text-[#334155] focus:outline-none"
                        autoFocus={false}
                      />
                      {newSubtask && (
                        <button
                          type="button"
                          onClick={addDraftSub}
                          className="text-xs font-medium text-[#6366f1] hover:text-[#5254cc] transition-colors flex-shrink-0"
                        >
                          Add
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#334155] mt-0.5 pl-1">Drag to reorder · Click title to edit · Enter to add new</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {subtasks.map(s => (
                      <div key={s.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[#1e293b]/60 transition-colors">
                        <button onClick={() => setSubtasks(p => p.map(x => x.id === s.id ? { ...x, done: !x.done } : x))} className="flex-shrink-0 text-[#475569] hover:text-[#6366f1] transition-colors">
                          {s.done ? <CheckSquare className="h-4 w-4 text-[#10b981]" /> : <Square className="h-4 w-4" />}
                        </button>
                        <span className={`flex-1 text-sm leading-snug ${s.done ? "line-through text-[#475569]" : "text-[#f1f5f9]"}`}>{s.title}</span>
                        <button onClick={() => setSubtasks(p => p.filter(x => x.id !== s.id))} className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md text-[#475569] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all">
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#1e293b] px-3 py-2 hover:border-[#6366f1]/40 transition-colors focus-within:border-[#6366f1]/40">
                      <Plus className="h-3.5 w-3.5 text-[#475569] flex-shrink-0" />
                      <input
                        value={newSubtask}
                        onChange={e => setNewSub(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (() => { if (!newSubtask.trim()) return; setSubtasks(p => [...p, { id: `s${Date.now()}`, title: newSubtask.trim(), done: false }]); setNewSub(""); })()}
                        placeholder="Add a subtask…"
                        className="flex-1 bg-transparent text-sm text-[#f1f5f9] placeholder:text-[#334155] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </section>

              <div className="h-px bg-[#1e293b]" />

              {/* Comments */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <SectionHeading>Comments</SectionHeading>
                  <span className="flex items-center gap-1 text-[11px] text-[#475569]">
                    <MessageSquare className="h-3 w-3" />{comments.length}
                  </span>
                </div>
                <div className="flex flex-col gap-5">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar name={c.author} size={7} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-semibold text-[#f1f5f9]">{c.author}</span>
                          <span className="text-[11px] text-[#475569]">{c.time}</span>
                        </div>
                        <p className="text-sm text-[#94a3b8] leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-1">
                  <Avatar name="Alice Johnson" size={7} />
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && e.metaKey) sendComment(); }}
                      placeholder="Write a comment… (⌘↵ to send)"
                      rows={3}
                      className={`${inputBase} resize-none`}
                    />
                    {newComment.trim() && (
                      <div className="flex justify-end">
                        <button onClick={sendComment} className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 py-2 text-xs font-medium text-white hover:bg-[#5254cc] active:scale-[0.98] transition-all">
                          <Send className="h-3.5 w-3.5" />Send
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="h-4" />
            </div>

            {/* ── Right column (metadata) ───────────────────────────────────── */}
            <div className="flex flex-col gap-5 px-4 py-5" style={{ backgroundColor: "#0c1421" }}>

              {/* Status */}
              <div className="flex flex-col gap-2">
                <SectionHeading>Status</SectionHeading>
                {isEditMode ? (
                  <EditStatusPicker value={draftStatus} onChange={setDraftStatus} />
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => { setStatusOpen(v => !v); setPriorityOpen(false); }}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border transition-colors hover:opacity-90"
                      style={{ backgroundColor: sOpt.color + "18", color: sOpt.color, borderColor: sOpt.color + "40" }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sOpt.color }} />
                      {sOpt.label}
                      <ChevronDown className="h-3 w-3 ml-auto opacity-60" />
                    </button>
                    {statusOpen && (
                      <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[140px] rounded-lg border border-[#1e293b] bg-[#111827] shadow-xl py-1 overflow-hidden">
                        {STATUS_OPTIONS.map(o => (
                          <button key={o.value} onClick={() => { setStatus(o.value); setStatusOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#1e293b] transition-colors">
                            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
                            <span style={{ color: o.color }}>{o.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-2">
                <SectionHeading>Priority</SectionHeading>
                {isEditMode ? (
                  <EditPriorityPicker value={draftPriority} onChange={setDraftPriority} />
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => { setPriorityOpen(v => !v); setStatusOpen(false); }}
                      className="flex items-center gap-2 w-full rounded-lg border border-[#1e293b] bg-[#1e293b]/30 px-2.5 py-1.5 text-xs font-medium hover:bg-[#1e293b] transition-colors"
                    >
                      <PIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: pOpt.color }} />
                      <span style={{ color: pOpt.color }}>{pOpt.label}</span>
                      <ChevronDown className="h-3 w-3 text-[#475569] ml-auto" />
                    </button>
                    {priorityOpen && (
                      <div className="absolute left-0 top-full mt-1.5 z-50 min-w-full rounded-lg border border-[#1e293b] bg-[#111827] shadow-xl py-1 overflow-hidden">
                        {PRIORITY_OPTIONS.map(o => {
                          const Icon = o.icon;
                          return (
                            <button key={o.value} onClick={() => { setPriority(o.value); setPriorityOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#1e293b] transition-colors">
                              <Icon className="h-3.5 w-3.5" style={{ color: o.color }} />
                              <span style={{ color: o.color }}>{o.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-[#1e293b]" />

              {/* Assignees */}
              <div className="flex flex-col gap-2">
                <SectionHeading>Assignees</SectionHeading>
                {isEditMode ? (
                  <EditAssigneePicker selected={draftAssignees} onChange={setDraftAssignees} />
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1.5">
                      {assignees.map(a => (
                        <div key={a} className="group flex items-center gap-2">
                          <Avatar name={a} size={6} />
                          <span className="flex-1 text-xs text-[#f1f5f9] truncate">{a}</span>
                          <button onClick={() => toggleAssignee(a)} className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded text-[#475569] hover:text-[#f1f5f9] transition-all">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setAssigneeOpen(v => !v)} className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#6366f1] transition-colors">
                      <Plus className="h-3 w-3" /> Add member
                    </button>
                  </div>
                )}
              </div>

              {/* Reporter (always view) */}
              <div className="flex flex-col gap-2">
                <SectionHeading>Reporter</SectionHeading>
                <div className="flex items-center gap-2">
                  <Avatar name="Alice Johnson" size={6} />
                  <span className="text-xs text-[#94a3b8]">Alice Johnson</span>
                </div>
              </div>

              <div className="h-px bg-[#1e293b]" />

              {/* Board + Column (view only) */}
              <div className="flex flex-col gap-2">
                <SectionHeading>Board</SectionHeading>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#8b5cf6]/15 flex-shrink-0">
                    <LayoutGrid className="h-3 w-3 text-[#8b5cf6]" />
                  </div>
                  <span className="text-xs text-[#94a3b8]">Engineering Sprint</span>
                </div>
              </div>

              <div className="h-px bg-[#1e293b]" />

              {/* Deadline */}
              <div className="flex flex-col gap-2">
                <SectionHeading>Deadline</SectionHeading>
                {isEditMode ? (
                  <div
                    className="flex items-center gap-2 rounded-lg border-2 px-2.5 py-2 transition-all"
                    style={{ borderColor: "#6366f1" + "40", backgroundColor: "#0f172a", boxShadow: "0 0 0 3px rgba(99,102,241,0.06)" }}
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#6366f1] flex-shrink-0" />
                    <input
                      type="date"
                      value={draftDeadline}
                      onChange={e => setDraftDeadline(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-[#f1f5f9] focus:outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-[#1e293b] bg-[#1e293b]/30 px-2.5 py-1.5 hover:bg-[#1e293b] transition-colors">
                    <Calendar className="h-3.5 w-3.5 text-[#475569] flex-shrink-0" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-[#f1f5f9] focus:outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                )}
              </div>

              {/* Labels */}
              <div className="flex flex-col gap-2">
                <SectionHeading>Labels</SectionHeading>
                {isEditMode ? (
                  <EditLabelPicker selected={draftLabels} onChange={setDraftLabels} />
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {labels.map(l => (
                        <span key={l.label} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border" style={{ backgroundColor: l.color + "18", color: l.color, borderColor: l.color + "40" }}>
                          {l.label}
                          <button onClick={() => setLabels(p => p.filter(x => x.label !== l.label))} className="opacity-60 hover:opacity-100 transition-opacity"><X className="h-2.5 w-2.5" /></button>
                        </span>
                      ))}
                    </div>
                    <button onClick={() => setLabelOpen(v => !v)} className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#6366f1] transition-colors">
                      <Plus className="h-3 w-3" /> Add label
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px bg-[#1e293b]" />

              {/* Dates */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <SectionHeading>Created</SectionHeading>
                  <span className="text-xs text-[#475569]">May 26, 2026</span>
                </div>
                <div className="flex flex-col gap-1">
                  <SectionHeading>Last updated</SectionHeading>
                  <span className="text-xs text-[#475569]">Today at 10:14 AM</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Activity ──────────────────────────────────────────────────────── */}
          <div className="border-t border-[#1e293b] px-6 py-5">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Activity</p>
              {/* Filter segmented control */}
              <div className="flex items-center gap-0.5 rounded-lg border border-[#1e293b] bg-[#0c1421] p-0.5">
                {(["all", "task", "comments"] as ActivityFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setActivityFilter(f)}
                    className="rounded-md px-2.5 py-1 text-[10px] font-medium transition-all"
                    style={
                      activityFilter === f
                        ? { backgroundColor: "#1e293b", color: "#f1f5f9" }
                        : { color: "#475569" }
                    }
                  >
                    {f === "all" ? "All" : f === "task" ? "Task" : "Comments"}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="relative flex flex-col">
              {/* Vertical connector line */}
              <div className="absolute left-[9px] top-4 bottom-4 w-px bg-[#1e293b]" />

              {SEED_ACTIVITY
                .filter(entry =>
                  activityFilter === "all"      ? true :
                  activityFilter === "comments" ? entry.type === "COMMENT_ADDED" :
                  entry.type !== "COMMENT_ADDED"
                )
                .map((entry, i) => (
                  <div key={i} className="relative flex items-start gap-2.5 py-2.5">
                    {/* Action type icon on the line */}
                    <ActivityBadge type={entry.type} />

                    {/* User avatar 24px */}
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white flex-shrink-0 border-2 border-[#111827]"
                      style={{ backgroundColor: avatarBg(entry.user) }}
                      title={entry.user}
                    >
                      {initials(entry.user)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-xs text-[#64748b] leading-relaxed">
                        <span className="font-semibold text-[#94a3b8]">{entry.user}</span>
                        {" "}{entry.desc}
                      </p>
                      <span className="text-[10px] text-[#334155] tabular-nums mt-0.5 block">
                        {entry.time}
                      </span>
                    </div>
                  </div>
                ))
              }

              {/* Empty state */}
              {SEED_ACTIVITY.filter(e =>
                activityFilter === "all"      ? true :
                activityFilter === "comments" ? e.type === "COMMENT_ADDED" :
                e.type !== "COMMENT_ADDED"
              ).length === 0 && (
                <p className="text-xs text-[#334155] text-center py-4">No {activityFilter} activity yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Unsaved Changes Bar ──────────────────────────────────────────── */}
        {isEditMode && (
          <div
            className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-3 border-t"
            style={{
              backgroundColor: "rgba(245,158,11,0.08)",
              borderColor: "rgba(245,158,11,0.18)",
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b] flex-shrink-0" />
              <span className="text-xs text-[#f59e0b] font-medium">
                {hasChanges ? "You have unsaved changes" : "No changes yet — make edits above"}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleDiscard}
                className="text-xs text-[#64748b] hover:text-[#94a3b8] underline underline-offset-2 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: hasChanges ? "#6366f1" : "#334155",
                  boxShadow: hasChanges ? "0 2px 8px -2px rgba(99,102,241,0.5)" : "none",
                  cursor: hasChanges ? "pointer" : "default",
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
      )}
    </AnimatePresence>
  );
}
