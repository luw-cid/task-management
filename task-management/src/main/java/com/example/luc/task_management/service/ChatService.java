package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.chat.SendMessageRequest;
import com.example.luc.task_management.dto.response.ChatMessageResponse;
import com.example.luc.task_management.dto.websocket.WebSocketMessage;
import com.example.luc.task_management.dto.websocket.WebSocketMessageType;
import com.example.luc.task_management.entity.mongo.ChatMessage;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.repository.jpa.TaskRepository;
import com.example.luc.task_management.repository.mongo.ChatMessageRepository;
import com.example.luc.task_management.util.SecurityUtils;
import com.example.luc.task_management.websocket.WebSocketBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.example.luc.task_management.enums.MessageType;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final WebSocketBroadcaster webSocketBroadcaster;
    private final BoardSecurityService boardSecurityService;

    // Gửi tin nhắn -> lưu vào mongodb
    public ChatMessageResponse sendMessage(Long taskId, Long boardId, SendMessageRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        ChatMessage message = ChatMessage.builder()
                .taskId(taskId)
                .boardId(boardId)
                .senderId(currentUser.getId())
                .senderName(currentUser.getFullName())
                .senderAvatar(currentUser.getAvatarUrl())
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : MessageType.TEXT)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        chatMessageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.fromDocument(message, currentUser.getId());

        // ★ WEBSOCKET – Broadcast real-time
        WebSocketMessage<ChatMessageResponse> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.CHAT_MESSAGE,
                response,
                boardId,
                currentUser.getEmail()
        );
        wsMessage.setTaskId(taskId);
        webSocketBroadcaster.broadcastToTask(taskId, wsMessage);

        log.info("Chat message saved to Mongo: task={}", taskId);
        return response;
    }

    public List<ChatMessageResponse> getMessages(Long boardId, Long taskId, int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        // Query MongoDB – sort mới nhất trước
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        List<ChatMessageResponse> messages = chatMessageRepository
                .findAllByTaskIdAndIsDeletedFalse(taskId, pageable)
                .stream()
                .map(m -> ChatMessageResponse.fromDocument(m, currentUser.getId()))
                .collect(Collectors.toList());

        // Đảo ngược → hiển thị từ cũ đến mới
        Collections.reverse(messages);
        return messages;
    }


    public List<ChatMessageResponse> searchMessages(Long boardId, Long taskId, String keyword, int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        return chatMessageRepository.searchByContent(taskId, keyword, pageable)
                .stream()
                .map(m -> ChatMessageResponse.fromDocument(m, currentUser.getId()))
                .collect(Collectors.toList());
    }

    public void deleteMessage(Long boardId, Long taskId, String messageId) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        ChatMessage message = chatMessageRepository.findByIdAndTaskId(messageId, taskId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        // Chỉ người gửi đc xóa
        if (!message.getSenderId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        message.setIsDeleted(true);
        message.setContent("[Đã xóa]");
        chatMessageRepository.save(message);

        WebSocketMessage<String> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.CHAT_MESSAGE_DELETE,
                messageId,
                boardId,
                currentUser.getEmail()
        );

        wsMessage.setTaskId(taskId);
        webSocketBroadcaster.broadcastToTask(taskId, wsMessage);

        log.info("Chat message soft-delete: id={}", messageId);
    }

    // Thông báo vào chat
    public void notifyUserJoined(Long boardId, Long taskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        ChatMessage systemMessage = ChatMessage.builder()
                .taskId(taskId)
                .boardId(boardId)
                .senderId(currentUser.getId())
                .senderName(currentUser.getFullName())
                .senderAvatar(currentUser.getAvatarUrl())
                .content(currentUser.getFullName() + " joined the conversation.")
                .type(MessageType.SYSTEM)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        // Do not save system join message to MongoDB to prevent timeline clutter
        WebSocketMessage<ChatMessageResponse> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.CHAT_MESSAGE,
                ChatMessageResponse.fromDocument(systemMessage, currentUser.getId()),
                boardId,
                currentUser.getEmail()
        );
        wsMessage.setTaskId(taskId);
        webSocketBroadcaster.broadcastToTask(taskId, wsMessage);
    }

    // xóa toàn bộ chat chi task bị xóa
    public void deleteAllByTask(Long taskId) {
        chatMessageRepository.deleteAllByTaskId(taskId);
        log.info("All chat message deleted for task: {}", taskId);
    }

    public Long countMessages(Long boardId, Long taskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        taskRepository.findByIdAndBoardId(taskId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        return chatMessageRepository.countByTaskIdAndIsDeletedFalse(taskId);
    }

    // ─── BOARD CHAT METHODS ───

    public ChatMessageResponse sendBoardMessage(Long boardId, SendMessageRequest request) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        ChatMessage message = ChatMessage.builder()
                .boardId(boardId)
                .senderId(currentUser.getId())
                .senderName(currentUser.getFullName())
                .senderAvatar(currentUser.getAvatarUrl())
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : MessageType.TEXT)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        chatMessageRepository.save(message);

        ChatMessageResponse response = ChatMessageResponse.fromDocument(message, currentUser.getId());

        WebSocketMessage<ChatMessageResponse> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.CHAT_MESSAGE,
                response,
                boardId,
                currentUser.getEmail()
        );
        webSocketBroadcaster.broadcastToBoard(boardId, wsMessage);

        log.info("Board chat message saved: board={}", boardId);
        return response;
    }

    public List<ChatMessageResponse> getBoardMessages(Long boardId, int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        List<ChatMessageResponse> messages = chatMessageRepository
                .findAllByBoardIdAndIsDeletedFalse(boardId, pageable)
                .stream()
                .map(m -> ChatMessageResponse.fromDocument(m, currentUser.getId()))
                .collect(Collectors.toList());

        Collections.reverse(messages);
        return messages;
    }

    public List<ChatMessageResponse> searchBoardMessages(Long boardId, String keyword, int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        return chatMessageRepository.searchByBoardIdAndContent(boardId, keyword, pageable)
                .stream()
                .map(m -> ChatMessageResponse.fromDocument(m, currentUser.getId()))
                .collect(Collectors.toList());
    }

    public void deleteBoardMessage(Long boardId, String messageId) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        ChatMessage message = chatMessageRepository.findByIdAndBoardId(messageId, boardId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        if (!message.getSenderId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        message.setIsDeleted(true);
        message.setContent("[Đã xóa]");
        chatMessageRepository.save(message);

        WebSocketMessage<String> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.CHAT_MESSAGE_DELETE,
                messageId,
                boardId,
                currentUser.getEmail()
        );
        webSocketBroadcaster.broadcastToBoard(boardId, wsMessage);
    }

    public void notifyUserJoinedBoard(Long boardId) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        ChatMessage systemMessage = ChatMessage.builder()
                .boardId(boardId)
                .senderId(currentUser.getId())
                .senderName(currentUser.getFullName())
                .senderAvatar(currentUser.getAvatarUrl())
                .content(currentUser.getFullName() + " joined the board chat.")
                .type(MessageType.SYSTEM)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        // Do not save system join message to MongoDB to prevent timeline clutter
        WebSocketMessage<ChatMessageResponse> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.CHAT_MESSAGE,
                ChatMessageResponse.fromDocument(systemMessage, currentUser.getId()),
                boardId,
                currentUser.getEmail()
        );
        webSocketBroadcaster.broadcastToBoard(boardId, wsMessage);
    }

    public Long countBoardMessages(Long boardId) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        return chatMessageRepository.countByBoardIdAndIsDeletedFalse(boardId);
    }
}
