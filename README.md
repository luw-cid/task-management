# 📋 Task Management System

Hệ thống quản lý công việc theo dạng Kanban Board, xây dựng bằng Java Spring Boot.
Cho phép các nhóm tổ chức, theo dõi và quản lý công việc hiệu quả.

---

## 🛠️ Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.x |
| Security | Spring Security + JWT |
| Database | MySQL |
| ORM | Spring Data JPA / Hibernate |
| Build Tool | Maven |
| Real-time | WebSocket + STOMP |

---

## ✨ Tính năng chính

- 🔐 **Xác thực** – Đăng ký, đăng nhập, JWT Access Token + Refresh Token
- 📋 **Quản lý Board** – Tạo board, mời thành viên, phân quyền
- 📊 **Quản lý Column** – Tạo cột tùy chỉnh, thay đổi thứ tự
- ✅ **Quản lý Task** – Tạo task, gán người, chuyển cột, lọc & sắp xếp
- 💬 **Bình luận** – Comment vào task, sửa/xóa bình luận
- 🔔 **Thông báo** – Real-time notification khi task thay đổi
- 📜 **Lịch sử** – Ghi lại toàn bộ thay đổi của task

---

## 🎯 Design Pattern áp dụng

### 1. Factory Pattern
Tạo các loại Task khác nhau với thuộc tính mặc định riêng.

```java
// Mỗi loại task có priority và màu sắc mặc định
TaskProduct product = TaskFactory.createTask(TaskType.BUG);
// BUG         → priority CRITICAL, màu đỏ
// FEATURE     → priority MEDIUM,   màu xanh lam
// IMPROVEMENT → priority LOW,      màu xanh lá
// EPIC        → priority HIGH,     màu tím
```

### 2. Strategy Pattern
Sắp xếp Task linh hoạt theo nhiều tiêu chí.

```java
// Chọn cách sắp xếp lúc runtime
TaskSortContext context = TaskSortContext.of("priority");
List<Task> sorted = context.sort(tasks);
// "deadline"  → SortByDeadline
// "priority"  → SortByPriority
// "assignee"  → SortByAssignee
// default     → SortByCreatedAt
```

### 3. Command Pattern
Đóng gói thao tác thành object, tự động ghi lịch sử.

```java
// Mỗi thay đổi được đóng gói thành Command
AssignTaskCommand command = new AssignTaskCommand(task, newAssignee);
commandInvoker.execute(command, task, user, ActivityAction.TASK_ASSIGNED);
// execute() → thực hiện thay đổi + ghi ActivityLog tự động
```

### 4. Observer Pattern
Tự động thông báo khi task thay đổi.

```java
// Publish 1 lần, tất cả Observer tự nhận
taskEventPublisher.publish(task, "TASK_ASSIGNED", message);
// → InAppNotificationObserver → lưu Notification vào DB
// → WebSocketObserver (mở rộng) → push real-time
```

### 5. Singleton Pattern
Tất cả Spring Bean (@Service, @Component) đều là Singleton,
đảm bảo chỉ có 1 instance trong toàn bộ ứng dụng.

### 6. Builder Pattern
Sử dụng Lombok @Builder để tạo object rõ ràng, tránh nhầm lẫn.

```java
Task task = Task.builder()
        .title(request.getTitle())
        .type(request.getType())
        .priority(taskProduct.getDefaultPriority())
        .build();
```

---

## 📁 Cấu trúc thư mục

```
src/main/java/com/example/luc/task_management/
│
├── config/             # Cấu hình hệ thống
│   ├── DatabaseConfig.java
│   └── SecurityConfig.java
│
├── controller/         # Nhận HTTP Request
│   ├── AuthController.java
│   ├── BoardController.java
│   ├── ColumnController.java
│   ├── TaskController.java
│   └── CommentController.java
│
├── service/            # Business Logic
│   ├── AuthService.java
│   ├── BoardService.java
│   ├── ColumnService.java
│   ├── TaskService.java
│   └── CommentService.java
│
├── repository/         # Tầng truy cập Database
│   ├── UserRepository.java
│   ├── BoardRepository.java
│   ├── TaskRepository.java
│   └── ...
│
├── entity/             # JPA Entity
│   ├── User.java
│   ├── Board.java
│   ├── Task.java
│   └── ...
│
├── dto/                # Data Transfer Object
│   ├── request/
│   └── response/
│
├── pattern/            # Design Pattern
│   ├── factory/        # Factory Pattern
│   ├── strategy/       # Strategy Pattern
│   ├── observer/       # Observer Pattern
│   └── command/        # Command Pattern
│
├── security/           # JWT Security
│   ├── JwtTokenProvider.java
│   └── JwtAuthenticationFilter.java
│
├── exception/          # Xử lý lỗi
│   ├── GlobalExceptionHandler.java
│   └── ErrorCode.java
│
└── util/
    └── SecurityUtils.java
```

---

## 🗄️ Database Schema

```
users
  └──< boards (owner_id)
          └──< board_members >── users
          └──< columns
          │       └──< tasks >── users (assignee, reporter)
          │               └──< subtasks
          │               └──< comments >── users
          │               └──< task_labels
          │               └──< activity_logs
          └──< labels ──< task_labels

users └──< notifications
users └──< refresh_tokens
```

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu
- Java 17+
- MySQL 8.0+
- Maven 3.8+

### Bước 1 – Clone project
```bash
git clone https://github.com/yourname/task-management.git
cd task-management
```

### Bước 2 – Tạo Database
```sql
CREATE DATABASE task_management_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### Bước 3 – Cấu hình `application.yml`
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/task_management_db
    username: your_username
    password: your_password

app:
  jwt:
    secret: your-secret-key-at-least-256-bits
    access-token-expiration: 86400000
    refresh-token-expiration: 604800000
```

### Bước 4 – Chạy project
```bash
mvn clean install -DskipTests
mvn spring-boot:run
```

Ứng dụng chạy tại: `http://localhost:8080`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/refresh-token` | Làm mới token |
| POST | `/api/auth/logout` | Đăng xuất |

### Board
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/boards` | Tạo board |
| GET | `/api/boards` | Danh sách board |
| GET | `/api/boards/{id}` | Chi tiết board |
| PUT | `/api/boards/{id}` | Cập nhật board |
| DELETE | `/api/boards/{id}` | Xóa board |
| POST | `/api/boards/{id}/members` | Mời thành viên |
| DELETE | `/api/boards/{id}/members/{userId}` | Xóa thành viên |

### Column
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/boards/{boardId}/columns` | Tạo cột |
| GET | `/api/boards/{boardId}/columns` | Danh sách cột |
| PUT | `/api/boards/{boardId}/columns/{id}` | Cập nhật cột |
| DELETE | `/api/boards/{boardId}/columns/{id}` | Xóa cột |

### Task
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/boards/{boardId}/tasks` | Tạo task |
| GET | `/api/boards/{boardId}/tasks` | Danh sách task |
| GET | `/api/boards/{boardId}/tasks/{id}` | Chi tiết task |
| PUT | `/api/boards/{boardId}/tasks/{id}` | Cập nhật task |
| PUT | `/api/boards/{boardId}/tasks/{id}/move` | Chuyển cột |
| PUT | `/api/boards/{boardId}/tasks/{id}/assign` | Gán người |
| DELETE | `/api/boards/{boardId}/tasks/{id}` | Xóa task |

### Comment
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/boards/{boardId}/tasks/{taskId}/comments` | Thêm comment |
| GET | `/api/boards/{boardId}/tasks/{taskId}/comments` | Danh sách comment |
| PUT | `/api/boards/{boardId}/tasks/{taskId}/comments/{id}` | Sửa comment |
| DELETE | `/api/boards/{boardId}/tasks/{taskId}/comments/{id}` | Xóa comment |

---

## 🔐 Xác thực

Tất cả API (trừ `/api/auth/**`) đều yêu cầu JWT Token trong header:

```
Authorization: Bearer <accessToken>
```

---

## 📊 Phân quyền

| Role | Quyền |
|---|---|
| `SYSTEM_ADMIN` | Toàn quyền hệ thống |
| `BOARD_ADMIN` | Quản lý board, thành viên, cột |
| `MEMBER` | Tạo và xử lý task, comment |
| `VIEWER` | Chỉ xem |

---

## 🔄 Luồng hoạt động chính

```
Đăng nhập → Nhận JWT Token
     │
     ▼
Tạo Board → Tự động tạo 3 cột (To Do, In Progress, Done)
     │
     ▼
Mời thành viên → Thông báo real-time
     │
     ▼
Tạo Task (Factory Pattern chọn priority mặc định)
     │
     ▼
Gán người thực hiện
     │   └── Command Pattern ghi lịch sử
     │   └── Observer Pattern gửi thông báo
     ▼
Chuyển Task sang cột khác (kéo thả)
     │   └── Command Pattern ghi lịch sử
     │   └── Observer Pattern gửi thông báo
     ▼
Comment vào Task
     │   └── Observer Pattern thông báo cho assignee + reporter
     ▼
Xem lịch sử thay đổi
```

---

## 👨‍💻 Tác giả

**Phạm Tiến Lực**
- GitHub: [github.com/yourname](https://github.com/yourname)
- Email: your.email@example.com

---

## 📄 License

MIT License
