import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Settings, Check, Lock, Users,
  Mail, Eye, User, Shield, Send, RefreshCw, Clock,
  Tag, Pencil, Trash2, Plus,
  Archive, AlertTriangle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const BOARD_PALETTE = [
  { hex: "#ef4444", name: "Red"    },
  { hex: "#f59e0b", name: "Amber"  },
  { hex: "#10b981", name: "Green"  },
  { hex: "#6366f1", name: "Indigo" },
  { hex: "#8b5cf6", name: "Purple" },
  { hex: "#ec4899", name: "Pink"   },
  { hex: "#06b6d4", name: "Cyan"   },
  { hex: "#64748b", name: "Slate"  },
];

const PRESET_LABEL_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#64748b",
];

const CURRENT_BOARD = "Project Alpha";

type Tab       = "general" | "members" | "labels" | "danger";
type Visibility = "private" | "team";
type Role       = "Viewer" | "Member" | "Admin";

// ─── Members data ─────────────────────────────────────────────────────────────

const SYSTEM_USERS = [
  { name: "Alice Johnson", email: "alice@taskflow.io",  color: "#6366f1" },
  { name: "Marcus Webb",   email: "marcus@taskflow.io", color: "#10b981" },
  { name: "Tom Wilson",    email: "tom@taskflow.io",    color: "#f59e0b" },
  { name: "Sarah Chen",    email: "sarah@taskflow.io",  color: "#06b6d4" },
  { name: "Priya Nair",    email: "priya@taskflow.io",  color: "#ef4444" },
  { name: "Alex Rivera",   email: "alex@taskflow.io",   color: "#8b5cf6" },
  { name: "Emily Davis",   email: "emily@taskflow.io",  color: "#ec4899" },
  { name: "Raj Patel",     email: "raj@taskflow.io",    color: "#f97316" },
];

const ROLE_CONFIG: Record<Role, { Icon: React.ElementType; color: string; pillBg: string; pillText: string; desc: string }> = {
  Viewer: { Icon: Eye,    color: "#64748b", pillBg: "bg-[#64748b]/12", pillText: "text-[#94a3b8]", desc: "Can view tasks and comments only" },
  Member: { Icon: User,   color: "#3b82f6", pillBg: "bg-[#3b82f6]/12", pillText: "text-[#60a5fa]", desc: "Can create and manage tasks" },
  Admin:  { Icon: Shield, color: "#6366f1", pillBg: "bg-[#6366f1]/12", pillText: "text-[#818cf8]", desc: "Full board management access" },
};

interface PendingInvite {
  id: string;
  email: string;
  name?: string;
  avatarColor: string;
  role: Role;
  sentAt: string;
  resending?: boolean;
}

const SEED_PENDING: PendingInvite[] = [
  { id: "p1", email: "sarah.k@company.com", avatarColor: "#0ea5e9", role: "Member", sentAt: "2 days ago" },
  { id: "p2", email: "dev.mike@startup.io", avatarColor: "#8b5cf6", role: "Viewer",  sentAt: "5 days ago" },
];

// ─── Labels data ─────────────────────────────────────────────────────────────

interface Label { id: string; name: string; color: string; }

const SEED_LABELS: Label[] = [
  { id: "l1", name: "Frontend", color: "#6366f1" },
  { id: "l2", name: "Backend",  color: "#8b5cf6" },
  { id: "l3", name: "Mobile",   color: "#f59e0b" },
  { id: "l4", name: "Auth",     color: "#ef4444" },
  { id: "l5", name: "Design",   color: "#06b6d4" },
  { id: "l6", name: "DevOps",   color: "#10b981" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
function initials(name: string)  { return name.split(" ").map(n => n[0]).join("").toUpperCase(); }
function emailInitial(email: string) { return email.charAt(0).toUpperCase(); }
function avatarBgColor(s: string) {
  const p = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#f97316"];
  return p[s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % p.length];
}

// ─── ColorDot (shared for labels palette) ─────────────────────────────────────

function ColorDot({ color, selected, onClick }: { color: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative h-6 w-6 rounded-full flex-shrink-0 transition-all duration-150 hover:scale-110 focus:outline-none"
      style={{
        backgroundColor: color,
        boxShadow:  selected ? `0 0 0 2px #111827, 0 0 0 3.5px ${color}` : undefined,
        transform:  selected ? "scale(1.18)" : undefined,
      }}
      title={color}
    >
      {selected && <Check className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow-sm" strokeWidth={2.8} />}
    </button>
  );
}

// ─── General Tab ─────────────────────────────────────────────────────────────

function GeneralTab() {
  const [name,        setName]        = useState(CURRENT_BOARD);
  const [description, setDescription] = useState("Track features, milestones, and releases for the core product.");
  const [color,       setColor]       = useState("#6366f1");
  const [visibility,  setVisibility]  = useState<Visibility>("team");
  const [saved,       setSaved]       = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-5">

      {/* Board Name */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#f1f5f9]">Board Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value.slice(0, 255))}
          placeholder="e.g. Project Alpha"
          className="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#f1f5f9]">Description</label>
          <span className="text-[10px] text-[#475569]">Optional</span>
        </div>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What is this board about?"
          rows={3}
          className="w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] transition-all resize-none leading-relaxed"
        />
      </div>

      {/* Board Color */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#f1f5f9]">Board Color</label>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors duration-200"
            style={{ backgroundColor: color + "22", color }}
          >
            {BOARD_PALETTE.find(p => p.hex === color)?.name ?? "Custom"}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {BOARD_PALETTE.map(({ hex, name: label }) => {
            const isSelected = color === hex;
            return (
              <button
                key={hex}
                type="button"
                onClick={() => setColor(hex)}
                title={label}
                className="relative flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 transition-all duration-150 hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: hex,
                  boxShadow: isSelected ? `0 0 0 2.5px #111827, 0 0 0 4.5px ${hex}` : undefined,
                  transform:  isSelected ? "scale(1.12)" : undefined,
                }}
              >
                {isSelected && <Check className="h-[14px] w-[14px] text-white drop-shadow-sm" strokeWidth={2.8} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visibility */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-[#f1f5f9]">Visibility</label>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#334155] bg-[#0f172a] p-1">
          {([
            { value: "private" as Visibility, label: "Private", Icon: Lock,  desc: "Invite only"  },
            { value: "team"    as Visibility, label: "Team",    Icon: Users, desc: "All members"  },
          ] as const).map(({ value, label, Icon, desc }) => {
            const active = visibility === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setVisibility(value)}
                className={[
                  "flex flex-col items-center gap-1 rounded-lg px-4 py-2.5 text-xs font-medium transition-all",
                  active ? "bg-[#334155] text-[#f1f5f9] shadow-sm" : "text-[#64748b] hover:text-[#94a3b8]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" style={{ color: active ? color : undefined }} />
                <span>{label}</span>
                <span className={`text-[10px] font-normal ${active ? "text-[#94a3b8]" : "text-[#475569]"}`}>{desc}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[#64748b] leading-relaxed">
          {visibility === "private"
            ? "Only you and invited members can access this board."
            : "All workspace members can view and join this board."}
        </p>
      </div>

      {/* Save Changes */}
      <button
        type="button"
        onClick={handleSave}
        className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.99]"
        style={{
          backgroundColor: saved ? "#10b981" : color,
          boxShadow: `0 4px 16px -4px ${saved ? "#10b98150" : color + "50"}`,
        }}
      >
        {saved
          ? <><Check className="h-4 w-4" strokeWidth={2.5} /> Changes Saved!</>
          : "Save Changes"
        }
      </button>
    </div>
  );
}

// ─── Members Tab ─────────────────────────────────────────────────────────────

function MembersTab() {
  const [email,           setEmail]           = useState("");
  const [selectedRole,    setSelectedRole]    = useState<Role>("Member");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pendingList,     setPendingList]     = useState<PendingInvite[]>(SEED_PENDING);
  const [sendSuccess,     setSendSuccess]     = useState(false);
  const [emailError,      setEmailError]      = useState("");

  const emailRef      = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        suggestionRef.current && !suggestionRef.current.contains(e.target as Node) &&
        emailRef.current    && !emailRef.current.contains(e.target as Node)
      ) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = SYSTEM_USERS.filter(u =>
    email.length >= 1 &&
    (u.email.toLowerCase().includes(email.toLowerCase()) || u.name.toLowerCase().includes(email.toLowerCase())) &&
    !pendingList.some(p => p.email === u.email)
  ).slice(0, 5);

  function handleSend() {
    if (!email.trim())    { setEmailError("Please enter an email address."); return; }
    if (!isValidEmail(email)) { setEmailError("Please enter a valid email address."); return; }
    if (pendingList.some(p => p.email.toLowerCase() === email.trim().toLowerCase())) {
      setEmailError("An invitation was already sent to this address."); return;
    }
    setEmailError("");
    const su = SYSTEM_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    setPendingList(prev => [{
      id: `p${Date.now()}`, email: email.trim(), name: su?.name,
      avatarColor: su?.color ?? avatarBgColor(email.trim()), role: selectedRole, sentAt: "Just now",
    }, ...prev]);
    setEmail("");
    setSendSuccess(true);
    setTimeout(() => setSendSuccess(false), 2800);
  }

  function handleResend(id: string) {
    setPendingList(prev => prev.map(p => p.id === id ? { ...p, resending: true, sentAt: "Just now" } : p));
    setTimeout(() => setPendingList(prev => prev.map(p => p.id === id ? { ...p, resending: false } : p)), 1200);
  }

  const canSend = email.trim().length > 0 && isValidEmail(email);

  return (
    <div className="flex flex-col gap-5 px-6 py-5">

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#f1f5f9]">Email Address</label>
        <div className="relative">
          <div className={[
            "flex items-center gap-2.5 rounded-xl border bg-[#0f172a] px-3.5 transition-all",
            emailError
              ? "border-[#ef4444] ring-2 ring-[#ef4444]/20"
              : "border-[#1e293b] focus-within:border-[#6366f1]/50 focus-within:ring-2 focus-within:ring-[#6366f1]/15",
          ].join(" ")}>
            <Mail className="h-4 w-4 text-[#334155] flex-shrink-0" />
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(""); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              placeholder="Enter email address..."
              className="flex-1 bg-transparent py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#334155] focus:outline-none"
            />
            {email && (
              <button type="button" onClick={() => { setEmail(""); setEmailError(""); }}
                className="flex h-5 w-5 items-center justify-center rounded-full text-[#334155] hover:bg-[#1e293b] hover:text-[#64748b] transition-colors flex-shrink-0">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {showSuggestions && filtered.length > 0 && (
            <div ref={suggestionRef} className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl border border-[#1e293b] bg-[#111827] shadow-xl shadow-black/50 overflow-hidden">
              <div className="px-3 pt-2.5 pb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#334155]">Matching members</p>
              </div>
              {filtered.map((u, i) => (
                <button key={u.email} type="button"
                  onMouseDown={e => { e.preventDefault(); setEmail(u.email); setEmailError(""); setShowSuggestions(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-[#1e293b] transition-colors ${i < filtered.length - 1 ? "border-b border-[#0f172a]" : ""}`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: u.color }}>{initials(u.name)}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-[#f1f5f9] truncate">{u.name}</p><p className="text-xs text-[#475569] truncate">{u.email}</p></div>
                  <span className="text-[10px] text-[#334155] flex-shrink-0">↵ select</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {emailError && (
          <p className="text-xs text-[#ef4444] flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[#ef4444] flex-shrink-0" />{emailError}
          </p>
        )}
      </div>

      {/* Role selector */}
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-medium text-[#f1f5f9]">Role</label>
        <div className="grid grid-cols-3 gap-2">
          {(["Viewer", "Member", "Admin"] as Role[]).map(role => {
            const { Icon, color, desc } = ROLE_CONFIG[role];
            const active = selectedRole === role;
            return (
              <button key={role} type="button" onClick={() => setSelectedRole(role)}
                className="relative flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all duration-150 active:scale-[0.98]"
                style={{ border: `1.5px solid ${active ? color : "#1e293b"}`, backgroundColor: active ? color + "0c" : "#0f172a", boxShadow: active ? `0 0 0 1px ${color}20, 0 4px 16px -4px ${color}20` : "none" }}>
                {active && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </span>
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: color + (active ? "20" : "14") }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold" style={{ color: active ? "#f1f5f9" : "#64748b" }}>{role}</span>
                  <span className="text-[10px] leading-snug" style={{ color: active ? "#94a3b8" : "#334155" }}>{desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Send button */}
      <button type="button" onClick={handleSend} disabled={!canSend && !sendSuccess}
        className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.99]"
        style={{
          backgroundColor: sendSuccess ? "#10b981" : canSend ? "#6366f1" : "#1e293b",
          color: canSend || sendSuccess ? "#fff" : "#334155",
          boxShadow: canSend && !sendSuccess ? "0 4px 16px -4px rgba(99,102,241,0.5)" : "none",
          cursor: canSend || sendSuccess ? "pointer" : "default",
        }}>
        {sendSuccess
          ? <><Check className="h-4 w-4" strokeWidth={2.5} />Invitation Sent!</>
          : <><Send className="h-4 w-4" />Send Invitation</>
        }
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#1e293b]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#334155]">Pending Invitations</span>
        <div className="flex-1 h-px bg-[#1e293b]" />
      </div>

      {/* Pending list */}
      <div className="flex flex-col gap-2">
        {pendingList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e293b]"><Mail className="h-5 w-5 text-[#334155]" /></div>
            <p className="text-sm text-[#334155]">No pending invitations</p>
          </div>
        ) : (
          pendingList.map(invite => {
            const { pillBg, pillText } = ROLE_CONFIG[invite.role];
            return (
              <div key={invite.id} className="group flex items-center gap-3 rounded-xl border border-[#1e293b] bg-[#0c1421] px-4 py-3 hover:border-[#334155]/60 transition-all">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: invite.avatarColor }}>
                  {invite.name ? initials(invite.name) : emailInitial(invite.email)}
                </div>
                <div className="flex-1 min-w-0">
                  {invite.name && <p className="text-xs font-semibold text-[#f1f5f9] truncate">{invite.name}</p>}
                  <p className="text-xs text-[#64748b] truncate">{invite.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="h-2.5 w-2.5 text-[#334155] flex-shrink-0" />
                    <span className="text-[10px] text-[#334155]">Sent {invite.sentAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${pillBg} ${pillText}`}>{invite.role}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-0.5 text-[10px] font-semibold text-[#f59e0b]">
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0 bg-[#f59e0b]" />
                    Pending
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => handleResend(invite.id)} title="Resend invitation"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#6366f1]/15 hover:text-[#6366f1] transition-colors">
                    <RefreshCw className="h-3.5 w-3.5" style={{ animation: invite.resending ? "spin 0.8s linear infinite" : "none" }} />
                  </button>
                  <button type="button" onClick={() => setPendingList(prev => prev.filter(p => p.id !== invite.id))} title="Cancel invitation"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#ef4444]/12 hover:text-[#ef4444] transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
        {pendingList.length > 0 && (
          <p className="text-center text-[11px] text-[#334155] mt-1">
            {pendingList.length} pending invitation{pendingList.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Labels Tab ───────────────────────────────────────────────────────────────

function LabelsTab() {
  const [newColor,     setNewColor]     = useState("#6366f1");
  const [newName,      setNewName]      = useState("");
  const [newNameError, setNewNameError] = useState("");
  const [labels,       setLabels]       = useState<Label[]>(SEED_LABELS);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editColor,    setEditColor]    = useState("");
  const [editName,     setEditName]     = useState("");

  const newNameRef  = useRef<HTMLInputElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) setTimeout(() => editNameRef.current?.focus(), 40);
  }, [editingId]);

  function startEdit(label: Label) { setEditingId(label.id); setEditColor(label.color); setEditName(label.name); }
  function saveEdit() {
    if (!editName.trim()) return;
    setLabels(prev => prev.map(l => l.id === editingId ? { ...l, name: editName.trim(), color: editColor } : l));
    setEditingId(null);
  }
  function addLabel() {
    const trimmed = newName.trim();
    if (!trimmed) { setNewNameError("Enter a label name."); return; }
    if (labels.some(l => l.name.toLowerCase() === trimmed.toLowerCase())) { setNewNameError("A label with this name already exists."); return; }
    setLabels(prev => [...prev, { id: `l${Date.now()}`, name: trimmed, color: newColor }]);
    setNewName(""); setNewNameError("");
    newNameRef.current?.focus();
  }

  return (
    <div className="flex flex-col">
      {/* Create section */}
      <div className="px-6 pt-5 pb-4 border-b border-[#1e293b]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#334155] mb-3">Create New Label</p>
        <div className="flex items-center gap-2 flex-wrap mb-3.5">
          {PRESET_LABEL_COLORS.map(c => (
            <ColorDot key={c} color={c} selected={newColor === c} onClick={() => setNewColor(c)} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex-shrink-0 transition-colors duration-200"
            style={{ backgroundColor: newColor + "22", border: `2px solid ${newColor}55`, boxShadow: `inset 0 0 0 3px ${newColor}` }}
          />
          <input
            ref={newNameRef}
            type="text"
            value={newName}
            onChange={e => { setNewName(e.target.value.slice(0, 32)); setNewNameError(""); }}
            onKeyDown={e => e.key === "Enter" && addLabel()}
            placeholder="Label name"
            className={[
              "flex-1 rounded-lg border bg-[#1e293b] px-3 py-2 text-sm text-[#f1f5f9]",
              "placeholder:text-[#334155] focus:outline-none focus:ring-2 transition-all",
              newNameError
                ? "border-[#ef4444] focus:ring-[#ef4444]/20 focus:border-[#ef4444]"
                : "border-[#334155] focus:ring-[#6366f1]/20 focus:border-[#6366f1]/60",
            ].join(" ")}
          />
          <button type="button" onClick={addLabel}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-all active:scale-[0.97] flex-shrink-0"
            style={{ backgroundColor: newColor, boxShadow: `0 2px 10px -2px ${newColor}60` }}>
            <Plus className="h-3.5 w-3.5" />Add
          </button>
        </div>
        {newNameError && <p className="mt-1.5 text-[11px] text-[#ef4444] pl-10">{newNameError}</p>}
      </div>

      {/* Existing labels */}
      <div className="px-6 py-4 flex flex-col gap-1">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#334155]">Existing Labels</p>
          <span className="inline-flex items-center justify-center h-4 min-w-[18px] rounded-full px-1.5 text-[9px] font-bold text-[#94a3b8] bg-[#1e293b]">{labels.length}</span>
        </div>

        {labels.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e293b]"><Tag className="h-5 w-5 text-[#334155]" /></div>
            <p className="text-sm text-[#334155]">No labels yet</p>
          </div>
        ) : labels.map(label => {
          const isEditing = editingId === label.id;
          return isEditing ? (
            <div key={label.id} className="flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all"
              style={{ borderColor: editColor + "40", backgroundColor: editColor + "08" }}>
              <div className="h-6 w-6 rounded-full flex-shrink-0" style={{ backgroundColor: editColor }} />
              <input ref={editNameRef} type="text" value={editName}
                onChange={e => setEditName(e.target.value.slice(0, 32))}
                onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                className="flex-1 min-w-0 rounded-lg border border-[#334155] bg-[#0f172a] px-2.5 py-1.5 text-sm text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]/60 transition-all"
              />
              <button type="button" onClick={saveEdit}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#10b981]/12 text-[#10b981] hover:bg-[#10b981]/22 transition-colors flex-shrink-0">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <button type="button" onClick={() => setEditingId(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ef4444]/8 text-[#ef4444]/50 hover:bg-[#ef4444]/15 hover:text-[#ef4444] transition-colors flex-shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div key={label.id} className="group flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[#1e293b]/60 transition-colors">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium select-none"
                style={{ backgroundColor: label.color + "16", color: label.color, border: `1px solid ${label.color}28` }}>
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                <span className="truncate max-w-[180px]">{label.name}</span>
              </span>
              <div className="flex-1" />
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
                <button type="button" onClick={() => startEdit(label)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#1e293b] hover:text-[#94a3b8] transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button"
                  onClick={() => { setLabels(prev => prev.filter(l => l.id !== label.id)); if (editingId === label.id) setEditingId(null); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#ef4444]/12 hover:text-[#ef4444] transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Danger Zone Tab ──────────────────────────────────────────────────────────

function DangerZoneTab({ onDeleteClick, onArchive }: { onDeleteClick: () => void; onArchive: () => void }) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      {/* Archive Board */}
      <div className="rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Archive className="h-4 w-4 text-[#ef4444]/70 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-[#f1f5f9]">Archive Board</h3>
            </div>
            <p className="text-xs text-[#64748b] leading-relaxed">Archive this board to hide it from the workspace. Archived boards can be restored at any time from your account settings.</p>
          </div>
          <button
            type="button"
            onClick={onArchive}
            className="flex-shrink-0 rounded-lg border border-[#ef4444]/40 px-4 py-2 text-xs font-semibold text-[#ef4444] hover:bg-[#ef4444]/10 active:scale-[0.98] transition-all"
          >
            Archive
          </button>
        </div>
      </div>

      {/* Delete Board */}
      <div className="rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/8 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="h-4 w-4 text-[#ef4444] flex-shrink-0" />
              <h3 className="text-sm font-semibold text-[#f1f5f9]">Delete this board</h3>
            </div>
            <p className="text-xs text-[#64748b] leading-relaxed">Once deleted, all data will be permanently removed. This action cannot be undone and there is no recovery option.</p>
          </div>
          <button
            type="button"
            onClick={onDeleteClick}
            className="flex-shrink-0 rounded-lg bg-[#ef4444] px-4 py-2 text-xs font-semibold text-white hover:bg-[#dc2626] active:scale-[0.98] transition-all shadow shadow-[#ef4444]/25"
          >
            Delete Board
          </button>
        </div>
      </div>

      {/* Helpful note */}
      <div className="flex items-start gap-2.5 rounded-lg border border-[#334155]/50 bg-[#0f172a] px-4 py-3">
        <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#64748b] leading-relaxed">
          Consider <span className="text-[#f59e0b] font-medium">archiving</span> instead of deleting if you may need this board again. Archiving is reversible, deletion is not.
        </p>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({ boardName, onClose, onConfirm }: { boardName: string; onClose: () => void; onConfirm: () => void }) {
  const [inputValue, setInputValue] = useState("");
  const isMatch = inputValue.trim().toLowerCase() === boardName.toLowerCase();

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center p-6 rounded-2xl"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="w-full max-w-[360px] rounded-2xl border border-[#ef4444]/30 bg-[#0d1526] shadow-2xl shadow-black/80 overflow-hidden"
        initial={{ scale: 0.94, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 10 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="h-[3px] w-full bg-[#ef4444]" />
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ef4444]/15 flex-shrink-0">
              <Trash2 className="h-4 w-4 text-[#ef4444]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#f1f5f9]">Delete Board</h3>
              <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">
                This action is permanent. All tasks, comments, and board data will be deleted forever.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[#94a3b8]">
              Type <span className="font-semibold text-[#f1f5f9]">"{boardName}"</span> to confirm
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={boardName}
              autoFocus
              className="w-full rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/30 focus:border-[#ef4444]/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-[#334155] px-4 py-2 text-sm font-medium text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9] transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={isMatch ? onConfirm : undefined}
              className="flex-[2] rounded-lg px-4 py-2 text-xs font-semibold transition-all text-center"
              style={{
                backgroundColor: isMatch ? "#ef4444" : "#2a1212",
                color:           isMatch ? "#fff"    : "#7f3232",
                boxShadow:       isMatch ? "0 4px 12px -4px rgba(239,68,68,0.5)" : "none",
                cursor:          isMatch ? "pointer" : "default",
              }}
            >
              I understand, delete this board
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export function BoardSettingsModal({ onClose }: Props) {
  const [activeTab,        setActiveTab]        = useState<Tab>("general");
  const [showDeleteConfirm,setShowDeleteConfirm]= useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showDeleteConfirm) { setShowDeleteConfirm(false); return; }
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, showDeleteConfirm]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current && !showDeleteConfirm) onClose();
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "general", label: "General"     },
    { id: "members", label: "Members"     },
    { id: "labels",  label: "Labels"      },
    { id: "danger",  label: "Danger Zone" },
  ];

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
        className="relative flex flex-col w-full max-w-[520px] max-h-[90vh] rounded-2xl border border-[#334155] bg-[#111827] shadow-2xl shadow-black/70 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Accent stripe */}
        <div className="h-[3px] w-full flex-shrink-0 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#ec4899]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1]/15 flex-shrink-0">
              <Settings className="h-4 w-4 text-[#6366f1]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f1f5f9]">Board Settings</h2>
              <p className="text-xs text-[#475569] mt-0.5">{CURRENT_BOARD}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] hover:bg-[#1e293b] hover:text-[#94a3b8] transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex items-end gap-0 px-6 pt-4 border-b border-[#1e293b] flex-shrink-0">
          {TABS.map(tab => {
            const active   = activeTab === tab.id;
            const isDanger = tab.id === "danger";
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "relative pb-3 px-3 text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? isDanger ? "text-[#ef4444]" : "text-[#f1f5f9]"
                    : isDanger ? "text-[#ef4444]/45 hover:text-[#ef4444]/70" : "text-[#475569] hover:text-[#94a3b8]",
                ].join(" ")}
              >
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="board-settings-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: isDanger ? "#ef4444" : "#6366f1" }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable tab content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
            >
              {activeTab === "general" && <GeneralTab />}
              {activeTab === "members" && <MembersTab />}
              {activeTab === "labels"  && <LabelsTab />}
              {activeTab === "danger"  && (
                <DangerZoneTab
                  onDeleteClick={() => setShowDeleteConfirm(true)}
                  onArchive={onClose}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Delete Confirmation — floats inside the modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <DeleteConfirmModal
              boardName={CURRENT_BOARD}
              onClose={() => setShowDeleteConfirm(false)}
              onConfirm={() => { setShowDeleteConfirm(false); onClose(); }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  );
}
