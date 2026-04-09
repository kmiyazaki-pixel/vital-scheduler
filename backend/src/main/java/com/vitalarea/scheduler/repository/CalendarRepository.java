package com.vitalarea.scheduler.repository;

import com.vitalarea.scheduler.entity.Calendar;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarRepository extends JpaRepository<Calendar, Long> {

    void deleteByOwnerUserId(Long ownerUserId);
}
