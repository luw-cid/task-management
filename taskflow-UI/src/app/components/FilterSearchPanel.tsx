import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, X, ChevronDown, Bug, Zap, Package, Layers,
  ChevronsUp, ChevronUp, Minus, Calendar, Tag, Check,
} from "lucide-react";

type TaskType = "BUG" | "FEATURE" | "EPIC" | "IMPROVEMENT";
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type DeadlineFilter = "This week" | "This month" | "Overdue";

export interface FilterState {
  search: string;
  types: TaskType[];
  priorities: Priority[];
  assignees: string[];
  deadlines: DeadlineFilter[];
  labels: string[];
}

interface FilterSearchPanelProps {
  isOpen: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableMembers: string[];
  availableLabels: { label: string; color: string }[];
  resultCount: { showing: number; total: number };
}

function getAvatarColor(name: string) {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
  return colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

const TYPE_OPTIONS: { value: TaskType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "BUG", label: "Bug", icon: Bug, color: "#ef4444" },
  { value: "FEATURE", label: "Feature", icon: Zap, color: "#6366f1" },
  { value: "IMPROVEMENT", label: "Improvement", icon: Package, color: "#10b981" },
  { value: "EPIC", label: "Epic", icon: Layers, color: "#8b5cf6" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; icon: React.ElementType; color: string }[] = [
  { value: "CRITICAL", label: "Critical", icon: ChevronsUp, color: "#ef4444" },
  { value: "HIGH", label: "High", icon: ChevronUp, color: "#f97316" },
  { value: "MEDIUM", label: "Medium", icon: Minus, color: "#f59e0b" },
  { value: "LOW", label: "Low", icon: ChevronDown, color: "#94a3b8" },
];

const DEADLINE_OPTIONS: DeadlineFilter[] = ["This week", "This month", "Overdue"];

type DropdownType = "type" | "priority" | "assignee" | "deadline" | "label" | null;

function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all
        ${
          active
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-secondary/40"
        }`}
    >
      <span>{label}</span>
      {count > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] font-semibold">
          {count}
        </span>
      )}
      <ChevronDown className="h-3 w-3" />
    </button>
  );
}

function ActiveFilterTag({
  label,
  color,
  onRemove,
}: {
  label: string;
  color?: string;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
    >
      {color && <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

function Dropdown({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 mt-2 z-50 min-w-[200px] rounded-lg border border-border bg-card shadow-xl shadow-black/20"
    >
      {children}
    </motion.div>
  );
}

export function FilterSearchPanel({
  isOpen,
  filters,
  onFiltersChange,
  availableMembers,
  availableLabels,
  resultCount,
}: FilterSearchPanelProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);

  const updateFilters = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = <T,>(key: keyof FilterState, value: T) => {
    const current = filters[key] as T[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilters(key, updated);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      types: [],
      priorities: [],
      assignees: [],
      deadlines: [],
      labels: [],
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.types.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assignees.length > 0 ||
    filters.deadlines.length > 0 ||
    filters.labels.length > 0;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative z-20 border-b border-border bg-card/50 overflow-visible"
    >
      <div className="px-6 py-4 flex flex-col gap-4">
        {/* Top row: Search + Filter chips */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => updateFilters("search", e.target.value)}
              className="w-[240px] rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <FilterChip
                label="Type"
                active={filters.types.length > 0}
                count={filters.types.length}
                onClick={() => setOpenDropdown(openDropdown === "type" ? null : "type")}
              />
              <AnimatePresence>
                <Dropdown isOpen={openDropdown === "type"} onClose={() => setOpenDropdown(null)}>
                  <div className="p-2 flex flex-col gap-1">
                    {TYPE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = filters.types.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleArrayFilter("types", opt.value)}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-xs hover:bg-secondary/40 transition-colors w-full"
                        >
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded border-2 transition-all"
                            style={{
                              borderColor: isSelected ? opt.color : "#334155",
                              backgroundColor: isSelected ? opt.color + "20" : "transparent",
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3" style={{ color: opt.color }} />}
                          </div>
                          <Icon className="h-4 w-4 flex-shrink-0" style={{ color: opt.color }} />
                          <span className="flex-1 text-left text-foreground">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Dropdown>
              </AnimatePresence>
            </div>

            <div className="relative">
              <FilterChip
                label="Priority"
                active={filters.priorities.length > 0}
                count={filters.priorities.length}
                onClick={() => setOpenDropdown(openDropdown === "priority" ? null : "priority")}
              />
              <AnimatePresence>
                <Dropdown isOpen={openDropdown === "priority"} onClose={() => setOpenDropdown(null)}>
                  <div className="p-2 flex flex-col gap-1">
                    {PRIORITY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = filters.priorities.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleArrayFilter("priorities", opt.value)}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-xs hover:bg-secondary/40 transition-colors w-full"
                        >
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded border-2 transition-all"
                            style={{
                              borderColor: isSelected ? opt.color : "#334155",
                              backgroundColor: isSelected ? opt.color + "20" : "transparent",
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3" style={{ color: opt.color }} />}
                          </div>
                          <Icon className="h-4 w-4 flex-shrink-0" style={{ color: opt.color }} />
                          <span className="flex-1 text-left text-foreground">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Dropdown>
              </AnimatePresence>
            </div>

            <div className="relative">
              <FilterChip
                label="Assignee"
                active={filters.assignees.length > 0}
                count={filters.assignees.length}
                onClick={() => setOpenDropdown(openDropdown === "assignee" ? null : "assignee")}
              />
              <AnimatePresence>
                <Dropdown isOpen={openDropdown === "assignee"} onClose={() => setOpenDropdown(null)}>
                  <div className="p-2 flex flex-col gap-1">
                    {availableMembers.map((member) => {
                      const isSelected = filters.assignees.includes(member);
                      return (
                        <button
                          key={member}
                          onClick={() => toggleArrayFilter("assignees", member)}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-xs hover:bg-secondary/40 transition-colors w-full"
                        >
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded border-2 transition-all"
                            style={{
                              borderColor: isSelected ? "#6366f1" : "#334155",
                              backgroundColor: isSelected ? "#6366f1" + "20" : "transparent",
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3" style={{ color: "#6366f1" }} />}
                          </div>
                          <div
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: getAvatarColor(member) }}
                          >
                            {getInitials(member)}
                          </div>
                          <span className="flex-1 text-left text-foreground">{member}</span>
                        </button>
                      );
                    })}
                  </div>
                </Dropdown>
              </AnimatePresence>
            </div>

            <div className="relative">
              <FilterChip
                label="Deadline"
                active={filters.deadlines.length > 0}
                count={filters.deadlines.length}
                onClick={() => setOpenDropdown(openDropdown === "deadline" ? null : "deadline")}
              />
              <AnimatePresence>
                <Dropdown isOpen={openDropdown === "deadline"} onClose={() => setOpenDropdown(null)}>
                  <div className="p-2 flex flex-col gap-1">
                    {DEADLINE_OPTIONS.map((opt) => {
                      const isSelected = filters.deadlines.includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleArrayFilter("deadlines", opt)}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-xs hover:bg-secondary/40 transition-colors w-full"
                        >
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded border-2 transition-all"
                            style={{
                              borderColor: isSelected ? "#6366f1" : "#334155",
                              backgroundColor: isSelected ? "#6366f1" + "20" : "transparent",
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3" style={{ color: "#6366f1" }} />}
                          </div>
                          <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="flex-1 text-left text-foreground">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </Dropdown>
              </AnimatePresence>
            </div>

            <div className="relative">
              <FilterChip
                label="Label"
                active={filters.labels.length > 0}
                count={filters.labels.length}
                onClick={() => setOpenDropdown(openDropdown === "label" ? null : "label")}
              />
              <AnimatePresence>
                <Dropdown isOpen={openDropdown === "label"} onClose={() => setOpenDropdown(null)}>
                  <div className="p-2 flex flex-col gap-1">
                    {availableLabels.map((label) => {
                      const isSelected = filters.labels.includes(label.label);
                      return (
                        <button
                          key={label.label}
                          onClick={() => toggleArrayFilter("labels", label.label)}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-xs hover:bg-secondary/40 transition-colors w-full"
                        >
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded border-2 transition-all"
                            style={{
                              borderColor: isSelected ? label.color : "#334155",
                              backgroundColor: isSelected ? label.color + "20" : "transparent",
                            }}
                          >
                            {isSelected && <Check className="h-3 w-3" style={{ color: label.color }} />}
                          </div>
                          <Tag
                            className="h-4 w-4 flex-shrink-0"
                            style={{ color: label.color }}
                          />
                          <span className="flex-1 text-left text-foreground">{label.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Dropdown>
              </AnimatePresence>
            </div>
          </div>

          {/* Clear all button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <AnimatePresence>
              {filters.types.map((type) => {
                const opt = TYPE_OPTIONS.find((o) => o.value === type);
                return (
                  <ActiveFilterTag
                    key={type}
                    label={opt?.label || type}
                    color={opt?.color}
                    onRemove={() => toggleArrayFilter("types", type)}
                  />
                );
              })}
              {filters.priorities.map((priority) => {
                const opt = PRIORITY_OPTIONS.find((o) => o.value === priority);
                return (
                  <ActiveFilterTag
                    key={priority}
                    label={opt?.label || priority}
                    color={opt?.color}
                    onRemove={() => toggleArrayFilter("priorities", priority)}
                  />
                );
              })}
              {filters.assignees.map((assignee) => (
                <ActiveFilterTag
                  key={assignee}
                  label={assignee}
                  onRemove={() => toggleArrayFilter("assignees", assignee)}
                />
              ))}
              {filters.deadlines.map((deadline) => (
                <ActiveFilterTag
                  key={deadline}
                  label={deadline}
                  onRemove={() => toggleArrayFilter("deadlines", deadline)}
                />
              ))}
              {filters.labels.map((label) => {
                const labelObj = availableLabels.find((l) => l.label === label);
                return (
                  <ActiveFilterTag
                    key={label}
                    label={label}
                    color={labelObj?.color}
                    onRemove={() => toggleArrayFilter("labels", label)}
                  />
                );
              })}
            </AnimatePresence>

            {/* Result count */}
            <span className="ml-2 text-xs text-muted-foreground">
              Showing {resultCount.showing} of {resultCount.total} tasks
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
