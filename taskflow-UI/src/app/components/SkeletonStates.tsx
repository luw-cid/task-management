// ─── Skeleton Loading States ──────────────────────────────────────────────────

// Shimmer animation for skeleton elements
const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
`;

// Inject keyframes into document
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = shimmerKeyframes;
  document.head.appendChild(styleEl);
}

// Skeleton base component with shimmer effect
function SkeletonBox({ className = "", shimmer = true }: { className?: string; shimmer?: boolean }) {
  return (
    <div className={`relative bg-[#334155] rounded overflow-hidden ${className}`}>
      {shimmer && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
            animation: "shimmer 2s infinite",
          }}
        />
      )}
    </div>
  );
}

// ─── Skeleton 1: Board List Loading ───────────────────────────────────────────

export function BoardListLoadingSkeleton() {
  return (
    <div className="flex h-screen w-screen bg-background font-['Inter'] overflow-hidden">
      {/* Sidebar skeleton */}
      <aside className="flex flex-col w-[260px] min-w-[260px] h-full bg-card border-r border-border overflow-y-auto">
        {/* Logo area */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <SkeletonBox className="h-8 w-8 rounded-lg" />
          <SkeletonBox className="h-5 w-24" />
        </div>

        {/* User profile skeleton */}
        <div className="px-3 py-4 border-b border-border">
          <div className="w-full flex items-center gap-3 rounded-lg px-2 py-2">
            <SkeletonBox className="h-9 w-9 rounded-full" />
            <div className="flex-1 flex flex-col gap-2">
              <SkeletonBox className="h-3 w-28" />
              <SkeletonBox className="h-2.5 w-32" />
            </div>
          </div>
        </div>

        {/* Nav menu items */}
        <nav className="px-3 py-3 flex flex-col gap-0.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5">
              <SkeletonBox className="h-4 w-4 rounded" />
              <SkeletonBox className="h-3.5 w-20" />
            </div>
          ))}
        </nav>

        {/* Boards section */}
        <div className="px-3 mt-2 flex-1">
          <div className="w-full flex items-center justify-between px-3 py-2 mb-1">
            <SkeletonBox className="h-3 w-20" />
          </div>
          <div className="flex flex-col gap-0.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2">
                <SkeletonBox className="h-2.5 w-2.5 rounded-full" />
                <SkeletonBox className="h-3 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
          <SkeletonBox className="h-9 w-72 rounded-lg" />
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-9 w-9 rounded-lg" />
            <SkeletonBox className="h-9 w-9 rounded-lg" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-8 px-8 py-8 w-full">
            {/* Title area */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <SkeletonBox className="h-7 w-64 mb-2" />
                <SkeletonBox className="h-4 w-48" />
              </div>
              <SkeletonBox className="h-10 w-32 rounded-lg" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <SkeletonBox className="h-10 w-10 rounded-lg" />
                    <SkeletonBox className="h-4 w-4 rounded" />
                  </div>
                  <div>
                    <SkeletonBox className="h-8 w-12 mb-2" />
                    <SkeletonBox className="h-4 w-24 mb-1" />
                    <SkeletonBox className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>

            {/* Board cards section */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-5 w-32" />
                <SkeletonBox className="h-4 w-20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
                    {/* Color bar */}
                    <SkeletonBox className="h-1.5 w-full rounded-none" shimmer={false} />

                    {/* Card content */}
                    <div className="flex flex-col gap-4 p-5 flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <SkeletonBox className="h-8 w-8 rounded-lg" />
                          <div>
                            <SkeletonBox className="h-4 w-32 mb-1.5" />
                            <SkeletonBox className="h-3 w-16" />
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-2">
                        <SkeletonBox className="h-3 w-full" />
                        <SkeletonBox className="h-3 w-3/4" />
                      </div>

                      {/* Progress */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <SkeletonBox className="h-3 w-16" />
                          <SkeletonBox className="h-3 w-8" />
                        </div>
                        <SkeletonBox className="h-1.5 w-full rounded-full" />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-1">
                        {/* Member avatars */}
                        <div className="flex -space-x-2">
                          {[1, 2, 3, 4].map((j) => (
                            <SkeletonBox key={j} className="h-6 w-6 rounded-full border-2 border-card" />
                          ))}
                        </div>
                        <SkeletonBox className="h-3 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Skeleton 2: Kanban Board Loading ─────────────────────────────────────────

export function KanbanBoardLoadingSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Board toolbar */}
      <header className="flex items-center gap-4 px-6 py-3.5 border-b border-border bg-card flex-shrink-0">
        {/* Board title */}
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-7 w-7 rounded-lg" />
          <SkeletonBox className="h-4 w-32" />
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Member avatars */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBox key={i} className="h-7 w-7 rounded-full border-2 border-card" />
            ))}
          </div>
          <SkeletonBox className="h-7 w-7 rounded-full border-2 border-dashed border-border" shimmer={false} />
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Actions */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SkeletonBox className="h-8 w-20 rounded-lg" />
          <SkeletonBox className="h-8 w-20 rounded-lg" />
          <SkeletonBox className="h-8 w-44 rounded-lg" />
          <SkeletonBox className="h-8 w-24 rounded-lg" />
          <SkeletonBox className="h-8 w-8 rounded-lg" />
        </div>
      </header>

      {/* Kanban columns */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full items-start min-w-max">
          {[1, 2, 3, 4].map((colIndex) => (
            <div key={colIndex} className="flex flex-col w-[308px] min-w-[308px] max-h-full">
              {/* Column header */}
              <div className="flex items-center justify-between rounded-t-xl px-4 py-3 mb-0 border border-b-0 border-border bg-secondary/30">
                <div className="flex items-center gap-2.5">
                  <SkeletonBox className="w-2.5 h-2.5 rounded-full" />
                  <SkeletonBox className="h-4 w-20" />
                  <SkeletonBox className="h-5 w-6 rounded-full" />
                </div>
                <div className="flex items-center gap-1">
                  <SkeletonBox className="h-6 w-6 rounded-md" />
                  <SkeletonBox className="h-6 w-6 rounded-md" />
                </div>
              </div>

              {/* Column content with task cards */}
              <div
                className="flex flex-col gap-3 flex-1 rounded-b-xl border border-t-0 border-border bg-secondary/10 p-3 overflow-y-auto min-h-[200px]"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              >
                {/* Task card skeletons */}
                {[1, 2, 3].map((cardIndex) => (
                  <div
                    key={cardIndex}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    {/* Type badge */}
                    <div className="flex items-center justify-between">
                      <SkeletonBox className="h-5 w-16 rounded-md" />
                    </div>

                    {/* Title and description */}
                    <div>
                      <SkeletonBox className="h-4 w-full mb-2" />
                      <div className="flex flex-col gap-1.5">
                        <SkeletonBox className="h-3 w-full" />
                        <SkeletonBox className="h-3 w-5/6" />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <SkeletonBox className="h-5 w-12 rounded-full" />
                      <SkeletonBox className="h-5 w-16 rounded-full" />
                    </div>

                    {/* Progress bar */}
                    <SkeletonBox className="h-1 w-full rounded-full" />

                    {/* Bottom row */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      {/* Assignee avatars */}
                      <div className="flex -space-x-1.5">
                        {[1, 2].map((i) => (
                          <SkeletonBox key={i} className="h-6 w-6 rounded-full border-2 border-card" />
                        ))}
                      </div>

                      {/* Right meta */}
                      <div className="flex items-center gap-2.5">
                        <SkeletonBox className="h-3.5 w-3.5 rounded" />
                        <SkeletonBox className="h-3 w-12" />
                        <SkeletonBox className="h-3 w-6" />
                        <SkeletonBox className="h-3 w-8" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Skeleton 3: Task Detail Loading ──────────────────────────────────────────

export function TaskDetailLoadingSkeleton() {
  return (
    <div className="fixed top-0 right-0 h-full w-full sm:w-[600px] bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <SkeletonBox className="h-5 w-32" />
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-8 w-8 rounded-lg" />
          <SkeletonBox className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 p-6">
          {/* Type badge and ID */}
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-5 w-20 rounded-md" />
            <SkeletonBox className="h-4 w-16" />
          </div>

          {/* Title */}
          <div className="flex flex-col gap-2">
            <SkeletonBox className="h-7 w-full" />
            <SkeletonBox className="h-7 w-3/4" />
          </div>

          {/* Metadata grid (2 columns) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="flex flex-col gap-2">
              <SkeletonBox className="h-3 w-12" />
              <SkeletonBox className="h-9 w-full rounded-lg" />
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-2">
              <SkeletonBox className="h-3 w-14" />
              <SkeletonBox className="h-9 w-full rounded-lg" />
            </div>

            {/* Assignee */}
            <div className="flex flex-col gap-2">
              <SkeletonBox className="h-3 w-16" />
              <SkeletonBox className="h-9 w-full rounded-lg" />
            </div>

            {/* Deadline */}
            <div className="flex flex-col gap-2">
              <SkeletonBox className="h-3 w-14" />
              <SkeletonBox className="h-9 w-full rounded-lg" />
            </div>
          </div>

          {/* Description section */}
          <div className="flex flex-col gap-3">
            <SkeletonBox className="h-4 w-24" />
            <div className="flex flex-col gap-2">
              <SkeletonBox className="h-3 w-full" />
              <SkeletonBox className="h-3 w-full" />
              <SkeletonBox className="h-3 w-4/5" />
            </div>
          </div>

          {/* Tags section */}
          <div className="flex flex-col gap-3">
            <SkeletonBox className="h-4 w-16" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBox className="h-6 w-16 rounded-full" />
              <SkeletonBox className="h-6 w-20 rounded-full" />
              <SkeletonBox className="h-6 w-14 rounded-full" />
            </div>
          </div>

          {/* Subtasks section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-4 w-20" />
              <SkeletonBox className="h-4 w-12" />
            </div>
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/10 px-3 py-2.5">
                  <SkeletonBox className="h-4 w-4 rounded" />
                  <SkeletonBox className="h-3 flex-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Activity log section */}
          <div className="flex flex-col gap-4 pt-4 border-t border-border">
            <SkeletonBox className="h-5 w-28" />
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <SkeletonBox className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <SkeletonBox className="h-3 w-24" />
                      <SkeletonBox className="h-2 w-16" />
                    </div>
                    <SkeletonBox className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 px-6 py-4 border-t border-border flex-shrink-0">
        <SkeletonBox className="h-9 flex-1 rounded-lg" />
        <SkeletonBox className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Showcase Page ────────────────────────────────────────────────────────────

import { useState } from "react";
import { Eye } from "lucide-react";

export function SkeletonStatesShowcase() {
  const [activeDemo, setActiveDemo] = useState<"board-list" | "kanban" | "task-detail" | null>(null);

  const demos = [
    {
      id: "board-list" as const,
      title: "Board List Loading",
      description: "Dashboard view with sidebar, stats cards, and board cards loading state",
      component: <BoardListLoadingSkeleton />,
    },
    {
      id: "kanban" as const,
      title: "Kanban Board Loading",
      description: "Full kanban board with columns and task cards loading state",
      component: <KanbanBoardLoadingSkeleton />,
    },
    {
      id: "task-detail" as const,
      title: "Task Detail Loading",
      description: "Side panel with task details, metadata, and activity log loading state",
      component: <TaskDetailLoadingSkeleton />,
    },
  ];

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Skeleton Loading States</h1>
        <p className="text-sm text-muted-foreground">
          Shimmer-animated skeleton screens for loading states throughout TaskFlow
        </p>
      </div>

      {/* Demo grid */}
      <div className="flex-1 px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {demos.map((demo) => (
            <div
              key={demo.id}
              className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-border/60 hover:shadow-lg hover:shadow-black/20 transition-all"
            >
              {/* Preview area */}
              <div className="relative h-48 bg-background/50 overflow-hidden border-b border-border flex items-center justify-center">
                <div className="absolute inset-0 opacity-[0.02]" style={{
                  backgroundImage: "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }} />

                {/* Skeleton preview - scaled down */}
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  <div className="transform scale-[0.25] origin-center w-[400%] h-[400%] pointer-events-none">
                    {demo.id === "board-list" && (
                      <div className="flex h-screen">
                        <div className="w-[260px] bg-card border-r border-border">
                          <div className="p-4 space-y-3">
                            <SkeletonBox className="h-8 w-24" />
                            <SkeletonBox className="h-6 w-full" />
                            <SkeletonBox className="h-6 w-full" />
                          </div>
                        </div>
                        <div className="flex-1 p-8">
                          <div className="grid grid-cols-3 gap-4">
                            <SkeletonBox className="h-32 w-full rounded-xl" />
                            <SkeletonBox className="h-32 w-full rounded-xl" />
                            <SkeletonBox className="h-32 w-full rounded-xl" />
                          </div>
                        </div>
                      </div>
                    )}
                    {demo.id === "kanban" && (
                      <div className="flex gap-4 p-6 h-screen">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="w-80 flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
                            <SkeletonBox className="h-8 w-24" />
                            <SkeletonBox className="h-24 w-full rounded-lg" />
                            <SkeletonBox className="h-24 w-full rounded-lg" />
                          </div>
                        ))}
                      </div>
                    )}
                    {demo.id === "task-detail" && (
                      <div className="w-[600px] h-screen bg-card border-l border-border p-6 ml-auto">
                        <div className="space-y-4">
                          <SkeletonBox className="h-8 w-48" />
                          <SkeletonBox className="h-6 w-full" />
                          <SkeletonBox className="h-6 w-3/4" />
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <SkeletonBox className="h-10 w-full rounded-lg" />
                            <SkeletonBox className="h-10 w-full rounded-lg" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => setActiveDemo(demo.id)}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    <Eye className="h-4 w-4" />
                    View Full Screen
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col gap-2 p-5">
                <h3 className="text-sm font-semibold text-foreground">{demo.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{demo.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full-screen demo modal */}
      {activeDemo && (
        <div className="fixed inset-0 z-[100] bg-background">
          {/* Close button */}
          <button
            onClick={() => setActiveDemo(null)}
            className="fixed top-4 right-4 z-[101] flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors shadow-lg"
          >
            Close Preview
          </button>

          {/* Render the selected skeleton */}
          {demos.find((d) => d.id === activeDemo)?.component}
        </div>
      )}
    </div>
  );
}
