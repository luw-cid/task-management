export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface UpdateUserProfileRequest {
  fullName?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: UserInfo;
}

export type BoardRole = "BOARD_ADMIN" | "MEMBER" | "VIEWER";

export interface BoardMember {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: BoardRole;
}

export interface Board {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  ownerName: string;
  isArchived: boolean;
  memberCount: number;
  members: BoardMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  isArchived?: boolean;
}

export interface InviteBoardMemberRequest {
  email: string;
  role: BoardRole;
}

export interface Column {
  id: number;
  boardId: number;
  name: string;
  position: number;
  taskCount: number;
  createdAt: string;
}

export interface CreateColumnRequest {
  name: string;
}

export interface UpdateColumnRequest {
  name: string;
}

export type TaskType = "BUG" | "FEATURE" | "IMPROVEMENT" | "EPIC";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

export interface Task {
  id: number;
  title: string;
  description: string;
  type: TaskType;
  color: string;
  priority: TaskPriority;
  status: TaskStatus;
  columnId: number;
  columnName: string;
  boardId: number;
  assigneeId: number | null;
  assigneeName: string | null;
  assigneeAvatar: string | null;
  reporterId: number;
  reporterName: string;
  labels: Label[];
  subtaskTotal: number;
  subtaskCompleted: number;
  completionPercentage: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  type: TaskType;
  columnId: number;
  assigneeId?: number | null;
  deadline?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string | null;
}

export interface MoveTaskRequest {
  columnId: number;
  status: TaskStatus;
}

export interface AssignTaskRequest {
  assigneeId: number | null;
}

export interface Subtask {
  id: number;
  taskId: number;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubtaskRequest {
  title: string;
}

export interface UpdateSubtaskRequest {
  title?: string;
  completed?: boolean;
}

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  userFullName: string;
  userAvatar: string | null;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface Label {
  id: number;
  boardId: number;
  name: string;
  color: string;
  taskCount: number;
}

export interface CreateLabelRequest {
  name: string;
  color: string;
}

export interface UpdateLabelRequest {
  name: string;
  color: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  referenceId: number;
  referenceType: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  boardId: number;
  taskId: number | null;
  taskTitle: string | null;
  userId: number;
  userFullName: string;
  userAvatarUrl: string | null;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface MemberStats {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  assigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

export interface Statistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksByStatus: Record<string, number>;
  tasksByType: Record<string, number>;
  tasksByPriority: Record<string, number>;
  memberStats: MemberStats[];
  upcomingDeadlines: Task[];
  overdueTasks2: Task[];
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface WebSocketMessage<T> {
  type: string;
  payload: T;
  boardId: number | null;
  taskId: number | null;
  triggeredBy: string;
  timestamp: string;
}

export type ChatMessageType = "TEXT" | "SYSTEM" | "IMAGE" | "FILE";

export interface ChatMessage {
  id: string;
  taskId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  type: ChatMessageType;
  isDeleted: boolean;
  isOwn: boolean;
  createdAt: string;
}

export interface SendChatMessageRequest {
  content: string;
  type?: ChatMessageType;
}
