package com.vitalarea.scheduler.service;

import com.vitalarea.scheduler.dto.CalendarResponse;
import com.vitalarea.scheduler.repository.CalendarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService {
    private final CalendarRepository calendarRepository;

    public List<CalendarResponse> findAll() {
        return calendarRepository.findAll().stream()
                .filter(calendar -> calendar.isActive())
                .map(calendar -> new CalendarResponse(calendar.getId(), calendar.getName(), calendar.getType()))
                .toList();
    }
}
