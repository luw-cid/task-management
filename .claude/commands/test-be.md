# Backend Test Skill

Run and manage tests for the Spring Boot backend located at `task-management/`.

## How to run tests (Windows)

```bash
cd task-management
mvnw.cmd test
```

Run a single test class:
```bash
mvnw.cmd test -Dtest=ClassName
```

Run a single test method:
```bash
mvnw.cmd test -Dtest=ClassName#methodName
```

Skip tests during build:
```bash
mvnw.cmd package -DskipTests
```

## Test configuration

If `src/test/resources/application-test.yml` does not exist, create it before writing tests:

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: false
  flyway:
    enabled: false
app:
  jwt:
    secret: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
    access-token-expiration: 86400000
    refresh-token-expiration: 604800000
```

Add the H2 test dependency to `pom.xml` if not present:
```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

## Test patterns to follow

**Service unit tests** — mock all repositories, no Spring context:
```java
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock TaskRepository taskRepository;
    @InjectMocks TaskService taskService;
    // ...
}
```

**Controller slice tests** — only web layer, mock service:
```java
@WebMvcTest(TaskController.class)
@Import(SecurityConfig.class)
class TaskControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean TaskService taskService;
    // ...
}
```

**Repository slice tests** — real DB queries, H2 in-memory:
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class TaskRepositoryTest {
    @Autowired TaskRepository taskRepository;
    // ...
}
```

## What to do when invoked

1. Check if `src/test/resources/application-test.yml` exists; create it if not.
2. Check if H2 dependency is in `pom.xml`; add it if not.
3. Run `mvnw.cmd test` and report results.
4. If tests fail, diagnose and fix. If no meaningful tests exist beyond the stub `contextLoads()`, write tests for the service or controller the user is currently working on.
5. Focus test coverage on: service business logic, controller request/response mapping, and custom repository queries.
