package com.vitalarea.scheduler.repository;

import com.vitalarea.scheduler.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByCalendarIdAndEndAtGreaterThanEqualAndStartAtLessThanEqualOrderByStartAtAsc(
            Long calendarId,
            OffsetDateTime from,
            OffsetDateTime to
    );
}
