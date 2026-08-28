package com.example.luc.task_management.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    private final Storage storage;

    @Value("${gcp.storage.bucket-name:taskflow-attachments}")
    private String bucketName;

    /**
     * Upload multipart file lên Google Cloud Storage
     *
     * @param file   Tệp được gửi từ client
     * @param folder Tên thư mục phân loại (ví dụ: "task-attachments", "avatars")
     * @return Public URL để xem/tải tệp
     */
    public String uploadFile(MultipartFile file, String folder) throws IOException {
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }

        // Tạo tên file độc nhất tránh trùng lặp
        String fileName = folder + "/" + UUID.randomUUID() + extension;

        BlobId blobId = BlobId.of(bucketName, fileName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .build();

        log.info("Uploading file '{}' to GCS bucket '{}' as '{}'...", originalFileName, bucketName, fileName);
        storage.create(blobInfo, file.getBytes());

        // URL công khai của file trên Google Cloud Storage
        String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        String publicUrl = String.format("https://storage.googleapis.com/%s/%s", bucketName, encodedFileName);
        log.info("File uploaded successfully. Public URL: {}", publicUrl);

        return publicUrl;
    }
}
