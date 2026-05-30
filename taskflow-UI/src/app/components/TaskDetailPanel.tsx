import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckSquare,
  Clock,
  MessageSquare,
  Minus,
  Plus,
  Send,
  Square,
  Tag,
  User,
  X,
} from "lucide-react";
import { activityLogsApi, commentsApi, labelsApi, subtasksApi, tasksApi } from "../../api";
import type {
  ActivityLog,
  BoardMember,
  Column,
  Comment,
  Label,
  Subtask,
  Task,
  TaskPriority,
  TaskStatus,
} from "../../types";

type PriorityTone = "low" | "medium" | "high" | "urgent";

const PRIORITY_META: Record<TaskPriority, { label: string; tone: PriorityTone; color: string }> = {
  LOW: { label: "Low", tone: "low", color: "#94a3b8" },
  MEDIUM: { label: "Medium", tone: "medium", color: "#f59e0b" },
  HIGH: { label: "High", tone: "high", color: "#f97316" },
  CRITICAL: { label: "Urgent", tone: "urgent", color: "#ef4444" },
};

const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  TODO: { label: "To Do", color: "#64748b" },
  IN_PROGRESS: { label: "In Progress", color: "#6366f1" },
  IN_REVIEW: { label: "In Review", color: "#f59e0b" },
  DONE: { label: "Done", color: "#10b981" },
};

function avatarColor(name: string) {
  const palette = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
  return palette[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStatusFromColumnName(name: string): TaskStatus {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes("review")) return "IN_REVIEW";
  if (normalized.includes("progress") || normalized.includes("doing")) return "IN_PROGRESS";
  if (normalized.includes("done") || normalized.includes("complete")) return "DONE";
  return "TODO";
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const now = Date.now();
  const diffMinutes = Math.max(1, Math.round((now - date.getTime()) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

interface TaskDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: number | null;
  taskId: number | null;
  columns?: Column[];
  members?: BoardMember[];
}

export function TaskDetailPanel({
  isOpen,
  onClose,
  boardId,
  taskId,
  columns = [],
  members = [],
}: TaskDetailPanelProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [columnId, setColumnId] = useState<number | null>(null);
  const [deadline, setDeadline] = useState("");
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");

  const taskQuery = useQuery({
    queryKey: ["task-detail", boardId, taskId],
    queryFn: () => tasksApi.getById(boardId!, taskId!),
    enabled: isOpen && boardId !== null && taskId !== null,
  });

  const subtasksQuery = useQuery({
    queryKey: ["task-subtasks", boardId, taskId],
    queryFn: () => subtasksApi.getByTask(boardId!, taskId!),
    enabled: isOpen && boardId !== null && taskId !== null,
  });

  const commentsQuery = useQuery({
    queryKey: ["task-comments", boardId, taskId],
    queryFn: () => commentsApi.getByTask(boardId!, taskId!),
    enabled: isOpen && boardId !== null && taskId !== null,
  });

  const activityQuery = useQuery({
    queryKey: ["task-activity", boardId, taskId],
    queryFn: () => activityLogsApi.getByTask(boardId!, taskId!),
    enabled: isOpen && boardId !== null && taskId !== null,
  });

  const boardLabelsQuery = useQuery({
    queryKey: ["board-labels", boardId],
    queryFn: () => labelsApi.getByBoard(boardId!),
    enabled: isOpen && boardId !== null,
  });

  const currentTask = taskQuery.data;
  const subtasks = subtasksQuery.data ?? [];
  const comments = commentsQuery.data ?? [];
  const activity = activityQuery.data ?? [];
  const boardLabels = boardLabelsQuery.data ?? [];

  useEffect(() => {
    if (!currentTask) return;

    setTitle(currentTask.title);
    setDescription(currentTask.description ?? "");
    setPriority(currentTask.priority);
    setColumnId(currentTask.columnId);
    setDeadline(currentTask.deadline ? currentTask.deadline.slice(0, 16) : "");
    setAssigneeId(currentTask.assigneeId);
    setIsEditing(false);
  }, [currentTask]);

  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      if (!boardId || !taskId || !currentTask) return;

      if (columnId !== null && columnId !== currentTask.columnId) {
        const targetColumn = columns.find((item) => item.id === columnId);
        if (targetColumn) {
          await tasksApi.move(boardId, taskId, {
            columnId,
            status: getStatusFromColumnName(targetColumn.name),
          });
        }
      }

      const nextAssigneeId = assigneeId === currentTask.assigneeId ? currentTask.assigneeId : assigneeId;
      if (nextAssigneeId !== currentTask.assigneeId) {
        await tasksApi.assign(boardId, taskId, { assigneeId: nextAssigneeId });
      }

      await tasksApi.update(boardId, taskId, {
        title,
        description,
        priority,
        deadline: deadline || null,
      });
    },
    onSuccess: async () => {
      setIsEditing(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task-detail", boardId, taskId] }),
        queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] }),
        queryClient.invalidateQueries({ queryKey: ["all-board-tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["task-activity", boardId, taskId] }),
      ]);
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (payload: { title: string }) => subtasksApi.create(boardId!, taskId!, payload),
    onSuccess: async () => {
      setNewSubtask("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task-subtasks", boardId, taskId] }),
        queryClient.invalidateQueries({ queryKey: ["task-detail", boardId, taskId] }),
        queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] }),
      ]);
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, payload }: { subtaskId: number; payload: { title?: string; completed?: boolean } }) =>
      subtasksApi.update(boardId!, taskId!, subtaskId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task-subtasks", boardId, taskId] }),
        queryClient.invalidateQueries({ queryKey: ["task-detail", boardId, taskId] }),
      ]);
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: number) => subtasksApi.delete(boardId!, taskId!, subtaskId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task-subtasks", boardId, taskId] }),
        queryClient.invalidateQueries({ queryKey: ["task-detail", boardId, taskId] }),
      ]);
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.create(boardId!, taskId!, { content }),
    onSuccess: async () => {
      setNewComment("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task-comments", boardId, taskId] }),
        queryClient.invalidateQueries({ queryKey: ["task-activity", boardId, taskId] }),
      ]);
    },
  });

  const toggleTaskLabelMutation = useMutation({
    mutationFn: async (label: Label) => {
      if (!boardId || !taskId || !currentTask) return;

      const hasLabel = currentTask.labels.some((item) => item.id === label.id);
      if (hasLabel) {
        await labelsApi.removeFromTask(boardId, taskId, label.id);
        return;
      }

      await labelsApi.addToTask(boardId, taskId, label.id);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task-detail", boardId, taskId] }),
        queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] }),
        queryClient.invalidateQueries({ queryKey: ["all-board-tasks"] }),
      ]);
    },
  });

  const completion = useMemo(() => {
    if (subtasks.length === 0) return 0;
    return Math.round((subtasks.filter((item) => item.completed).length / subtasks.length) * 100);
  }, [subtasks]);

  const assigneeName = useMemo(() => {
    const byMember = members.find((member) => member.userId === assigneeId);
    return byMember?.fullName ?? currentTask?.assigneeName ?? null;
  }, [assigneeId, currentTask?.assigneeName, members]);

  const isLoading =
    taskQuery.isLoading ||
    subtasksQuery.isLoading ||
    commentsQuery.isLoading ||
    activityQuery.isLoading ||
    boardLabelsQuery.isLoading;
  const hasError =
    taskQuery.isError ||
    subtasksQuery.isError ||
    commentsQuery.isError ||
    activityQuery.isError ||
    boardLabelsQuery.isError;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[560px] flex-col border-l border-[#334155] bg-[#111827] shadow-2xl shadow-black/50"
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Task Detail</p>
                <h2 className="mt-1 text-sm font-semibold text-[#f1f5f9]">
                  {currentTask?.type ?? "Task"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#1e293b] hover:text-[#94a3b8] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-[#64748b]">Loading task...</div>
            ) : hasError || !currentTask ? (
              <div className="flex flex-1 items-center justify-center text-sm text-[#ef4444]">Unable to load task.</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {isEditing ? (
                          <textarea
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-lg font-semibold text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30"
                          />
                        ) : (
                          <h3 className="text-xl font-semibold text-[#f1f5f9]">{currentTask.title}</h3>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: STATUS_META[currentTask.status].color + "18", color: STATUS_META[currentTask.status].color }}
                          >
                            {STATUS_META[currentTask.status].label}
                          </span>
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: PRIORITY_META[currentTask.priority].color + "18", color: PRIORITY_META[currentTask.priority].color }}
                          >
                            {PRIORITY_META[currentTask.priority].label}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsEditing((value) => !value)}
                        className="rounded-lg border border-[#334155] px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9] transition-colors"
                      >
                        {isEditing ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    <section className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
                        <Tag className="h-3 w-3" />
                        Description
                      </div>
                      {isEditing ? (
                        <textarea
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          rows={6}
                          className="w-full resize-none rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30"
                        />
                      ) : (
                        <p className="rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-3 text-sm leading-relaxed text-[#94a3b8]">
                          {currentTask.description || "No description yet."}
                        </p>
                      )}
                    </section>

                    <section className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
                        <Tag className="h-3 w-3" />
                        Labels
                      </div>
                      <div className="rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-3">
                        {isEditing ? (
                          <div className="flex flex-wrap gap-2">
                            {boardLabels.map((label) => {
                              const isSelected = currentTask.labels.some((item) => item.id === label.id);
                              return (
                                <button
                                  key={label.id}
                                  type="button"
                                  onClick={() => toggleTaskLabelMutation.mutate(label)}
                                  className="rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
                                  style={{
                                    borderColor: isSelected ? label.color : "#334155",
                                    backgroundColor: isSelected ? `${label.color}26` : "transparent",
                                    color: isSelected ? label.color : "#94a3b8",
                                  }}
                                >
                                  {label.name}
                                </button>
                              );
                            })}
                            {boardLabels.length === 0 && (
                              <p className="text-sm text-[#64748b]">No labels on this board yet.</p>
                            )}
                          </div>
                        ) : currentTask.labels.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {currentTask.labels.map((label) => (
                              <span
                                key={label.id}
                                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{ backgroundColor: `${label.color}26`, color: label.color }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[#64748b]">No labels attached.</p>
                        )}
                      </div>
                    </section>

                    <div className="grid grid-cols-2 gap-4">
                      <section className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
                          <Clock className="h-3 w-3" />
                          Status
                        </div>
                        {isEditing ? (
                          <select
                            value={String(columnId ?? currentTask.columnId)}
                            onChange={(event) => setColumnId(Number(event.target.value))}
                            className="rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9] focus:outline-none"
                          >
                            {columns.map((column) => (
                              <option key={column.id} value={column.id}>
                                {column.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9]">
                            {currentTask.columnName}
                          </div>
                        )}
                      </section>

                      <section className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
                          <AlertTriangle className="h-3 w-3" />
                          Priority
                        </div>
                        {isEditing ? (
                          <select
                            value={priority}
                            onChange={(event) => setPriority(event.target.value as TaskPriority)}
                            className="rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9] focus:outline-none"
                          >
                            {Object.entries(PRIORITY_META).map(([value, meta]) => (
                              <option key={value} value={value}>
                                {meta.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9]">
                            {PRIORITY_META[currentTask.priority].label}
                          </div>
                        )}
                      </section>

                      <section className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
                          <User className="h-3 w-3" />
                          Assignee
                        </div>
                        {isEditing ? (
                          <select
                            value={assigneeId ?? ""}
                            onChange={(event) => setAssigneeId(event.target.value ? Number(event.target.value) : null)}
                            className="rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9] focus:outline-none"
                          >
                            <option value="">Unassigned</option>
                            {members.map((member) => (
                              <option key={member.userId} value={member.userId}>
                                {member.fullName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9]">
                            {assigneeName ?? "Unassigned"}
                          </div>
                        )}
                      </section>

                      <section className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
                          <Calendar className="h-3 w-3" />
                          Deadline
                        </div>
                        {isEditing ? (
                          <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(event) => setDeadline(event.target.value)}
                            className="rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9] focus:outline-none"
                          />
                        ) : (
                          <div className="rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9]">
                            {currentTask.deadline ? new Date(currentTask.deadline).toLocaleString("en-US") : "No deadline"}
                          </div>
                        )}
                      </section>
                    </div>

                    <section className="flex flex-col gap-3 rounded-xl border border-[#1e293b] bg-[#0f172a] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#f1f5f9]">Subtasks</p>
                          <p className="text-xs text-[#64748b]">{completion}% complete</p>
                        </div>
                        <span className="text-xs text-[#94a3b8]">
                          {subtasks.filter((item) => item.completed).length}/{subtasks.length}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#1e293b]">
                        <div className="h-full rounded-full bg-[#6366f1]" style={{ width: `${completion}%` }} />
                      </div>
                      <div className="flex flex-col gap-2">
                        {subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-3 rounded-lg border border-[#1e293b] px-3 py-2">
                            <button
                              onClick={() =>
                                updateSubtaskMutation.mutate({
                                  subtaskId: subtask.id,
                                  payload: { completed: !subtask.completed, title: subtask.title },
                                })
                              }
                              className="text-[#64748b] hover:text-[#10b981] transition-colors"
                            >
                              {subtask.completed ? <CheckSquare className="h-4 w-4 text-[#10b981]" /> : <Square className="h-4 w-4" />}
                            </button>
                            <span className={`flex-1 text-sm ${subtask.completed ? "text-[#64748b] line-through" : "text-[#f1f5f9]"}`}>
                              {subtask.title}
                            </span>
                            <button
                              onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                              className="text-[#475569] hover:text-[#ef4444] transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#334155] px-3 py-2">
                        <Plus className="h-4 w-4 text-[#475569]" />
                        <input
                          value={newSubtask}
                          onChange={(event) => setNewSubtask(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && newSubtask.trim()) {
                              createSubtaskMutation.mutate({ title: newSubtask.trim() });
                            }
                          }}
                          placeholder="Add a subtask..."
                          className="flex-1 bg-transparent text-sm text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none"
                        />
                      </div>
                    </section>

                    <section className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
                        <MessageSquare className="h-3 w-3" />
                        Comments
                      </div>
                      <div className="flex flex-col gap-3">
                        {comments.map((comment) => (
                          <div key={comment.id} className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                style={{ backgroundColor: avatarColor(comment.userFullName) }}
                              >
                                {initials(comment.userFullName)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#f1f5f9]">{comment.userFullName}</p>
                                <p className="text-[11px] text-[#64748b]">{formatRelativeTime(comment.createdAt)}</p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-[#94a3b8]">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-3">
                        <textarea
                          value={newComment}
                          onChange={(event) => setNewComment(event.target.value)}
                          rows={3}
                          placeholder="Write a comment..."
                          className="w-full resize-none bg-transparent text-sm text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none"
                        />
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => newComment.trim() && createCommentMutation.mutate(newComment.trim())}
                            className="flex items-center gap-2 rounded-lg bg-[#6366f1] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#5254cc] transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Send
                          </button>
                        </div>
                      </div>
                    </section>

                    <section className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
                        <Clock className="h-3 w-3" />
                        Activity
                      </div>
                      <div className="flex flex-col gap-2">
                        {activity.map((entry) => (
                          <div key={entry.id} className="rounded-xl border border-[#1e293b] bg-[#0f172a] px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                                style={{ backgroundColor: avatarColor(entry.userFullName) }}
                              >
                                {initials(entry.userFullName)}
                              </div>
                              <p className="text-xs text-[#94a3b8]">
                                <span className="font-semibold text-[#f1f5f9]">{entry.userFullName}</span>{" "}
                                {entry.action.replaceAll("_", " ").toLowerCase()}
                              </p>
                            </div>
                            <p className="mt-2 text-[11px] leading-relaxed text-[#64748b]">
                              {entry.fieldName ? `${entry.fieldName}: ` : ""}
                              {entry.newValue ?? entry.taskTitle ?? "Updated task"}
                            </p>
                            <p className="mt-1 text-[10px] text-[#475569]">{formatRelativeTime(entry.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center justify-between border-t border-[#1e293b] bg-[#0c1421] px-5 py-3">
                    <span className="text-xs text-[#f59e0b]">Save task changes to sync with the board.</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (!currentTask) return;
                          setTitle(currentTask.title);
                          setDescription(currentTask.description ?? "");
                          setPriority(currentTask.priority);
                          setColumnId(currentTask.columnId);
                          setDeadline(currentTask.deadline ? currentTask.deadline.slice(0, 16) : "");
                          setAssigneeId(currentTask.assigneeId);
                          setIsEditing(false);
                        }}
                        className="rounded-lg border border-[#334155] px-3 py-1.5 text-xs font-medium text-[#94a3b8] hover:bg-[#1e293b] transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        onClick={() => updateTaskMutation.mutate()}
                        className="flex items-center gap-2 rounded-lg bg-[#6366f1] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#5254cc] transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
