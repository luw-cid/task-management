import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bold,
  Bug,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  Clock,
  Code2,
  Italic,
  Link2,
  List,
  MessageSquare,
  Minus,
  Plus,
  Sparkles,
  Send,
  Square,
  Tag,
  Underline,
  User,
  X,
  ArrowUp,
  Zap,
  MessageSquareText,
  Search as SearchIcon,
  Trash2 as TrashIcon,
} from "lucide-react";
import { activityLogsApi, boardsApi, chatApi, columnsApi, commentsApi, labelsApi, subtasksApi, tasksApi, websocketService } from "../../api";
import type {
  ActivityLog,
  BoardMember,
  ChatMessage,
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

const TYPE_META: Record<Task["type"], { label: string; color: string; Icon: typeof Bug }> = {
  BUG: { label: "Bug", color: "#ef4444", Icon: Bug },
  FEATURE: { label: "Feature", color: "#6366f1", Icon: Sparkles },
  IMPROVEMENT: { label: "Improvement", color: "#10b981", Icon: ArrowUp },
  EPIC: { label: "Epic", color: "#8b5cf6", Icon: Zap },
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
  if (!value) return "Just now";
  const dateStr = value.endsWith("Z") || value.includes("+") ? value : `${value}Z`;
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMinutes = Math.max(1, Math.round((now - date.getTime()) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function formatDateTime(value: string | null) {
  if (!value) return "No deadline";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function applyFormat(
  element: HTMLTextAreaElement,
  setter: (value: string) => void,
  wrap: [string, string]
) {
  const start = element.selectionStart;
  const end = element.selectionEnd;
  const selected = element.value.slice(start, end) || "text";
  const nextValue =
    element.value.slice(0, start) +
    wrap[0] +
    selected +
    wrap[1] +
    element.value.slice(end);

  setter(nextValue);

  requestAnimationFrame(() => {
    element.focus();
    element.setSelectionRange(start + wrap[0].length, start + wrap[0].length + selected.length);
  });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#4b587c]">{children}</p>;
}

function getActivityAccent(action: string) {
  if (action.includes("COMMENT")) return { color: "#7c5cff", bg: "#221a43" };
  if (action.includes("ASSIGN")) return { color: "#06b6d4", bg: "#0f2433" };
  if (action.includes("MOVE")) return { color: "#f59e0b", bg: "#33240f" };
  if (action.includes("DELETE")) return { color: "#ef4444", bg: "#35151a" };
  return { color: "#6366f1", bg: "#1a2142" };
}

function formatActivityText(entry: ActivityLog) {
  const action = entry.action.replaceAll("_", " ").toLowerCase();
  const detail = entry.newValue ?? entry.taskTitle ?? "Updated task";

  if (entry.action.includes("COMMENT")) {
    return `added a comment: "${detail}"`;
  }

  if (entry.fieldName) {
    return `${action} ${entry.fieldName.toLowerCase()}: ${detail}`;
  }

  return `${action}: ${detail}`;
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
  const [activityFilter, setActivityFilter] = useState<"all" | "task" | "comments">("comments");
  const [saveError, setSaveError] = useState("");
  const [labelError, setLabelError] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const taskQuery = useQuery({
    queryKey: ["task-detail", boardId, taskId],
    queryFn: () => tasksApi.getById(boardId!, taskId!),
    enabled: isOpen && boardId !== null && taskId !== null,
  });

  const boardColumnsQuery = useQuery({
    queryKey: ["task-detail-columns", boardId],
    queryFn: () => columnsApi.getByBoard(boardId!),
    enabled: isOpen && boardId !== null,
    initialData: columns.length > 0 ? columns : undefined,
  });

  const boardMembersQuery = useQuery({
    queryKey: ["task-detail-members", boardId],
    queryFn: () => boardsApi.getBoardMembers(boardId!),
    enabled: isOpen && boardId !== null,
    initialData: members.length > 0 ? members : undefined,
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

  const [newChatMessage, setNewChatMessage] = useState("");
  const [chatSearchKeyword, setChatSearchKeyword] = useState("");
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const chatMessagesQuery = useQuery({
    queryKey: ["task-chat-messages", boardId, taskId],
    queryFn: () => chatApi.getMessages(boardId!, taskId!),
    enabled: isOpen && boardId !== null && taskId !== null,
  });

  const chatSearchQuery = useQuery({
    queryKey: ["task-chat-search", boardId, taskId, chatSearchKeyword],
    queryFn: () => chatApi.searchMessages(boardId!, taskId!, chatSearchKeyword),
    enabled: isOpen && boardId !== null && taskId !== null && chatSearchKeyword.trim().length > 0,
  });

  const chatMessages = useMemo(() => {
    if (chatSearchKeyword.trim().length > 0 && chatSearchQuery.data) {
      return chatSearchQuery.data;
    }
    return chatMessagesQuery.data ?? [];
  }, [chatSearchKeyword, chatSearchQuery.data, chatMessagesQuery.data]);

  useEffect(() => {
    if (!isOpen || !boardId || !taskId) return;

    chatApi.joinChat(boardId, taskId).catch(() => { });

    const unsubscribe = websocketService.subscribeToTask(taskId, (wsMessage) => {
      if (wsMessage.type === "CHAT_MESSAGE") {
        queryClient.setQueryData<ChatMessage[]>(
          ["task-chat-messages", boardId, taskId],
          (old = []) => {
            const incoming = wsMessage.payload as ChatMessage;
            if (old.some((m) => m.id === incoming.id)) return old;
            return [...old, incoming];
          }
        );
      } else if (wsMessage.type === "CHAT_MESSAGE_DELETE") {
        const deletedId = wsMessage.payload as string;
        queryClient.setQueryData<ChatMessage[]>(
          ["task-chat-messages", boardId, taskId],
          (old = []) =>
            old.map((m) =>
              m.id === deletedId
                ? { ...m, isDeleted: true, content: "Message is deleted" }
                : m
            )
        );
      }

      if (
        wsMessage.type === "COMMENT_ADDED" ||
        wsMessage.type === "COMMENT_UPDATED" ||
        wsMessage.type === "COMMENT_DELETED"
      ) {
        queryClient.invalidateQueries({ queryKey: ["task-comments", boardId, taskId] });
        queryClient.invalidateQueries({ queryKey: ["task-activity", boardId, taskId] });
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [isOpen, boardId, taskId, queryClient]);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages.length]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [commentsQuery.data?.length]);

  const sendChatMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!boardId || !taskId) throw new Error("Missing boardId or taskId");
      return chatApi.sendMessage(boardId, taskId, { content });
    },
    onSuccess: (newMessage: ChatMessage) => {
      setNewChatMessage("");
      if (newMessage && newMessage.id) {
        queryClient.setQueryData<ChatMessage[]>(
          ["task-chat-messages", boardId, taskId],
          (old = []) => {
            if (old.some((m) => m.id === newMessage.id)) return old;
            return [...old, newMessage];
          }
        );
      }
    },
  });

  const deleteChatMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!boardId || !taskId) throw new Error("Missing boardId or taskId");
      await chatApi.deleteMessage(boardId, taskId, messageId);
      return messageId;
    },
    onSuccess: (messageId: string) => {
      queryClient.setQueryData<ChatMessage[]>(
        ["task-chat-messages", boardId, taskId],
        (old = []) =>
          old.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, content: "Message is deleted" }
              : m
          )
      );
    },
  });

  const boardLabelsQuery = useQuery({
    queryKey: ["board-labels", boardId],
    queryFn: () => labelsApi.getByBoard(boardId!),
    enabled: isOpen && boardId !== null,
  });

  const currentTask = taskQuery.data;
  const boardColumns = boardColumnsQuery.data ?? [];
  const boardMembers = boardMembersQuery.data ?? [];
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
    setSaveError("");
    setLabelError("");
  }, [currentTask]);

  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      if (!boardId || !taskId || !currentTask) return;

      if (columnId !== null && columnId !== currentTask.columnId) {
        const targetColumn = boardColumns.find((item) => item.id === columnId);
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
      setSaveError("");
      setIsEditing(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task-detail", boardId, taskId] }),
        queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] }),
        queryClient.invalidateQueries({ queryKey: ["all-board-tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["task-activity", boardId, taskId] }),
      ]);
    },
  });

  async function handleSaveChanges() {
    if (!currentTask) return;

    if (!hasUnsavedChanges) {
      setSaveError("");
      setIsEditing(false);
      return;
    }

    setSaveError("");

    try {
      await updateTaskMutation.mutateAsync();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save task changes.");
    }
  }

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
    onMutate: () => {
      setNewComment("");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task-comments", boardId, taskId] }),
        queryClient.invalidateQueries({ queryKey: ["task-activity", boardId, taskId] }),
      ]);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number | string) => commentsApi.delete(boardId!, taskId!, commentId),
    onSuccess: async () => {
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
      setLabelError("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["task-detail", boardId, taskId] }),
        queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] }),
        queryClient.invalidateQueries({ queryKey: ["all-board-tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["task-activity", boardId, taskId] }),
      ]);
    },
  });

  const completion = useMemo(() => {
    if (subtasks.length === 0) return 0;
    return Math.round((subtasks.filter((item) => item.completed).length / subtasks.length) * 100);
  }, [subtasks]);

  const assigneeName = useMemo(() => {
    const byMember = boardMembers.find((member) => member.userId === assigneeId);
    return byMember?.fullName ?? currentTask?.assigneeName ?? null;
  }, [assigneeId, currentTask?.assigneeName, boardMembers]);
  const currentTypeMeta = currentTask ? TYPE_META[currentTask.type] : null;

  const activeColumn = useMemo(
    () => boardColumns.find((column) => column.id === (columnId ?? currentTask?.columnId)) ?? null,
    [boardColumns, columnId, currentTask?.columnId]
  );
  const hasUnsavedChanges =
    !!currentTask &&
    (
      title !== currentTask.title ||
      description !== (currentTask.description ?? "") ||
      priority !== currentTask.priority ||
      columnId !== currentTask.columnId ||
      deadline !== (currentTask.deadline ? currentTask.deadline.slice(0, 16) : "") ||
      assigneeId !== currentTask.assigneeId
    );
  const filteredActivity = useMemo(() => {
    return activity.filter((entry) => {
      if (activityFilter === "all") return true;
      if (activityFilter === "comments") return entry.action.includes("COMMENT");
      return !entry.action.includes("COMMENT");
    });
  }, [activity, activityFilter]);

  const isLoading = taskQuery.isLoading || boardColumnsQuery.isLoading;
  const hasError = taskQuery.isError;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-[#030712]/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: 640 }}
            animate={{ x: 0 }}
            exit={{ x: 640 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-full w-full md:w-[50vw] md:max-w-none flex-col overflow-hidden border-l border-[#283457] bg-[#111827] shadow-2xl shadow-black/60"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#5b5cf0] via-[#7c5cff] to-[#5b5cf0]" />

            {isLoading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-[#64748b]">Loading task...</div>
            ) : hasError || !currentTask ? (
              <div className="flex flex-1 items-center justify-center text-sm text-[#ef4444]">Unable to load task.</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  <div className="border-b border-[#22304f] px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs uppercase tracking-[0.22em] text-[#53627f]">
                            {currentTask.formattedId || `T${String(currentTask.id).padStart(5, "0")}`}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              backgroundColor: `${TYPE_META[currentTask.type].color}22`,
                              color: TYPE_META[currentTask.type].color,
                            }}
                          >
                            {currentTypeMeta && <currentTypeMeta.Icon className="h-3 w-3" />}
                            {currentTypeMeta?.label}
                          </span>
                          {currentTask.labels.slice(0, 3).map((label) => (
                            <span
                              key={label.id}
                              className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                              style={{
                                borderColor: `${label.color}55`,
                                backgroundColor: `${label.color}14`,
                                color: label.color,
                              }}
                            >
                              {label.name}
                            </span>
                          ))}
                          {currentTask.labels.length > 3 && (
                            <span className="rounded-full border border-[#334155] bg-[#141c2e] px-2.5 py-1 text-[11px] font-semibold text-[#8ea0c4]">
                              +{currentTask.labels.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6d4d12] bg-[#35260f] px-3 py-1 text-xs font-semibold text-[#f59e0b]">
                            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                            Editing
                          </span>
                        )}
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSaveChanges}
                              disabled={updateTaskMutation.isPending}
                              className="rounded-xl bg-[#6d6cf8] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#6d6cf8]/30 transition-colors hover:bg-[#5b5cf0] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {updateTaskMutation.isPending ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                if (!currentTask) return;
                                setTitle(currentTask.title);
                                setDescription(currentTask.description ?? "");
                                setPriority(currentTask.priority);
                                setColumnId(currentTask.columnId);
                                setDeadline(currentTask.deadline ? currentTask.deadline.slice(0, 16) : "");
                                setAssigneeId(currentTask.assigneeId);
                                setSaveError("");
                                setIsEditing(false);
                              }}
                              disabled={updateTaskMutation.isPending}
                              className="rounded-xl border border-[#25314f] px-4 py-2 text-sm font-medium text-[#7c8aa7] transition-colors hover:bg-[#172033] hover:text-[#d6ddf0] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="rounded-xl border border-[#25314f] bg-[#161d2d] px-4 py-2 text-sm font-medium text-[#cbd5e1] transition-colors hover:bg-[#1b2438] hover:text-white"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={onClose}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6b7894] transition-colors hover:bg-[#161d2d] hover:text-[#dbe4ff]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-[#4a49d8] bg-[#0f1729] p-4 shadow-[0_0_0_1px_rgba(109,108,248,0.2)]">
                      {isEditing ? (
                        <textarea
                          value={title}
                          onChange={(event) => {
                            setTitle(event.target.value);
                            if (saveError) setSaveError("");
                          }}
                          rows={2}
                          className="w-full resize-none bg-transparent text-[2rem] font-semibold leading-tight text-[#eef2ff] placeholder:text-[#54637f] focus:outline-none"
                        />
                      ) : (
                        <h2 className="text-[2rem] font-semibold leading-tight text-[#eef2ff]">{currentTask.title}</h2>
                      )}
                    </div>
                  </div>

                  <div className="grid min-h-0 grid-cols-[1.65fr_0.95fr]">
                    <div className="border-r border-[#22304f] px-6 py-5">
                      <div className="space-y-6">
                        <section>
                          <SectionLabel>Description</SectionLabel>
                          <div className="mt-3 overflow-hidden rounded-2xl border border-[#30406a] bg-[#0b1323]">
                            {isEditing && (
                              <div className="flex items-center gap-0.5 border-b border-[#22304f] bg-[#101a2d] px-2 py-1.5">
                                {[
                                  { label: "Bold", Icon: Bold, wrap: ["**", "**"] as [string, string] },
                                  { label: "Italic", Icon: Italic, wrap: ["_", "_"] as [string, string] },
                                  { label: "Underline", Icon: Underline, wrap: ["<u>", "</u>"] as [string, string] },
                                  { label: "Link", Icon: Link2, wrap: ["[", "](url)"] as [string, string] },
                                  { label: "List", Icon: List, wrap: ["\n- ", ""] as [string, string] },
                                  { label: "Code", Icon: Code2, wrap: ["`", "`"] as [string, string] },
                                ].map(({ label, Icon, wrap }) => (
                                  <button
                                    key={label}
                                    type="button"
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      if (descriptionRef.current) {
                                        applyFormat(descriptionRef.current, setDescription, wrap);
                                      }
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7b8aa8] transition-colors hover:bg-[#1a2540] hover:text-[#dbe4ff]"
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                  </button>
                                ))}
                                <span className="ml-auto pr-2 text-[10px] font-medium text-[#4b587c]">Markdown</span>
                              </div>
                            )}

                            {isEditing ? (
                              <textarea
                                ref={descriptionRef}
                                value={description}
                                onChange={(event) => {
                                  setDescription(event.target.value);
                                  if (saveError) setSaveError("");
                                }}
                                rows={10}
                                className="min-h-[250px] w-full resize-none bg-transparent px-4 py-4 text-[15px] leading-8 text-[#e5e7eb] placeholder:text-[#4b587c] focus:outline-none"
                              />
                            ) : (
                              <div className="min-h-[250px] whitespace-pre-wrap px-4 py-4 text-[15px] leading-8 text-[#d1d9eb]">
                                {currentTask.description || "No description yet."}
                              </div>
                            )}
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center justify-between">
                            <SectionLabel>Subtasks</SectionLabel>
                            <span className="text-xs text-[#7c8aa7]">
                              {subtasks.filter((item) => item.completed).length} / {subtasks.length || 0} done
                            </span>
                          </div>
                          <div className="mt-3 rounded-2xl border border-[#22304f] bg-[#0b1323] p-4">
                            <div className="mb-4 flex items-center gap-3">
                              <div className="h-2 flex-1 rounded-full bg-[#1b2742]">
                                <div className="h-full rounded-full bg-[#6d6cf8]" style={{ width: `${completion}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-[#7c8aa7]">{completion}%</span>
                            </div>

                            <div className="space-y-2">
                              {subtasks.map((subtask) => (
                                <div
                                  key={subtask.id}
                                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#121c30]"
                                >
                                  <button
                                    onClick={() =>
                                      updateSubtaskMutation.mutate({
                                        subtaskId: subtask.id,
                                        payload: { completed: !subtask.completed, title: subtask.title },
                                      })
                                    }
                                    className="text-[#6c7a97] transition-colors hover:text-[#10b981]"
                                  >
                                    {subtask.completed ? <CheckSquare className="h-4 w-4 text-[#10b981]" /> : <Square className="h-4 w-4" />}
                                  </button>
                                  <span className={`flex-1 text-sm ${subtask.completed ? "text-[#63728e] line-through" : "text-[#eef2ff]"}`}>
                                    {subtask.title}
                                  </span>
                                  <button
                                    onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                                    className="text-[#4b587c] transition-colors hover:text-[#ef4444]"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-[#33456f] px-3 py-3">
                              <Plus className="h-4 w-4 text-[#586886]" />
                              <input
                                value={newSubtask}
                                onChange={(event) => setNewSubtask(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" && newSubtask.trim()) {
                                    createSubtaskMutation.mutate({ title: newSubtask.trim() });
                                  }
                                }}
                                placeholder="Add subtask... (Enter to add)"
                                className="flex-1 bg-transparent text-sm text-[#eef2ff] placeholder:text-[#4b587c] focus:outline-none"
                              />
                            </div>
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center justify-between">
                            <SectionLabel>Comments</SectionLabel>
                            <span className="rounded-full bg-[#1b2742] px-2.5 py-0.5 text-xs font-semibold text-[#8ea0c4]">
                              {comments.length}
                            </span>
                          </div>

                          {/* Scrollable Comments Container */}
                          <div className="mt-3 max-h-[320px] space-y-3 overflow-y-auto pr-1.5 scrollbar-thin">
                            {comments.length === 0 ? (
                              <div className="flex h-20 items-center justify-center rounded-2xl border border-dashed border-[#22304f] text-xs text-[#546487]">
                                No comments yet. Be the first to comment!
                              </div>
                            ) : (
                              comments.map((comment) => (
                                <div key={comment.id} className="group relative rounded-2xl border border-[#22304f] bg-[#0b1323] p-4 transition-all hover:border-[#2b3d66]">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-white shadow-sm"
                                        style={{ backgroundColor: avatarColor(comment.userFullName) }}
                                      >
                                        {initials(comment.userFullName)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-[#eef2ff]">{comment.userFullName}</p>
                                        <p className="text-[11px] text-[#667796]">{formatRelativeTime(comment.createdAt)}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                                      disabled={deleteCommentMutation.isPending}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-[#667796] hover:text-[#ef4444] hover:bg-[#ef4444]/10 disabled:opacity-50"
                                      title="Delete comment"
                                    >
                                      <TrashIcon className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#ccd6eb]">{comment.content}</p>
                                </div>
                              ))
                            )}
                            <div ref={commentsEndRef} />
                          </div>

                          {/* Comment Input Box */}
                          <div className="mt-3 rounded-2xl border border-[#22304f] bg-[#0b1323] p-4">
                            <textarea
                              value={newComment}
                              onChange={(event) => setNewComment(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey && newComment.trim()) {
                                  event.preventDefault();
                                  createCommentMutation.mutate(newComment.trim());
                                }
                              }}
                              rows={3}
                              placeholder="Write a comment... (Enter to send, Shift+Enter for new line)"
                              className="w-full resize-none bg-transparent text-sm leading-7 text-[#eef2ff] placeholder:text-[#4b587c] focus:outline-none"
                            />
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                disabled={!newComment.trim() || createCommentMutation.isPending}
                                onClick={() => newComment.trim() && createCommentMutation.mutate(newComment.trim())}
                                className="flex items-center gap-2 rounded-xl bg-[#6d6cf8] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5b5cf0] disabled:opacity-50"
                              >
                                <Send className="h-3.5 w-3.5" />
                                {createCommentMutation.isPending ? "Sending..." : "Send"}
                              </button>
                            </div>
                          </div>
                        </section>

                        <section className="border-t border-[#22304f] pt-6">
                          <div className="flex items-center justify-between gap-4">
                            <SectionLabel>Activity</SectionLabel>
                            <div className="flex items-center gap-1 rounded-xl border border-[#22304f] bg-[#10192c] p-1">
                              {[
                                { value: "all", label: "All" },
                                { value: "task", label: "Task" },
                                { value: "comments", label: "Comments" },
                              ].map((option) => {
                                const isActive = activityFilter === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setActivityFilter(option.value as "all" | "task" | "comments")}
                                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                                    style={{
                                      backgroundColor: isActive ? "#27324b" : "transparent",
                                      color: isActive ? "#eef2ff" : "#6f7f9d",
                                    }}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-4 space-y-4">
                            {filteredActivity.map((entry) => {
                              const accent = getActivityAccent(entry.action);
                              return (
                                <div key={entry.id} className="flex items-start gap-3 px-1">
                                  <div className="relative flex flex-col items-center">
                                    <div
                                      className="flex h-5 w-5 items-center justify-center rounded-md border"
                                      style={{ backgroundColor: accent.bg, borderColor: `${accent.color}35` }}
                                    >
                                      <MessageSquare className="h-3 w-3" style={{ color: accent.color }} />
                                    </div>
                                    <div className="mt-1 h-8 w-px bg-[#24314e]" />
                                  </div>

                                  <div
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                                    style={{ backgroundColor: avatarColor(entry.userFullName) }}
                                  >
                                    {initials(entry.userFullName)}
                                  </div>

                                  <div className="min-w-0 flex-1 pt-0.5">
                                    <p className="text-sm leading-6 text-[#71819f]">
                                      <span className="mr-1 font-semibold text-[#dce5f9]">{entry.userFullName}</span>
                                      {formatActivityText(entry)}
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#4b587c]">{formatRelativeTime(entry.createdAt)}</p>
                                  </div>
                                </div>
                              );
                            })}

                            {filteredActivity.length === 0 && (
                              <div className="rounded-2xl border border-[#22304f] bg-[#0b1323] px-4 py-4 text-sm text-[#64748b]">
                                No activity for this filter yet.
                              </div>
                            )}
                          </div>
                        </section>
                      </div>
                    </div>

                    <div className="bg-[#0d1526] px-4 py-5">
                      <div className="space-y-6">
                        <section>
                          <SectionLabel>Status</SectionLabel>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {boardColumns.map((column) => {
                              const statusMeta = STATUS_META[getStatusFromColumnName(column.name)];
                              const isActive = column.id === (columnId ?? currentTask.columnId);
                              return (
                                <button
                                  key={column.id}
                                  type="button"
                                  disabled={!isEditing}
                                  onClick={() => {
                                    setColumnId(column.id);
                                    if (saveError) setSaveError("");
                                  }}
                                  className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all disabled:cursor-default"
                                  style={
                                    isActive
                                      ? {
                                        borderColor: statusMeta.color,
                                        backgroundColor: `${statusMeta.color}26`,
                                        color: "#ffffff",
                                        boxShadow: `inset 0 0 0 1px ${statusMeta.color}55`,
                                      }
                                      : {
                                        borderColor: "#23314f",
                                        backgroundColor: "#10192c",
                                        color: statusMeta.color,
                                      }
                                  }
                                >
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: isActive ? "#ffffff" : statusMeta.color, opacity: isActive ? 0.9 : 1 }}
                                  />
                                  <span className="truncate">{statusMeta.label}</span>
                                  {isActive && <Check className="ml-auto h-3.5 w-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </section>

                        <section>
                          <SectionLabel>Priority</SectionLabel>
                          <div className="mt-3 overflow-hidden rounded-2xl border border-[#22304f] bg-[#10192c] p-1">
                            {Object.entries(PRIORITY_META).map(([value, meta]) => {
                              const isActive = priority === value;
                              const icon =
                                value === "CRITICAL" ? AlertTriangle :
                                  value === "HIGH" ? ChevronDown :
                                    value === "MEDIUM" ? Minus :
                                      ChevronDown;
                              const Icon = icon;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  disabled={!isEditing}
                                  onClick={() => {
                                    setPriority(value as TaskPriority);
                                    if (saveError) setSaveError("");
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors disabled:cursor-default"
                                  style={{
                                    backgroundColor: isActive ? `${meta.color}22` : "transparent",
                                    color: isActive ? meta.color : "#8090af",
                                  }}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  <span className="flex-1 text-left">{meta.label}</span>
                                  {isActive && (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: meta.color }}>
                                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </section>

                        <section>
                          <SectionLabel>Assignees</SectionLabel>
                          <div className="mt-3 overflow-hidden rounded-2xl border border-[#22304f] bg-[#10192c]">
                            {boardMembers.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-[#64748b]">No members available.</p>
                            ) : (
                              boardMembers.map((member) => {
                                const isActive = assigneeId === member.userId;
                                return (
                                  <button
                                    key={member.userId}
                                    type="button"
                                    disabled={!isEditing}
                                    onClick={() => {
                                      setAssigneeId(member.userId);
                                      if (saveError) setSaveError("");
                                    }}
                                    className="flex w-full items-center gap-3 border-b border-[#22304f] px-4 py-3 text-left transition-colors last:border-b-0 disabled:cursor-default"
                                    style={{ backgroundColor: isActive ? "#232c63" : "transparent" }}
                                  >
                                    <div
                                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                      style={{ backgroundColor: avatarColor(member.fullName) }}
                                    >
                                      {initials(member.fullName)}
                                    </div>
                                    <span className={`flex-1 text-sm ${isActive ? "font-semibold text-white" : "text-[#b6c0d6]"}`}>
                                      {member.fullName}
                                    </span>
                                    {isActive && (
                                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#6d6cf8]">
                                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                      </span>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </section>

                        <section>
                          <SectionLabel>Deadline</SectionLabel>
                          <div className="mt-3 rounded-2xl border border-[#22304f] bg-[#10192c] px-3 py-3">
                            {isEditing ? (
                              <input
                                type="datetime-local"
                                value={deadline}
                                onChange={(event) => {
                                  setDeadline(event.target.value);
                                  if (saveError) setSaveError("");
                                }}
                                className="w-full bg-transparent text-sm text-[#eef2ff] focus:outline-none [color-scheme:dark]"
                              />
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-[#d7deef]">
                                <Calendar className="h-4 w-4 text-[#7a8aa8]" />
                                {formatDateTime(currentTask.deadline)}
                              </div>
                            )}
                          </div>
                        </section>

                        <section>
                          <SectionLabel>Labels</SectionLabel>
                          {!isEditing ? (
                            <div className="mt-3 rounded-2xl border border-[#22304f] bg-[#10192c] p-3">
                              {currentTask.labels.length === 0 ? (
                                <p className="text-sm text-[#64748b]">This task has no labels yet.</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {currentTask.labels.map((label) => (
                                    <span
                                      key={label.id}
                                      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                                      style={{
                                        borderColor: `${label.color}66`,
                                        backgroundColor: `${label.color}22`,
                                        color: label.color,
                                      }}
                                    >
                                      {label.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="mt-3 rounded-2xl border border-[#22304f] bg-[#10192c] p-3">
                                <p className="text-[11px] font-medium text-[#8ea0c4]">Attached to this task</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {currentTask.labels.length === 0 ? (
                                    <p className="text-sm text-[#64748b]">No labels attached yet.</p>
                                  ) : (
                                    currentTask.labels.map((label) => (
                                      <span
                                        key={label.id}
                                        className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                                        style={{
                                          borderColor: `${label.color}66`,
                                          backgroundColor: `${label.color}22`,
                                          color: label.color,
                                        }}
                                      >
                                        {label.name}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 rounded-2xl border border-[#22304f] bg-[#10192c] p-3">
                                <p className="text-[11px] font-medium text-[#8ea0c4]">Board labels</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {boardLabels.length === 0 && <p className="text-sm text-[#64748b]">No labels on this board yet.</p>}
                                  {boardLabels.map((label) => {
                                    const isSelected = currentTask.labels.some((item) => item.id === label.id);
                                    return (
                                      <button
                                        key={label.id}
                                        type="button"
                                        onClick={() => {
                                          if (toggleTaskLabelMutation.isPending) return;
                                          setLabelError("");
                                          toggleTaskLabelMutation.mutate(label, {
                                            onError: (error) => {
                                              setLabelError(error instanceof Error ? error.message : "Unable to update labels.");
                                            },
                                          });
                                        }}
                                        disabled={toggleTaskLabelMutation.isPending}
                                        className="rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                                        style={{
                                          borderColor: isSelected ? `${label.color}66` : "#334155",
                                          backgroundColor: isSelected ? `${label.color}26` : "transparent",
                                          color: isSelected ? label.color : "#95a3bf",
                                        }}
                                      >
                                        {label.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <p className="text-xs text-[#64748b]">Click a board label to add or remove it from this task.</p>
                                {toggleTaskLabelMutation.isPending && (
                                  <span className="text-xs text-[#8ea0c4]">Updating labels...</span>
                                )}
                              </div>
                            </>
                          )}
                          {labelError && <p className="mt-2 text-xs text-[#ef4444]">{labelError}</p>}
                        </section>

                        <section className="space-y-3">
                          <div>
                            <SectionLabel>Reporter</SectionLabel>
                            <div className="mt-2 flex items-center gap-2 text-sm text-[#d7deef]">
                              <div
                                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                style={{ backgroundColor: avatarColor(currentTask.reporterName) }}
                              >
                                {initials(currentTask.reporterName)}
                              </div>
                              {currentTask.reporterName}
                            </div>
                          </div>

                          <div>
                            <SectionLabel>Column</SectionLabel>
                            <div className="mt-2 flex items-center gap-2 text-sm text-[#d7deef]">
                              <Clock className="h-4 w-4 text-[#7a8aa8]" />
                              {activeColumn?.name ?? currentTask.columnName}
                            </div>
                          </div>

                          <div>
                            <SectionLabel>Created</SectionLabel>
                            <p className="mt-2 text-sm text-[#7c8aa7]">{formatDateTime(currentTask.createdAt)}</p>
                          </div>

                          <div>
                            <SectionLabel>Last Updated</SectionLabel>
                            <p className="mt-2 text-sm text-[#7c8aa7]">{formatRelativeTime(currentTask.updatedAt)}</p>
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center justify-between border-t border-[#5b4414] bg-[#2b2217] px-6 py-3">
                    <span className={`text-xs font-medium ${saveError ? "text-[#ef4444]" : "text-[#f59e0b]"}`}>
                      {saveError || (hasUnsavedChanges ? "You have unsaved changes" : "No changes yet — make edits above")}
                    </span>
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
                          setSaveError("");
                          setIsEditing(false);
                        }}
                        disabled={updateTaskMutation.isPending}
                        className="text-xs font-medium text-[#a5afc6] underline underline-offset-2 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        disabled={updateTaskMutation.isPending}
                        className="flex items-center gap-2 rounded-xl bg-[#6d6cf8] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5b5cf0] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
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
