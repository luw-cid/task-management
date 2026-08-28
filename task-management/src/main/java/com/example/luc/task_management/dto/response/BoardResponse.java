package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.mysql.Board;
import com.example.luc.task_management.util.IdFormatter;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardResponse {

    private Long id;
    private String formattedId;  // ví dụ: "B00001"
    private String name;
    private String description;
    private String ownerName;
    private Long ownerId;
    private String formattedOwnerId; // ví dụ: "U00001"
    private Boolean isArchived;
    private int memberCount;
    private List<BoardMemberResponse> members;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Map từ Entity → DTO
    public static BoardResponse fromEntity(Board board) {
        Long ownId = board.getOwner() != null ? board.getOwner().getId() : null;
        String ownName = board.getOwner() != null ? board.getOwner().getFullName() : null;

        return BoardResponse.builder()
                .id(board.getId())
                .formattedId(IdFormatter.formatBoardId(board.getId()))
                .name(board.getName())
                .description(board.getDescription())
                .ownerName(ownName)
                .ownerId(ownId)
                .formattedOwnerId(IdFormatter.formatUserId(ownId))
                .isArchived(board.getIsArchived())
                .memberCount(board.getMembers() != null ? board.getMembers().size() : 0)
                .members(board.getMembers() != null ? board.getMembers().stream()
                        .map(BoardMemberResponse::fromEntity)
                        .collect(Collectors.toList()) : List.of())
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }

    // Map không kèm members (dùng cho danh sách board)
    public static BoardResponse fromEntitySimple(Board board) {
        Long ownId = board.getOwner() != null ? board.getOwner().getId() : null;
        String ownName = board.getOwner() != null ? board.getOwner().getFullName() : null;

        return BoardResponse.builder()
                .id(board.getId())
                .formattedId(IdFormatter.formatBoardId(board.getId()))
                .name(board.getName())
                .description(board.getDescription())
                .ownerName(ownName)
                .ownerId(ownId)
                .formattedOwnerId(IdFormatter.formatUserId(ownId))
                .isArchived(board.getIsArchived())
                .memberCount(board.getMembers() != null ? board.getMembers().size() : 0)
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }
}
