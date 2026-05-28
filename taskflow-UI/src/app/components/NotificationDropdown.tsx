import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus, Pencil, ArrowRight, MessageSquare,
  Bell, Check, ExternalLink,
} from "lucide-react";

// ─── Types & data ─────────────────────────────────────────────────────────────

type NotifType = "TASK_ASSIGNED" | "TASK_UPDATED" | "TASK_MOVED" | "COMMENT_ADDED";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const SEED: Notif[] = [
  {
    id: "n1",
    type: "TASK_ASSIGNED",
    title: "New task assigned to you",
    message: "Marcus Webb assigned you to \"Auth system v2 — OAuth + SSO\" in Engineering Sprint.",
    time: "2 minutes ago",
    read: false,
  },
  {
    id: "n2",
    type: "COMMENT_ADDED",
    title: "New comment on your task",
    message: "Sarah Chen commented: \"Should we add a date range filter to the burndown chart as well?\"",
    time: "15 minutes ago",
    read: false,
  },
  {
    id: "n3",
    type: "TASK_MOVED",
    title: "Task moved to In Review",
    message: "Emily Davis moved \"Mobile responsive fixes\" from In Progress to In Review.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "n4",
    type: "TASK_UPDATED",
    title: "Priority changed to Urgent",
    message: "Tom Wilson updated \"Fix login redirect on mobile Safari\" — priority raised from Medium to Urgent.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "n5",
    type: "TASK_ASSIGNED",
    title: "New task assigned to you",
    message: "Alex Rivera assigned you to \"Improve search result ranking\" in Product Roadmap.",
    time: "3 hours ago",
    read: false,
  },
  {
    id: "n6",
    type: "TASK_UPDATED",
    title: "Subtasks added",
    message: "Raj Patel added 3 new subtasks to \"Setup CI/CD pipeline\" in Engineering Sprint.",
    time: "5 hours ago",
    read: true,
  },
];

// ─── Icon config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  TASK_ASSIGNED: { icon: UserPlus,      color: "#6366f1", bg: "#6366f1" },
  TASK_UPDATED:  { icon: Pencil,        color: "#f59e0b", bg: "#f59e0b" },
  TASK_MOVED:    { icon: ArrowRight,    color: "#10b981", bg: "#10b981" },
  COMMENT_ADDED: { icon: MessageSquare, color: "#8b5cf6", bg: "#8b5cf6" },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifs, setNotifs] = useState<Notif[]>(SEED);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter(n => !n.read).length;

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

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }
  function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

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
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border">
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
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="h-3 w-3" />
          Mark all as read
        </button>
      </div>

      {/* ── Scrollable list ──────────────────────────────────────────────── */}
      <div className="overflow-y-auto" style={{ maxHeight: 392 }}>
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50">
              <Bell className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifs.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type];
              const Icon = cfg.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/30 ${
                    !n.read ? "bg-primary/[0.06]" : ""
                  } ${i !== notifs.length - 1 ? "border-b border-border/50" : ""}`}
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
                    <p className={`text-sm leading-snug ${n.read ? "font-medium text-muted-foreground" : "font-semibold text-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <p className={`text-[11px] mt-1 tabular-nums ${n.read ? "text-muted-foreground/50" : "text-primary/70 font-medium"}`}>
                      {n.time}
                    </p>
                  </div>

                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-2.5 w-4 flex justify-center">
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="border-t border-border px-4 py-3">
        <button className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/70 transition-colors">
          View all notifications
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
