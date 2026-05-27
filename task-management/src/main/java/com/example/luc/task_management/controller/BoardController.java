package com.example.luc.task_management.controller;

import com.example.luc.task_management.dto.request.board.CreateBoardRequest;
import com.example.luc.task_management.dto.request.board.InviteMemberRequest;
import com.example.luc.task_management.dto.request.board.UpdateBoardRequest;
import com.example.luc.task_management.dto.response.ApiResponse;
import com.example.luc.task_management.dto.response.BoardMemberResponse;
import com.example.luc.task_management.dto.response.BoardResponse;
import com.example.luc.task_management.service.BoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    // POST /api/boards – Create new board
    @PostMapping
    public ResponseEntity<ApiResponse<BoardResponse>> createBoard (@Valid @RequestBody CreateBoardRequest request) {
        return ResponseEntity.status(201)
                .body(ApiResponse.created(boardService.createBoard(request)));
    }

    // GET /api/boards – Get my board list
    @GetMapping
    public ResponseEntity<ApiResponse<List<BoardResponse>>> getMyBoards() {
        return ResponseEntity.ok(ApiResponse.success(boardService.getMyBoards()));
    }

    // PUT /api/boards/{id} – Update board
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardResponse>> updateBoard (
            @PathVariable Long id,
            @Valid @RequestBody UpdateBoardRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Update board successfully", boardService.updateBoard(id, request)));
    }

    // DELETE /api/boards/{id} – Delete board
    @DeleteMapping
    public ResponseEntity<ApiResponse<BoardResponse>> deleteBoard (@PathVariable Long id) {
        boardService.deleteBoard(id);
        return ResponseEntity.ok(ApiResponse.success("Delete board successfully", null));
    }

    // POST /api/boards/{id}/members – Invite member
    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<BoardMemberResponse>> inviteMember (@PathVariable Long id,
                                                                                   @Valid @RequestBody InviteMemberRequest request) {
        return ResponseEntity.status(201)
                .body(ApiResponse.created(boardService.inviteMember(id, request)));
    }

    // GET /api/boards/{id}/members – Get member list
    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<BoardMemberResponse>>> getBoardMembers(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(boardService.getBoardMembers(id)));
    }

    // DELETE /api/boards/{id}/members/{userId} – Delete Member
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        boardService.removeMember(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Remove member successfully", null));
    }


}
