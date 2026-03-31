package com.vitalarea.scheduler.repository;

import com.vitalarea.scheduler.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
}
