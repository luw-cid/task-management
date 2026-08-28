package com.example.luc.task_management.controller;

import com.example.luc.task_management.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/attachments")
@RequiredArgsConstructor
@Tag(name = "Attachment", description = "API upload và quản lý file đính kèm trên Google Cloud Storage")
public class AttachmentController {

    private final FileStorageService fileStorageService;

    @Operation(summary = "Upload tệp đính kèm lên Cloud Storage")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "task-attachments") String folder) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Tệp không được để trống"));
            }

            String fileUrl = fileStorageService.uploadFile(file, folder);

            return ResponseEntity.ok(Map.of(
                    "fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed",
                    "fileUrl", fileUrl,
                    "fileType", file.getContentType() != null ? file.getContentType() : "",
                    "fileSize", file.getSize()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Upload tệp thất bại: " + e.getMessage()));
        }
    }
}
