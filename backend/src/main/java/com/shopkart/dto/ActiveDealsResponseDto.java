package com.shopkart.dto;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public class ActiveDealsResponseDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private Instant serverTime;
    private Instant endTime;
    private long remainingSeconds;
    private String status; // "ACTIVE" or "EXPIRED"
    private List<FlashDealDto> deals;

    public ActiveDealsResponseDto() {
    }

    public ActiveDealsResponseDto(Instant serverTime, Instant endTime, long remainingSeconds, String status, List<FlashDealDto> deals) {
        this.serverTime = serverTime;
        this.endTime = endTime;
        this.remainingSeconds = remainingSeconds;
        this.status = status;
        this.deals = deals;
    }

    public Instant getServerTime() {
        return serverTime;
    }

    public void setServerTime(Instant serverTime) {
        this.serverTime = serverTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public long getRemainingSeconds() {
        return remainingSeconds;
    }

    public void setRemainingSeconds(long remainingSeconds) {
        this.remainingSeconds = remainingSeconds;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<FlashDealDto> getDeals() {
        return deals;
    }

    public void setDeals(List<FlashDealDto> deals) {
        this.deals = deals;
    }
}
