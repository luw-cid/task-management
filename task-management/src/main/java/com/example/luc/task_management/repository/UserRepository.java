package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.email LIKE %:keyword%")
    List<User> searchByEmail(@Param("keyword") String keyword);
}
