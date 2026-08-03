package com.example.luc.task_management.dto.request.chat;

import com.example.luc.task_management.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SendMessageRequest {
    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 2000, message = "Message must not exceed 2000 characters")
    private String content;
    private MessageType type;

    // Sau này có thể thêm:
    // private List<String> attachmentUrls; (nếu muốn gửi kèm ảnh/file)
    // private String replyToMessageId; (nếu muốn tính năng reply tin nhắn)
}
