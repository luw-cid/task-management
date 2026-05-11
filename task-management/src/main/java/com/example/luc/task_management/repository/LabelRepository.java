package com.example.luc.task_management.repository;

import com.example.luc.task_management.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {

    List<Label> findAllByBoardId(Long boardId);

    Optional<Label> findByIdAndBoardId(Long id, Long boardId);

    boolean existsByBoardIdAndName(Long boardId, String name);
}
