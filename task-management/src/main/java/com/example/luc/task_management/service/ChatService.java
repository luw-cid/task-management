package com.example.luc.task_management.service;

import com.example.luc.task_management.dto.request.chat.SendMessageRequest;
import com.example.luc.task_management.dto.response.ChatMessageResponse;
import com.example.luc.task_management.dto.websocket.WebSocketMessage;
import com.example.luc.task_management.dto.websocket.WebSocketMessageType;
import com.example.luc.task_management.entity.mongo.ChatMessage;
import com.example.luc.task_management.entity.mongo.item.ChatBucket;
import com.example.luc.task_management.entity.mongo.item.ChatMessageItem;
import com.example.luc.task_management.entity.mysql.User;
import com.example.luc.task_management.exception.AppException;
import com.example.luc.task_management.exception.ErrorCode;
import com.example.luc.task_management.repository.jpa.BoardRepository;
import com.example.luc.task_management.repository.jpa.TaskRepository;
import com.example.luc.task_management.repository.mongo.ChatBucketRepository;
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
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final ChatBucketRepository chatBucketRepository;
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

        // 1. Tìm Bucket mới nhất của Board
        ChatBucket currentBucket = chatBucketRepository.findFirstByBoardIdAndTaskIdIsNullOrderByBucketIndexDesc(boardId)
                .orElse(null);

        // 2. Nếu chưa có Bucket hoặc Bucket cũ đã chứa đủ 50 tin nhắn -> Tạo Bucket mới (Index + 1)
        if (currentBucket == null || currentBucket.getCount() >= 50) {
            int nextIndex = currentBucket == null ? 0 : currentBucket.getBucketIndex() + 1;

            currentBucket = ChatBucket.builder()
                    .id("board_" + boardId + "_bucket_" + nextIndex)
                    .boardId(boardId)
                    .bucketIndex(nextIndex)
                    .count(0)
                    .startDate(LocalDateTime.now())
                    .messages(new ArrayList<>())
                    .build();
        }

        // 3. Tạo tin nhắn mới
        ChatMessageItem item = ChatMessageItem.builder()
                .id(UUID.randomUUID().toString())
                .senderId(currentUser.getId())
                .senderName(currentUser.getFullName())
                .senderAvatar(currentUser.getAvatarUrl())
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : MessageType.TEXT)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        // 4. Thêm tin nhắn vào mảng và cập nhật thông số Bucket
        currentBucket.getMessages().add(item);
        currentBucket.setCount(currentBucket.getMessages().size());
        currentBucket.setEndDate(item.getCreatedAt());

        // 5. Lưu lại Bucket vào MongoDB (Chỉ tốn 1 lượt ghi!)
        chatBucketRepository.save(currentBucket);

        // 6. Map sang DTO Response gửi qua WebSocket như bình thường
        ChatMessageResponse response = ChatMessageResponse.fromItem(item, currentUser.getId());

        WebSocketMessage<ChatMessageResponse> wsMessage = WebSocketMessage.of(
                WebSocketMessageType.CHAT_MESSAGE,
                response,
                boardId,
                currentUser.getEmail()
        );
        webSocketBroadcaster.broadcastToBoard(boardId, wsMessage);

        log.info("Board chat message saved to Bucket: board={}", boardId);
        return response;
    }

    public List<ChatMessageResponse> getBoardMessages(Long boardId, int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        // 1. Lấy bucket mới nhất làm mốc
        Optional<ChatBucket> latestBucketOpt = chatBucketRepository.findFirstByBoardIdAndTaskIdIsNullOrderByBucketIndexDesc(boardId);

        if (latestBucketOpt.isEmpty()) return Collections.emptyList();

        int maxIndex = latestBucketOpt.get().getBucketIndex();
        int targetIndex = maxIndex - page;

        if (targetIndex < 0) {
            return Collections.emptyList();
        }

        // 2. Đọc ĐÚNG 1 Bucket theo index (Chỉ tốn 1 lượt đọc đĩa!)
        ChatBucket bucket = chatBucketRepository.findByBoardIdAndTaskIdIsNullAndBucketIndex(boardId, targetIndex)
                .orElse(null);

        if (bucket == null || bucket.getMessages() == null) {
            return Collections.emptyList();
        }

        return bucket.getMessages().stream()
                .map(item -> ChatMessageResponse.fromItem(item, currentUser.getId()))
                .collect(Collectors.toList());
    }

    public List<ChatMessageResponse> searchBoardMessages(Long boardId, String keyword, int page, int size) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Tìm các Buckets có chứa tin nhắn khớp từ khóa
        List<ChatBucket> buckets = chatBucketRepository.searchBucketsByBoardIdAndKeyword(boardId, keyword.trim());

        String lowerKeyword = keyword.toLowerCase();

        // 2. Trích xuất và lọc danh sách tin nhắn thỏa mãn điều kiện
        return buckets.stream()
                .filter(bucket -> bucket.getMessages() != null)
                .flatMap(bucket -> bucket.getMessages().stream())
                .filter(msg -> !Boolean.TRUE.equals(msg.getIsDeleted()))
                .filter(msg -> msg.getContent() != null && msg.getContent().toLowerCase().contains(lowerKeyword))
                .map(item -> ChatMessageResponse.fromItem(item, currentUser.getId()))
                .collect(Collectors.toList());
    }

    public void deleteBoardMessage(Long boardId, String messageId) {
        User currentUser = SecurityUtils.getCurrentUser();
        boardSecurityService.checkBoardMember(boardId, currentUser);

        ChatBucket bucket = chatBucketRepository.findFirstByBoardIdAndTaskIdIsNullOrderByBucketIndexDesc(boardId)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        ChatMessageItem messageItem = bucket.getMessages().stream()
                .filter(m -> m.getId().equals(messageId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST));

        if (!messageItem.getSenderId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        messageItem.setIsDeleted(true);
        messageItem.setContent("[Đã xóa]");
        chatBucketRepository.save(bucket);

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

        Optional<ChatBucket> latestBucketOpt = chatBucketRepository
                .findFirstByBoardIdAndTaskIdIsNullOrderByBucketIndexDesc(boardId);

        if (latestBucketOpt.isEmpty()) return 0L;

        int maxIndex = latestBucketOpt.get().getBucketIndex();
        long total = 0;
        for (int i = 0; i <= maxIndex; i++) {
            Optional<ChatBucket> b = chatBucketRepository.findByBoardIdAndTaskIdIsNullAndBucketIndex(boardId, i);
            if (b.isPresent() && b.get().getMessages() != null) {
                total += b.get().getMessages().stream().filter(m -> !Boolean.TRUE.equals(m.getIsDeleted())).count();
            }
        }
        return total;
    }

}
