import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, Mail, Lock, Eye, EyeOff, User, ArrowRight,
  CheckCircle2, Circle, Clock, AlertCircle, Plus, MoreHorizontal,
  Search, Bell, Settings, ChevronDown, ChevronRight, Calendar,
  Home, ClipboardList, Users, LayoutGrid, TrendingUp, AlertTriangle,
  ExternalLink, Hash, ArrowLeft, Filter, SlidersHorizontal,
  ChevronsUp, ChevronUp, Minus, MessageSquare, ListChecks,
  MoreVertical, Grip,
} from "lucide-react";
import { TaskDetailPanel } from "./components/TaskDetailPanel";
import { NotificationDropdown } from "./components/NotificationDropdown";
import { SettingsPage } from "./components/SettingsPage";
import { BoardMembersModal } from "./components/BoardMembersModal";
import { BoardDetail } from "./components/BoardDetail";
import { CreateBoardModal } from "./components/CreateBoardModal";
import { CreateTaskModal } from "./components/CreateTaskModal";
import { InviteMemberModal } from "./components/InviteMemberModal";
import { ManageLabelsModal } from "./components/ManageLabelsModal";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthView = "login" | "signup";
type Priority = "low" | "medium" | "high" | "urgent";
type TaskType = "BUG" | "FEATURE" | "EPIC" | "IMPROVEMENT";
type NavItem = "home" | "tasks" | "notifications" | "settings";
type AppView = "home" | "tasks" | "board" | "notifications" | "settings";

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

// ─── Kanban Data ─────────────────────────────────────────────────────────────

interface KanbanTask {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  tags: { label: string; color: string }[];
  assignees: string[];
  priority: Priority;
  deadline: string;
  comments: number;
  subtasks: { done: number; total: number };
  isDragging?: boolean;
}
interface KanbanCol {
  id: string;
  title: string;
  color: string;
  tasks: KanbanTask[];
  isDone?: boolean;
  highlight?: boolean;
}

const KANBAN_COLS: KanbanCol[] = [
  {
    id: "todo", title: "To Do", color: "#64748b",
    tasks: [
      {
        id: "k1", type: "FEATURE",
        title: "Redesign onboarding flow",
        description: "Rework the 5-step onboarding into a streamlined 3-step wizard with live progress tracking.",
        tags: [{ label: "UX", color: "#6366f1" }, { label: "Frontend", color: "#06b6d4" }],
        assignees: ["Alice Johnson", "Sarah Chen"],
        priority: "high", deadline: "2026-06-05", comments: 3,
        subtasks: { done: 2, total: 5 },
      },
      {
        id: "k2", type: "BUG",
        title: "Fix login redirect on mobile Safari",
        description: "Auth redirect fails silently on iOS Safari 17 when third-party cookies are blocked by default.",
        tags: [{ label: "Mobile", color: "#f59e0b" }, { label: "Auth", color: "#ef4444" }],
        assignees: ["Tom Wilson"],
        priority: "urgent", deadline: "2026-05-30", comments: 1,
        subtasks: { done: 0, total: 2 },
      },
      {
        id: "k3", type: "IMPROVEMENT",
        title: "Improve search result ranking",
        description: "Replace simple string match with weighted fuzzy search using TF-IDF relevance scoring.",
        tags: [{ label: "Search", color: "#10b981" }, { label: "Backend", color: "#8b5cf6" }],
        assignees: ["Priya Nair", "Marcus Webb"],
        priority: "medium", deadline: "2026-06-10", comments: 5,
        subtasks: { done: 1, total: 3 },
      },
    ],
  },
  {
    id: "in-progress", title: "In Progress", color: "#6366f1", highlight: true,
    tasks: [
      {
        id: "k4", type: "EPIC",
        title: "Auth system v2 — OAuth + SSO",
        description: "Implement OAuth 2.0 with Google and GitHub, plus enterprise SSO via SAML 2.0 federation.",
        tags: [{ label: "Auth", color: "#ef4444" }, { label: "Backend", color: "#8b5cf6" }, { label: "Security", color: "#f59e0b" }],
        assignees: ["Alex Rivera", "Tom Wilson", "Raj Patel"],
        priority: "high", deadline: "2026-06-03", comments: 8,
        subtasks: { done: 3, total: 6 },
        isDragging: true,
      },
      {
        id: "k5", type: "FEATURE",
        title: "Dashboard analytics widgets",
        description: "Add burndown chart, velocity tracker, and cycle time histogram to the sprint overview.",
        tags: [{ label: "Analytics", color: "#6366f1" }, { label: "Charts", color: "#06b6d4" }],
        assignees: ["Sarah Chen"],
        priority: "medium", deadline: "2026-06-08", comments: 2,
        subtasks: { done: 4, total: 4 },
      },
    ],
  },
  {
    id: "review", title: "In Review", color: "#f59e0b",
    tasks: [
      {
        id: "k6", type: "BUG",
        title: "Memory leak in real-time sync",
        description: "WebSocket listeners are not cleaned up on route change, causing steady heap growth over time.",
        tags: [{ label: "Performance", color: "#ef4444" }, { label: "WebSocket", color: "#8b5cf6" }],
        assignees: ["Marcus Webb"],
        priority: "urgent", deadline: "2026-05-28", comments: 4,
        subtasks: { done: 1, total: 1 },
      },
      {
        id: "k7", type: "IMPROVEMENT",
        title: "Keyboard navigation for board",
        description: "Full keyboard support — arrow keys to move focus between cards and columns, Enter to open.",
        tags: [{ label: "A11y", color: "#10b981" }, { label: "Frontend", color: "#06b6d4" }],
        assignees: ["Emily Davis"],
        priority: "low", deadline: "2026-06-01", comments: 2,
        subtasks: { done: 3, total: 3 },
      },
    ],
  },
  {
    id: "done", title: "Done", color: "#10b981", isDone: true,
    tasks: [
      {
        id: "k8", type: "FEATURE",
        title: "CSV export for task lists",
        description: "One-click export of filtered task views to CSV with all metadata columns included.",
        tags: [{ label: "Export", color: "#10b981" }, { label: "Backend", color: "#8b5cf6" }],
        assignees: ["Raj Patel"],
        priority: "medium", deadline: "2026-05-22", comments: 3,
        subtasks: { done: 3, total: 3 },
      },
      {
        id: "k9", type: "BUG",
        title: "Notification bell missing on mobile",
        description: "The bell icon was clipped by the hamburger overflow container on viewports under 375px.",
        tags: [{ label: "Mobile", color: "#f59e0b" }, { label: "UI", color: "#6366f1" }],
        assignees: ["Emily Davis"],
        priority: "high", deadline: "2026-05-20", comments: 1,
        subtasks: { done: 2, total: 2 },
      },
      {
        id: "k10", type: "EPIC",
        title: "Initial project setup & CI/CD",
        description: "Repository scaffold, GitHub Actions pipelines, staging and production deployment config.",
        tags: [{ label: "DevOps", color: "#06b6d4" }, { label: "Infra", color: "#94a3b8" }],
        assignees: ["Alex Rivera", "Tom Wilson"],
        priority: "high", deadline: "2026-05-15", comments: 7,
        subtasks: { done: 6, total: 6 },
      },
    ],
  },
];

const BOARD_MEMBERS = ["Alice Johnson", "Sarah Chen", "Tom Wilson", "Marcus Webb", "Priya Nair"];

const TYPE_STYLES: Record<TaskType, { bg: string; text: string; label: string }> = {
  BUG:         { bg: "bg-[#ef4444]/12", text: "text-[#ef4444]",  label: "Bug" },
  FEATURE:     { bg: "bg-[#6366f1]/12", text: "text-[#6366f1]",  label: "Feature" },
  EPIC:        { bg: "bg-[#8b5cf6]/12", text: "text-[#8b5cf6]",  label: "Epic" },
  IMPROVEMENT: { bg: "bg-[#10b981]/12", text: "text-[#10b981]",  label: "Improvement" },
};

const PRIORITY_META: Record<Priority, { icon: React.ElementType; color: string; label: string }> = {
  urgent: { icon: ChevronsUp, color: "#ef4444", label: "Urgent" },
  high:   { icon: ChevronUp,  color: "#f97316", label: "High" },
  medium: { icon: Minus,      color: "#f59e0b", label: "Medium" },
  low:    { icon: ChevronDown,color: "#94a3b8", label: "Low" },
};

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

function AuthPanel({ view, onSwitch, onSignIn }: { view: AuthView; onSwitch: () => void; onSignIn: () => void }) {
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

  const base = "w-full rounded-lg border border-border bg-input-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all";

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
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSignIn(); }}>
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
            <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.99] transition-all shadow-lg shadow-primary/25">Sign In <ArrowRight className="h-4 w-4" /></button>
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
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (signupPw !== confirmPw) { setConfirmErr("Passwords do not match"); return; } setConfirmErr(""); onSignIn(); }}>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-foreground">Full name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input placeholder="Alex Rivera" value={name} onChange={(e) => setName(e.target.value)} className={base} /></div></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-foreground">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type="email" placeholder="you@company.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className={base} /></div></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-foreground">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type={showSPw ? "text" : "password"} placeholder="Create a password" value={signupPw} onChange={(e) => setSignupPw(e.target.value)} className={base} /><div className="absolute right-3 top-1/2 -translate-y-1/2"><EyeToggle show={showSPw} onToggle={() => setShowSPw(!showSPw)} /></div></div><PasswordStrengthBar password={signupPw} /></div>
            <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-foreground">Confirm password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" /><input type={showCPw ? "text" : "password"} placeholder="Repeat your password" value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); if (confirmErr) setConfirmErr(""); }} className={`${base} ${confirmErr ? "border-[#ef4444]" : ""}`} /><div className="absolute right-3 top-1/2 -translate-y-1/2"><EyeToggle show={showCPw} onToggle={() => setShowCPw(!showCPw)} /></div></div>{confirmErr && <p className="text-xs text-[#ef4444]">{confirmErr}</p>}</div>
            <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.99] transition-all shadow-lg shadow-primary/25">Create Account <ArrowRight className="h-4 w-4" /></button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">Already have an account?{" "}<button onClick={onSwitch} className="text-primary hover:text-primary/80 font-medium transition-colors">Sign in</button></p>
        </>
      )}
    </div>
  );
}

function LoginPage({ onSignIn }: { onSignIn: () => void }) {
  const [authView, setAuthView] = useState<AuthView>("login");
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
        <AuthPanel view={authView} onSwitch={() => setAuthView(authView === "login" ? "signup" : "login")} onSignIn={onSignIn} />
        <p className="mt-10 text-xs text-muted-foreground text-center">By continuing, you agree to our{" "}<button className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</button>{" "}and{" "}<button className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</button></p>
      </div>
    </div>
  );
}

// ─── Kanban Components ────────────────────────────────────────────────────────

function TaskCard({ task, isDone, onClick }: { task: KanbanTask; isDone?: boolean; onClick?: () => void }) {
  const type = TYPE_STYLES[task.type];
  const pMeta = PRIORITY_META[task.priority];
  const PIcon = pMeta.icon;
  const isOverdue = !isDone && new Date(task.deadline) < new Date("2026-05-28");
  const subtaskPct = task.subtasks.total > 0 ? (task.subtasks.done / task.subtasks.total) * 100 : 0;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200
        ${task.isDragging
          ? "border-primary/60 bg-[#1e293b] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] rotate-[1.5deg] scale-[1.02] ring-2 ring-primary/30 z-20"
          : isDone
            ? "border-border/40 bg-card/50 opacity-60 hover:opacity-80 hover:border-border hover:shadow-md"
            : "border-border bg-card hover:border-border/80 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)]"
        }`}
    >
      {/* Drag handle (visible on hover) */}
      {!task.isDragging && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Grip className="h-3.5 w-3.5 text-muted-foreground/50" />
        </div>
      )}

      {/* Type badge */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${type.bg} ${type.text}`}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "currentColor" }} />
          {type.label}
        </span>
        {task.isDragging && (
          <span className="text-[10px] text-primary/70 font-medium">Dragging…</span>
        )}
      </div>

      {/* Title */}
      <div>
        <h4 className={`text-sm font-semibold leading-snug ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {task.title}
        </h4>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {task.description}
        </p>
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag.label}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: tag.color + "18", color: tag.color }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* Subtask progress bar */}
      {task.subtasks.total > 0 && (
        <div className="flex flex-col gap-1">
          <div className="h-1 w-full rounded-full bg-secondary/60">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${subtaskPct}%`,
                backgroundColor: subtaskPct === 100 ? "#10b981" : PRIORITY_META[task.priority].color,
              }}
            />
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* Assignee avatars */}
        <div className="flex -space-x-1.5">
          {task.assignees.slice(0, 3).map((a) => (
            <div
              key={a}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: getAvatarColor(a) }}
              title={a}
            >
              {getInitials(a)}
            </div>
          ))}
          {task.assignees.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[9px] font-medium text-muted-foreground">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>

        {/* Right meta strip */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Priority */}
          <span title={`${pMeta.label} priority`}>
            <PIcon className="h-3.5 w-3.5" style={{ color: pMeta.color }} />
          </span>

          {/* Deadline */}
          <span className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? "text-[#ef4444]" : "text-muted-foreground"}`} title={isOverdue ? "Overdue" : "Deadline"}>
            {isOverdue && <AlertTriangle className="h-3 w-3" />}
            <Calendar className="h-3 w-3" />
            {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>

          {/* Comments */}
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {task.comments}
          </span>

          {/* Subtasks */}
          <span
            className={`flex items-center gap-1 text-[10px] font-medium ${task.subtasks.done === task.subtasks.total && task.subtasks.total > 0 ? "text-[#10b981]" : "text-muted-foreground"}`}
            title="Subtasks"
          >
            <ListChecks className="h-3 w-3" />
            {task.subtasks.done}/{task.subtasks.total}
          </span>
        </div>
      </div>
    </div>
  );
}

function KanbanColumnComponent({ col, onCardClick, onCreateTask }: { col: KanbanCol; onCardClick?: () => void; onCreateTask?: () => void }) {
  return (
    <div className="flex flex-col w-[308px] min-w-[308px] max-h-full">
      {/* Column header */}
      <div
        className={`flex items-center justify-between rounded-t-xl px-4 py-3 mb-0 border border-b-0 ${
          col.highlight ? "border-primary/30 bg-primary/8" : "border-border bg-secondary/30"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {/* Color indicator */}
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
          <span className={`text-sm font-semibold ${col.highlight ? "text-primary" : "text-foreground"}`}>
            {col.title}
          </span>
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
            style={{ backgroundColor: col.color + "22", color: col.color }}
          >
            {col.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Drop zone / card list */}
      <div
        className={`flex flex-col gap-3 flex-1 rounded-b-xl border border-t-0 p-3 overflow-y-auto min-h-[200px] ${
          col.highlight ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/10"
        }`}
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {col.tasks.map((task) => (
          <TaskCard key={task.id} task={task} isDone={col.isDone} onClick={onCardClick} />
        ))}

        {/* Add task row */}
        <button onClick={onCreateTask} className="flex items-center gap-2 rounded-lg border border-dashed border-border/50 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all mt-1">
          <Plus className="h-3.5 w-3.5" />
          Add task
        </button>
      </div>
    </div>
  );
}

function KanbanContent({ onCreateTask, onTaskClick }: { onCreateTask: () => void; onTaskClick: () => void }) {
  const [searchVal, setSearchVal] = useState("");
  const [membersOpen, setMembersOpen] = useState(false);
  const extraMembers = 3;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Board toolbar */}
      <header className="flex items-center gap-4 px-6 py-3.5 border-b border-border bg-card flex-shrink-0">
        {/* Board title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366f1]/20 flex-shrink-0">
            <LayoutGrid className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-sm font-semibold text-foreground truncate">Project Alpha</h1>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Member avatars */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setMembersOpen(true)}
            className="flex -space-x-2 hover:opacity-90 transition-opacity"
            title="Manage board members"
          >
            {BOARD_MEMBERS.map((m) => (
              <div
                key={m}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold text-white"
                style={{ backgroundColor: getAvatarColor(m) }}
                title={m}
              >
                {getInitials(m)}
              </div>
            ))}
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-semibold text-muted-foreground">
              +{extraMembers}
            </div>
          </button>
          <button
            onClick={() => setMembersOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            title="Add member"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Actions */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          {/* Filter */}
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors flex-shrink-0">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>

          {/* Sort */}
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors flex-shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Sort
            <ChevronDown className="h-3 w-3" />
          </button>

          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-44 rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:w-56 transition-all"
            />
          </div>

          {/* Add Task */}
          <button onClick={onCreateTask} className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 active:scale-[0.98] transition-all shadow shadow-primary/25 flex-shrink-0">
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </button>

          {/* Settings */}
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors flex-shrink-0">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Board area — horizontal scroll */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full items-start min-w-max">
          {KANBAN_COLS.map((col) => (
            <KanbanColumnComponent key={col.id} col={col} onCardClick={onTaskClick} onCreateTask={onCreateTask} />
          ))}

          {/* Add Column */}
          <div className="flex flex-col w-[260px] min-w-[260px]">
            <button className="flex items-center gap-2.5 rounded-xl border border-dashed border-border/50 px-5 py-4 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all w-full">
              <Plus className="h-4 w-4" />
              Add Column
            </button>
          </div>
        </div>
      </main>

      {membersOpen && <BoardMembersModal onClose={() => setMembersOpen(false)} />}
    </div>
  );
}

// ─── Sidebar + shared layout ──────────────────────────────────────────────────

function Sidebar({ active, onNav, onOpenBoard, onCreateBoard }: { active: NavItem; onNav: (n: NavItem) => void; onOpenBoard: () => void; onCreateBoard: () => void }) {
  const [boardsOpen, setBoardsOpen] = useState(true);
  const navItems: { id: NavItem; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "home",          label: "Home",          icon: Home },
    { id: "tasks",         label: "My Tasks",      icon: ClipboardList },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3 },
    { id: "settings",      label: "Settings",      icon: Settings },
  ];
  return (
    <aside className="flex flex-col w-[260px] min-w-[260px] h-full bg-card border-r border-border overflow-y-auto">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow shadow-primary/30"><Zap className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
        <span className="text-lg font-semibold text-foreground tracking-tight">TaskFlow</span>
      </div>
      <div className="px-3 py-4 border-b border-border">
        <button onClick={() => onNav("settings")} className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary/40 transition-colors group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white flex-shrink-0" style={{ backgroundColor: "#6366f1" }}>AJ</div>
          <div className="flex-1 text-left min-w-0"><p className="text-sm font-medium text-foreground truncate">Alice Johnson</p><p className="text-xs text-muted-foreground truncate">alice@taskflow.io</p></div>
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      </div>
      <nav className="px-3 py-3 flex flex-col gap-0.5">
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => onNav(id)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`}>
              <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span className="flex-1 text-left">{label}</span>
              {badge != null && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white px-1.5">{badge}</span>}
            </button>
          );
        })}
      </nav>
      <div className="px-3 mt-2 flex-1">
        <button onClick={() => setBoardsOpen(!boardsOpen)} className="w-full flex items-center justify-between px-3 py-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Boards</span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${boardsOpen ? "" : "-rotate-90"}`} />
        </button>
        {boardsOpen && (
          <div className="flex flex-col gap-0.5">
            {MY_BOARDS.map((board) => (
              <button key={board.id} onClick={onOpenBoard} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-secondary/40 transition-colors group">
                <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: board.color }} />
                <span className="flex-1 text-left text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">{board.name}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground/60"><Users className="h-3 w-3" /><span>{board.members}</span></div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-3 py-4 border-t border-border mt-2">
        <button
          onClick={onCreateBoard}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4" />Create Board
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

function BoardCard({ board, onClick }: { board: typeof RECENT_BOARDS[0]; onClick: () => void }) {
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

function TaskRow({ task }: { task: typeof MY_TASKS[0] }) {
  const [done, setDone] = useState(task.done);
  const p = PRIORITY_STYLES[task.priority];
  const isOverdue = !done && new Date(task.deadline) < new Date("2026-05-28");
  return (
    <div className={`group flex items-center gap-4 rounded-lg px-4 py-3 hover:bg-secondary/20 transition-colors ${done ? "opacity-50" : ""}`}>
      <button onClick={() => setDone(!done)} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">{done ? <CheckCircle2 className="h-4 w-4 text-[#10b981]" /> : <Circle className="h-4 w-4" />}</button>
      <div className="flex-1 min-w-0"><p className={`text-sm font-medium truncate ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p><div className="flex items-center gap-1.5 mt-0.5"><div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.boardColor }} /><span className="text-xs text-muted-foreground truncate">{task.board}</span></div></div>
      <span className={`hidden sm:inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium flex-shrink-0 ${p.bg} ${p.text}`}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
      <div className={`hidden md:flex items-center gap-1.5 text-xs flex-shrink-0 ${isOverdue ? "text-[#ef4444]" : "text-muted-foreground"}`}>{isOverdue && <AlertTriangle className="h-3 w-3" />}<Calendar className="h-3 w-3" /><span>{new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
      <div className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: getAvatarColor(task.assignee) }} title={task.assignee}>{getInitials(task.assignee)}</div>
      <button className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary/50 transition-all flex-shrink-0"><MoreHorizontal className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function DashboardHome({ onOpenBoard, onCreateTask }: { onOpenBoard: () => void; onCreateTask: () => void }) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return (
    <div className="flex flex-col gap-8 px-8 py-8 w-full">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold text-foreground">Good morning, Alice 👋</h1><p className="mt-1 text-sm text-muted-foreground">{today}</p></div>
        <button onClick={onCreateTask} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow shadow-primary/20 flex-shrink-0"><Plus className="h-4 w-4" />New Task</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks"  value={24} icon={Hash}          color="#6366f1" sub="Across all boards" />
        <StatCard label="In Progress"  value={8}  icon={Clock}         color="#f59e0b" sub="Active right now" />
        <StatCard label="Completed"    value={12} icon={CheckCircle2}  color="#10b981" sub="This sprint" />
        <StatCard label="Overdue"      value={4}  icon={AlertTriangle} color="#ef4444" sub="Needs attention" />
      </div>
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-foreground">Recent Boards</h2><button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">View all <ExternalLink className="h-3.5 w-3.5" /></button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECENT_BOARDS.map((board) => <BoardCard key={board.id} board={board} onClick={onOpenBoard} />)}
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
          <div className="divide-y divide-border/50">{MY_TASKS.map((task) => <TaskRow key={task.id} task={task} />)}</div>
          <div className="border-t border-border/50"><button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors"><Plus className="h-4 w-4" />Add a task</button></div>
        </div>
      </section>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appView, setAppView] = useState<AppView>("home");
  const [notifOpen, setNotifOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [createTaskOpen,  setCreateTaskOpen]  = useState(false);
  const [inviteMemberOpen,  setInviteMemberOpen]  = useState(false);
  const [manageLabelsOpen,  setManageLabelsOpen]  = useState(false);

  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoginPage onSignIn={() => setIsAuthenticated(true)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Which sidebar nav item is highlighted
  const sidebarNav: NavItem =
    appView === "tasks"         ? "tasks"
    : appView === "notifications" ? "notifications"
    : appView === "settings"      ? "settings"
    : "home";

  function handleSidebarNav(n: NavItem) {
    setAppView(
      n === "tasks"         ? "tasks"
      : n === "notifications" ? "notifications"
      : n === "settings"      ? "settings"
      : "home"
    );
    setNotifOpen(false);
  }

  return (
    <div className="flex h-screen w-screen bg-background font-['Inter'] overflow-hidden">

      {/* ── Permanent Sidebar ─────────────────────────────────────────────── */}
      <Sidebar
        active={sidebarNav}
        onNav={handleSidebarNav}
        onOpenBoard={() => { setAppView("board"); setNotifOpen(false); }}
        onCreateBoard={() => setCreateBoardOpen(true)}
      />

      {/* ── Main content column ───────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {appView === "board" ? (
            /* Board view: full-height, sidebar stays visible on left */
            <motion.div
              key="board"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col flex-1 min-w-0 overflow-hidden"
            >
              <BoardDetail
                onBack={() => setAppView("home")}
                onCreateTask={() => setCreateTaskOpen(true)}
                onInvite={() => setInviteMemberOpen(true)}
                onManageLabels={() => setManageLabelsOpen(true)}
                onTaskClick={() => setTaskDetailOpen(true)}
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
              <header className="flex items-center justify-between px-8 py-4 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search tasks, boards…"
                    className="w-72 rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setNotifOpen((v) => !v)}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${notifOpen ? "bg-secondary/50 text-foreground" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`}
                    >
                      <Bell className="h-4 w-4" />
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary border-2 border-background" />
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
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#6366f1" }}
                  >
                    AJ
                  </button>
                </div>
              </header>

              {/* Scrollable content area */}
              <main className={`flex-1 min-h-0 w-full ${appView === "settings" ? "flex overflow-hidden" : "overflow-y-auto"}`}>
                {appView === "home" && (
                  <DashboardHome onOpenBoard={() => setAppView("board")} onCreateTask={() => setCreateTaskOpen(true)} />
                )}
                {appView === "tasks" && (
                  <div className="px-8 py-8 w-full">
                    <h1 className="text-2xl font-semibold text-foreground mb-1">My Tasks</h1>
                    <p className="text-sm text-muted-foreground mb-6">All tasks assigned to you across boards</p>
                    <div className="rounded-xl border border-border bg-card overflow-hidden w-full">
                      <div className="divide-y divide-border/50">
                        {MY_TASKS.map((task) => <TaskRow key={task.id} task={task} />)}
                      </div>
                    </div>
                  </div>
                )}
                {appView === "notifications" && (
                  <div className="px-8 py-8 w-full">
                    <h1 className="text-2xl font-semibold text-foreground mb-6">Notifications</h1>
                    <div className="flex flex-col gap-2">
                      {[
                        "Marcus Webb mentioned you in Product Roadmap",
                        "Emily Davis assigned a task to you",
                        "Sprint 24.2 ends in 2 days — 4 tasks overdue",
                      ].map((n, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card px-5 py-4">
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">{n}</p>
                        </div>
                      ))}
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
            onClose={() => setTaskDetailOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Create Board modal — fade + scale */}
      <AnimatePresence>
        {createBoardOpen && (
          <CreateBoardModal
            onClose={() => setCreateBoardOpen(false)}
            onCreate={() => {
              setCreateBoardOpen(false);
              setAppView("board");
            }}
          />
        )}
      </AnimatePresence>

      {/* Create Task modal — fade + scale */}
      <AnimatePresence>
        {createTaskOpen && (
          <CreateTaskModal
            onClose={() => setCreateTaskOpen(false)}
            onCreate={() => setCreateTaskOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Invite Member modal — fade + scale */}
      <AnimatePresence>
        {inviteMemberOpen && (
          <InviteMemberModal onClose={() => setInviteMemberOpen(false)} />
        )}
      </AnimatePresence>

      {/* Manage Labels modal — fade + scale */}
      <AnimatePresence>
        {manageLabelsOpen && (
          <ManageLabelsModal onClose={() => setManageLabelsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
