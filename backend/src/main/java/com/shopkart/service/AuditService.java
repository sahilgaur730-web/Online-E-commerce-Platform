package com.shopkart.service;

import com.shopkart.model.AuditLog;
import com.shopkart.repository.AuditLogRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String action, String performedBy, String details, String entityType, Long entityId) {
        AuditLog auditLog = new AuditLog(action, performedBy, details, entityType, entityId);
        auditLogRepository.save(auditLog);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }
}
