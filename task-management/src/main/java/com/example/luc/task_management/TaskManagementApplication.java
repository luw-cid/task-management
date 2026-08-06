package com.example.luc.task_management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableAsync
@EnableJpaAuditing
@EnableJpaRepositories(basePackages = "com.example.luc.task_management.repository.jpa")
@EnableMongoRepositories(basePackages = "com.example.luc.task_management.repository.mongo")
public class TaskManagementApplication {

	@jakarta.annotation.PostConstruct
	public void init() {
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
	}

	public static void main(String[] args) {
		try {
			io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.configure()
					.ignoreIfMissing()
					.load();
			dotenv.entries().forEach(entry -> {
				if (System.getProperty(entry.getKey()) == null) {
					System.setProperty(entry.getKey(), entry.getValue());
				}
			});
		} catch (Exception ignored) {
		}
		SpringApplication.run(TaskManagementApplication.class, args);
	}

}
