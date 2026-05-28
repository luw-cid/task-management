import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, Mail, Lock, Eye, EyeOff, User, ArrowRight,
  CheckCircle2, Circle, Clock, Plus, MoreHorizontal,
  Search, Bell, Settings, ChevronDown, ChevronRight, Calendar,
  Home, ClipboardList, Users, LayoutGrid, TrendingUp, AlertTriangle,
  ExternalLink, Hash, ChevronLeft,
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
import { BoardSettingsModal } from "./components/BoardSettingsModal";
import { NoNotificationsState } from "./components/EmptyStates";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthView = "login" | "signup";
type Priority = "low" | "medium" | "high" | "urgent";
type NavItem = "home" | "tasks" | "notifications" | "settings";
type AppView = "home" | "tasks" | "board" | "notifications" | "settings";

const ROUTES: Record<AppView, string> = {
  home: "/",
  tasks: "/tasks",
  board: "/boards/project-alpha",
  notifications: "/notifications",
  settings: "/settings",
};

function getViewFromPath(pathname: string): AppView {
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/boards/")) return "board";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/settings")) return "settings";
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

// ─── Sidebar + shared layout ──────────────────────────────────────────────────

function Sidebar({
  active,
  collapsed,
  onToggle,
  onNav,
  onOpenBoard,
  onCreateBoard,
}: {
  active: NavItem;
  collapsed: boolean;
  onToggle: () => void;
  onNav: (n: NavItem) => void;
  onOpenBoard: () => void;
  onCreateBoard: () => void;
}) {
  const [boardsOpen, setBoardsOpen] = useState(true);
  const navItems: { id: NavItem; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "home",          label: "Home",          icon: Home },
    { id: "tasks",         label: "My Tasks",      icon: ClipboardList },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3 },
    { id: "settings",      label: "Settings",      icon: Settings },
  ];
  const labelClass = `overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${
    collapsed ? "max-w-0 opacity-0 translate-x-1" : "max-w-[180px] opacity-100 translate-x-0"
  }`;

  return (
    <aside
      className={`relative flex h-full flex-col border-r border-border bg-card transition-[width,min-width] duration-300 ease-out ${
        collapsed ? "w-[72px] min-w-[72px]" : "w-[260px] min-w-[260px]"
      }`}
    >
      <button
        onClick={onToggle}
        className="absolute -right-3 top-24 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-lg shadow-black/20 hover:bg-secondary hover:text-foreground transition-all"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div className={`flex h-[72px] items-center gap-2.5 border-b border-border px-4 transition-all duration-300 ${
        collapsed ? "justify-center" : ""
      }`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow shadow-primary/30"><Zap className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
        <span className={`text-lg font-semibold text-foreground tracking-tight ${labelClass}`}>TaskFlow</span>
      </div>
      <div className="border-b border-border px-3 py-4">
        <button
          onClick={() => onNav("settings")}
          className={
            collapsed
              ? "group grid h-10 w-full place-items-center rounded-lg px-0 hover:bg-secondary/40 transition-colors"
              : "group flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary/40 transition-colors"
          }
          title={collapsed ? "Alice Johnson" : undefined}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white flex-shrink-0" style={{ backgroundColor: "#6366f1" }}>AJ</div>
          <div className={`flex-1 text-left min-w-0 ${labelClass}`}><p className="text-sm font-medium text-foreground truncate">Alice Johnson</p><p className="text-xs text-muted-foreground truncate">alice@taskflow.io</p></div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "opacity-100"}`} />
        </button>
      </div>
      <nav className={`px-3 py-3 flex flex-col ${collapsed ? "gap-2" : "gap-0.5"}`}>
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              title={collapsed ? label : undefined}
              className={`relative w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              } ${collapsed ? "h-10 justify-center px-0 py-0" : "px-3 py-2.5"}`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span className={`flex-1 text-left ${labelClass}`}>{label}</span>
              {badge != null && (
                <span className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white px-1.5 ${
                  collapsed ? "absolute -right-1 top-1" : ""
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
          onClick={() => !collapsed && setBoardsOpen(!boardsOpen)}
          className={`w-full flex items-center mb-1 text-muted-foreground ${collapsed ? "h-9 justify-center px-0" : "justify-between px-3 py-2"}`}
          title={collapsed ? "My Boards" : undefined}
        >
          <span className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground ${labelClass}`}>My Boards</span>
          {collapsed ? (
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          ) : (
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-all duration-300 ${boardsOpen ? "" : "-rotate-90"}`} />
          )}
        </button>
        {(boardsOpen || collapsed) && (
          <div className={`flex flex-col ${collapsed ? "gap-3 pt-2" : "gap-0.5"}`}>
            {MY_BOARDS.map((board) => (
              <button
                key={board.id}
                onClick={onOpenBoard}
                title={collapsed ? board.name : undefined}
                className={`w-full flex items-center gap-2.5 rounded-lg hover:bg-secondary/40 transition-colors group ${
                  collapsed ? "h-8 justify-center px-0 py-0" : "px-3 py-2"
                }`}
              >
                <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: board.color }} />
                <span className={`flex-1 text-left text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate ${labelClass}`}>{board.name}</span>
                <div className={`flex items-center gap-1 text-xs text-muted-foreground/60 ${labelClass}`}><Users className="h-3 w-3" /><span>{board.members}</span></div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-3 py-4 border-t border-border mt-2">
        <button
          onClick={onCreateBoard}
          className={`w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-2 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all ${
            collapsed ? "h-10 py-0" : "py-2.5"
          }`}
          title={collapsed ? "Create Board" : undefined}
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className={labelClass}>Create Board</span>
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
  const isOverdue = !done && new Date(task.deadline) < new Date();
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
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [createTaskOpen,  setCreateTaskOpen]  = useState(false);
  const [inviteMemberOpen,   setInviteMemberOpen]   = useState(false);
  const [manageLabelsOpen,   setManageLabelsOpen]   = useState(false);
  const [boardSettingsOpen,  setBoardSettingsOpen]  = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  const appView = getViewFromPath(location.pathname);
  const sidebarNav: NavItem =
    appView === "tasks"           ? "tasks"
    : appView === "notifications" ? "notifications"
    : appView === "settings"      ? "settings"
    : "home";

  function handleSidebarNav(n: NavItem) {
    navigate(
      n === "tasks"           ? ROUTES.tasks
      : n === "notifications" ? ROUTES.notifications
      : n === "settings"      ? ROUTES.settings
      : ROUTES.home
    );
    setNotifOpen(false);
  }

  return (
    <div className="flex h-screen w-screen bg-background font-['Inter'] overflow-hidden">

      {/* ── Permanent Sidebar ─────────────────────────────────────────────── */}
      <Sidebar
        active={sidebarNav}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        onNav={handleSidebarNav}
        onOpenBoard={() => { navigate(ROUTES.board); setNotifOpen(false); }}
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
                onBack={() => navigate(ROUTES.home)}
                onCreateTask={() => setCreateTaskOpen(true)}
                onInvite={() => setInviteMemberOpen(true)}
                onManageLabels={() => setManageLabelsOpen(true)}
                onTaskClick={() => setTaskDetailOpen(true)}
                onBoardSettings={() => setBoardSettingsOpen(true)}
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
                    placeholder="Search tasks, boards..."
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
              <main className={`flex-1 min-h-0 w-full ${appView === "settings" ? "flex overflow-hidden" : "overflow-y-auto"} ${appView === "notifications" ? "flex flex-col" : ""}`}>
                {appView === "home" && (
                  <DashboardHome onOpenBoard={() => navigate(ROUTES.board)} onCreateTask={() => setCreateTaskOpen(true)} />
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
                  <div className="flex flex-col h-full">
                    <div className="px-8 pt-8 pb-2 border-b border-border/50 flex-shrink-0">
                      <h1 className="text-2xl font-semibold text-foreground mb-1">Notifications</h1>
                      <p className="text-sm text-muted-foreground">Stay up to date with your team's activity</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <NoNotificationsState />
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
              navigate(ROUTES.board);
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

      {/* Board Settings modal — fade + scale */}
      <AnimatePresence>
        {boardSettingsOpen && (
          <BoardSettingsModal onClose={() => setBoardSettingsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
