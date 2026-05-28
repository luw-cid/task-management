import { useState, useRef, useEffect } from "react";
import {
  X, Crown, Trash2, ChevronDown, Mail, UserPlus,
  Check, Shield, Eye, User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "BOARD_ADMIN" | "MEMBER" | "VIEWER";
type InviteRole = "Admin" | "Member" | "Viewer";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  isOwner?: boolean;
  avatarColor: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  BOARD_ADMIN: { label: "Admin",  color: "#6366f1", bg: "bg-[#6366f1]/12 text-[#6366f1]", icon: Shield },
  MEMBER:      { label: "Member", color: "#3b82f6", bg: "bg-[#3b82f6]/12 text-[#3b82f6]", icon: User },
  VIEWER:      { label: "Viewer", color: "#94a3b8", bg: "bg-[#94a3b8]/12 text-[#94a3b8]", icon: Eye },
};

const INVITE_ROLES: InviteRole[] = ["Admin", "Member", "Viewer"];

const INVITE_ROLE_TO_ROLE: Record<InviteRole, Role> = {
  Admin:  "BOARD_ADMIN",
  Member: "MEMBER",
  Viewer: "VIEWER",
};

const INITIAL_MEMBERS: Member[] = [
  { id: "m1", name: "Alice Johnson",  email: "alice@taskflow.io",   role: "BOARD_ADMIN", isOwner: true,  avatarColor: "#6366f1" },
  { id: "m2", name: "Marcus Webb",    email: "marcus@taskflow.io",  role: "BOARD_ADMIN",                 avatarColor: "#8b5cf6" },
  { id: "m3", name: "Sarah Chen",     email: "sarah@taskflow.io",   role: "MEMBER",                      avatarColor: "#10b981" },
  { id: "m4", name: "Tom Wilson",     email: "tom@taskflow.io",     role: "MEMBER",                      avatarColor: "#f59e0b" },
  { id: "m5", name: "Priya Nair",     email: "priya@taskflow.io",   role: "MEMBER",                      avatarColor: "#ec4899" },
  { id: "m6", name: "Emily Davis",    email: "emily@taskflow.io",   role: "VIEWER",                      avatarColor: "#06b6d4" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Dropdown (role selector) ─────────────────────────────────────────────────

function RoleDropdown({
  value,
  onChange,
  compact = false,
}: {
  value: Role;
  onChange: (r: Role) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = ROLE_META[value];

  const roles: Role[] = ["BOARD_ADMIN", "MEMBER", "VIEWER"];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors ${compact ? "min-w-[90px]" : "min-w-[108px]"}`}
      >
        <span className="flex-1 text-left truncate">{current.label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-border bg-popover shadow-xl shadow-black/30 z-50 overflow-hidden py-1">
          {roles.map((r) => {
            const meta = ROLE_META[r];
            const Icon = meta.icon;
            return (
              <button
                key={r}
                onClick={() => { onChange(r); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-secondary/40 transition-colors"
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: meta.color }} />
                <span className="text-sm text-foreground flex-1">{meta.label}</span>
                {value === r && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Invite Role Dropdown ─────────────────────────────────────────────────────

function InviteRoleDropdown({
  value,
  onChange,
}: {
  value: InviteRole;
  onChange: (r: InviteRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-10 rounded-lg border border-border bg-input-background px-3 text-sm text-foreground hover:bg-secondary/40 transition-colors whitespace-nowrap"
      >
        {value}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-32 rounded-xl border border-border bg-popover shadow-xl shadow-black/30 z-50 overflow-hidden py-1">
          {INVITE_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { onChange(r); setOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-secondary/40 transition-colors"
            >
              <span className="text-sm text-foreground">{r}</span>
              {value === r && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  onRoleChange,
  onRemove,
}: {
  member: Member;
  onRoleChange: (id: string, role: Role) => void;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const roleMeta = ROLE_META[member.role];

  function handleRemove() {
    setRemoving(true);
    setTimeout(() => onRemove(member.id), 220);
  }

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 hover:bg-secondary/10 transition-all ${removing ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      style={{ transition: "opacity 220ms, transform 220ms" }}
    >
      {/* Avatar */}
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 select-none"
        style={{ backgroundColor: member.avatarColor }}
      >
        {getInitials(member.name)}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
          {member.isOwner && (
            <Crown className="h-3.5 w-3.5 text-[#f59e0b] flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{member.email}</p>
      </div>

      {/* Role badge */}
      <span className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${roleMeta.bg}`}>
        {member.isOwner ? "Owner" : roleMeta.label}
      </span>

      {/* Actions */}
      {member.isOwner ? (
        <div className="w-[140px] flex-shrink-0" />
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <RoleDropdown
            value={member.role}
            onChange={(r) => onRoleChange(member.id, r)}
          />
          <button
            onClick={handleRemove}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
            title="Remove member"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function BoardMembersModal({ onClose }: { onClose: () => void }) {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("Member");
  const [inviteErr, setInviteErr] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [saved, setSaved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleInvite() {
    if (!inviteEmail.trim()) { setInviteErr("Please enter an email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) { setInviteErr("Enter a valid email address."); return; }
    if (members.some((m) => m.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      setInviteErr("This person is already a member."); return;
    }
    setInviteErr("");
    const colors = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
    const newMember: Member = {
      id: `m${Date.now()}`,
      name: inviteEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email: inviteEmail.trim().toLowerCase(),
      role: INVITE_ROLE_TO_ROLE[inviteRole],
      avatarColor: colors[members.length % colors.length],
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail("");
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 2000);
  }

  function handleRoleChange(id: string, role: Role) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  function handleRemove(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        className="relative flex flex-col w-full max-w-[560px] max-h-[90vh] rounded-2xl border border-border bg-card shadow-2xl shadow-black/50"
        style={{ animation: "modalIn 180ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Board Members</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Invite section ── */}
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">Invite People</p>
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); if (inviteErr) setInviteErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                placeholder="Enter email address"
                className="w-full h-10 rounded-lg border border-border bg-input-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
              />
            </div>
            <InviteRoleDropdown value={inviteRole} onChange={setInviteRole} />
            <button
              onClick={handleInvite}
              className="flex items-center gap-1.5 h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.98] transition-all shadow shadow-primary/25 flex-shrink-0"
            >
              {inviteSent ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {inviteSent ? "Sent!" : "Send Invite"}
            </button>
          </div>
          {inviteErr && (
            <p className="text-xs text-[#ef4444] mt-2">{inviteErr}</p>
          )}
          {inviteSent && (
            <p className="text-xs text-[#10b981] mt-2">Invite sent successfully.</p>
          )}
        </div>

        {/* ── Members list (scrollable) ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 pt-4 pb-1 flex-shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Members</p>
          </div>
          <div className="flex flex-col divide-y divide-border/50 pb-2">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onRoleChange={handleRoleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-secondary/20 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.98] transition-all shadow shadow-primary/25"
          >
            {saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
