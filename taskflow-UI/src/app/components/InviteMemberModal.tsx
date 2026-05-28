import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  X, Eye, User, Shield, Check, RefreshCw, Send, Mail,
  UserPlus, Clock, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "Viewer" | "Member" | "Admin";

interface SystemUser {
  name: string;
  email: string;
  color: string;
}

interface PendingInvite {
  id: string;
  email: string;
  name?: string;
  avatarColor: string;
  role: Role;
  sentAt: string;
  resending?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYSTEM_USERS: SystemUser[] = [
  { name: "Alice Johnson", email: "alice@taskflow.io",   color: "#6366f1" },
  { name: "Marcus Webb",   email: "marcus@taskflow.io",  color: "#10b981" },
  { name: "Tom Wilson",    email: "tom@taskflow.io",     color: "#f59e0b" },
  { name: "Sarah Chen",    email: "sarah@taskflow.io",   color: "#06b6d4" },
  { name: "Priya Nair",    email: "priya@taskflow.io",   color: "#ef4444" },
  { name: "Alex Rivera",   email: "alex@taskflow.io",    color: "#8b5cf6" },
  { name: "Emily Davis",   email: "emily@taskflow.io",   color: "#ec4899" },
  { name: "Raj Patel",     email: "raj@taskflow.io",     color: "#f97316" },
];

const ROLE_CONFIG: Record<Role, {
  Icon: React.ElementType;
  color: string;
  pillBg: string;
  pillText: string;
  desc: string;
}> = {
  Viewer: {
    Icon: Eye,
    color: "#64748b",
    pillBg: "bg-[#64748b]/12",
    pillText: "text-[#94a3b8]",
    desc: "Can view tasks and comments only",
  },
  Member: {
    Icon: User,
    color: "#3b82f6",
    pillBg: "bg-[#3b82f6]/12",
    pillText: "text-[#60a5fa]",
    desc: "Can create and manage tasks",
  },
  Admin: {
    Icon: Shield,
    color: "#6366f1",
    pillBg: "bg-[#6366f1]/12",
    pillText: "text-[#818cf8]",
    desc: "Full board management access",
  },
};

const SEED_PENDING: PendingInvite[] = [
  {
    id: "p1",
    email: "sarah.k@company.com",
    avatarColor: "#0ea5e9",
    role: "Member",
    sentAt: "2 days ago",
  },
  {
    id: "p2",
    email: "dev.mike@startup.io",
    avatarColor: "#8b5cf6",
    role: "Viewer",
    sentAt: "5 days ago",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function emailInitial(email: string) {
  return email.charAt(0).toUpperCase();
}

function avatarColor(name: string) {
  const palette = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#f97316"];
  return palette[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export function InviteMemberModal({ onClose }: Props) {
  const [email,          setEmail]          = useState("");
  const [selectedRole,   setSelectedRole]   = useState<Role>("Member");
  const [showSuggestions,setShowSuggestions]= useState(false);
  const [pendingList,    setPendingList]    = useState<PendingInvite[]>(SEED_PENDING);
  const [sendSuccess,    setSendSuccess]    = useState(false);
  const [emailError,     setEmailError]     = useState("");

  const overlayRef    = useRef<HTMLDivElement>(null);
  const emailRef      = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Auto-focus email on mount
  useEffect(() => { emailRef.current?.focus(); }, []);

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Click-outside closes suggestions
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target as Node) &&
        emailRef.current &&
        !emailRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = SYSTEM_USERS.filter(u =>
    email.length >= 1 &&
    (u.email.toLowerCase().includes(email.toLowerCase()) ||
     u.name.toLowerCase().includes(email.toLowerCase())) &&
    !pendingList.some(p => p.email === u.email)
  ).slice(0, 5);

  function handleSelectSuggestion(u: SystemUser) {
    setEmail(u.email);
    setEmailError("");
    setShowSuggestions(false);
    setTimeout(() => emailRef.current?.focus(), 0);
  }

  function handleSend() {
    if (!email.trim()) {
      setEmailError("Please enter an email address.");
      emailRef.current?.focus();
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    if (pendingList.some(p => p.email.toLowerCase() === email.trim().toLowerCase())) {
      setEmailError("An invitation was already sent to this address.");
      return;
    }
    setEmailError("");

    const systemUser = SYSTEM_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    const newInvite: PendingInvite = {
      id: `p${Date.now()}`,
      email: email.trim(),
      name: systemUser?.name,
      avatarColor: systemUser?.color ?? avatarColor(email.trim()),
      role: selectedRole,
      sentAt: "Just now",
    };
    setPendingList(prev => [newInvite, ...prev]);
    setEmail("");
    setSendSuccess(true);
    setTimeout(() => setSendSuccess(false), 2800);
  }

  function handleResend(id: string) {
    setPendingList(prev =>
      prev.map(p => p.id === id ? { ...p, resending: true, sentAt: "Just now" } : p)
    );
    setTimeout(() => {
      setPendingList(prev => prev.map(p => p.id === id ? { ...p, resending: false } : p));
    }, 1200);
  }

  function handleCancel(id: string) {
    setPendingList(prev => prev.filter(p => p.id !== id));
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  const canSend = email.trim().length > 0 && isValidEmail(email);

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
        className="relative flex flex-col w-full max-w-[520px] max-h-[92vh] rounded-2xl border border-[#334155] bg-[#111827] shadow-2xl shadow-black/70 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >

        {/* ── Accent stripe ─────────────────────────────────────────────── */}
        <div className="h-[3px] w-full flex-shrink-0 bg-gradient-to-r from-[#6366f1] via-[#3b82f6] to-[#06b6d4]" />

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#1e293b] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1]/15 flex-shrink-0">
              <UserPlus className="h-4 w-4 text-[#6366f1]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f1f5f9]">Invite Members</h2>
              <p className="text-xs text-[#475569] mt-0.5">Invite people to collaborate on this board</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] hover:bg-[#1e293b] hover:text-[#94a3b8] transition-colors flex-shrink-0 mt-0.5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-5 px-6 py-5">

            {/* ── Email field ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#f1f5f9]">
                Email Address
              </label>

              <div className="relative">
                {/* Input */}
                <div className={`flex items-center gap-2.5 rounded-xl border bg-[#0f172a] px-3.5 transition-all ${
                  emailError
                    ? "border-[#ef4444] ring-2 ring-[#ef4444]/20"
                    : showSuggestions && filtered.length > 0
                      ? "border-[#6366f1]/50 ring-2 ring-[#6366f1]/15"
                      : "border-[#1e293b] focus-within:border-[#6366f1]/50 focus-within:ring-2 focus-within:ring-[#6366f1]/15"
                }`}>
                  <Mail className="h-4 w-4 text-[#334155] flex-shrink-0" />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setEmailError("");
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                    placeholder="Enter email address..."
                    className="flex-1 bg-transparent py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#334155] focus:outline-none"
                  />
                  {email && (
                    <button
                      type="button"
                      onClick={() => { setEmail(""); setEmailError(""); emailRef.current?.focus(); }}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[#334155] hover:bg-[#1e293b] hover:text-[#64748b] transition-colors flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Suggestion dropdown */}
                {showSuggestions && filtered.length > 0 && (
                  <div
                    ref={suggestionRef}
                    className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl border border-[#1e293b] bg-[#111827] shadow-xl shadow-black/50 overflow-hidden"
                  >
                    <div className="px-3 pt-2.5 pb-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#334155]">
                        Matching members
                      </p>
                    </div>
                    {filtered.map((u, i) => (
                      <button
                        key={u.email}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); handleSelectSuggestion(u); }}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-[#1e293b] transition-colors ${i < filtered.length - 1 ? "border-b border-[#0f172a]" : ""}`}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: u.color }}
                        >
                          {initials(u.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#f1f5f9] truncate">{u.name}</p>
                          <p className="text-xs text-[#475569] truncate">{u.email}</p>
                        </div>
                        <span className="text-[10px] text-[#334155] flex-shrink-0">↵ select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {emailError && (
                <p className="text-xs text-[#ef4444] flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#ef4444] flex-shrink-0" />
                  {emailError}
                </p>
              )}
            </div>

            {/* ── Role selector ─────────────────────────────────────── */}
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-medium text-[#f1f5f9]">Role</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(["Viewer", "Member", "Admin"] as Role[]).map(role => {
                  const { Icon, color, desc } = ROLE_CONFIG[role];
                  const active = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className="relative flex flex-col items-center gap-2.5 rounded-xl p-3.5 text-center transition-all duration-150 active:scale-[0.98]"
                      style={{
                        border: `1.5px solid ${active ? color : "#1e293b"}`,
                        backgroundColor: active ? color + "0c" : "#0f172a",
                        boxShadow: active ? `0 0 0 1px ${color}20, 0 4px 16px -4px ${color}20` : "none",
                      }}
                    >
                      {/* Selected checkmark */}
                      {active && (
                        <span
                          className="absolute top-2 right-2 flex h-4.5 w-4.5 items-center justify-center rounded-full"
                          style={{ backgroundColor: color }}
                        >
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        </span>
                      )}

                      {/* Icon */}
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                        style={{ backgroundColor: color + (active ? "20" : "14") }}
                      >
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>

                      {/* Label */}
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: active ? "#f1f5f9" : "#64748b" }}
                        >
                          {role}
                        </span>
                        <span className="text-[10px] leading-snug" style={{ color: active ? "#94a3b8" : "#334155" }}>
                          {desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Role permission hint */}
              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2.5 border transition-colors"
                style={{
                  backgroundColor: ROLE_CONFIG[selectedRole].color + "0a",
                  borderColor: ROLE_CONFIG[selectedRole].color + "20",
                }}
              >
                {(() => { const { Icon, color } = ROLE_CONFIG[selectedRole]; return <Icon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color }} />; })()}
                <p className="text-[11px] text-[#64748b] leading-snug">
                  <span className="font-semibold" style={{ color: ROLE_CONFIG[selectedRole].color }}>
                    {selectedRole}:{" "}
                  </span>
                  {ROLE_CONFIG[selectedRole].desc.toLowerCase()}.
                  {selectedRole === "Admin" && " This person will be able to invite and remove members."}
                  {selectedRole === "Viewer" && " They won't be able to add or edit tasks."}
                  {selectedRole === "Member" && " They can also comment and update task status."}
                </p>
              </div>
            </div>

            {/* ── Send Invitation button ─────────────────────────────── */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend && !sendSuccess}
              className="relative flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.99] overflow-hidden"
              style={{
                backgroundColor: sendSuccess
                  ? "#10b981"
                  : canSend
                    ? "#6366f1"
                    : "#1e293b",
                color: canSend || sendSuccess ? "#fff" : "#334155",
                boxShadow: canSend && !sendSuccess ? "0 4px 16px -4px rgba(99,102,241,0.5)" : "none",
                cursor: canSend || sendSuccess ? "pointer" : "default",
              }}
            >
              {sendSuccess ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                  Invitation Sent!
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </button>

          </div>

          {/* ── Divider ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-6 py-2">
            <div className="flex-1 h-px bg-[#1e293b]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#334155] flex-shrink-0">
              Pending Invitations
            </span>
            <div className="flex-1 h-px bg-[#1e293b]" />
          </div>

          {/* ── Pending list ──────────────────────────────────────────── */}
          <div className="flex flex-col px-6 pb-6 gap-2 mt-1">
            {pendingList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e293b]">
                  <Mail className="h-5 w-5 text-[#334155]" />
                </div>
                <p className="text-sm text-[#334155]">No pending invitations</p>
              </div>
            ) : (
              pendingList.map(invite => {
                const { pillBg, pillText } = ROLE_CONFIG[invite.role];
                return (
                  <div
                    key={invite.id}
                    className="group flex items-center gap-3 rounded-xl border border-[#1e293b] bg-[#0c1421] px-4 py-3 hover:border-[#334155]/60 transition-all"
                  >
                    {/* Avatar */}
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0 ring-2 ring-[#0c1421]"
                      style={{ backgroundColor: invite.avatarColor }}
                    >
                      {invite.name ? initials(invite.name) : emailInitial(invite.email)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {invite.name && (
                        <p className="text-xs font-semibold text-[#f1f5f9] truncate">{invite.name}</p>
                      )}
                      <p className="text-xs text-[#64748b] truncate">{invite.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-2.5 w-2.5 text-[#334155] flex-shrink-0" />
                        <span className="text-[10px] text-[#334155]">Sent {invite.sentAt}</span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${pillBg} ${pillText}`}>
                        {invite.role}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-0.5 text-[10px] font-semibold text-[#f59e0b]">
                        <span
                          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: "#f59e0b",
                            animation: "pendingPulse 2s ease-in-out infinite",
                          }}
                        />
                        Pending
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleResend(invite.id)}
                        title="Resend invitation"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#6366f1]/15 hover:text-[#6366f1] transition-colors"
                      >
                        <RefreshCw
                          className="h-3.5 w-3.5 transition-transform duration-700"
                          style={{ animation: invite.resending ? "spin 0.8s linear infinite" : "none" }}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(invite.id)}
                        title="Cancel invitation"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#ef4444]/12 hover:text-[#ef4444] transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Pending count hint */}
            {pendingList.length > 0 && (
              <p className="text-center text-[11px] text-[#334155] mt-1">
                {pendingList.length} pending invitation{pendingList.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes pendingPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
