use `task-management`;

CREATE TABLE users (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    avatar_url  VARCHAR(500),
    role        ENUM('SYSTEM_ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expired_at  DATETIME NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE boards (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id    BIGINT NOT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE board_members (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    board_id    BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    role        ENUM('BOARD_ADMIN', 'MEMBER', 'VIEWER') NOT NULL DEFAULT 'MEMBER',
    joined_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_board_user (board_id, user_id),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);

CREATE TABLE columns (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    board_id    BIGINT NOT NULL,
    name        VARCHAR(100) NOT NULL,
    position    INT NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    column_id       BIGINT NOT NULL,
    board_id        BIGINT NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    type            ENUM('BUG', 'FEATURE', 'IMPROVEMENT', 'EPIC') NOT NULL DEFAULT 'FEATURE',
    priority        ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    status          ENUM('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE') NOT NULL DEFAULT 'TODO',
    assignee_id     BIGINT,
    reporter_id     BIGINT NOT NULL,
    deadline        DATETIME,
    position        INT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (column_id)   REFERENCES columns(id) ON DELETE CASCADE,
    FOREIGN KEY (board_id)    REFERENCES boards(id)  ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id)   ON DELETE SET NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id)   ON DELETE RESTRICT
);

CREATE TABLE subtasks (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id      BIGINT NOT NULL,
    title        VARCHAR(255) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    position     INT NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id     BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    content     TEXT NOT NULL,
    is_edited   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id)  ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE
);

CREATE TABLE labels (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    board_id    BIGINT NOT NULL,
    name        VARCHAR(50) NOT NULL,
    color       VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE task_labels (
    task_id     BIGINT NOT NULL,
    label_id    BIGINT NOT NULL,
    PRIMARY KEY (task_id, label_id),
    FOREIGN KEY (task_id)  REFERENCES tasks(id)  ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

CREATE TABLE activity_logs (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    board_id    BIGINT NOT NULL,
    task_id     BIGINT,
    user_id     BIGINT NOT NULL,
    action      VARCHAR(100) NOT NULL,  -- VD: TASK_CREATED, STATUS_CHANGED, ASSIGNED
    field_name  VARCHAR(100),           -- VD: status, assignee, priority
    old_value   VARCHAR(500),
    new_value   VARCHAR(500),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id)  REFERENCES tasks(id)  ON DELETE SET NULL,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE RESTRICT
);

CREATE TABLE notifications (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    type        ENUM('TASK_ASSIGNED', 'TASK_UPDATED', 'COMMENT_ADDED',
                     'BOARD_INVITED', 'DEADLINE_REMINDER') NOT NULL,
    reference_id    BIGINT,         -- ID của task hoặc board liên quan
    reference_type  VARCHAR(50),    -- 'TASK' hoặc 'BOARD'
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);