import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X, Crown, Trash2, Mail, UserPlus, Check, Shield, Eye, User, RefreshCw
} from "lucide-react";
import { boardsApi } from "../../api";
import type { BoardMember } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "BOARD_ADMIN" | "MEMBER" | "VIEWER";
type InviteRole = "Admin" | "Member" | "Viewer";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  BOARD_ADMIN: { label: "Admin",  color: "#6366f1", bg: "bg-[#6366f1]/12 text-[#6366f1]", icon: Shield },
  MEMBER:      { label: "Member", color: "#3b82f6", bg: "bg-[#3b82f6]/12 text-[#3b82f6]", icon: User },
  VIEWER:      { label: "Viewer", color: "#94a3b8", bg: "bg-[#94a3b8]/12 text-[#94a3b8]", icon: Eye },
};

const INVITE_ROLES: InviteRole[] = ["Admin", "Member", "Viewer"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
  return colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
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
        <span className="text-[10px] text-muted-foreground">▼</span>
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
  isOwner,
  onRemove,
  isRemoving,
}: {
  member: BoardMember;
  isOwner: boolean;
  onRemove: (userId: number) => void;
  isRemoving: boolean;
}) {
  const roleMeta = ROLE_META[member.role] || ROLE_META.MEMBER;

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 hover:bg-secondary/10 transition-all ${isRemoving ? "opacity-40" : "opacity-100"}`}
    >
      {/* Avatar */}
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 select-none"
        style={{ backgroundColor: getAvatarColor(member.fullName) }}
      >
        {getInitials(member.fullName)}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground truncate">{member.fullName}</p>
          {isOwner && (
            <Crown className="h-3.5 w-3.5 text-[#f59e0b] flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{member.email}</p>
      </div>

      {/* Role badge */}
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${roleMeta.bg}`}>
        {isOwner ? "Owner" : roleMeta.label}
      </span>

      {/* Actions */}
      {!isOwner && (
        <button
          onClick={() => onRemove(member.userId)}
          disabled={isRemoving}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors disabled:opacity-40"
          title="Remove member"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function BoardMembersModal({ onClose, boardId }: { onClose: () => void; boardId?: number | null }) {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("Member");
  const [inviteErr, setInviteErr] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fetch Board Details to find the Owner
  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: boardsApi.getMyBoards,
  });

  const currentBoard = boardsQuery.data?.find((b) => b.id === boardId) ?? null;
  const ownerId = currentBoard?.ownerId;

  // Query actual board members
  const membersQuery = useQuery({
    queryKey: ["board-members", boardId],
    queryFn: () => {
      if (!boardId) throw new Error("No active board");
      return boardsApi.getBoardMembers(boardId);
    },
    enabled: !!boardId,
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; role: string }) => {
      if (!boardId) throw new Error("No active board");
      const apiRole = payload.role === "Admin" ? "BOARD_ADMIN" : payload.role === "Viewer" ? "VIEWER" : "MEMBER";
      return boardsApi.inviteMember(boardId, { email: payload.email, role: apiRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setInviteEmail("");
      setInviteSent(true);
      setTimeout(() => setInviteSent(false), 2000);
    },
    onError: (err: any) => {
      if (err.message === "Invalid request") {
        setInviteErr("This user is already a member of this board.");
      } else {
        setInviteErr(err.message || "Failed to invite member.");
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => {
      if (!boardId) throw new Error("No active board");
      return boardsApi.removeMember(boardId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });

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
    if (members.some(m => m.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      setInviteErr("This user is already a member of this board.");
      return;
    }
    setInviteErr("");
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  }

  const members = membersQuery.data ?? [];

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
              disabled={inviteMutation.isPending}
              className="flex items-center gap-1.5 h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.98] transition-all shadow shadow-primary/25 flex-shrink-0 disabled:opacity-50"
            >
              {inviteMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : inviteSent ? (
                <Check className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {inviteMutation.isPending ? "Sending..." : inviteSent ? "Sent!" : "Send Invite"}
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
          {membersQuery.isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading members...
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50 pb-2">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isOwner={member.userId === ownerId}
                  onRemove={(uid) => removeMutation.mutate(uid)}
                  isRemoving={removeMutation.isPending && removeMutation.variables === member.userId}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-secondary/20 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            Close
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
