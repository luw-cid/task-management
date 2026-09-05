package com.example.luc.task_management;

import com.example.luc.task_management.entity.mysql.Board;
import com.example.luc.task_management.entity.mysql.ColumnEntity;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.TaskPriority;
import com.example.luc.task_management.enums.TaskStatus;
import com.example.luc.task_management.enums.TaskType;
import com.example.luc.task_management.repository.jpa.BoardMemberRepository;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.repository.jpa.ColumnRepository;
import com.example.luc.task_management.repository.jpa.TaskRepository;
import com.example.luc.task_management.repository.jpa.UserRepository;
import com.example.luc.task_management.service.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import static org.assertj.core.api.Assertions.assertThat;

public class TaskIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ColumnRepository columnRepository;

    @Autowired
    private BoardMemberRepository boardMemberRepository;

    @Autowired
    private TaskService taskService;

    @Autowired
    private org.springframework.cache.CacheManager cacheManager;

    @Autowired
    private org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate;

    @Test
    void shouldCreateAndPersistTaskSuccessfully() {
        // 1. Tạo User mẫu
        User user = userRepository.save(User.builder()
                .email("test@example.com")
                .password("encoded_pass")
                .fullName("Test User")
                .role(com.example.luc.task_management.enums.SystemRole.USER)
                .isActive(true)
                .build());

        // 2. Tạo Board & Column
        Board board = boardRepository.save(Board.builder()
                .name("Project Alpha")
                .owner(user)
                .isArchived(false)
                .build());

        ColumnEntity column = columnRepository.save(ColumnEntity.builder()
                .name("TODO")
                .board(board)
                .position(0)
                .build());

        // 3. Tạo Task và lưu vào PostgreSQL thật của Testcontainers
        Task task = taskRepository.save(Task.builder()
                .title("Nhiệm vụ đầu tiên")
                .board(board)
                .column(column)
                .reporter(user)
                .type(TaskType.FEATURE)
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .position(0)
                .build());

        // 4. Assert kiểm tra dữ liệu đã lưu đúng và sinh ID
        assertThat(task.getId()).isNotNull();
        assertThat(taskRepository.findById(task.getId())).isPresent();
    }

    @Test
    void shouldCacheBoardTasksAndEvictOnUpdate() {
        // 1. Tạo User và cấp quyền đăng nhập trong SecurityContext
        User user = userRepository.save(User.builder()
                .email("cache_tester@example.com")
                .password("encoded_pass")
                .fullName("Cache Tester")
                .role(com.example.luc.task_management.enums.SystemRole.USER)
                .isActive(true)
                .build());

        com.example.luc.task_management.security.CustomUserDetails userDetails =
                new com.example.luc.task_management.security.CustomUserDetails(user);
        org.springframework.security.core.Authentication auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

        // 2. Tạo Board, gán User làm ADMIN, tạo Column và Task
        Board board = boardRepository.save(Board.builder()
                .name("Cache Board")
                .owner(user)
                .isArchived(false)
                .build());

        boardMemberRepository.save(com.example.luc.task_management.entity.mysql.BoardMember.builder()
                .board(board)
                .user(user)
                .role(com.example.luc.task_management.enums.BoardRole.BOARD_ADMIN)
                .build());

        ColumnEntity column = columnRepository.save(ColumnEntity.builder()
                .name("IN_PROGRESS")
                .board(board)
                .position(0)
                .build());

        Task task = taskRepository.save(Task.builder()
                .title("Task trước khi update")
                .board(board)
                .column(column)
                .reporter(user)
                .type(TaskType.FEATURE)
                .priority(TaskPriority.MEDIUM)
                .status(TaskStatus.TODO)
                .position(0)
                .build());

        // 3. Gọi getTasksByBoard lần 1 -> Phải nạp kết quả vào Redis Cache
        java.util.List<com.example.luc.task_management.dto.response.TaskResponse> tasks =
                taskService.getTasksByBoard(board.getId(), "createdAt");
        assertThat(tasks).isNotEmpty();

        org.springframework.cache.Cache cache = cacheManager.getCache("board_tasks");
        assertThat(cache).isNotNull();
        String cacheKey = board.getId() + ":createdAt";
        assertThat(cache.get(cacheKey)).isNotNull(); // ĐÃ ĐƯỢC CACHE VÀO REDIS!

        // 4. Update task -> @CacheEvict phải tự động xóa cache này khỏi Redis
        com.example.luc.task_management.dto.request.task.UpdateTaskRequest updateReq =
                new com.example.luc.task_management.dto.request.task.UpdateTaskRequest();
        updateReq.setTitle("Task sau khi update");
        updateReq.setPriority(TaskPriority.HIGH);

        taskService.updateTask(board.getId(), task.getId(), updateReq);

        // 5. Kiểm tra Cache: Key phải bị xóa (Evicted) để chống dữ liệu cũ!
        assertThat(cache.get(cacheKey)).isNull(); // CACHE INVALIDATION THÀNH CÔNG!
    }
}
