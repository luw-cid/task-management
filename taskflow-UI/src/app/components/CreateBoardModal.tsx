import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X, Lock, Users, Check, LayoutGrid } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  { hex: "#ef4444", name: "Red"    },
  { hex: "#f59e0b", name: "Amber"  },
  { hex: "#10b981", name: "Green"  },
  { hex: "#6366f1", name: "Indigo" },
  { hex: "#8b5cf6", name: "Purple" },
  { hex: "#ec4899", name: "Pink"   },
  { hex: "#06b6d4", name: "Cyan"   },
  { hex: "#64748b", name: "Slate"  },
];

type Visibility = "private" | "team";

export interface NewBoard {
  name: string;
  description: string;
  color: string;
  visibility: Visibility;
}

interface Props {
  onClose: () => void;
  onCreate?: (board: NewBoard) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateBoardModal({ onClose, onCreate }: Props) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor]             = useState("#6366f1");
  const [visibility, setVisibility]   = useState<Visibility>("private");
  const [nameError, setNameError]     = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef    = useRef<HTMLInputElement>(null);

  // Focus name on mount
  useEffect(() => { nameRef.current?.focus(); }, []);

  // Escape to close
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError("Board name is required."); nameRef.current?.focus(); return; }
    setNameError("");
    onCreate?.({ name: name.trim(), description: description.trim(), color, visibility });
    onClose();
  }

  const visibilityDesc =
    visibility === "private"
      ? "Only you and invited members can access this board."
      : "All workspace members can view and join this board.";

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
        className="relative flex flex-col w-full max-w-[480px] rounded-2xl border border-[#334155] bg-[#1e293b] shadow-2xl shadow-black/70 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Colour accent stripe ──────────────────────────────────────── */}
        <div
          className="h-[3px] w-full flex-shrink-0 transition-colors duration-300"
          style={{ backgroundColor: color }}
        />

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#334155] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 transition-colors duration-300"
              style={{ backgroundColor: color + "22" }}
            >
              <LayoutGrid className="h-4.5 w-4.5" style={{ color }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f1f5f9]">Create New Board</h2>
              <p className="text-xs text-[#64748b] mt-0.5">Set up a new workspace for your project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#334155]/60 hover:text-[#94a3b8] transition-colors flex-shrink-0 mt-0.5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Form body ────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5 px-6 py-5">

            {/* Board Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#f1f5f9]">
                Board Name
                <span className="text-[#ef4444] ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value.slice(0, 255));
                    if (nameError) setNameError("");
                  }}
                  placeholder="e.g. Project Alpha"
                  maxLength={255}
                  className={[
                    "w-full rounded-lg border bg-[#0f172a] px-3.5 py-2.5 pb-5 text-sm text-[#f1f5f9]",
                    "placeholder:text-[#475569] focus:outline-none transition-all",
                    nameError
                      ? "border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/25 focus:border-[#ef4444]"
                      : "border-[#334155] focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]",
                  ].join(" ")}
                />
                {/* Character count — bottom-right inside input */}
                <span className="absolute bottom-2 right-3 text-[10px] text-[#475569] pointer-events-none select-none">
                  {name.length}/255
                </span>
              </div>
              {nameError && (
                <p className="text-xs text-[#ef4444] flex items-center gap-1">{nameError}</p>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#f1f5f9]">Description</label>
                <span className="text-[10px] text-[#475569]">Optional</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                  {PALETTE.find((p) => p.hex === color)?.name}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {PALETTE.map(({ hex, name: label }) => {
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
                        boxShadow: isSelected
                          ? `0 0 0 2.5px #1e293b, 0 0 0 4.5px ${hex}`
                          : undefined,
                        transform: isSelected ? "scale(1.12)" : undefined,
                      }}
                    >
                      {isSelected && (
                        <Check
                          className="h-[14px] w-[14px] text-white drop-shadow-sm"
                          strokeWidth={2.8}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-[#f1f5f9]">Visibility</label>

              {/* Segmented control */}
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#334155] bg-[#0f172a] p-1">
                {(
                  [
                    { value: "private" as Visibility, label: "Private", Icon: Lock,  desc: "Invite only" },
                    { value: "team"    as Visibility, label: "Team",    Icon: Users, desc: "All members" },
                  ] as const
                ).map(({ value, label, Icon, desc }) => {
                  const active = visibility === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setVisibility(value)}
                      className={[
                        "flex flex-col items-center gap-1 rounded-lg px-4 py-2.5 text-xs font-medium transition-all",
                        active
                          ? "bg-[#334155] text-[#f1f5f9] shadow-sm"
                          : "text-[#64748b] hover:text-[#94a3b8]",
                      ].join(" ")}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: active ? color : undefined }}
                      />
                      <span>{label}</span>
                      <span className={`text-[10px] font-normal ${active ? "text-[#94a3b8]" : "text-[#475569]"}`}>
                        {desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Contextual hint */}
              <p className="text-[11px] text-[#64748b] leading-relaxed">{visibilityDesc}</p>
            </div>
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#334155] flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#334155] px-4 py-2 text-sm font-medium text-[#94a3b8] hover:bg-[#334155]/40 hover:text-[#f1f5f9] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition-all active:scale-[0.98] shadow"
              style={{ backgroundColor: color, boxShadow: `0 2px 12px -2px ${color}55` }}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Create Board
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
