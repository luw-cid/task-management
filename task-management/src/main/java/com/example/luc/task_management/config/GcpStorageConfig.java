package com.example.luc.task_management.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class GcpStorageConfig {

    @Value("${gcp.storage.credentials-path:}")
    private String credentialsPath;

    private final ResourceLoader resourceLoader;

    public GcpStorageConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Bean
    public Storage storage() throws IOException {
        // 1. Nếu có chỉ định credentials path (Local Dev)
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            // Kiểm tra nếu là đường dẫn file hệ thống thông thường
            Path filePath = Paths.get(credentialsPath);
            if (Files.exists(filePath)) {
                try (InputStream is = new FileInputStream(filePath.toFile())) {
                    GoogleCredentials credentials = GoogleCredentials.fromStream(is);
                    return StorageOptions.newBuilder()
                            .setCredentials(credentials)
                            .build()
                            .getService();
                }
            }

            // Kiểm tra nếu là classpath resource (classpath:...)
            try {
                Resource resource = resourceLoader.getResource(credentialsPath);
                if (resource.exists()) {
                    try (InputStream is = resource.getInputStream()) {
                        GoogleCredentials credentials = GoogleCredentials.fromStream(is);
                        return StorageOptions.newBuilder()
                                .setCredentials(credentials)
                                .build()
                                .getService();
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // 2. Mặc định trên Cloud Run: Tự động dùng Application Default Credentials (ADC)
        return StorageOptions.getDefaultInstance().getService();
    }
}
