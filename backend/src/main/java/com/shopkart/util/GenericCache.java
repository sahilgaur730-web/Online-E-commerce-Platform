package com.shopkart.util;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Thread-safe generic in-memory cache supporting TTL expiration,
 * generic method bounds, and Java Streams processing.
 *
 * @param <K> Key type
 * @param <V> Value type
 */
public class GenericCache<K, V> {

    private final long defaultTtlMillis;
    private final Map<K, CacheEntry<V>> store = new ConcurrentHashMap<>();

    public GenericCache() {
        this(300_000); // 5 minutes default
    }

    public GenericCache(long defaultTtlMillis) {
        this.defaultTtlMillis = defaultTtlMillis;
    }

    public void put(K key, V value) {
        put(key, value, defaultTtlMillis);
    }

    public void put(K key, V value, long ttlMillis) {
        Objects.requireNonNull(key, "Key must not be null");
        Objects.requireNonNull(value, "Value must not be null");
        long expiresAt = ttlMillis > 0 ? System.currentTimeMillis() + ttlMillis : Long.MAX_VALUE;
        store.put(key, new CacheEntry<>(value, expiresAt));
    }

    public Optional<V> get(K key) {
        if (key == null) return Optional.empty();
        CacheEntry<V> entry = store.get(key);
        if (entry == null) return Optional.empty();

        if (entry.isExpired()) {
            store.remove(key, entry);
            return Optional.empty();
        }
        return Optional.of(entry.getValue());
    }

    public V computeIfAbsent(K key, Function<? super K, ? extends V> mappingFunction) {
        Objects.requireNonNull(key, "Key must not be null");
        Objects.requireNonNull(mappingFunction, "Mapping function must not be null");

        CacheEntry<V> entry = store.compute(key, (k, existingEntry) -> {
            long now = System.currentTimeMillis();
            if (existingEntry != null && !existingEntry.isExpired(now)) {
                return existingEntry;
            }
            V computed = mappingFunction.apply(k);
            if (computed == null) {
                return null;
            }
            long expiresAt = defaultTtlMillis > 0 ? now + defaultTtlMillis : Long.MAX_VALUE;
            return new CacheEntry<>(computed, expiresAt);
        });
        return entry != null ? entry.getValue() : null;
    }

    public boolean containsKey(K key) {
        return get(key).isPresent();
    }

    public void remove(K key) {
        if (key != null) {
            store.remove(key);
        }
    }

    public void clear() {
        store.clear();
    }

    public int size() {
        cleanUpExpired();
        return store.size();
    }

    public void cleanUpExpired() {
        long now = System.currentTimeMillis();
        store.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
    }

    /**
     * Type-safe filtering of values using Java Stream Predicate.
     */
    public List<V> filterValues(Predicate<? super V> predicate) {
        Objects.requireNonNull(predicate, "Predicate must not be null");
        cleanUpExpired();
        long now = System.currentTimeMillis();
        return store.values().stream()
                .filter(entry -> !entry.isExpired(now))
                .map(CacheEntry::getValue)
                .filter(predicate)
                .collect(Collectors.toList());
    }

    /**
     * Type-safe transformation of cache values into a new collection of type R.
     */
    public <R> List<R> mapValues(Function<? super V, ? extends R> mapper) {
        Objects.requireNonNull(mapper, "Mapper must not be null");
        cleanUpExpired();
        long now = System.currentTimeMillis();
        return store.values().stream()
                .filter(entry -> !entry.isExpired(now))
                .map(CacheEntry::getValue)
                .map(mapper)
                .collect(Collectors.toList());
    }

    private static class CacheEntry<T> {
        private final T value;
        private final long expiresAt;

        CacheEntry(T value, long expiresAt) {
            this.value = value;
            this.expiresAt = expiresAt;
        }

        T getValue() {
            return value;
        }

        boolean isExpired() {
            return isExpired(System.currentTimeMillis());
        }

        boolean isExpired(long now) {
            return now > expiresAt;
        }
    }
}
