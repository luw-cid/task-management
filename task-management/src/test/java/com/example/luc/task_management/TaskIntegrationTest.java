package com.example.luc.task_management;

import com.example.luc.task_management.entity.mysql.Board;
import com.example.luc.task_management.entity.mysql.ColumnEntity;
import com.example.luc.task_management.entity.mysql.Task;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.enums.TaskPriority;
import com.example.luc.task_management.enums.TaskStatus;
import com.example.luc.task_management.enums.TaskType;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.repository.jpa.ColumnRepository;
import com.example.luc.task_management.repository.jpa.TaskRepository;
import com.example.luc.task_management.repository.jpa.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
public class TaskIntegrationTest {

    // Khởi tạo container PostgreSQL thật
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ColumnRepository columnRepository;

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
}
