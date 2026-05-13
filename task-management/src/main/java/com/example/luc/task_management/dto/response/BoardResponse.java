package com.example.luc.task_management.dto.response;

import com.example.luc.task_management.entity.Board;
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
    private String name;
    private String description;
    private String ownerName;
    private Long ownerId;
    private Boolean isArchived;
    private int memberCount;
    private List<BoardMemberResponse> members;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Map từ Entity → DTO
    public static BoardResponse fromEntity(Board board) {
        return BoardResponse.builder()
                .id(board.getId())
                .name(board.getName())
                .description(board.getDescription())
                .ownerName(board.getOwner().getFullName())
                .ownerId(board.getOwner().getId())
                .isArchived(board.getIsArchived())
                .memberCount(board.getMembers().size())
                .members(board.getMembers().stream().
                        map(BoardMemberResponse::fromEntity)
                        .collect(Collectors.toList()))
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }

    // Map không kèm members (dùng cho danh sách board)
    public static BoardResponse fromEntitySimple(Board board) {
        return BoardResponse.builder()
                .id(board.getId())
                .name(board.getName())
                .description(board.getDescription())
                .ownerName(board.getOwner().getFullName())
                .ownerId(board.getOwner().getId())
                .isArchived(board.getIsArchived())
                .memberCount(board.getMembers().size())
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }
}
