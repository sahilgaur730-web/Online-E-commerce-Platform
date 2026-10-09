package com.shopkart.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Spring Async configuration with dedicated ThreadPoolTaskExecutor.
 * Thread pool parameters: Core: 4, Max: 8, Queue Capacity: 50.
 * Prefix: "ShopKart-Async-"
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "shopkartTaskExecutor")
    public Executor shopkartTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("ShopKart-Async-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }
}
