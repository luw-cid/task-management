import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus, Pencil, ArrowRight, MessageSquare,
  Bell, Check, ExternalLink, AlertTriangle, Users, Clock, Trash2
} from "lucide-react";
import { notificationsApi } from "../../api/notifications";
import type { Notification } from "../../types";

// ─── Icon config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  TASK_ASSIGNED: { icon: UserPlus,      color: "#6366f1", bg: "#6366f1" },
  TASK_UPDATE:   { icon: Pencil,        color: "#f59e0b", bg: "#f59e0b" },
  TASK_DELETED:  { icon: AlertTriangle, color: "#ef4444", bg: "#ef4444" },
  TASK_COMMENTED:{ icon: MessageSquare, color: "#8b5cf6", bg: "#8b5cf6" },
  BOARD_INVITED: { icon: Users,         color: "#10b981", bg: "#10b981" },
  DEADLINE_REMINDER: { icon: Clock,      color: "#ec4899", bg: "#ec4899" },
  SYSTEM_ALERT:  { icon: Bell,          color: "#3b82f6", bg: "#3b82f6" },
};

const DEFAULT_TYPE_CONFIG = { icon: Bell, color: "#6366f1", bg: "#6366f1" };

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll(0, 50),
    enabled: isOpen,
    refetchInterval: isOpen ? 5000 : undefined,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const notifs = notificationsQuery.data ?? [];
  const unreadCount = notifs.filter(n => !n.isRead).length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markAsReadMutation.mutateAsync(notif.id);
    }
    onClose();
    if (notif.type === "BOARD_INVITED" && notif.referenceId) {
      navigate(`/boards/${notif.referenceId}`);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const formatNotifTime = (timeStr: string) => {
    try {
      return formatDistanceToNow(new Date(timeStr), { addSuffix: true });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          className="absolute right-0 top-full mt-2 z-50 w-[380px] rounded-xl border border-border bg-card shadow-2xl shadow-black/40 overflow-hidden"
          style={{ maxHeight: 500 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border bg-card">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white tabular-nums">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="h-3 w-3" />
              Mark all as read
            </button>
          </div>

          {/* ── Scrollable list ──────────────────────────────────────────────── */}
          <div className="overflow-y-auto bg-card" style={{ maxHeight: 392 }}>
            {notificationsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50">
                  <Bell className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifs.map((n, i) => {
                  const cfg = TYPE_CONFIG[n.type] || DEFAULT_TYPE_CONFIG;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      className={`group w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/30 relative ${
                        !n.isRead ? "bg-primary/[0.06]" : ""
                      } ${i !== notifs.length - 1 ? "border-b border-border/50" : ""}`}
                    >
                      {/* Interactive area */}
                      <button
                        onClick={() => handleNotifClick(n)}
                        className="flex-1 flex items-start gap-3 text-left focus:outline-none min-w-0"
                      >
                        {/* Type icon */}
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: cfg.bg + "20" }}
                        >
                          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <p className={`text-sm leading-snug ${n.isRead ? "font-medium text-muted-foreground" : "font-semibold text-foreground"}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pr-6">
                            {n.message}
                          </p>
                          <p className={`text-[11px] mt-1 tabular-nums ${n.isRead ? "text-muted-foreground/50" : "text-primary/70 font-medium"}`}>
                            {formatNotifTime(n.createdAt)}
                          </p>
                        </div>
                      </button>

                      {/* Unread dot / Delete button area */}
                      <div className="flex-shrink-0 mt-1 w-6 flex items-center justify-center h-9">
                        <button
                          onClick={(e) => handleDelete(e, n.id)}
                          className="hidden group-hover:flex items-center justify-center h-6 w-6 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {!n.isRead && (
                          <span className="group-hover:hidden h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────────────────── */}
          <div className="border-t border-border px-4 py-3 bg-card">
            <button
              onClick={() => { onClose(); navigate("/notifications"); }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/70 transition-colors"
            >
              View all notifications
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
