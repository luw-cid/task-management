import { motion } from "motion/react";
import { Plus, X } from "lucide-react";

// ─── SVG Illustrations ────────────────────────────────────────────────────────

function KanbanBoardSVG() {
  return (
    <svg width="228" height="158" viewBox="0 0 228 158" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ambient glow */}
      <ellipse cx="114" cy="146" rx="88" ry="13" fill="#6366f1" fillOpacity="0.08" />

      {/* ── Column 1 ── */}
      <rect x="5" y="14" width="64" height="128" rx="9" fill="#1e293b" stroke="#2a3a50" strokeWidth="1.5" />
      {/* Column 1 header bar */}
      <rect x="13" y="24" width="34" height="4" rx="2" fill="#374151" />
      <circle cx="58" cy="26" r="5" fill="#2a3a50" />
      {/* Column 1 dot indicator */}
      <circle cx="13" cy="26" r="3" fill="#4b5563" />
      {/* Card placeholders */}
      <rect x="11" y="42" width="50" height="34" rx="6" fill="#0b1628" stroke="#2a3a50" strokeWidth="1.2" strokeDasharray="5 3.5" />
      <line x1="36" y1="55" x2="36" y2="65" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="31" y1="60" x2="41" y2="60" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="11" y="84" width="50" height="34" rx="6" fill="#0b1628" stroke="#2a3a50" strokeWidth="1.2" strokeDasharray="5 3.5" />
      <line x1="36" y1="97" x2="36" y2="107" stroke="#2a3a50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="31" y1="102" x2="41" y2="102" stroke="#2a3a50" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── Column 2 (indigo accent – In Progress) ── */}
      <rect x="82" y="14" width="64" height="128" rx="9" fill="#1a2035" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.55" />
      {/* Column 2 header */}
      <rect x="90" y="24" width="34" height="4" rx="2" fill="#6366f1" fillOpacity="0.45" />
      <circle cx="135" cy="26" r="5" fill="#6366f1" fillOpacity="0.35" />
      <circle cx="90" cy="26" r="3" fill="#6366f1" fillOpacity="0.5" />
      {/* Card placeholder */}
      <rect x="88" y="42" width="50" height="34" rx="6" fill="#6366f1" fillOpacity="0.05" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="5 3.5" strokeOpacity="0.45" />
      <line x1="113" y1="55" x2="113" y2="65" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="108" y1="60" x2="118" y2="60" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
      {/* Second placeholder ghost */}
      <rect x="88" y="84" width="50" height="22" rx="5" fill="#6366f1" fillOpacity="0.03" stroke="#6366f1" strokeWidth="1" strokeDasharray="5 3.5" strokeOpacity="0.25" />

      {/* ── Column 3 ── */}
      <rect x="159" y="14" width="64" height="128" rx="9" fill="#1e293b" stroke="#2a3a50" strokeWidth="1.5" />
      {/* Column 3 header */}
      <rect x="167" y="24" width="34" height="4" rx="2" fill="#374151" />
      <circle cx="212" cy="26" r="5" fill="#2a3a50" />
      <circle cx="167" cy="26" r="3" fill="#4b5563" />
      {/* Card placeholder */}
      <rect x="165" y="42" width="50" height="34" rx="6" fill="#0b1628" stroke="#2a3a50" strokeWidth="1.2" strokeDasharray="5 3.5" />
      <line x1="190" y1="55" x2="190" y2="65" stroke="#2a3a50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="185" y1="60" x2="195" y2="60" stroke="#2a3a50" strokeWidth="1.5" strokeLinecap="round" />

      {/* Floating sparkles */}
      <circle cx="3" cy="9" r="2.5" fill="#6366f1" fillOpacity="0.3" />
      <circle cx="224" cy="7" r="2" fill="#8b5cf6" fillOpacity="0.38" />
      <circle cx="114" cy="3" r="1.5" fill="#6366f1" fillOpacity="0.5" />
      <circle cx="52" cy="5" r="1.5" fill="#8b5cf6" fillOpacity="0.22" />
      <circle cx="172" cy="5" r="2" fill="#6366f1" fillOpacity="0.22" />

      {/* Connector dots between columns */}
      <circle cx="76" cy="78" r="2" fill="#2a3a50" />
      <circle cx="153" cy="78" r="2" fill="#2a3a50" />
    </svg>
  );
}

function BellZZZSVG() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground glow */}
      <ellipse cx="68" cy="140" rx="42" ry="11" fill="#6366f1" fillOpacity="0.1" />

      {/* Hanger */}
      <rect x="62" y="8" width="13" height="12" rx="6.5" fill="#1e293b" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="65" y1="20" x2="65" y2="24" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.35" />
      <line x1="72" y1="20" x2="72" y2="24" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.35" />

      {/* Bell body */}
      <path
        d="M68.5 24
           C 55 24, 38 38, 36 62
           L 32 92
           Q 31 98, 39 98
           L 98 98
           Q 106 98, 105 92
           L 101 62
           C 99 38, 82 24, 68.5 24 Z"
        fill="#1e293b"
        stroke="#6366f1"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />

      {/* Bell inner highlight */}
      <path d="M50 36 C45 44, 42 55, 42 66 L40 82" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeOpacity="0.14" />
      <path d="M50 36 C45 44, 42 55, 42 66 L40 82" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" strokeOpacity="0.04" />

      {/* Bottom rim */}
      <rect x="26" y="94" width="85" height="8" rx="4" fill="#263347" />
      <rect x="26" y="94" width="85" height="8" rx="4" stroke="#334155" strokeWidth="1" />

      {/* Clapper */}
      <circle cx="68.5" cy="108" r="9" fill="#1e293b" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.4" />
      <circle cx="68.5" cy="108" r="4.5" fill="#263347" />

      {/* ── ZZZ letters (drawn as paths) ── */}
      {/* Z1 – largest, closest */}
      <path d="M98 70 L110 70 L98 84 L110 84" stroke="#6366f1" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Z2 – medium */}
      <path d="M110 52 L120 52 L110 64 L120 64" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.58" />
      {/* Z3 – small, farthest */}
      <path d="M120 37 L128 37 L120 47 L128 47" stroke="#6366f1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.3" />

      {/* Sparkle stars */}
      <circle cx="20" cy="58" r="2.5" fill="#8b5cf6" fillOpacity="0.42" />
      <circle cx="14" cy="76" r="1.5" fill="#6366f1" fillOpacity="0.32" />
      <circle cx="118" cy="98" r="2" fill="#8b5cf6" fillOpacity="0.28" />
      <circle cx="28" cy="38" r="1.5" fill="#6366f1" fillOpacity="0.25" />

      {/* Cross sparkle top-left */}
      <line x1="30" y1="22" x2="30" y2="30" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.28" />
      <line x1="26" y1="26" x2="34" y2="26" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.28" />

      {/* Cross sparkle top-right */}
      <line x1="136" y1="28" x2="136" y2="34" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.25" />
      <line x1="133" y1="31" x2="139" y2="31" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.25" />
    </svg>
  );
}

function MagnifyingGlassSVG() {
  return (
    <svg width="158" height="158" viewBox="0 0 158 158" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ground glow */}
      <ellipse cx="64" cy="140" rx="44" ry="12" fill="#6366f1" fillOpacity="0.08" />

      {/* Handle shadow */}
      <line x1="96" y1="96" x2="130" y2="130" stroke="#0b1628" strokeWidth="16" strokeLinecap="round" />
      {/* Handle body */}
      <line x1="96" y1="96" x2="130" y2="130" stroke="#263347" strokeWidth="12" strokeLinecap="round" />
      {/* Handle highlight */}
      <line x1="97" y1="97" x2="129" y2="129" stroke="#3d5069" strokeWidth="7" strokeLinecap="round" />
      {/* Handle grip lines */}
      <line x1="107" y1="107" x2="109" y2="109" stroke="#4a6080" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="113" y1="113" x2="115" y2="115" stroke="#4a6080" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="119" y1="119" x2="121" y2="121" stroke="#4a6080" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />

      {/* Outer ring */}
      <circle cx="62" cy="62" r="52" fill="#1e293b" stroke="#334155" strokeWidth="3" />

      {/* Lens background */}
      <circle cx="62" cy="62" r="43" fill="#0b1628" />

      {/* Lens inner ring (indigo glow) */}
      <circle cx="62" cy="62" r="43" fill="none" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.2" />

      {/* Lens highlight arc */}
      <path d="M38 40 Q46 32 58 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity="0.05" />
      <path d="M38 40 Q46 32 58 32" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.28" />

      {/* X mark inside lens */}
      <line x1="46" y1="46" x2="78" y2="78" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1="78" y1="46" x2="46" y2="78" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" />

      {/* X end circles */}
      <circle cx="46" cy="46" r="3" fill="#6366f1" fillOpacity="0.35" />
      <circle cx="78" cy="78" r="3" fill="#6366f1" fillOpacity="0.35" />
      <circle cx="78" cy="46" r="3" fill="#6366f1" fillOpacity="0.35" />
      <circle cx="46" cy="78" r="3" fill="#6366f1" fillOpacity="0.35" />

      {/* Floating dots */}
      <circle cx="128" cy="28" r="2.5" fill="#6366f1" fillOpacity="0.3" />
      <circle cx="12" cy="46" r="2" fill="#8b5cf6" fillOpacity="0.36" />
      <circle cx="16" cy="88" r="1.5" fill="#6366f1" fillOpacity="0.25" />
      <circle cx="135" cy="60" r="1.5" fill="#8b5cf6" fillOpacity="0.28" />

      {/* Sparkle cross */}
      <line x1="140" y1="42" x2="140" y2="48" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.28" />
      <line x1="137" y1="45" x2="143" y2="45" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.28" />
    </svg>
  );
}

function ColumnEmptySVG() {
  return (
    <svg width="76" height="64" viewBox="0 0 76 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Card shadow */}
      <rect x="9" y="14" width="58" height="38" rx="8" fill="#0b1628" stroke="#2a3a50" strokeWidth="1.5" strokeDasharray="5.5 3.5" />
      {/* Content lines */}
      <rect x="17" y="25" width="24" height="3.5" rx="1.75" fill="#2a3a50" />
      <rect x="17" y="31" width="17" height="2.5" rx="1.25" fill="#2a3a50" fillOpacity="0.55" />
      <rect x="17" y="36" width="20" height="2" rx="1" fill="#2a3a50" fillOpacity="0.3" />
      {/* Plus circle */}
      <circle cx="55" cy="33" r="8.5" fill="#6366f1" fillOpacity="0.13" />
      <circle cx="55" cy="33" r="8.5" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.25" />
      <line x1="55" y1="29" x2="55" y2="37" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1="51" y1="33" x2="59" y2="33" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.7" />
    </svg>
  );
}

// ─── Empty State Components ───────────────────────────────────────────────────

/** 1. No Boards — home page when user has no boards */
export function NoBoardsState({ onCreateBoard }: { onCreateBoard?: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-7 py-14 px-8 text-center"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
    >
      <div className="relative">
        <div className="absolute -inset-8 rounded-full bg-[#6366f1]/6 blur-3xl pointer-events-none" />
        <motion.div
          initial={{ scale: 0.92 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <KanbanBoardSVG />
        </motion.div>
      </div>
      <div className="flex flex-col items-center gap-2.5 max-w-[290px]">
        <h3 className="text-xl font-semibold text-[#f1f5f9]">No boards yet</h3>
        <p className="text-sm text-[#64748b] leading-relaxed">
          Create your first board to start organizing and managing your team's tasks
        </p>
      </div>
      <motion.button
        onClick={onCreateBoard}
        className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5558e8] active:scale-[0.97] transition-all shadow-lg shadow-[#6366f1]/25"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Plus className="h-4 w-4" />
        Create Board
      </motion.button>
    </motion.div>
  );
}

/** 2. No Tasks in Column — compact, fits inside a kanban column */
export function NoTasksState({ onAddTask }: { onAddTask?: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-3 py-5 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <ColumnEmptySVG />
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-medium text-[#475569]">No tasks here</p>
        <button
          onClick={onAddTask}
          className="group flex items-center gap-1 text-[11px] font-semibold text-[#6366f1] hover:text-[#818cf8] transition-colors"
        >
          <Plus className="h-3 w-3 group-hover:scale-110 transition-transform" />
          Add Task
        </button>
      </div>
    </motion.div>
  );
}

/** 3. No Notifications — notification center when empty */
export function NoNotificationsState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 py-14 px-8 text-center"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
    >
      <div className="relative">
        <div className="absolute -inset-8 rounded-full bg-[#6366f1]/5 blur-3xl pointer-events-none" />
        <motion.div
          initial={{ scale: 0.9, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <BellZZZSVG />
        </motion.div>
      </div>
      <div className="flex flex-col items-center gap-2 max-w-[240px]">
        <h3 className="text-xl font-semibold text-[#f1f5f9]">You're all caught up!</h3>
        <p className="text-sm text-[#64748b] leading-relaxed">No new notifications right now. Check back later.</p>
      </div>
    </motion.div>
  );
}

/** 4. No Search Results — board/task view when search returns nothing */
export function NoSearchResultsState({ onClearSearch }: { onClearSearch?: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 py-14 px-8 text-center"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
    >
      <div className="relative">
        <div className="absolute -inset-8 rounded-full bg-[#6366f1]/5 blur-3xl pointer-events-none" />
        <motion.div
          initial={{ scale: 0.88 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <MagnifyingGlassSVG />
        </motion.div>
      </div>
      <div className="flex flex-col items-center gap-2.5 max-w-[270px]">
        <h3 className="text-xl font-semibold text-[#f1f5f9]">No results found</h3>
        <p className="text-sm text-[#64748b] leading-relaxed">
          Try different keywords or clear your filters to see all tasks
        </p>
      </div>
      <motion.button
        onClick={onClearSearch}
        className="flex items-center gap-2 rounded-xl border border-[#334155] px-5 py-2.5 text-sm font-medium text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f1f5f9] active:scale-[0.97] transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <X className="h-3.5 w-3.5" />
        Clear Search
      </motion.button>
    </motion.div>
  );
}

// ─── Showcase ─────────────────────────────────────────────────────────────────

function ShowcaseCard({
  index,
  label,
  title,
  description,
  children,
  accent = "#6366f1",
}: {
  index: number;
  label: string;
  title: string;
  description: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <motion.div
      className="flex flex-col rounded-2xl border border-[#1e293b] overflow-hidden"
      style={{ backgroundColor: "#0d1526" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
    >
      {/* Card accent stripe */}
      <div className="h-[2.5px] w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}00)` }} />

      {/* Card header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-[#1e293b]" style={{ backgroundColor: "#111827" }}>
        <div
          className="flex h-7 w-9 items-center justify-center rounded-md text-[10px] font-bold font-mono flex-shrink-0 mt-0.5"
          style={{ backgroundColor: accent + "18", color: accent }}
        >
          {label}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#f1f5f9]">{title}</p>
          <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #1a2540 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function EmptyStatesShowcase() {
  return (
    <div className="min-h-full overflow-y-auto">
      <div className="px-8 py-8 max-w-5xl">

        {/* Page header */}
        <motion.div
          className="flex flex-col gap-1 mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366f1]/15">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="#6366f1" fillOpacity="0.4" />
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="#6366f1" fillOpacity="0.7" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="#6366f1" fillOpacity="0.7" />
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="#6366f1" fillOpacity="0.4" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-[#f1f5f9]">Empty States</h1>
          </div>
          <p className="text-sm text-[#64748b] ml-11">
            Illustrated empty states for TaskFlow's key screens — flat style, dark theme, indigo accents
          </p>
        </motion.div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* ── 01 No Boards ── */}
          <ShowcaseCard
            index={0}
            label="01"
            title="No Boards"
            description="Home page when the user hasn't created any boards yet"
            accent="#6366f1"
          >
            <NoBoardsState onCreateBoard={() => {}} />
          </ShowcaseCard>

          {/* ── 02 No Tasks in Column ── */}
          <ShowcaseCard
            index={1}
            label="02"
            title="No Tasks in Column"
            description="Empty Kanban column — compact inline state with add action"
            accent="#8b5cf6"
          >
            <div className="flex items-start justify-center gap-4 px-6 py-8">
              {/* Simulated column */}
              <div className="flex flex-col w-[200px] rounded-xl overflow-hidden border border-[#6366f1]/30 bg-[#6366f1]/5 shadow-lg">
                {/* Column header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#6366f1]/20 bg-[#1a2035]">
                  <span className="h-2 w-2 rounded-full bg-[#6366f1] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#818cf8] flex-1">In Progress</span>
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-semibold px-1.5"
                    style={{ backgroundColor: "#6366f122", color: "#818cf8" }}
                  >
                    0
                  </span>
                </div>
                {/* Empty state inside column */}
                <div className="px-3 pb-2">
                  <NoTasksState onAddTask={() => {}} />
                </div>
                {/* Add task row */}
                <div className="px-3 pb-3">
                  <button className="flex items-center gap-2 w-full rounded-lg border border-dashed border-[#6366f1]/25 px-3 py-2 text-[11px] font-medium text-[#6366f1]/50 hover:text-[#6366f1]/70 hover:border-[#6366f1]/40 transition-all">
                    <Plus className="h-3 w-3" />Add task
                  </button>
                </div>
              </div>

              {/* Adjacent empty column */}
              <div className="flex flex-col w-[140px] rounded-xl overflow-hidden border border-[#2a3a50] bg-[#0b1628]/60 opacity-50">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#2a3a50] bg-[#1e293b]/80">
                  <span className="h-2 w-2 rounded-full bg-[#64748b] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#64748b] flex-1">To Do</span>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-semibold px-1.5 bg-[#64748b]/15 text-[#64748b]">0</span>
                </div>
                <div className="px-3 py-4 flex flex-col items-center gap-2">
                  <div className="w-full h-14 rounded-lg border border-dashed border-[#2a3a50]" />
                  <div className="w-full h-10 rounded-lg border border-dashed border-[#2a3a50] opacity-60" />
                </div>
              </div>
            </div>
          </ShowcaseCard>

          {/* ── 03 No Notifications ── */}
          <ShowcaseCard
            index={2}
            label="03"
            title="No Notifications"
            description="Notification center when all alerts have been read or cleared"
            accent="#06b6d4"
          >
            <NoNotificationsState />
          </ShowcaseCard>

          {/* ── 04 No Search Results ── */}
          <ShowcaseCard
            index={3}
            label="04"
            title="No Search Results"
            description="Board or task list view when search keywords match nothing"
            accent="#6366f1"
          >
            <NoSearchResultsState onClearSearch={() => {}} />
          </ShowcaseCard>
        </div>

        {/* Footer note */}
        <motion.p
          className="mt-8 text-center text-[11px] text-[#334155]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          4 empty states · flat illustration style · indigo accent #6366f1 · dark theme background #0f172a
        </motion.p>
      </div>
    </div>
  );
}
