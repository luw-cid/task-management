package com.example.luc.task_management.config;

import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TaskFlow – Task Management API")
                        .description("""
                                REST API cho hệ thống quản lý công việc TaskFlow.
                                
                                ## Xác thực
                                Sử dụng JWT Bearer Token.
                                Đăng nhập tại `/api/auth/login` để lấy token,
                                sau đó click **Authorize** và nhập token vào.
                                
                                ## Design Pattern
                                - **Factory Pattern** – Tạo Task theo type
                                - **Strategy Pattern** – Sắp xếp Task
                                - **Command Pattern** – Ghi lịch sử thay đổi
                                - **Observer Pattern** – Thông báo real-time
                                - **Singleton Pattern** – Spring Bean
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Phạm Tiến Lực")
                                .email("tienluc14052005@gmail.com")
                                .url("https://github.com/luw-cid"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")
                        )
                )

                // ─── Servers ───
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local Development"),
                        new Server()
                                .url("https://api.taskflow.com")
                                .description("Production")
                ))

                // ─── Security – JWT Bearer ───
                .addSecurityItem(new SecurityRequirement()
                        .addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .name("bearerAuth")
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Nhập JWT token (không cần Bearer prefix)")
                        )
                );
    }
}
