# 📋 Task Management System (TaskFlow)

Hệ thống quản lý công việc theo dạng Kanban Board với kiến trúc **Full-stack (Spring Boot + React Vite)**.
Hỗ trợ quản lý công việc, thảo luận nhóm Real-time qua WebSocket và lưu trữ dữ liệu kết hợp **Dual-Database (MySQL + MongoDB)**.

---

## 🛠️ Tech Stack

### Backend
| Thành phần | Công nghệ |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.x |
| Security | Spring Security + JWT (Access Token & Refresh Token) |
| Relational DB | MySQL / Supabase PostgreSQL (Chuẩn bị statement transaction threshold = 0) |
| NoSQL DB | MongoDB (Lưu trữ Chat & Comments real-time) |
| ORM | Spring Data JPA (Relational) + Spring Data MongoDB (NoSQL) |
| Real-time | WebSocket + STOMP / SockJS |
| Build Tool | Maven |

### Frontend (`taskflow-UI`)
| Thành phần | Công nghệ |
|---|---|
| Core | React 18 + TypeScript + Vite |
| Styling | TailwindCSS + Lucide Icons + Glassmorphism Design |
| Animation | Motion (Framer Motion) |
| State & Query | TanStack Query (React Query v5) + Axios |
| WebSocket | `@stomp/stompjs` + `sockjs-client` |

---

## ✨ Tính năng chính

- 🔐 **Xác thực & Bảo mật** – Đăng ký, đăng nhập, JWT Access Token & Refresh Token lưu trữ an toàn.
- 📋 **Quản lý Board** – Tạo board, mời thành viên, thống kê tiến độ, phân quyền thành viên.
- 📊 **Quản lý Column** – Tạo cột tùy chỉnh, đổi màu sắc, thay đổi vị trí kéo thả.
- ✅ **Quản lý Task** – Tạo task, gán người thực hiện, chuyển cột, phân loại độ ưu tiên, lọc & tìm kiếm.
- 💬 **Bình luận (Task Comments - MongoDB)** – Đăng bình luận trong task, sửa/xóa bình luận, thanh cuộn mượt mà và tự động cuộn xuống tin nhắn mới nhất.
- 🗣️ **Chat Room Real-time (Board Chat - MongoDB + WebSocket)** – Cửa sổ Chat nhóm nổi tại giao diện Board, nhắn tin trực tiếp với toàn đội, căn lề tin nhắn góc phải thông minh.
- 🔔 **Thông báo & Lịch sử** – Real-time notification qua WebSocket và ghi Activity Logs toàn bộ thay đổi.

---

## 🏗️ Kiến trúc Dual-Database (MySQL + MongoDB)

Hệ thống kết hợp sức mạnh của 2 cơ sở dữ liệu:

```
                  ┌─────────────────────────────────────────┐
                  │           TaskFlow Application          │
                  └────────────────────┬────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
  ┌───────────────────────────┐                 ┌───────────────────────────┐
  │     MySQL / PostgreSQL    │                 │          MongoDB          │
  │    (Dữ liệu Quan hệ)      │                 │    (Dữ liệu Truyền thông) │
  ├───────────────────────────┤                 ├───────────────────────────┤
  │ - Users & Auth Tokens     │                 │ - Board Chat Messages     │
  │ - Boards & Members        │                 │ - Task Comments           │
  │ - Columns & Tasks         │                 │ - Message Search & Logs   │
  │ - Subtasks & Activity Logs│                 └───────────────────────────┘
  └───────────────────────────┘
```

---

## 🎯 Design Pattern áp dụng

### 1. Factory Pattern
Tạo các loại Task khác nhau với thuộc tính mặc định riêng.
```java
TaskProduct product = TaskFactory.createTask(TaskType.BUG);
// BUG         → priority CRITICAL, màu đỏ
// FEATURE     → priority MEDIUM,   màu xanh lam
// IMPROVEMENT → priority LOW,      màu xanh lá
// EPIC        → priority HIGH,     màu tím
```

### 2. Strategy Pattern
Sắp xếp Task linh hoạt theo nhiều tiêu chí runtime.
```java
TaskSortContext context = TaskSortContext.of("priority");
List<Task> sorted = context.sort(tasks);
```

### 3. Command Pattern
Đóng gói thao tác thành object, tự động ghi lịch sử Activity Log.
```java
AssignTaskCommand command = new AssignTaskCommand(task, newAssignee);
commandInvoker.execute(command, task, user, ActivityAction.TASK_ASSIGNED);
```

### 4. Observer Pattern
Tự động gửi thông báo cho assignee & reporter khi task/comment có thay đổi.
```java
commentObserver.onCommentAdded(comment);
```

### 5. Singleton & Builder Pattern
- Sử dụng Spring Beans Singleton đảm bảo tối ưu tài nguyên.
- Sử dụng Lombok `@Builder` cho các DTO và Entities.

---

## 📁 Cấu trúc thư mục Backend

```
src/main/java/com/example/luc/task_management/
│
├── config/             # Cấu hình hệ thống (Database, Security, WebSocket)
├── controller/         # REST Controllers
│   ├── AuthController.java
│   ├── BoardController.java
│   ├── BoardChatController.java   # REST API Chat Board
│   ├── ColumnController.java
│   ├── TaskController.java
│   └── CommentController.java     # REST API Comments
│
├── service/            # Business Logic Layer
│   ├── AuthService.java
│   ├── BoardService.java
│   ├── ChatService.java           # Xử lý Chat MongoDB + STOMP
│   ├── CommentService.java        # Xử lý Comments MongoDB
│   └── TaskService.java
│
├── repository/         # Data Access Layer
│   ├── jpa/            # MySQL / JPA Repositories (User, Board, Task...)
│   └── mongo/          # MongoDB Repositories (ChatMessage, Comment)
│
├── entity/             # Data Entities
│   ├── mysql/          # Relational JPA Entities
│   └── mongo/          # NoSQL MongoDB Documents (ChatMessage, Comment)
│
├── pattern/            # GoF Design Patterns
│   ├── factory/        # Factory Pattern
│   ├── strategy/       # Strategy Pattern
│   ├── observer/       # Observer Pattern
│   └── command/        # Command Pattern
│
├── websocket/          # WebSocket Broadcaster & STOMP Handler
└── security/           # JWT Security Filters
```

---

## 📡 API Endpoints chính

### Authentication
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập nhận JWT |
| POST | `/api/auth/refresh-token` | Làm mới Token |
| POST | `/api/auth/logout` | Đăng xuất |

### Board Chat (MongoDB + WebSocket)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/boards/{boardId}/chat/messages` | Gửi tin nhắn Chat vào Board |
| GET | `/api/boards/{boardId}/chat/messages` | Lấy danh sách tin nhắn Chat |
| GET | `/api/boards/{boardId}/chat/messages/search` | Tìm kiếm tin nhắn Chat theo từ khóa |
| DELETE | `/api/boards/{boardId}/chat/messages/{messageId}` | Xóa tin nhắn Chat |
| GET | `/api/boards/{boardId}/chat/count` | Đếm tổng số tin nhắn |

### Task Comments (MongoDB)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/boards/{boardId}/tasks/{taskId}/comments` | Thêm bình luận vào Task |
| GET | `/api/boards/{boardId}/tasks/{taskId}/comments` | Lấy danh sách bình luận |
| PUT | `/api/boards/{boardId}/tasks/{taskId}/comments/{commentId}` | Chỉnh sửa bình luận |
| DELETE | `/api/boards/{boardId}/tasks/{taskId}/comments/{commentId}` | Xóa bình luận |

---

## 🔌 Kênh WebSocket Real-time (STOMP)

- Endpoint kết nối: `/ws` (Hỗ trợ SockJS fallback)
- Header xác thực: `Authorization: Bearer <accessToken>`
- Subscriptions:
  - `/topic/board/{boardId}`: Nhận cập nhật Task và tin nhắn Chat của Board real-time.
  - `/topic/task/{taskId}/comments`: Nhận bình luận mới của Task tức thì.

---

## 🚀 Hướng dẫn khởi chạy Local

### 1. Backend (Spring Boot)
```bash
cd task-management
mvn clean install -DskipTests
mvn spring-boot:run
```
*(Chạy tại: `http://localhost:8080`)*

### 2. Frontend (React Vite)
```bash
cd taskflow-UI
npm install
npm run dev
```
*(Chạy tại: `http://localhost:5173`)*

---

## 👨‍💻 Tác giả

**Phạm Tiến Lực** (Luwcid)
- Repository: [task-management](https://github.com/luw-cid/task-management)
