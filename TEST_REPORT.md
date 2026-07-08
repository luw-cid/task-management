# Báo Cáo Test Toàn Bộ Hệ Thống — TaskFlow

> Ngày test: 2026-06-16
> Người thực hiện: QA Automation (Claude Code)
> Phạm vi: Backend Spring Boot (REST API) + kiểm tra build Frontend
> Lưu ý: **Không sửa code** — báo cáo chỉ ghi nhận lỗi và đề xuất tối ưu.

---

## 1. Tài Khoản Test

Tài khoản được tạo qua API đăng ký (`POST /api/auth/register`) để chạy toàn bộ kịch bản test.

| Trường | Giá trị |
|---|---|
| **User ID** | 6 |
| **Email** | `qa.automation@taskflow.test` |
| **Mật khẩu** | `QaTest@2026` |
| **Họ tên** | QA Automation |
| **Role** | USER |

Tài khoản phụ (dùng test mời thành viên / phân quyền):

| Trường | Giá trị |
|---|---|
| **User ID** | 5 |
| **Email** | `qa.tester@taskflow.test` |
| **Họ tên** | QA Tester |
| **Role** | USER |

> Đây là tài khoản test cục bộ trên DB `task_management` (MySQL localhost). Nên xóa khi không còn dùng.

---

## 2. Môi Trường

| Thành phần | Trạng thái |
|---|---|
| Java | 21.0.2 LTS |
| Maven | 3.9.15 |
| Backend Spring Boot | Khởi động OK trên `:8080`, kết nối MySQL OK (ddl-auto=update tự tạo bảng) |
| MySQL | Đang chạy `:3306`, DB `task_management` |
| Frontend Vite | Build production OK (`pnpm build` thành công, 2754 modules) |
| Frontend dev server | Không khởi động được tự động qua bash/cmd trong môi trường này (pnpm chỉ chạy được qua cmd, lệnh `start` tách tiến trình rồi thoát). Build OK nên không phải lỗi code. |

---

## 3. Kết Quả Test API

**Tổng: 70 ca test — PASS 66 / FAIL 4** (sau khi loại bỏ các lỗi do script test sai).

Đã test đầy đủ các nhóm: Auth, User Profile, Board, Column, Label, Task (Factory/Strategy/Command), Subtask, Comment, Activity Log, Statistics, Notification, Invite Member, Archive, Refresh Token, và các ca validation/authorization.

### Các nhóm PASS hoàn toàn
- **Auth**: login, login sai (401), register trùng email (400), register password ngắn (400), refresh token.
- **User Profile**: get me, update, get by id.
- **Board**: CRUD, validation tên ngắn, archive/unarchive, danh sách archived.
- **Column**: list, create, update, validation tên rỗng, chống trùng tên.
- **Label**: CRUD, validation màu hex sai, gắn/gỡ label vào task.
- **Task**: create đủ 3 type (FEATURE/BUG/EPIC), list, sort 4 chiến lược (Strategy Pattern hoạt động), get by id, get by column, update, move (Command Pattern), validation thiếu title, task không tồn tại (404).
- **Subtask / Comment**: CRUD + validation.
- **Statistics**: trả về thống kê chính xác (totalTasks, theo status/type/priority, memberStats).
- **Notification**: list, unread-count, read-all.
- **Invite Member / Authorization**: mời thành viên, mời email không tồn tại (404).

---

## 4. Lỗi Phát Hiện

### 🔴 BUG-01 — `assignTask` thiếu `@Transactional` → lỗi 500

- **Endpoint**: `PUT /api/boards/{boardId}/tasks/{taskId}/assign`
- **Hiện tượng**: Trả về `500 {"message":"System error, please try again later"}` thay vì gán assignee thành công.
- **File**: `service/TaskService.java:263` — method `assignTask(...)`
- **Root cause**: Đây là method mutating **duy nhất** không có annotation `@Transactional` (so với `createTask`, `updateTask`, `moveTask`, `deleteTask` đều có). Khi không có transaction, `Task` lấy từ repository bị **detached**. Trong `AssignTaskCommand.execute()` (`pattern/command/AssignTaskCommand.java:17`) truy cập `task.getAssignee().getFullName()` — `assignee` là `FetchType.LAZY` → ném `LazyInitializationException` → rơi vào generic handler → 500.
- **Đề xuất sửa**: Thêm `@Transactional` lên method `assignTask` (giống các method còn lại).

### 🔴 BUG-02 — Xóa label đang gắn vào task → lỗi 500

- **Endpoint**: `DELETE /api/boards/{boardId}/labels/{labelId}`
- **Hiện tượng**: Xóa label chưa gắn task thì OK; xóa label **đang gắn** vào task trả về 500.
- **File**: `service/LabelService.java:92` (`deleteLabel`), `entity/Task.java:85-92`, `entity/Label.java:30-32`
- **Root cause**: Quan hệ `@ManyToMany` được **sở hữu (owning side) bởi `Task`** qua `@JoinTable(name = "task_labels")`. Phía `Label` chỉ là `mappedBy = "labels"` (inverse side, **không có** cascade/orphanRemoval). Comment trong code (`LabelService.java:101-102`) ghi "tự động remove khỏi task_labels nhờ CascadeType và orphanRemoval" — **giả định này sai**. Khi `labelRepository.delete(label)`, các dòng trong `task_labels` không bị xóa trước → vi phạm khóa ngoại (FK constraint) → `DataIntegrityViolationException` → 500.
- **Đề xuất sửa**: Trước khi xóa label, gỡ nó khỏi tất cả task (xóa các dòng `task_labels` của `labelId`), ví dụ thêm query `DELETE FROM task_labels WHERE label_id = :labelId` trong `deleteLabel`, hoặc cấu hình quan hệ để dọn join table đúng cách.

### 🟠 BUG-03 — Enum không hợp lệ → 500 thay vì 400

- **Endpoint**: `POST /api/boards/{boardId}/tasks` với `"type":"NOPE"` (giá trị enum sai)
- **Hiện tượng**: Trả về 500 thay vì 400 Bad Request.
- **File**: `exception/GlobalExceptionHandler.java`
- **Root cause**: Giá trị enum sai khiến Jackson ném `HttpMessageNotReadableException` ngay khi deserialize body — xảy ra **trước** khi `@Valid` chạy. Handler hiện chỉ bắt `MethodArgumentNotValidException` và `AppException`, nên rơi vào `Exception` chung → 500. Client không phân biệt được đây là lỗi dữ liệu đầu vào.
- **Đề xuất sửa**: Thêm `@ExceptionHandler(HttpMessageNotReadableException.class)` trả về 400 với thông báo rõ ràng (ví dụ liệt kê các giá trị enum hợp lệ).

### 🟡 BUG-04 (Minor) — Truy cập không token trả về 403 thay vì 401

- **Endpoint**: bất kỳ endpoint cần auth khi **không gửi** token (vd `GET /api/boards`)
- **Hiện tượng**: Trả về `403 Forbidden` thay vì `401 Unauthorized`.
- **Root cause**: Cấu hình Spring Security chưa set `AuthenticationEntryPoint` riêng, nên request thiếu authentication bị xử lý như "access denied" (403). Đúng chuẩn REST: **chưa xác thực → 401**, đã xác thực nhưng không đủ quyền → 403.
- **Đề xuất sửa**: Cấu hình `authenticationEntryPoint` trả về 401 cho request thiếu/invalid token trong `SecurityConfig`.

---

## 5. Các Điểm Cần Tối Ưu (không phải lỗi)

### OPT-01 — Truy vấn N+1 trong list task
- **File**: `TaskService.java:138` (`getTasksByBoard`), `:154` (`getTasksByColumn`)
- Mỗi task gọi `TaskFactory.createTask(task.getType())` chỉ để lấy `getColor()` — chấp nhận được, nhưng việc map `TaskResponse.fromEntity` có thể chạm các quan hệ LAZY (assignee, labels, subtasks) gây N+1 query. **Đề xuất**: dùng `@EntityGraph` hoặc `JOIN FETCH` khi load danh sách task để gom query.

### OPT-02 — `getTasksByColumn` đánh dấu `@Transactional` (read-write) cho thao tác chỉ đọc
- **File**: `TaskService.java:146`
- Nên là `@Transactional(readOnly = true)` như `getTasksByBoard` để DB tối ưu (không flush, không dirty-check).

### OPT-03 — `getBoardMembers` dùng `@Transactional` đọc + gọi `findById` 2 lần
- **File**: `BoardService.java:155-169`
- `getBoardAndCheckAdmin` đã load board, sau đó `findAllByBoard(boardRepository.findById(boardId)...)` load lại lần nữa. **Đề xuất**: tái sử dụng `board` đã load, và đặt `readOnly = true`.

### OPT-04 — Phân quyền xem member quá chặt
- **File**: `BoardService.java:156` — `getBoardMembers` gọi `getBoardAndCheckAdmin` (chỉ admin/owner). Nhưng `ColumnService.getColumnsByBoard` và `LabelService.getLabelsByBoard` lại cho **mọi thành viên** xem. **Không nhất quán** — thành viên thường (MEMBER/VIEWER) không xem được danh sách member của board mình. Cân nhắc nới quyền cho member xem.

### OPT-05 — Thông báo lỗi business trả về message tiếng Việt/Anh lẫn lộn
- Ví dụ: register thành công trả `"Tạo thành công"`, statistics trả `"Thành công"`, nhưng login trả `"Login successfully"`, validation trả `"Dữ liệu không hợp lệ"`. **Đề xuất**: thống nhất một ngôn ngữ hoặc dùng i18n (message key + `messages.properties`).

### OPT-06 — Frontend bundle quá lớn (1.07 MB / gzip 298 KB)
- **File**: cảnh báo khi `pnpm build`: `index-*.js` 1,069 KB vượt ngưỡng 500 KB.
- **Đề xuất**: code-split bằng `dynamic import()` (lazy-load route board/statistics), hoặc cấu hình `build.rollupOptions.output.manualChunks` để tách vendor (MUI, Radix, Recharts, react-dnd).

### OPT-07 — JWT secret hardcode trong `application.yml`
- **File**: `resources/application.yml:51`
- Secret JWT để cứng trong file cấu hình (dù có comment "prod dùng biến môi trường"). **Đề xuất**: chuyển sang biến môi trường `${JWT_SECRET}` cho mọi môi trường, không commit secret thật.

### OPT-08 — Typo / đặt tên dễ gây nhầm
- `entity/UpdateSubtaskRequest.java:14` — field `Completed` viết hoa (lệch convention camelCase, dễ gây sai khi map JSON; client gửi `isCompleted` có thể không bind đúng).
- `StatisticsResponse` có field `overdueTask2` (`api-test` log) — tên trường lạ, nên đổi thành tên có nghĩa.
- Một số observer/listener đặt tên `TaskEvenPublisher`, `WebSocketEvenListener` (thiếu chữ "t" — "Event"). Không ảnh hưởng chức năng nhưng nên sửa cho dễ đọc.

---

## 6. Tổng Kết & Ưu Tiên

| Ưu tiên | Mục | Ảnh hưởng |
|---|---|---|
| 🔴 Cao | BUG-01 (assign task 500) | Chức năng gán người chính của Kanban bị hỏng hoàn toàn |
| 🔴 Cao | BUG-02 (xóa label 500) | Không xóa được label đã dùng — data integrity |
| 🟠 TB | BUG-03 (enum → 500) | Sai chuẩn HTTP, ảnh hưởng UX client |
| 🟡 Thấp | BUG-04 (401 vs 403) | Sai chuẩn REST, không chặn chức năng |
| ⚪ Tối ưu | OPT-01..08 | Hiệu năng, bảo mật, maintainability |

**Đánh giá chung**: Backend hoạt động tốt ở ~94% endpoint (66/70). Các pattern (Factory, Strategy, Command, Observer) hoạt động đúng. 2 bug nghiêm trọng (BUG-01, BUG-02) đều có nguyên nhân rõ ràng và sửa đơn giản. Frontend build sạch, chỉ cần tối ưu bundle size.
