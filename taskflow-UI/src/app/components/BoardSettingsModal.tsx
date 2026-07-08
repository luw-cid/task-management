import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Settings, Check, Lock, Users,
  Mail, Eye, User, Shield, Send, RefreshCw, Clock,
  Tag, Pencil, Trash2, Plus,
  Archive, AlertTriangle,
} from "lucide-react";
import { labelsApi, boardsApi } from "../../api";
import type { Label as ApiLabel } from "../../types";

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

type Tab       = "general" | "members" | "labels" | "danger";
type Visibility = "private" | "team";
type Role       = "Viewer" | "Member" | "Admin";

interface PendingInvite {
  id: string;
  email: string;
  name?: string;
  avatarColor: string;
  role: Role;
  sentAt: string;
  resending?: boolean;
}

const ROLE_CONFIG: Record<Role, { Icon: React.ElementType; color: string; pillBg: string; pillText: string; desc: string }> = {
  Viewer: { Icon: Eye,    color: "#64748b", pillBg: "bg-[#64748b]/12", pillText: "text-[#94a3b8]", desc: "Can view tasks and comments only" },
  Member: { Icon: User,   color: "#3b82f6", pillBg: "bg-[#3b82f6]/12", pillText: "text-[#60a5fa]", desc: "Can create and manage tasks" },
  Admin:  { Icon: Shield, color: "#6366f1", pillBg: "bg-[#6366f1]/12", pillText: "text-[#818cf8]", desc: "Full board management access" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
function initials(name: string)  { return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }
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
      className="relative flex h-7.5 w-7.5 items-center justify-center rounded-lg flex-shrink-0 transition-all duration-150 hover:scale-110 focus:outline-none"
      style={{
        backgroundColor: color,
        border: selected ? "2px solid #111827" : "none",
        boxShadow: selected ? `0 0 0 2px ${color}` : "none",
      }}
    >
      {selected && <Check className="h-4 w-4 text-white drop-shadow-sm" strokeWidth={2.8} />}
    </button>
  );
}

// ─── General Tab ─────────────────────────────────────────────────────────────

function GeneralTab({ boardId, currentBoard }: { boardId: number | null; currentBoard: any }) {
  const queryClient = useQueryClient();
  const [name,        setName]        = useState(currentBoard?.name ?? "");
  const [description, setDescription] = useState(currentBoard?.description ?? "");
  const [color,       setColor]       = useState(currentBoard?.color ?? "#6366f1");
  const [visibility,  setVisibility]  = useState<Visibility>("team");
  const [saved,       setSaved]       = useState(false);

  const updateBoardMutation = useMutation({
    mutationFn: (payload: { name: string; description: string }) => {
      if (!boardId) throw new Error("No active board");
      return boardsApi.updateBoard(boardId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    },
  });

  function handleSave() {
    updateBoardMutation.mutate({ name, description });
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
        disabled={updateBoardMutation.isPending}
        className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.99] disabled:opacity-50"
        style={{
          backgroundColor: saved ? "#10b981" : color,
          boxShadow: `0 4px 16px -4px ${saved ? "#10b98150" : color + "50"}`,
        }}
      >
        {updateBoardMutation.isPending ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <><Check className="h-4 w-4" strokeWidth={2.5} /> Changes Saved!</>
        ) : (
          "Save Changes"
        )}
      </button>
    </div>
  );
}

// ─── Members Tab ─────────────────────────────────────────────────────────────

function MembersTab({ boardId, ownerId }: { boardId: number | null; ownerId?: number }) {
  const queryClient = useQueryClient();
  const [email,           setEmail]           = useState("");
  const [selectedRole,    setSelectedRole]    = useState<Role>("Member");
  const [pendingList,     setPendingList]     = useState<PendingInvite[]>([]);
  const [sendSuccess,     setSendSuccess]     = useState(false);
  const [emailError,      setEmailError]      = useState("");

  const emailRef      = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  // Fetch actual members
  const membersQuery = useQuery({
    queryKey: ["board-members-settings", boardId],
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
      queryClient.invalidateQueries({ queryKey: ["board-members-settings", boardId] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setSendSuccess(true);
      setEmail("");
      setTimeout(() => setSendSuccess(false), 2800);
    },
    onError: (err: any) => {
      if (err.message === "Invalid request") {
        setEmailError("This user is already a member of this board.");
      } else {
        setEmailError(err.message || "Failed to invite member.");
      }
    }
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => {
      if (!boardId) throw new Error("No active board");
      return boardsApi.removeMember(boardId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members-settings", boardId] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });

  function handleSend() {
    if (!email.trim())    { setEmailError("Please enter an email address."); return; }
    if (!isValidEmail(email)) { setEmailError("Please enter a valid email address."); return; }
    if (members.some(m => m.email.toLowerCase() === email.trim().toLowerCase())) {
      setEmailError("This user is already a member of this board.");
      return;
    }
    setEmailError("");
    inviteMutation.mutate({ email: email.trim(), role: selectedRole });
  }

  const canSend = email.trim().length > 0 && isValidEmail(email);
  const members = membersQuery.data ?? [];

  return (
    <div className="flex flex-col gap-5 px-6 py-5">
      {/* Email */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#f1f5f9]">Email Address</label>
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
            onChange={e => { setEmail(e.target.value); setEmailError(""); }}
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            placeholder="Enter email address"
            className="flex-1 bg-transparent py-2.5 text-sm text-[#f1f5f9] placeholder:text-[#334155] focus:outline-none"
          />
        </div>
        {emailError && <p className="text-xs text-[#ef4444] mt-1">{emailError}</p>}
      </div>

      {/* Role */}
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-medium text-[#f1f5f9]">Role</label>
        <div className="grid grid-cols-3 gap-2.5">
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
      <button type="button" onClick={handleSend} disabled={(!canSend && !sendSuccess) || inviteMutation.isPending}
        className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.99] disabled:opacity-50"
        style={{
          backgroundColor: sendSuccess ? "#10b981" : canSend ? "#6366f1" : "#1e293b",
          color: canSend || sendSuccess ? "#fff" : "#334155",
          boxShadow: canSend && !sendSuccess ? "0 4px 16px -4px rgba(99,102,241,0.5)" : "none",
          cursor: canSend || sendSuccess ? "pointer" : "default",
        }}>
        {inviteMutation.isPending ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : sendSuccess ? (
          <><Check className="h-4 w-4" strokeWidth={2.5} />Invitation Sent!</>
        ) : (
          <><Send className="h-4 w-4" />Send Invitation</>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#1e293b]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#334155]">Current Members</span>
        <div className="flex-1 h-px bg-[#1e293b]" />
      </div>

      {/* Actual Members list */}
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
        {membersQuery.isLoading ? (
          <div className="text-xs text-muted-foreground text-center py-4">Loading members...</div>
        ) : (
          members.map(m => {
            const isOwner = m.userId === ownerId;
            return (
              <div key={m.id} className="group flex items-center justify-between rounded-xl border border-[#1e293b] bg-[#0c1421] px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: avatarBgColor(m.fullName) }}>
                    {initials(m.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f1f5f9] truncate">{m.fullName}</p>
                    <p className="text-[10px] text-[#64748b] truncate">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="rounded-full bg-[#3b82f6]/10 px-2 py-0.5 text-[9px] font-medium text-[#60a5fa]">
                    {isOwner ? "Owner" : m.role === "BOARD_ADMIN" ? "Admin" : m.role === "VIEWER" ? "Viewer" : "Member"}
                  </span>
                  {!isOwner && (
                    <button
                      onClick={() => removeMutation.mutate(m.userId)}
                      disabled={removeMutation.isPending}
                      className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Labels Tab ───────────────────────────────────────────────────────────────

function LabelsTab({ boardId }: { boardId: number | null }) {
  const queryClient = useQueryClient();
  const [newName,      setNewName]      = useState("");
  const [newColor,     setNewColor]     = useState(PRESET_LABEL_COLORS[0]);
  const [newNameError, setNewNameError] = useState("");
  const [submitError,  setSubmitError]  = useState("");
  const [editingId,    setEditingId]    = useState<number | null>(null);
  const [editName,     setEditName]     = useState("");
  const [editColor,    setEditColor]    = useState("");

  const newNameRef  = useRef<HTMLInputElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

  const labelsQuery = useQuery({
    queryKey: ["board-labels", boardId],
    queryFn: () => {
      if (!boardId) throw new Error("No active board selected");
      return labelsApi.getByBoard(boardId);
    },
    enabled: boardId !== null,
  });

  const createLabelMutation = useMutation({
    mutationFn: (payload: { name: string; color: string }) => {
      if (!boardId) throw new Error("No active board selected");
      return labelsApi.create(boardId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-labels", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] });
    },
  });

  const updateLabelMutation = useMutation({
    mutationFn: (payload: { id: number; name: string; color: string }) => {
      if (!boardId) throw new Error("No active board selected");
      return labelsApi.update(boardId, payload.id, { name: payload.name, color: payload.color });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-labels", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] });
    },
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (id: number) => {
      if (!boardId) throw new Error("No active board selected");
      return labelsApi.delete(boardId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-labels", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-tasks", boardId] });
    },
  });

  const labels = labelsQuery.data ?? [];

  useEffect(() => {
    if (editingId) setTimeout(() => editNameRef.current?.focus(), 40);
  }, [editingId]);

  function startEdit(label: ApiLabel) {
    setSubmitError("");
    setEditingId(label.id);
    setEditColor(label.color);
    setEditName(label.name);
  }

  async function saveEdit() {
    const trimmed = editName.trim();
    if (!trimmed || editingId === null) return;
    if (labels.some((label) => label.id !== editingId && label.name.toLowerCase() === trimmed.toLowerCase())) {
      setSubmitError("A label with this name already exists.");
      return;
    }

    try {
      setSubmitError("");
      await updateLabelMutation.mutateAsync({ id: editingId, name: trimmed, color: editColor });
      setEditingId(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to update label.");
    }
  }

  async function addLabel() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setNewNameError("Enter a label name.");
      return;
    }
    if (labels.some((label) => label.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewNameError("A label with this name already exists.");
      return;
    }

    try {
      setSubmitError("");
      await createLabelMutation.mutateAsync({ name: trimmed, color: newColor });
      setNewName("");
      setNewNameError("");
      newNameRef.current?.focus();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create label.");
    }
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
            onChange={e => { setNewName(e.target.value.slice(0, 32)); setNewNameError(""); setSubmitError(""); }}
            onKeyDown={e => { if (e.key === "Enter") void addLabel(); }}
            placeholder="Label name"
            className={[
              "flex-1 rounded-lg border bg-[#1e293b] px-3 py-2 text-sm text-[#f1f5f9]",
              "placeholder:text-[#334155] focus:outline-none focus:ring-2 transition-all",
              newNameError
                ? "border-[#ef4444] focus:ring-[#ef4444]/20 focus:border-[#ef4444]"
                : "border-[#334155] focus:ring-[#6366f1]/20 focus:border-[#6366f1]/60",
            ].join(" ")}
          />
          <button type="button" onClick={() => void addLabel()}
            disabled={boardId === null || createLabelMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-all active:scale-[0.97] flex-shrink-0"
            style={{ backgroundColor: newColor, boxShadow: `0 2px 10px -2px ${newColor}60` }}>
            <Plus className="h-3.5 w-3.5" />Add
          </button>
        </div>
        {newNameError && <p className="mt-1.5 text-[11px] text-[#ef4444] pl-10">{newNameError}</p>}
        {!newNameError && submitError && <p className="mt-1.5 text-[11px] text-[#ef4444] pl-10">{submitError}</p>}
      </div>

      {/* Existing labels */}
      <div className="px-6 py-4 flex flex-col gap-1">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#334155]">Existing Labels</p>
          <span className="inline-flex items-center justify-center h-4 min-w-[18px] rounded-full px-1.5 text-[9px] font-bold text-[#94a3b8] bg-[#1e293b]">{labels.length}</span>
        </div>

        {labelsQuery.isLoading ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm text-[#64748b]">Loading labels...</p>
          </div>
        ) : labels.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center bg-[#0c1421] rounded-xl border border-[#1e293b] border-dashed">
            <Tag className="h-5 w-5 text-[#334155]" />
            <p className="text-xs text-[#475569]">No labels created yet</p>
          </div>
        ) : labels.map(label => {
          const isEditing = editingId === label.id;
          if (isEditing) {
            return (
              <div key={label.id} className="flex items-center gap-2.5 rounded-xl border border-[#6366f1]/40 bg-[#6366f1]/5 px-4.5 py-3 transition-all duration-200">
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_LABEL_COLORS.map(c => (
                      <ColorDot key={c} color={c} selected={editColor === c} onClick={() => setEditColor(c)} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex-shrink-0 transition-colors duration-200"
                      style={{ backgroundColor: editColor + "22", border: `2px solid ${editColor}55`, boxShadow: `inset 0 0 0 3px ${editColor}` }} />
                    <input ref={editNameRef} type="text" value={editName} onChange={e => setEditName(e.target.value.slice(0, 32))}
                      onKeyDown={e => { if (e.key === "Enter") void saveEdit(); }}
                      className="flex-1 rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]/60 transition-all" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => void saveEdit()} disabled={updateLabelMutation.isPending}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25 transition-colors">
                    <Check className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-[#334155]/20 text-[#64748b] hover:bg-[#334155]/40 hover:text-[#94a3b8] transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={label.id} className="group flex items-center justify-between gap-3 rounded-xl border border-[#1e293b] bg-[#0c1421] px-4 py-3 hover:border-[#334155]/60 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color, boxShadow: `0 0 10px -1px ${label.color}b0` }} />
                <span className="text-sm font-medium text-[#f1f5f9] truncate">{label.name}</span>
                {label.taskCount > 0 && (
                  <span className="rounded-full bg-[#1e293b] px-2 py-0.5 text-[9px] font-semibold text-[#475569]">{label.taskCount} task{label.taskCount !== 1 ? "s" : ""}</span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => startEdit(label)} title="Edit label"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#6366f1]/15 hover:text-[#6366f1] transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button"
                  onClick={() => {
                    if (confirm(`Delete label "${label.name}"? This cannot be undone.`)) {
                      deleteLabelMutation.mutate(label.id);
                    }
                  }}
                  disabled={deleteLabelMutation.isPending}
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
  boardId: number | null;
}

export function BoardSettingsModal({ onClose, boardId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab,        setActiveTab]        = useState<Tab>("general");
  const [showDeleteConfirm,setShowDeleteConfirm]= useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Fetch actual board details from workspace
  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: boardsApi.getMyBoards,
  });

  const currentBoard = boardsQuery.data?.find((b) => b.id === boardId) ?? null;
  const boardName = currentBoard?.name ?? "Board Settings";

  const deleteBoardMutation = useMutation({
    mutationFn: () => {
      if (!boardId) throw new Error("No active board selected");
      return boardsApi.deleteBoard(boardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      onClose();
      navigate("/");
    },
  });

  const archiveBoardMutation = useMutation({
    mutationFn: () => {
      if (!boardId) throw new Error("No active board selected");
      return boardsApi.archiveBoard(boardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      onClose();
    },
  });

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
              <p className="text-xs text-[#475569] mt-0.5">{boardName}</p>
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
              {activeTab === "general" && <GeneralTab boardId={boardId} currentBoard={currentBoard} />}
              {activeTab === "members" && <MembersTab boardId={boardId} ownerId={currentBoard?.ownerId} />}
              {activeTab === "labels"  && <LabelsTab boardId={boardId} />}
              {activeTab === "danger"  && (
                <DangerZoneTab
                  onDeleteClick={() => setShowDeleteConfirm(true)}
                  onArchive={() => archiveBoardMutation.mutate()}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Delete Confirmation — floats inside the modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <DeleteConfirmModal
              boardName={boardName}
              onClose={() => setShowDeleteConfirm(false)}
              onConfirm={() => deleteBoardMutation.mutate()}
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
