import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, Mail, Lock, Eye, EyeOff, User, ArrowRight,
  CheckCircle2, Circle, Clock, Plus, MoreHorizontal,
  Search, Bell, Settings, ChevronDown, ChevronRight, Calendar,
  Home, ClipboardList, Users, LayoutGrid, TrendingUp, AlertTriangle,
  ExternalLink, Hash, ChevronLeft, LogOut, Check, Trash2, UserPlus, Pencil, MessageSquare,
  Menu, X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TaskDetailPanel } from "./components/TaskDetailPanel";
import { MyTasksView } from "./components/MyTasksView";
import { NotificationDropdown } from "./components/NotificationDropdown";
import { SettingsPage } from "./components/SettingsPage";
import { BoardMembersModal } from "./components/BoardMembersModal";
import { BoardDetail, type BoardColumn } from "./components/BoardDetail";
import { CreateBoardModal } from "./components/CreateBoardModal";
import { CreateTaskModal } from "./components/CreateTaskModal";
import { InviteMemberModal } from "./components/InviteMemberModal";
import { ManageLabelsModal } from "./components/ManageLabelsModal";
import { BoardSettingsModal } from "./components/BoardSettingsModal";
import { NoNotificationsState } from "./components/EmptyStates";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { api, authApi, boardsApi, clearAuthTokens, columnsApi, getAccessToken, labelsApi, notificationsApi, setAccessToken, tasksApi, usersApi } from "../api";
import type { Column, CreateBoardRequest, LoginRequest, RegisterRequest, Task, TaskStatus, UserProfile } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthView = "login" | "signup";
type Priority = "low" | "medium" | "high" | "urgent";
type NavItem = "home" | "tasks" | "notifications" | "settings";
type AppView = "home" | "tasks" | "board" | "notifications" | "settings";

const queryClient = new QueryClient();

const ROUTES: Record<AppView, string> = {
  home: "/",
  tasks: "/tasks",
  board: "/boards",
  notifications: "/notifications",
  settings: "/profile",
};

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

function getBoardRoute(boardId: number | string) {
  return `/boards/${boardId}`;
}

function getViewFromPath(pathname: string): AppView {
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/boards/")) return "board";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/profile") || pathname.startsWith("/settings")) return "settings";
  return "home";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAvatarColor(name: string) {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
  return colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}
function getPasswordStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return [
    { score: 1, label: "Weak", color: "#ef4444" },
    { score: 2, label: "Fair", color: "#f59e0b" },
    { score: 3, label: "Good", color: "#6366f1" },
    { score: 4, label: "Strong", color: "#10b981" },
  ][s - 1] || { score: 0, label: "", color: "" };
}

// ─── Dashboard Data ───────────────────────────────────────────────────────────

const MY_BOARDS = [
  { id: "b1", name: "Product Roadmap",   color: "#6366f1", members: 8 },
  { id: "b2", name: "Design System",     color: "#10b981", members: 5 },
  { id: "b3", name: "Marketing Q2",      color: "#f59e0b", members: 4 },
  { id: "b4", name: "Engineering Sprint",color: "#8b5cf6", members: 12 },
  { id: "b5", name: "Customer Feedback", color: "#06b6d4", members: 3 },
];

const RECENT_BOARDS = [
  { id: "b1", name: "Product Roadmap",   description: "Track features, milestones, and releases for the core product.",                         color: "#6366f1", members: ["Alice Johnson","Marcus Webb","Priya Nair","Tom Wilson"],         tasks: 34, updated: "2 hours ago", progress: 68 },
  { id: "b2", name: "Design System",     description: "Component library, tokens, and design guidelines for the app.",                           color: "#10b981", members: ["Sarah Chen","Emily Davis","Marcus Webb"],                        tasks: 18, updated: "Yesterday",  progress: 82 },
  { id: "b4", name: "Engineering Sprint",description: "Sprint 24.2 — backend infrastructure and API performance improvements.",                   color: "#8b5cf6", members: ["Tom Wilson","Alex Rivera","Priya Nair","Raj Patel","Sam Lee"], tasks: 47, updated: "3 hours ago", progress: 41 },
];

const MY_TASKS = [
  { id: "t1", title: "Finalize onboarding flow wireframes",      board: "Product Roadmap",    boardColor: "#6366f1", priority: "high"   as Priority, deadline: "2026-05-29", assignee: "Alice Johnson", done: false },
  { id: "t2", title: "Write API docs for auth endpoints",         board: "Engineering Sprint", boardColor: "#8b5cf6", priority: "medium" as Priority, deadline: "2026-05-30", assignee: "Alice Johnson", done: false },
  { id: "t3", title: "Review button component variants",          board: "Design System",      boardColor: "#10b981", priority: "low"    as Priority, deadline: "2026-05-31", assignee: "Alice Johnson", done: false },
  { id: "t4", title: "Set up staging environment CI/CD",          board: "Engineering Sprint", boardColor: "#8b5cf6", priority: "urgent" as Priority, deadline: "2026-05-27", assignee: "Alice Johnson", done: false },
  { id: "t5", title: "Collect Q2 user interview results",         board: "Customer Feedback",  boardColor: "#06b6d4", priority: "medium" as Priority, deadline: "2026-06-02", assignee: "Alice Johnson", done: true  },
];

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string }> = {
  low:    { bg: "bg-[#94a3b8]/10", text: "text-[#94a3b8]" },
  medium: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]" },
  high:   { bg: "bg-[#6366f1]/10", text: "text-[#6366f1]" },
  urgent: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]" },
};

type DashboardBoard = {
  id: number;
  name: string;
  description: string;
  color: string;
  members: string[];
  tasks: number;
  updated: string;
  progress: number;
  memberCount: number;
};

type DashboardTask = {
  id: string;
  boardId: number;
  title: string;
  board: string;
  boardColor: string;
  priority: Priority;
  deadline: string;
  assignee: string;
  done: boolean;
};

function getBoardColor(boardId: number) {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#ec4899"];
  return colors[boardId % colors.length];
}

function toPriority(priority: Task["priority"]): Priority {
  switch (priority) {
    case "LOW":
      return "low";
    case "MEDIUM":
      return "medium";
    case "HIGH":
      return "high";
    case "CRITICAL":
      return "urgent";
    default:
      return "medium";
  }
}

function formatUpdated(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusFromColumnName(name: string): TaskStatus {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes("review")) return "IN_REVIEW";
  if (normalized.includes("progress") || normalized.includes("doing")) return "IN_PROGRESS";
  if (normalized.includes("done") || normalized.includes("complete")) return "DONE";
  return "TODO";
}

function mapTaskToBoardColumnTask(task: Task): BoardColumn["tasks"][number] {
  return {
    id: String(task.id),
    type: task.type,
    title: task.title,
    description: task.description ?? "",
    labels: task.labels.map((label) => ({
      text: label.name,
      color: label.color,
    })),
    assignees: task.assigneeName ? [task.assigneeName] : [],
    priority: toPriority(task.priority),
    deadline: task.deadline ?? new Date().toISOString(),
    subtasks: {
      done: task.subtaskCompleted,
      total: task.subtaskTotal,
    },
    attachments: 0,
    comments: 0,
  };
}

function buildBoardColumns(columns: Column[], tasks: Task[]): BoardColumn[] {
  return columns.map((column) => ({
    id: String(column.id),
    title: column.name,
    dotColor: getBoardColor(column.id),
    isDone: getStatusFromColumnName(column.name) === "DONE",
    tasks: tasks
      .filter((task) => task.columnId === column.id)
      .map(mapTaskToBoardColumnTask),
  }));
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none" tabIndex={-1}>
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  const s = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1">
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ backgroundColor: i <= s.score ? s.color : "#334155" }} />
        ))}
      </div>
      {s.label && <p className="text-xs" style={{ color: s.color }}>{s.label} password</p>}
    </div>
  );
}

function KanbanIllustration() {
  const cols = [
    { items: 3, colors: ["#6366f1","#f59e0b","#ef4444"] },
    { items: 2, colors: ["#6366f1","#10b981"] },
    { items: 2, colors: ["#f59e0b","#6366f1"] },
    { items: 1, colors: ["#10b981"] },
  ];
  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      <div className="absolute inset-0 rounded-2xl bg-[#6366f1]/10 blur-3xl scale-110 pointer-events-none" />
      <div className="relative rounded-xl border border-white/10 bg-[#1e293b]/80 backdrop-blur-sm shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0f172a]/60">
          <div className="flex gap-1.5">
            {["#ef4444","#f59e0b","#10b981"].map((c) => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c+"b0" }} />)}
          </div>
          <div className="flex-1 mx-3 h-4 rounded bg-white/5 text-[9px] text-white/30 flex items-center px-2">app.taskflow.io/board</div>
        </div>
        <div className="grid grid-cols-4 gap-2 p-3">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                <div className="h-1.5 w-10 rounded-full bg-white/20" />
              </div>
              {Array.from({ length: col.items }).map((_, ii) => (
                <div key={ii} className="rounded-md border border-white/8 bg-[#0f172a]/60 p-1.5 flex flex-col gap-1">
                  <div className="h-1.5 rounded-full bg-white/25" style={{ width: `${70 + ii * 15}%` }} />
                  <div className="h-1 rounded-full bg-white/12" style={{ width: `${50 + ii * 10}%` }} />
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="h-1.5 w-6 rounded-full opacity-70" style={{ backgroundColor: col.colors[ii] }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.colors[ii] + "99" }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthPanel({
  view,
  onSwitch,
  onSignIn,
}: {
  view: AuthView;
  onSwitch: () => void;
  onSignIn: (payload: LoginRequest | RegisterRequest) => Promise<void>;
}) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPw, setSignupPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showSPw, setShowSPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [confirmErr, setConfirmErr] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const base = "w-full rounded-lg border border-border bg-input-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all";

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await onSignIn({
        email: loginEmail,
        password: loginPw,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (signupPw !== confirmPw) {
      setConfirmErr("Passwords do not match");
      return;
    }

    setConfirmErr("");
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await onSignIn({
        email: signupEmail,
        password: signupPw,
        fullName: name,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30"><Zap className="h-5 w-5 text-white" /></div>
        <span className="text-xl font-semibold text-foreground tracking-tight">TaskFlow</span>
      </div>
      {view === "login" ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type="email" placeholder="you@company.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={base} /></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
                <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot password?</button>
              </div>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type={showLoginPw ? "text" : "password"} placeholder="Enter your password" value={loginPw} onChange={(e) => setLoginPw(e.target.value)} className={base} /><div className="absolute right-3 top-1/2 -translate-y-1/2"><EyeToggle show={showLoginPw} onToggle={() => setShowLoginPw(!showLoginPw)} /></div></div>
            </div>
            {submitError && <p className="text-xs text-[#ef4444]">{submitError}</p>}
            <button disabled={isSubmitting} type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.99] transition-all shadow-lg shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? "Signing In..." : <>Sign In <ArrowRight className="h-4 w-4" /></>}</button>
          </form>
          <div className="flex items-center gap-3 my-6"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
          <p className="text-center text-sm text-muted-foreground">Don{"'"}t have an account?{" "}<button onClick={onSwitch} className="text-primary hover:text-primary/80 font-medium transition-colors">Sign up</button></p>
        </>
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-1">Create an account</h1>
            <p className="text-sm text-muted-foreground">Start managing your team{"'"}s work</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleRegisterSubmit}>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-foreground">Full name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input placeholder="Alex Rivera" value={name} onChange={(e) => setName(e.target.value)} className={base} /></div></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-foreground">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type="email" placeholder="you@company.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className={base} /></div></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-foreground">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type={showSPw ? "text" : "password"} placeholder="Create a password" value={signupPw} onChange={(e) => setSignupPw(e.target.value)} className={base} /><div className="absolute right-3 top-1/2 -translate-y-1/2"><EyeToggle show={showSPw} onToggle={() => setShowSPw(!showSPw)} /></div></div><PasswordStrengthBar password={signupPw} /></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-foreground">Confirm password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type={showCPw ? "text" : "password"} placeholder="Repeat your password" value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); if (confirmErr) setConfirmErr(""); }} className={`${base} ${confirmErr ? "border-[#ef4444]" : ""}`} /><div className="absolute right-3 top-1/2 -translate-y-1/2"><EyeToggle show={showCPw} onToggle={() => setShowCPw(!showCPw)} /></div></div>{confirmErr && <p className="text-xs text-[#ef4444]">{confirmErr}</p>}</div>
            {submitError && <p className="text-xs text-[#ef4444]">{submitError}</p>}
            <button disabled={isSubmitting} type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.99] transition-all shadow-lg shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? "Creating Account..." : <>Create Account <ArrowRight className="h-4 w-4" /></>}</button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">Already have an account?{" "}<button onClick={onSwitch} className="text-primary hover:text-primary/80 font-medium transition-colors">Sign in</button></p>
        </>
      )}
    </div>
  );
}

function LoginPage({
  view,
  onSignIn,
}: {
  view: AuthView;
  onSignIn: (payload: LoginRequest | RegisterRequest) => Promise<void>;
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex bg-background font-['Inter']">
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0f1e]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#6366f1]/15 blur-[80px]" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-[#8b5cf6]/10 blur-[80px]" />
        <div className="relative z-10 flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/40"><Zap className="h-5 w-5 text-white" /></div><span className="text-xl font-semibold text-white tracking-tight">TaskFlow</span></div>
        <div className="relative z-10 flex flex-col gap-10 -mt-12">
          <div className="max-w-sm"><h2 className="text-3xl xl:text-4xl font-semibold text-white leading-tight">Manage your team{"'"}s work, <span className="text-primary">all in one place</span></h2><p className="mt-4 text-[#94a3b8] text-base leading-relaxed">Plan sprints, track progress, and ship faster with a board your whole team loves.</p></div>
          <KanbanIllustration />
          <div className="flex flex-col gap-3">{["Real-time collaboration across your team","Customizable workflows for any project type","Insights and reporting built right in"].map((t) => (<div key={t} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" /><span className="text-sm text-[#94a3b8]">{t}</span></div>))}</div>
        </div>
        <div className="relative z-10"><p className="text-xs text-[#475569]">Trusted by 12,000+ teams at companies like Vercel, Linear, and Stripe.</p></div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-card lg:border-l border-border">
        <AuthPanel
          view={view}
          onSwitch={() => navigate(view === "login" ? "/register" : "/login")}
          onSignIn={onSignIn}
        />
        <p className="mt-10 text-xs text-muted-foreground text-center">By continuing, you agree to our{" "}<button className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</button>{" "}and{" "}<button className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</button></p>
      </div>
    </div>
  );
}

// ─── Sidebar + shared layout ──────────────────────────────────────────────────

function Sidebar({
  active,
  collapsed,
  onToggle,
  onNav,
  boards,
  currentUser,
  unreadNotificationsCount,
  onOpenBoard,
  onCreateBoard,
  onLogout,
  isMobileDrawer = false,
}: {
  active: NavItem;
  collapsed: boolean;
  onToggle: () => void;
  onNav: (n: NavItem) => void;
  boards: DashboardBoard[];
  currentUser: UserProfile | null;
  unreadNotificationsCount: number;
  onOpenBoard: (boardId: number) => void;
  onCreateBoard: () => void;
  onLogout: () => void;
  isMobileDrawer?: boolean;
}) {
  const [boardsOpen, setBoardsOpen] = useState(true);
  const isEffectiveCollapsed = isMobileDrawer ? false : collapsed;

  const navItems: { id: NavItem; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "home",          label: "Home",          icon: Home },
    { id: "tasks",         label: "My Tasks",      icon: ClipboardList },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadNotificationsCount },
    { id: "settings",      label: "Settings",      icon: Settings },
  ];
  const labelClass = `overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${
    isEffectiveCollapsed ? "max-w-0 opacity-0 translate-x-1" : "max-w-[180px] opacity-100 translate-x-0"
  }`;
  const userName = currentUser?.fullName ?? "Your Profile";
  const userEmail = currentUser?.email ?? "";
  const userInitials = getInitials(userName).slice(0, 2) || "TF";

  return (
    <aside
      className={
        isMobileDrawer
          ? "flex h-full w-full flex-col bg-card"
          : `hidden md:flex relative h-full flex-col border-r border-border bg-card transition-[width,min-width] duration-300 ease-out ${
              collapsed ? "w-[72px] min-w-[72px]" : "w-[260px] min-w-[260px]"
            }`
      }
    >
      {!isMobileDrawer && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-24 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg shadow-black/20 hover:bg-secondary hover:text-foreground transition-all"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      )}

      <div className={`flex h-[72px] items-center gap-2.5 border-b border-border px-4 transition-all duration-300 ${
        isEffectiveCollapsed ? "justify-center" : ""
      }`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow shadow-primary/30"><Zap className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
        <span className={`text-lg font-semibold text-foreground tracking-tight ${labelClass}`}>TaskFlow</span>
      </div>
      <div className="border-b border-border px-3 py-4">
        <button
          onClick={() => onNav("settings")}
          className={
            isEffectiveCollapsed
              ? "group grid h-10 w-full place-items-center rounded-lg px-0 hover:bg-secondary/40 transition-colors"
              : "group flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary/40 transition-colors"
          }
          title={isEffectiveCollapsed ? userName : undefined}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white flex-shrink-0 overflow-hidden" style={{ backgroundColor: "#6366f1" }}>
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={userName} className="h-full w-full object-cover" />
            ) : (
              userInitials
            )}
          </div>
          <div className={`flex-1 text-left min-w-0 ${labelClass}`}><p className="text-sm font-medium text-foreground truncate">{userName}</p><p className="text-xs text-muted-foreground truncate">{userEmail}</p></div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-all duration-300 ${isEffectiveCollapsed ? "w-0 opacity-0" : "opacity-100"}`} />
        </button>
      </div>
      <nav className={`px-3 py-3 flex flex-col ${isEffectiveCollapsed ? "gap-2" : "gap-0.5"}`}>
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              title={isEffectiveCollapsed ? label : undefined}
              className={`relative w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              } ${isEffectiveCollapsed ? "h-10 justify-center px-0 py-0" : "px-3 py-2.5"}`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span className={`flex-1 text-left ${labelClass}`}>{label}</span>
              {badge != null && (
                <span className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white px-1.5 ${
                  isEffectiveCollapsed ? "absolute -right-1 top-1" : ""
                }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="px-3 mt-2 flex-1 overflow-y-auto overflow-x-hidden">
        <button
          onClick={() => !isEffectiveCollapsed && setBoardsOpen(!boardsOpen)}
          className={`w-full flex items-center mb-1 text-muted-foreground ${isEffectiveCollapsed ? "h-9 justify-center px-0" : "justify-between px-3 py-2"}`}
          title={isEffectiveCollapsed ? "My Boards" : undefined}
        >
          <span className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground ${labelClass}`}>My Boards</span>
          {isEffectiveCollapsed ? (
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          ) : (
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-all duration-300 ${boardsOpen ? "" : "-rotate-90"}`} />
          )}
        </button>
        {(boardsOpen || isEffectiveCollapsed) && (
          <div className={`flex flex-col ${isEffectiveCollapsed ? "gap-3 pt-2" : "gap-0.5"}`}>
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => onOpenBoard(board.id)}
                title={isEffectiveCollapsed ? board.name : undefined}
                className={`w-full flex items-center gap-2.5 rounded-lg hover:bg-secondary/40 transition-colors group ${
                  isEffectiveCollapsed ? "h-8 justify-center px-0 py-0" : "px-3 py-2"
                }`}
              >
                <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: board.color }} />
                <span className={`flex-1 text-left text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate ${labelClass}`}>{board.name}</span>
                <div className={`flex items-center gap-1 text-xs text-muted-foreground/60 ${labelClass}`}><Users className="h-3 w-3" /><span>{board.memberCount}</span></div>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={onCreateBoard}
          className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-2 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all ${
            isEffectiveCollapsed ? "h-10 py-0" : "py-2.5"
          }`}
          title={isEffectiveCollapsed ? "Create Board" : undefined}
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className={labelClass}>Create Board</span>
        </button>
      </div>
      <div className="px-3 py-4 border-t border-border mt-2">
        <button
          onClick={onLogout}
          className={`w-full flex items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-all ${
            isEffectiveCollapsed ? "h-10 py-0" : "py-2.5"
          }`}
          title={isEffectiveCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className={labelClass}>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number; icon: React.ElementType; color: string; sub: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: color + "1a" }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-3xl font-semibold text-foreground tracking-tight">{value}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function BoardCard({ board, onClick }: { board: DashboardBoard; onClick: () => void }) {
  return (
    <div onClick={onClick} className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-border/60 hover:shadow-lg hover:shadow-black/20 transition-all cursor-pointer">
      <div className="h-1.5 w-full" style={{ backgroundColor: board.color }} />
      <div className="flex flex-col gap-4 p-5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: board.color + "22" }}><LayoutGrid className="h-4 w-4" style={{ color: board.color }} /></div>
            <div><h3 className="text-sm font-semibold text-foreground">{board.name}</h3><p className="text-xs text-muted-foreground mt-0.5">{board.tasks} tasks</p></div>
          </div>
          <button className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/50 transition-all"><MoreHorizontal className="h-4 w-4" /></button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{board.description}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Progress</span><span className="text-xs font-medium text-foreground">{board.progress}%</span></div>
          <div className="h-1.5 w-full rounded-full bg-secondary/60"><div className="h-full rounded-full transition-all" style={{ width: `${board.progress}%`, backgroundColor: board.color }} /></div>
        </div>
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex -space-x-2">
            {board.members.slice(0, 4).map((m) => (<div key={m} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-semibold text-white" style={{ backgroundColor: getAvatarColor(m) }} title={m}>{getInitials(m)}</div>))}
            {board.members.length > 4 && (<div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[9px] font-medium text-muted-foreground">+{board.members.length - 4}</div>)}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{board.updated}</div>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onOpen }: { task: DashboardTask; onOpen?: (task: DashboardTask) => void }) {
  const [done, setDone] = useState(task.done);
  const p = PRIORITY_STYLES[task.priority];
  const isOverdue = !done && new Date(task.deadline) < new Date();
  return (
    <div
      onClick={() => onOpen?.(task)}
      className={`group flex items-center gap-4 rounded-lg px-4 py-3 hover:bg-secondary/20 transition-colors ${done ? "opacity-50" : ""} ${onOpen ? "cursor-pointer" : ""}`}
    >
      <button onClick={(event) => { event.stopPropagation(); setDone(!done); }} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">{done ? <CheckCircle2 className="h-4 w-4 text-[#10b981]" /> : <Circle className="h-4 w-4" />}</button>
      <div className="flex-1 min-w-0"><p className={`text-sm font-medium truncate ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p><div className="flex items-center gap-1.5 mt-0.5"><div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.boardColor }} /><span className="text-xs text-muted-foreground truncate">{task.board}</span></div></div>
      <span className={`hidden sm:inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium flex-shrink-0 ${p.bg} ${p.text}`}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
      <div className={`hidden md:flex items-center gap-1.5 text-xs flex-shrink-0 ${isOverdue ? "text-[#ef4444]" : "text-muted-foreground"}`}>{isOverdue && <AlertTriangle className="h-3 w-3" />}<Calendar className="h-3 w-3" /><span>{new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
      <div className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: getAvatarColor(task.assignee) }} title={task.assignee}>{getInitials(task.assignee)}</div>
      <button onClick={(event) => event.stopPropagation()} className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary/50 transition-all flex-shrink-0"><MoreHorizontal className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function DashboardHome({
  boards,
  tasks,
  onOpenBoard,
  onOpenTask,
  onCreateTask,
}: {
  boards: DashboardBoard[];
  tasks: DashboardTask[];
  onOpenBoard: (boardId: number) => void;
  onOpenTask: (task: DashboardTask) => void;
  onCreateTask: () => void;
}) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.done).length;
  const inProgressTasks = tasks.filter((task) => !task.done).length;
  const overdueTasks = tasks.filter((task) => !task.done && new Date(task.deadline) < new Date()).length;
  return (
    <div className="flex flex-col gap-5 sm:gap-8 px-3 sm:px-8 py-4 sm:py-8 w-full max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-xl sm:text-2xl font-semibold text-foreground">Good morning 👋</h1><p className="mt-1 text-xs sm:text-sm text-muted-foreground">{today}</p></div>
        <button onClick={onCreateTask} className="flex items-center gap-2 rounded-lg bg-primary px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow shadow-primary/20 flex-shrink-0"><Plus className="h-4 w-4" /><span>New Task</span></button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard label="Total Tasks"  value={totalTasks} icon={Hash}          color="#6366f1" sub="Across all boards" />
        <StatCard label="In Progress"  value={inProgressTasks}  icon={Clock}         color="#f59e0b" sub="Active right now" />
        <StatCard label="Completed"    value={completedTasks} icon={CheckCircle2}  color="#10b981" sub="Finished tasks" />
        <StatCard label="Overdue"      value={overdueTasks}  icon={AlertTriangle} color="#ef4444" sub="Needs attention" />
      </div>
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-foreground">Recent Boards</h2><button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">View all <ExternalLink className="h-3.5 w-3.5" /></button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => <BoardCard key={board.id} board={board} onClick={() => onOpenBoard(board.id)} />)}
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-foreground">My Tasks</h2><div className="flex items-center gap-2"><button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"><TrendingUp className="h-3.5 w-3.5" />Priority<ChevronDown className="h-3 w-3" /></button><button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">View all <ExternalLink className="h-3.5 w-3.5" /></button></div></div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-2.5 border-b border-border bg-secondary/10">
            <span className="text-xs font-medium text-muted-foreground pl-8">Task</span>
            <span className="text-xs font-medium text-muted-foreground w-16 text-center">Priority</span>
            <span className="text-xs font-medium text-muted-foreground w-24 text-center">Deadline</span>
            <span className="text-xs font-medium text-muted-foreground w-8 text-center">Who</span>
            <span className="w-6" />
          </div>
          <div className="divide-y divide-border/50">{tasks.map((task) => <TaskRow key={task.id} task={task} onOpen={onOpenTask} />)}</div>
          <div className="border-t border-border/50"><button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors"><Plus className="h-4 w-4" />Add a task</button></div>
        </div>
      </section>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function AuthenticatedLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { boardId = "project-alpha" } = useParams();
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedTaskBoardId, setSelectedTaskBoardId] = useState<number | null>(null);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [createTaskOpen,  setCreateTaskOpen]  = useState(false);
  const [inviteMemberOpen,   setInviteMemberOpen]   = useState(false);
  const [manageLabelsOpen,   setManageLabelsOpen]   = useState(false);
  const [boardSettingsOpen,  setBoardSettingsOpen]  = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const boardIdNumber = Number(boardId);

  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: boardsApi.getMyBoards,
  });
  const currentUserQuery = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: usersApi.getMe,
  });

  const unreadNotificationsCountQuery = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 5000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll(0, 50),
    refetchInterval: 5000,
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

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const handleNotifClick = async (notif: any) => {
    if (!notif.isRead) {
      await markAsReadMutation.mutateAsync(notif.id);
    }
    if (notif.type === "BOARD_INVITED" && notif.referenceId) {
      navigate(`/boards/${notif.referenceId}`);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(id);
  };

  const formatNotifTime = (timeStr: string) => {
    try {
      return formatDistanceToNow(new Date(timeStr), { addSuffix: true });
    } catch (e) {
      return timeStr;
    }
  };

  const boards = boardsQuery.data ?? [];
  const fallbackBoard = boards[0] ?? null;
  const currentBoard = boards.find((item) => item.id === boardIdNumber) ?? fallbackBoard;
  const activeBoardId = currentBoard?.id ?? null;

  const boardColumnsQuery = useQuery({
    queryKey: ["board-columns", activeBoardId],
    queryFn: () => columnsApi.getByBoard(activeBoardId!),
    enabled: activeBoardId !== null,
  });

  const boardTasksQuery = useQuery({
    queryKey: ["board-tasks", activeBoardId],
    queryFn: () => tasksApi.getByBoard(activeBoardId!),
    enabled: activeBoardId !== null,
  });

  const boardLabelsQuery = useQuery({
    queryKey: ["board-labels", activeBoardId],
    queryFn: () => labelsApi.getByBoard(activeBoardId!),
    enabled: activeBoardId !== null,
  });

  const allTasksQuery = useQuery({
    queryKey: ["all-board-tasks", boards.map((item) => item.id)],
    enabled: boards.length > 0,
    queryFn: async () => {
      const taskGroups = await Promise.all(boards.map((item) => tasksApi.getByBoard(item.id)));
      return taskGroups.flat();
    },
  });

  const myTasksQuery = useQuery({
    queryKey: ["my-tasks"],
    queryFn: () => tasksApi.getMyTasks(),
    retry: false,
  });

  const createBoardMutation = useMutation({
    mutationFn: (payload: CreateBoardRequest) => boardsApi.createBoard(payload),
    onSuccess: async (board) => {
      await queryClient.invalidateQueries({ queryKey: ["boards"] });
      setCreateBoardOpen(false);
      navigate(getBoardRoute(board.id));
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: ({ boardId, name }: { boardId: number; name: string }) => columnsApi.create(boardId, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board-columns", activeBoardId] });
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({ columnId, name }: { columnId: number; name: string }) => {
      if (!activeBoardId) throw new Error("No active board selected");
      return columnsApi.update(activeBoardId, columnId, { name });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["board-columns", activeBoardId] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || "Không thể cập nhật tên cột";
      alert(msg);
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (columnId: number) => {
      if (!activeBoardId) throw new Error("No active board selected");
      return columnsApi.delete(activeBoardId, columnId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["board-columns", activeBoardId] }),
        queryClient.invalidateQueries({ queryKey: ["board-tasks", activeBoardId] }),
      ]);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || "Không thể xóa cột";
      alert(msg);
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({
      boardId,
      taskId,
      targetColumnId,
      columns,
    }: {
      boardId: number;
      taskId: string;
      targetColumnId: string;
      columns: Column[];
    }) => {
      const targetColumn = columns.find((column) => String(column.id) === targetColumnId);
      if (!targetColumn) {
        throw new Error("Target column not found");
      }

      return tasksApi.move(boardId, Number(taskId), {
        columnId: targetColumn.id,
        status: getStatusFromColumnName(targetColumn.name),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["board-tasks", activeBoardId] }),
        queryClient.invalidateQueries({ queryKey: ["all-board-tasks"] }),
      ]);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: {
      boardId: number;
      columnId: number;
      type: Task["type"];
      title: string;
      description: string;
      assigneeId: number | null;
      deadline: string | null;
      labels: { label: string; color: string }[];
    }) => {
      const task = await tasksApi.create(payload.boardId, {
        title: payload.title,
        description: payload.description || undefined,
        type: payload.type,
        columnId: payload.columnId,
        assigneeId: payload.assigneeId,
        deadline: payload.deadline,
      });

      if (payload.labels.length > 0) {
        const labels = await labelsApi.getByBoard(payload.boardId);
        await Promise.all(
          payload.labels.map(async (item) => {
            const matchedLabel = labels.find((label) => label.name === item.label);
            if (matchedLabel) {
              await labelsApi.addToTask(payload.boardId, task.id, matchedLabel.id);
            }
          })
        );
      }

      return task;
    },
    onSuccess: async (_, payload) => {
      setCreateTaskOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["board-tasks", payload.boardId] }),
        queryClient.invalidateQueries({ queryKey: ["all-board-tasks"] }),
      ]);
    },
  });

  const dashboardBoards = useMemo<DashboardBoard[]>(() => {
    const boardTasks = allTasksQuery.data ?? [];
    return boards.map((board) => {
      const tasks = boardTasks.filter((task) => task.boardId === board.id);
      const completed = tasks.filter((task) => task.status === "DONE").length;
      return {
        id: board.id,
        name: board.name,
        description: board.description,
        color: getBoardColor(board.id),
        members: board.members.map((member) => member.fullName),
        memberCount: board.memberCount,
        tasks: tasks.length,
        updated: formatUpdated(board.updatedAt),
        progress: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      };
    });
  }, [allTasksQuery.data, boards]);

  const dashboardTasks = useMemo<DashboardTask[]>(() => {
    const currentUser = currentUserQuery.data;
    let rawTasks = myTasksQuery.data;

    if (!rawTasks && allTasksQuery.data) {
      rawTasks = allTasksQuery.data.filter((task) => {
        if (!currentUser) return true;
        return (
          (task.assigneeId && task.assigneeId === currentUser.id) ||
          (task.assigneeName && currentUser.fullName && task.assigneeName.toLowerCase() === currentUser.fullName.toLowerCase())
        );
      });
    }

    const boardMap = new Map(boards.map((board) => [board.id, board]));
    return (rawTasks ?? []).map((task) => {
      const parentBoard = boardMap.get(task.boardId);
      return {
        id: String(task.id),
        boardId: task.boardId,
        title: task.title,
        board: parentBoard?.name ?? "Board",
        boardColor: getBoardColor(task.boardId),
        priority: toPriority(task.priority),
        deadline: task.deadline ?? new Date().toISOString(),
        assignee: task.assigneeName ?? "Unassigned",
        done: task.status === "DONE",
      };
    });
  }, [myTasksQuery.data, allTasksQuery.data, currentUserQuery.data, boards]);

  // Which sidebar nav item is highlighted
  const appView = getViewFromPath(location.pathname);
  const sidebarNav: NavItem =
    appView === "tasks"           ? "tasks"
    : appView === "notifications" ? "notifications"
    : appView === "settings"      ? "settings"
    : "home";

  const boardColumns = useMemo(
    () => buildBoardColumns(boardColumnsQuery.data ?? [], boardTasksQuery.data ?? []),
    [boardColumnsQuery.data, boardTasksQuery.data]
  );

  useEffect(() => {
    if (appView === "board" && currentBoard && !Number.isFinite(boardIdNumber)) {
      navigate(getBoardRoute(currentBoard.id), { replace: true });
    }
  }, [appView, boardIdNumber, currentBoard, navigate]);

  function handleSidebarNav(n: NavItem) {
    navigate(
      n === "tasks"           ? ROUTES.tasks
      : n === "notifications" ? ROUTES.notifications
      : n === "settings"      ? ROUTES.settings
      : ROUTES.home
    );
    setNotifOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setNotifOpen(false);
    setTaskDetailOpen(false);
    setSelectedTaskId(null);
    setSelectedTaskBoardId(null);
    setCreateBoardOpen(false);
    setCreateTaskOpen(false);
    setInviteMemberOpen(false);
    setManageLabelsOpen(false);
    setBoardSettingsOpen(false);
    onLogout();
    navigate("/login", { replace: true });
  }

  function handleBoardTabChange(tabIndex: number) {
    if (tabIndex === 4) {
      navigate(`/boards/${boardId}/statistics`);
      return;
    }

    if (location.pathname.endsWith("/statistics")) {
      navigate(`/boards/${boardId}`);
    }
  }

  function handleOpenTaskDetail(task: { id: string; boardId: number }) {
    setSelectedTaskId(Number(task.id));
    setSelectedTaskBoardId(task.boardId);
    setTaskDetailOpen(true);
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-background font-['Inter'] overflow-hidden">

      {/* ── Mobile Top Navigation Bar ──────────────────────────────────────── */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-card border-b border-border z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/30 text-foreground hover:bg-secondary transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow shadow-primary/30">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">TaskFlow</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                notifOpen ? "bg-secondary/50 text-foreground" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              <Bell className="h-4 w-4" />
              {!!unreadNotificationsCountQuery.data && unreadNotificationsCountQuery.data > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary border-2 border-background" />
              )}
            </button>
            <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>
          <button
            onClick={() => handleSidebarNav("settings")}
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white overflow-hidden"
            style={{ backgroundColor: "#6366f1" }}
          >
            {currentUserQuery.data?.avatarUrl ? (
              <img src={currentUserQuery.data.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              getInitials(currentUserQuery.data?.fullName ?? "TF").slice(0, 2)
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile Navigation Drawer ────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-[280px] max-w-[85vw] h-full bg-card shadow-2xl flex flex-col"
            >
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Sidebar
                active={sidebarNav}
                collapsed={false}
                onToggle={() => {}}
                onNav={(n) => {
                  handleSidebarNav(n);
                  setMobileMenuOpen(false);
                }}
                boards={dashboardBoards}
                currentUser={currentUserQuery.data ?? null}
                unreadNotificationsCount={unreadNotificationsCountQuery.data ?? 0}
                onOpenBoard={(nextBoardId) => {
                  navigate(getBoardRoute(nextBoardId));
                  setNotifOpen(false);
                  setMobileMenuOpen(false);
                }}
                onCreateBoard={() => {
                  setCreateBoardOpen(true);
                  setMobileMenuOpen(false);
                }}
                onLogout={handleLogout}
                isMobileDrawer={true}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Desktop Permanent Sidebar ──────────────────────────────────────── */}
      <Sidebar
        active={sidebarNav}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        onNav={handleSidebarNav}
        boards={dashboardBoards}
        currentUser={currentUserQuery.data ?? null}
        unreadNotificationsCount={unreadNotificationsCountQuery.data ?? 0}
        onOpenBoard={(nextBoardId) => { navigate(getBoardRoute(nextBoardId)); setNotifOpen(false); }}
        onCreateBoard={() => setCreateBoardOpen(true)}
        onLogout={handleLogout}
      />

      {/* ── Main content column ───────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {appView === "board" ? (
            /* Board view: full-height */
            <motion.div
              key="board"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col flex-1 min-w-0 overflow-hidden"
            >
              <BoardDetail
                onBack={() => navigate(ROUTES.home)}
                onCreateTask={() => setCreateTaskOpen(true)}
                onInvite={() => setInviteMemberOpen(true)}
                onManageLabels={() => setManageLabelsOpen(true)}
                onTaskClick={(taskId) => {
                  if (!activeBoardId) return;
                  handleOpenTaskDetail({ id: taskId, boardId: activeBoardId });
                }}
                onBoardSettings={() => setBoardSettingsOpen(true)}
                initialActiveTab={location.pathname.endsWith("/statistics") ? 4 : 0}
                onTabChange={handleBoardTabChange}
                boardId={activeBoardId}
                boardName={currentBoard?.name}
                members={(currentBoard?.members ?? []).map((member) => member.fullName)}
                columnsData={boardColumns}
                isLoading={boardColumnsQuery.isLoading || boardTasksQuery.isLoading}
                onCreateColumn={async (name) => {
                  if (!activeBoardId) throw new Error("No active board selected");
                  await createColumnMutation.mutateAsync({ boardId: activeBoardId, name });
                }}
                onUpdateColumn={async (columnId, name) => {
                  const numId = Number(columnId);
                  if (!isNaN(numId)) {
                    await updateColumnMutation.mutateAsync({ columnId: numId, name });
                  }
                }}
                onDeleteColumn={async (columnId) => {
                  const numId = Number(columnId);
                  if (!isNaN(numId)) {
                    await deleteColumnMutation.mutateAsync(numId);
                  }
                }}
                onMoveTask={async (taskId, targetColumnId) => {
                  if (!activeBoardId) throw new Error("No active board selected");
                  await moveTaskMutation.mutateAsync({
                    boardId: activeBoardId,
                    taskId,
                    targetColumnId,
                    columns: boardColumnsQuery.data ?? [],
                  });
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={appView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 min-w-0 overflow-hidden"
            >
              {/* Shared top header for all non-board views */}
              <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0 gap-3">
                <div className="relative flex-1 max-w-xs sm:max-w-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search tasks, boards..."
                    className="w-full sm:w-72 rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setNotifOpen((v) => !v)}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${notifOpen ? "bg-secondary/50 text-foreground" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`}
                    >
                      <Bell className="h-4 w-4" />
                      {!!unreadNotificationsCountQuery.data && unreadNotificationsCountQuery.data > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary border-2 border-background" />
                      )}
                    </button>
                    <NotificationDropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
                  </div>
                  <button
                    onClick={() => handleSidebarNav("settings")}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <button
                    onClick={() => handleSidebarNav("settings")}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                    style={{ backgroundColor: "#6366f1" }}
                  >
                    {currentUserQuery.data?.avatarUrl ? (
                      <img src={currentUserQuery.data.avatarUrl} alt={currentUserQuery.data.fullName} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(currentUserQuery.data?.fullName ?? "TaskFlow").slice(0, 2)
                    )}
                  </button>
                </div>
              </header>

              {/* Scrollable content area */}
              <main className={`flex-1 min-h-0 w-full ${appView === "settings" ? "flex overflow-hidden" : "overflow-y-auto"} ${appView === "notifications" ? "flex flex-col" : ""}`}>
                {appView === "home" && (
                  <DashboardHome
                    boards={dashboardBoards}
                    tasks={dashboardTasks}
                    onOpenBoard={(nextBoardId) => navigate(getBoardRoute(nextBoardId))}
                    onOpenTask={handleOpenTaskDetail}
                    onCreateTask={() => setCreateTaskOpen(true)}
                  />
                )}
                {appView === "tasks" && (
                  <MyTasksView
                    tasks={dashboardTasks}
                    onOpenTask={handleOpenTaskDetail}
                    onCreateTask={() => setCreateTaskOpen(true)}
                  />
                )}
                {appView === "notifications" && (
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="px-8 pt-8 pb-4 border-b border-border/50 flex-shrink-0 flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-semibold text-foreground mb-1">Notifications</h1>
                        <p className="text-sm text-muted-foreground">Stay up to date with your team's activity</p>
                      </div>
                      {(notificationsQuery.data?.length ?? 0) > 0 && (
                        <button
                          onClick={() => markAllAsReadMutation.mutate()}
                          disabled={!(notificationsQuery.data?.some(n => !n.isRead))}
                          className="flex items-center gap-1.5 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Check className="h-4 w-4" />
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                      {notificationsQuery.isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <p className="text-sm text-muted-foreground">Loading notifications...</p>
                        </div>
                      ) : (notificationsQuery.data?.length ?? 0) === 0 ? (
                        <div className="mt-8 flex justify-center">
                          <NoNotificationsState />
                        </div>
                      ) : (
                        <div className="max-w-4xl mx-auto rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                          <div className="divide-y divide-border/50">
                            {notificationsQuery.data?.map((n) => {
                              const cfg = TYPE_CONFIG[n.type] || DEFAULT_TYPE_CONFIG;
                              const Icon = cfg.icon;
                              return (
                                <div
                                  key={n.id}
                                  className={`group w-full flex items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-secondary/20 relative ${
                                    !n.isRead ? "bg-primary/[0.04]" : ""
                                  }`}
                                >
                                  <button
                                    onClick={() => handleNotifClick(n)}
                                    className="flex-1 flex items-start gap-4 text-left focus:outline-none min-w-0"
                                  >
                                    <div
                                      className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                                      style={{ backgroundColor: cfg.bg + "20" }}
                                    >
                                      <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                      <p className={`text-base leading-snug ${n.isRead ? "font-medium text-muted-foreground" : "font-semibold text-foreground"}`}>
                                        {n.title}
                                      </p>
                                      <p className="text-sm text-muted-foreground leading-relaxed">
                                        {n.message}
                                      </p>
                                      <p className={`text-xs mt-1 tabular-nums ${n.isRead ? "text-muted-foreground/50" : "text-primary/70 font-medium"}`}>
                                        {formatNotifTime(n.createdAt)}
                                      </p>
                                    </div>
                                  </button>
                                  <div className="flex-shrink-0 mt-1 w-8 flex items-center justify-center h-10">
                                    <button
                                      onClick={(e) => handleDelete(e, n.id)}
                                      className="hidden group-hover:flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                      title="Delete notification"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                    {!n.isRead && (
                                      <span className="group-hover:hidden h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {appView === "settings" && <SettingsPage />}
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task Detail Panel — slide in from right */}
      <AnimatePresence>
        {taskDetailOpen && (
          <TaskDetailPanel
            isOpen={taskDetailOpen}
            onClose={() => {
              setTaskDetailOpen(false);
              setSelectedTaskId(null);
              setSelectedTaskBoardId(null);
            }}
            boardId={selectedTaskBoardId}
            taskId={selectedTaskId}
            columns={selectedTaskBoardId === activeBoardId ? (boardColumnsQuery.data ?? []) : []}
            members={selectedTaskBoardId === activeBoardId ? (currentBoard?.members ?? []) : []}
          />
        )}
      </AnimatePresence>

      {/* Create Board modal — fade + scale */}
      <AnimatePresence>
        {createBoardOpen && (
          <CreateBoardModal
            onClose={() => setCreateBoardOpen(false)}
            onCreate={async (board) => {
              await createBoardMutation.mutateAsync({
                name: board.name,
                description: board.description,
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Task modal — fade + scale */}
      <AnimatePresence>
        {createTaskOpen && (
          <CreateTaskModal
            onClose={() => setCreateTaskOpen(false)}
            boards={boards}
            initialBoardId={activeBoardId}
            onCreate={async (task) => {
              const matchedBoard = boards.find((board) => board.id === task.boardId) ?? null;
              if (!matchedBoard) throw new Error("Please create a board first.");
              const matchedAssignee = matchedBoard.members.find((member) => member.fullName === task.assignee) ?? null;
              await createTaskMutation.mutateAsync({
                boardId: task.boardId,
                columnId: Number(task.column),
                type: task.type,
                title: task.title,
                description: task.description,
                assigneeId: matchedAssignee?.userId ?? null,
                deadline: task.deadline || null,
                labels: task.labels,
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* Invite Member modal — fade + scale */}
      <AnimatePresence>
        {inviteMemberOpen && (
          <InviteMemberModal onClose={() => setInviteMemberOpen(false)} boardId={activeBoardId} />
        )}
      </AnimatePresence>

      {/* Manage Labels modal — fade + scale */}
      <AnimatePresence>
        {manageLabelsOpen && (
          <ManageLabelsModal onClose={() => setManageLabelsOpen(false)} boardId={activeBoardId} />
        )}
      </AnimatePresence>

      {/* Board Settings modal — fade + scale */}
      <AnimatePresence>
        {boardSettingsOpen && (
          <BoardSettingsModal onClose={() => setBoardSettingsOpen(false)} boardId={activeBoardId} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAccessToken()));

  useEffect(() => {
    function handleAuthExpired() {
      clearAuthTokens();
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    }

    window.addEventListener("taskflow:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("taskflow:auth-expired", handleAuthExpired);
  }, [navigate]);

  useEffect(() => {
    async function restoreSession() {
      const token = getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.post("/auth/refresh", {}, { timeout: 8000 });
        const accessToken = response.data.data.accessToken;
        
        setAccessToken(accessToken);
        setIsAuthenticated(true);
      } catch (err) {
        clearAuthTokens();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function handleSignIn(payload: LoginRequest | RegisterRequest) {
    if ("fullName" in payload) {
      await authApi.register(payload);
    } else {
      await authApi.login(payload);
    }

    setIsAuthenticated(true);
    navigate("/tasks", { replace: true });
  }

  async function handleLogout() {
    await authApi.logout();
    setIsAuthenticated(false);
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070b13] text-[#7c8aa7]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1b2742] border-t-[#6d6cf8]" />
          <p className="text-sm font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/tasks" : "/login"} replace />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/tasks" replace /> : <LoginPage view="login" onSignIn={handleSignIn} />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/tasks" replace /> : <LoginPage view="signup" onSignIn={handleSignIn} />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/tasks" element={<AuthenticatedLayout onLogout={handleLogout} />} />
          <Route path="/boards/:boardId" element={<AuthenticatedLayout onLogout={handleLogout} />} />
          <Route path="/boards/:boardId/statistics" element={<AuthenticatedLayout onLogout={handleLogout} />} />
          <Route path="/profile" element={<AuthenticatedLayout onLogout={handleLogout} />} />
          <Route path="/notifications" element={<AuthenticatedLayout onLogout={handleLogout} />} />
          <Route path="/settings" element={<Navigate to="/profile" replace />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? "/tasks" : "/login"} replace />} />
      </Routes>
    </QueryClientProvider>
  );
}
