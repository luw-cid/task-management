//package com.example.luc.task_management.config;
//
//import com.zaxxer.hikari.HikariConfig;
//import com.zaxxer.hikari.HikariDataSource;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.context.annotation.Primary;
//import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
//import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
//import org.springframework.orm.jpa.JpaTransactionManager;
//import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
//import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
//import org.springframework.transaction.PlatformTransactionManager;
//import org.springframework.transaction.annotation.EnableTransactionManagement;
//
//import javax.sql.DataSource;
//import java.util.Properties;
//
//
//@Configuration
//@EnableTransactionManagement          // Bật @Transactional
//@EnableJpaAuditing                    // Bật @CreatedDate, @LastModifiedDate
//@EnableJpaRepositories(basePackages = "com.example.luc.task_management.repository")
//
//public class DatabaseConfig {
//    @Value("${spring.datasource.url}")
//    private String dbUrl;
//
//    @Value("${spring.datasource.username}")
//    private String dbUsername;
//
//    @Value("${spring.datasource.password:#{null}}")
//    private String dbPassword;
//
//    @Value("${spring.datasource.driver-class-name}")
//    private String dbDriverClassName;
//
//    @Value("${spring.datasource.hikari.pool-name:TaskManagerPool}")
//    private String hikariPoolName;
//
//    @Value("${spring.datasource.hikari.maximum-pool-size:20}")
//    private int maximumPoolSize;
//
//    @Value("${spring.datasource.hikari.minimum-idle:5}")
//    private int minimumIdle;
//
//    @Value("${spring.datasource.hikari.idle-timeout:300000}")
//    private long idleTimeout;
//
//    @Value("${spring.datasource.hikari.connection-timeout:20000}")
//    private long connectionTimeout;
//
//    @Value("${spring.datasource.hikari.max-lifetime:1200000}")
//    private long maxLifetime;
//
//    // ============================================================
//    // 1. DataSource Bean – HikariCP Connection Pool
//    // ============================================================
//    @Bean
//    @Primary
//    public DataSource dataSource () {
//        HikariConfig hikariConfig = new HikariConfig();
//
//        hikariConfig.setJdbcUrl(dbUrl);
//        hikariConfig.setUsername(dbUsername);
//        hikariConfig.setPassword(dbPassword);
//        hikariConfig.setDriverClassName(dbDriverClassName);
//
//        // Pool settings
//        hikariConfig.setPoolName(hikariPoolName);
//        hikariConfig.setMaximumPoolSize(maximumPoolSize);
//        hikariConfig.setMinimumIdle(minimumIdle);
//        hikariConfig.setIdleTimeout(idleTimeout);
//        hikariConfig.setConnectionTimeout(connectionTimeout);
//        hikariConfig.setMaxLifetime(maxLifetime);
//        hikariConfig.setConnectionTestQuery("SELECT 1");
//
//        // Performance settings
//        hikariConfig.addDataSourceProperty("cachePrepStms", "true");
//        hikariConfig.addDataSourceProperty("prepStmtCacheSize", "250");
//        hikariConfig.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
//        hikariConfig.addDataSourceProperty("useServerPrepStmts", "true");
//        return new HikariDataSource(hikariConfig);
//    }
//
//    // ============================================================
//    // 2. EntityManagerFactory Bean – Quản lý JPA Entity
//    // ============================================================
//    @Bean
//    @Primary
//    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {
//        LocalContainerEntityManagerFactoryBean emf = new LocalContainerEntityManagerFactoryBean();
//
//        emf.setDataSource(dataSource());
//        emf.setPackagesToScan("com.example.luc.task_management.entity");
//
//        HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
//        vendorAdapter.setGenerateDdl(false);
//        vendorAdapter.setShowSql(true);
//        emf.setJpaVendorAdapter(vendorAdapter);
//
//        emf.setJpaProperties(hibernateProperties());
//        return emf;
//    }
//
//    // ============================================================
//    // 3. TransactionManager Bean – Quản lý transaction
//    // ============================================================
//    @Bean
//    @Primary
//    public PlatformTransactionManager transactionManager() {
//        JpaTransactionManager transactionManager = new JpaTransactionManager();
//        transactionManager.setEntityManagerFactory(entityManagerFactory().getObject());
//
//        return transactionManager;
//    }
//
//    // ============================================================
//    // 4. Hibernate Properties
//    // ============================================================
//    private Properties hibernateProperties() {
//        Properties properties = new Properties();
//
//        properties.setProperty(
//                "hibernate.dialect",
//                "org.hibernate.dialect.MySQLDialect"
//        );
//        properties.setProperty("hibernate.show_sql", "true");
//        properties.setProperty("hibernate.format_sql", "true");
//        properties.setProperty("hibernate.hbm2ddl.auto", "validate");
//
//        // Batch processing – tối ưu insert/update nhiều bản ghi
//        properties.setProperty("hibernate.jdbc.batch_size", "20");
//        properties.setProperty("hibernate.order_inserts", "true");
//        properties.setProperty("hibernate.order_updates", "true");
//
//        // Second-level cache (tùy chọn mở rộng sau)
//        properties.setProperty("hibernate.cache.use_second_level_cache", "false");
//
//        return properties;
//    }
//
//}
