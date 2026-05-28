import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { X, Check, Pencil, Trash2, Plus, Tag } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#64748b", // Slate
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Props {
  onClose: () => void;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_LABELS: Label[] = [
  { id: "l1", name: "Frontend",   color: "#6366f1" },
  { id: "l2", name: "Backend",    color: "#8b5cf6" },
  { id: "l3", name: "Mobile",     color: "#f59e0b" },
  { id: "l4", name: "Auth",       color: "#ef4444" },
  { id: "l5", name: "Design",     color: "#06b6d4" },
  { id: "l6", name: "DevOps",     color: "#10b981" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorDot({
  color,
  selected,
  onClick,
  size = 6,
}: {
  color: string;
  selected?: boolean;
  onClick?: () => void;
  size?: number;
}) {
  const dim = size === 5 ? "h-5 w-5" : size === 7 ? "h-7 w-7" : "h-6 w-6";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative ${dim} rounded-full flex-shrink-0 transition-all duration-150 hover:scale-110 focus:outline-none`}
      style={{
        backgroundColor: color,
        boxShadow: selected ? `0 0 0 2px #0f172a, 0 0 0 3.5px ${color}` : undefined,
        transform: selected ? "scale(1.18)" : undefined,
      }}
      title={color}
    >
      {selected && (
        <Check
          className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow-sm"
          strokeWidth={2.8}
        />
      )}
    </button>
  );
}

function ColorRow({
  selected,
  onChange,
  customRef,
}: {
  selected: string;
  onChange: (c: string) => void;
  customRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESET_COLORS.map(c => (
        <ColorDot key={c} color={c} selected={selected === c} onClick={() => onChange(c)} />
      ))}
      {/* Custom color */}
      <div className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => customRef.current?.click()}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-[#334155] text-[#475569] hover:border-[#6366f1]/60 hover:text-[#6366f1] hover:scale-110 transition-all"
          title="Custom color"
        >
          <Plus className="h-3 w-3" />
        </button>
        <input
          ref={customRef}
          type="color"
          value={selected}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ManageLabelsModal({ onClose }: Props) {
  // ── Create form ──
  const [newColor,     setNewColor]     = useState(PRESET_COLORS[6]); // indigo
  const [newName,      setNewName]      = useState("");
  const [newNameError, setNewNameError] = useState("");

  // ── Labels ──
  const [labels, setLabels] = useState<Label[]>(SEED_LABELS);

  // ── Edit state — start with "Mobile" in edit mode per spec ──
  const [editingId,     setEditingId]     = useState<string | null>("l3");
  const [editColor,     setEditColor]     = useState(SEED_LABELS[2].color);
  const [editName,      setEditName]      = useState(SEED_LABELS[2].name);
  const [editColorOpen, setEditColorOpen] = useState(false);

  // ── Refs ──
  const overlayRef         = useRef<HTMLDivElement>(null);
  const newCustomColorRef  = useRef<HTMLInputElement>(null);
  const editCustomColorRef = useRef<HTMLInputElement>(null);
  const editColorWrapRef   = useRef<HTMLDivElement>(null);
  const editNameRef        = useRef<HTMLInputElement>(null);
  const newNameRef         = useRef<HTMLInputElement>(null);

  // Click-outside: close edit-color popover
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (editColorWrapRef.current && !editColorWrapRef.current.contains(e.target as Node)) {
        setEditColorOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Escape: cancel edit or close modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (editingId) { cancelEdit(); } else { onClose(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editingId, onClose]);

  // Focus edit name on enter-edit
  useEffect(() => {
    if (editingId) setTimeout(() => editNameRef.current?.focus(), 40);
  }, [editingId]);

  // ── Handlers ──

  function startEdit(label: Label) {
    setEditingId(label.id);
    setEditColor(label.color);
    setEditName(label.name);
    setEditColorOpen(false);
  }

  function saveEdit() {
    if (!editName.trim()) return;
    setLabels(prev =>
      prev.map(l => l.id === editingId ? { ...l, name: editName.trim(), color: editColor } : l)
    );
    setEditingId(null);
    setEditColorOpen(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditColorOpen(false);
  }

  function deleteLabel(id: string) {
    setLabels(prev => prev.filter(l => l.id !== id));
    if (editingId === id) cancelEdit();
  }

  function addLabel() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setNewNameError("Enter a label name.");
      newNameRef.current?.focus();
      return;
    }
    if (labels.some(l => l.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewNameError("A label with this name already exists.");
      newNameRef.current?.focus();
      return;
    }
    setLabels(prev => [...prev, { id: `l${Date.now()}`, name: trimmed, color: newColor }]);
    setNewName("");
    setNewNameError("");
    newNameRef.current?.focus();
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // ── Render ──

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
        className="relative flex flex-col w-full max-w-[440px] max-h-[90vh] rounded-2xl border border-[#334155] bg-[#0f172a] shadow-2xl shadow-black/80 overflow-hidden"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >

        {/* ── Accent stripe ────────────────────────────────────────────── */}
        <div className="h-[3px] w-full flex-shrink-0 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]" />

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-[#1e293b] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/15 flex-shrink-0">
              <Tag className="h-3.5 w-3.5 text-[#6366f1]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#f1f5f9]">Labels</h2>
              <p className="text-[11px] text-[#475569] mt-0.5">
                {labels.length} label{labels.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#1e293b] hover:text-[#94a3b8] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">

          {/* ── Create new label ──────────────────────────────────────── */}
          <div className="px-5 pt-4 pb-4 border-b border-[#1e293b]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#334155] mb-3">
              Create New Label
            </p>

            {/* Color palette row */}
            <div className="mb-3.5">
              <ColorRow
                selected={newColor}
                onChange={setNewColor}
                customRef={newCustomColorRef as React.RefObject<HTMLInputElement>}
              />
            </div>

            {/* Preview + name input + Add button */}
            <div className="flex items-center gap-2">
              {/* Selected color preview */}
              <div className="relative flex-shrink-0" title="Selected color">
                <div
                  className="h-8 w-8 rounded-lg transition-colors duration-200 flex-shrink-0"
                  style={{
                    backgroundColor: newColor + "22",
                    border: `2px solid ${newColor}55`,
                    boxShadow: `inset 0 0 0 3px ${newColor}`,
                  }}
                >
                  <div
                    className="h-full w-full rounded-md"
                    style={{ backgroundColor: newColor + "18" }}
                  />
                </div>
                <div
                  className="absolute inset-0 m-auto h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: newColor }}
                />
              </div>

              {/* Name input */}
              <input
                ref={newNameRef}
                type="text"
                value={newName}
                onChange={e => { setNewName(e.target.value.slice(0, 32)); setNewNameError(""); }}
                onKeyDown={e => e.key === "Enter" && addLabel()}
                placeholder="Label name"
                maxLength={32}
                className={[
                  "flex-1 rounded-lg border bg-[#1e293b] px-3 py-2 text-sm text-[#f1f5f9]",
                  "placeholder:text-[#334155] focus:outline-none focus:ring-2 transition-all",
                  newNameError
                    ? "border-[#ef4444] focus:ring-[#ef4444]/20 focus:border-[#ef4444]"
                    : "border-[#334155] focus:ring-[#6366f1]/20 focus:border-[#6366f1]/60",
                ].join(" ")}
              />

              {/* Add button */}
              <button
                type="button"
                onClick={addLabel}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-all active:scale-[0.97] flex-shrink-0"
                style={{
                  backgroundColor: newColor,
                  boxShadow: `0 2px 10px -2px ${newColor}60`,
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            {newNameError && (
              <p className="mt-1.5 text-[11px] text-[#ef4444] pl-10">{newNameError}</p>
            )}
          </div>

          {/* ── Existing labels ───────────────────────────────────────── */}
          <div className="px-5 py-4 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#334155]">
                Existing Labels
              </p>
              <span
                className="inline-flex items-center justify-center h-4.5 min-w-[18px] rounded-full px-1.5 text-[9px] font-bold text-[#94a3b8]"
                style={{ backgroundColor: "#1e293b" }}
              >
                {labels.length}
              </span>
            </div>

            {labels.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e293b]">
                  <Tag className="h-5 w-5 text-[#334155]" />
                </div>
                <p className="text-sm text-[#334155]">No labels yet</p>
                <p className="text-xs text-[#283346]">Create your first label above</p>
              </div>
            ) : (
              labels.map(label => {
                const isEditing = editingId === label.id;

                return isEditing ? (
                  /* ── Inline edit row ────────────────────────────────── */
                  <div
                    key={label.id}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all"
                    style={{
                      borderColor: editColor + "40",
                      backgroundColor: editColor + "08",
                      boxShadow: `0 0 0 1px ${editColor}18`,
                    }}
                  >
                    {/* Color circle (click to change) */}
                    <div ref={editColorWrapRef} className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditColorOpen(v => !v)}
                        className="h-6 w-6 rounded-full flex-shrink-0 transition-all hover:scale-110 hover:brightness-110 focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: editColor,
                          boxShadow: `0 0 0 2px #0f172a, 0 0 0 3.5px ${editColor}70`,
                        }}
                        title="Change color"
                      />

                      {/* Color popover */}
                      {editColorOpen && (
                        <div
                          className="absolute left-0 top-full mt-2.5 z-30 rounded-xl border border-[#334155] bg-[#1e293b] shadow-2xl shadow-black/60 p-3"
                          style={{ width: 196 }}
                        >
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#334155] mb-2.5">
                            Choose color
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map(c => (
                              <ColorDot
                                key={c}
                                color={c}
                                selected={editColor === c}
                                onClick={() => { setEditColor(c); setEditColorOpen(false); }}
                              />
                            ))}
                            {/* Custom in edit popover */}
                            <div className="relative flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => editCustomColorRef.current?.click()}
                                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-[#475569] text-[#475569] hover:border-[#6366f1]/60 hover:text-[#6366f1] hover:scale-110 transition-all"
                                title="Custom"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <input
                                ref={editCustomColorRef}
                                type="color"
                                value={editColor}
                                onChange={e => { setEditColor(e.target.value); setEditColorOpen(false); }}
                                className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                                tabIndex={-1}
                              />
                            </div>
                          </div>
                          {/* Current custom color display if not in preset */}
                          {!PRESET_COLORS.includes(editColor) && (
                            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[#334155]">
                              <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: editColor }} />
                              <span className="text-[10px] font-mono text-[#64748b]">{editColor}</span>
                              <Check className="h-3 w-3 text-[#10b981] ml-auto" strokeWidth={2.5} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Name input */}
                    <input
                      ref={editNameRef}
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value.slice(0, 32))}
                      onKeyDown={e => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      maxLength={32}
                      className="flex-1 min-w-0 rounded-lg border border-[#334155] bg-[#0f172a] px-2.5 py-1.5 text-sm text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/25 focus:border-[#6366f1]/60 transition-all"
                    />

                    {/* Save */}
                    <button
                      type="button"
                      onClick={saveEdit}
                      title="Save (Enter)"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#10b981]/12 text-[#10b981] hover:bg-[#10b981]/22 transition-colors flex-shrink-0"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>

                    {/* Cancel */}
                    <button
                      type="button"
                      onClick={cancelEdit}
                      title="Cancel (Esc)"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ef4444]/8 text-[#ef4444]/50 hover:bg-[#ef4444]/15 hover:text-[#ef4444] transition-colors flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  /* ── View row ───────────────────────────────────────── */
                  <div
                    key={label.id}
                    className="group flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[#1e293b]/60 transition-colors"
                  >
                    {/* Label pill */}
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium select-none min-w-0"
                      style={{
                        backgroundColor: label.color + "16",
                        color: label.color,
                        border: `1px solid ${label.color}28`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="truncate max-w-[180px]">{label.name}</span>
                    </span>

                    {/* Color preview dot (subtle, always visible) */}
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0 opacity-30 group-hover:opacity-0 transition-opacity"
                      style={{ backgroundColor: label.color }}
                    />

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Actions — visible on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
                      <button
                        type="button"
                        onClick={() => startEdit(label)}
                        title="Edit"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#1e293b] hover:text-[#94a3b8] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLabel(label.id)}
                        title="Delete"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#475569] hover:bg-[#ef4444]/12 hover:text-[#ef4444] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#1e293b] flex-shrink-0 bg-[#0c1421]">
          <p className="text-[11px] text-[#334155]">
            {labels.length} label{labels.length !== 1 ? "s" : ""} · {PRESET_COLORS.length} preset colors
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#6366f1] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5254cc] active:scale-[0.98] transition-all shadow shadow-[#6366f1]/30"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
