# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Monorepo with two modules:
- `task-management/` — Spring Boot 4 backend (Java 17, Maven)
- `taskflow-UI/` — React 18 + TypeScript frontend (Vite 6, pnpm)

## Commands

### Backend (`task-management/`)

```bash
# Run (from repo root)
cd task-management && ./mvnw spring-boot:run

# Build
cd task-management && ./mvnw package -DskipTests

# Run all tests
cd task-management && ./mvnw test

# Run a single test class
cd task-management && ./mvnw test -Dtest=TaskServiceTest

# Run a single test method
cd task-management && ./mvnw test -Dtest=TaskServiceTest#createTask_shouldReturnTask
```

Backend requires MySQL at `localhost:3306/task_management`. Credentials via env vars `DB_USERNAME` / `DB_PASSWORD` (default: `root` / empty). Flyway is disabled; JPA uses `ddl-auto: update`.

### Frontend (`taskflow-UI/`)

```bash
# Dev server (from repo root)
cd taskflow-UI && pnpm dev

# Production build
cd taskflow-UI && pnpm build

# Type check (no tsc script exists — use vite build to catch type errors)
cd taskflow-UI && pnpm build
```

No test framework is set up yet. To add Vitest: `pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom`.

## Architecture

### Backend

**Security**: JWT-based auth (`jjwt 0.12.3`). `JwtAuthenticationFilter` validates tokens on every request. `SecurityConfig` defines public vs protected routes. JWT secret and expiry are in `application.yml` under `app.jwt`.

**Layered structure**: `Controller → Service → Repository → Entity`. Controllers return `ApiResponse<T>` wrappers. Errors are thrown as `AppException(ErrorCode)` and caught by `GlobalExceptionHandler`.

**Design patterns in use**:
- `pattern/factory/` — `TaskFactory` creates typed task products (`BugTask`, `EpicTask`, `FeatureTask`, `ImprovementTask`) based on `TaskType` enum
- `pattern/command/` — `CommandInvoker` executes `TaskCommand` implementations (`MoveTaskCommand`, `AssignTaskCommand`, `UpdateTaskCommand`)
- `pattern/strategy/` — `TaskSortContext` applies `TaskSortStrategy` implementations (sort by deadline, priority, assignee, createdAt)
- `pattern/observer/` — `TaskEvenPublisher` notifies `TaskObserver` instances (`InAppNotificationObserver`, `WebSocketNotificationObserver`, `CommentObserver`)

**WebSocket**: STOMP over `/ws` endpoint (`WebSocketConfig`). `WebSocketBroadcaster` pushes `WebSocketMessage<T>` payloads typed by `WebSocketMessageType`.

**Entities**: `Board → ColumnEntity → Task`. Tasks have `Subtask`, `Comment`, `Label` (via `TaskLabel` join), `ActivityLog`, `Notification`. `BaseEntity` provides `createdAt`/`updatedAt`. `BoardMember` links `User` to `Board` with a `BoardRole`.

**Enums**: `TaskStatus` (TODO/IN_PROGRESS/IN_REVIEW/DONE), `TaskPriority` (LOW/MEDIUM/HIGH/CRITICAL), `TaskType` (BUG/FEATURE/IMPROVEMENT/EPIC), `BoardRole` (OWNER/ADMIN/MEMBER), `SystemRole` (ADMIN/USER).

### Frontend

**API layer** (`src/api/`): Axios instance in `axios.ts` with JWT interceptor (attaches `Authorization: Bearer` header, handles 401 by dispatching `taskflow:auth-expired` custom event). Each domain has its own file (`boards.ts`, `tasks.ts`, `columns.ts`, etc.) re-exported from `index.ts`.

**State management**: TanStack Query v5 for all server state. No global client state store — component-local `useState` only.

**Routing**: React Router v7. Routes defined in `App.tsx`. `ProtectedRoute` guards authenticated routes. Board view lives at `/boards/:boardId`, stats at `/boards/:boardId/statistics`.

**UI**: shadcn/ui components in `src/app/components/ui/`. MUI used alongside for some components. Tailwind CSS v4 for styling. `motion/react` (Framer Motion) for animations.

**Key components**:
- `App.tsx` — root router, auth state, all modal state, all TanStack Query mutations for board/task/column operations
- `BoardDetail.tsx` — Kanban board with drag-and-drop (react-dnd)
- `TaskDetailPanel.tsx` — slide-in panel for task editing
- `BoardStatistics.tsx` — Recharts-based board analytics

**Types** (`src/types/index.ts`): Single source of truth for all API response/request shapes shared across the frontend.
