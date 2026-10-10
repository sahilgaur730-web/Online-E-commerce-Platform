package com.shopkart.util;

import java.util.*;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Type-safe generic pagination wrapper supporting functional transformations,
 * stream filtering, comparator sorting, and bounded generics.
 *
 * @param <T> Element type
 */
public class PaginatedResult<T> {

    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;

    public PaginatedResult(List<T> content, int page, int size, long totalElements) {
        this.content = content != null ? Collections.unmodifiableList(new ArrayList<>(content)) : Collections.emptyList();
        this.page = Math.max(0, page);
        this.size = Math.max(1, size);
        this.totalElements = Math.max(0, totalElements);
        this.totalPages = (int) Math.ceil((double) this.totalElements / this.size);
    }

    public static <E> PaginatedResult<E> empty() {
        return new PaginatedResult<>(Collections.emptyList(), 0, 10, 0);
    }

    /**
     * Constructs a PaginatedResult from a full collection using Java Streams.
     */
    public static <E> PaginatedResult<E> of(List<E> allItems, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        if (allItems == null || allItems.isEmpty()) {
            return new PaginatedResult<>(Collections.emptyList(), safePage, safeSize, 0);
        }
        long fromIndex = (long) safePage * safeSize;

        List<E> pageContent = allItems.stream()
                .skip(fromIndex)
                .limit(safeSize)
                .collect(Collectors.toList());

        return new PaginatedResult<>(pageContent, safePage, safeSize, allItems.size());
    }

    /**
     * Constructs a PaginatedResult from a Spring Data Page.
     */
    public static <E> PaginatedResult<E> fromPage(org.springframework.data.domain.Page<E> page) {
        if (page == null) {
            return empty();
        }
        return new PaginatedResult<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements());
    }

    /**
     * Type-safe transformation using Java Streams.
     */
    public <R> PaginatedResult<R> map(Function<? super T, ? extends R> mapper) {
        Objects.requireNonNull(mapper, "Mapper function must not be null");
        List<R> mappedContent = this.content.stream()
                .map(mapper)
                .collect(Collectors.toList());
        return new PaginatedResult<>(mappedContent, this.page, this.size, this.totalElements);
    }

    /**
     * Filters content using a Predicate.
     */
    public PaginatedResult<T> filter(Predicate<? super T> predicate) {
        Objects.requireNonNull(predicate, "Predicate must not be null");
        List<T> filteredContent = this.content.stream()
                .filter(predicate)
                .collect(Collectors.toList());
        return new PaginatedResult<>(filteredContent, this.page, this.size, filteredContent.size());
    }

    /**
     * Sorts content using a Comparator.
     */
    public PaginatedResult<T> sorted(Comparator<? super T> comparator) {
        Objects.requireNonNull(comparator, "Comparator must not be null");
        List<T> sortedContent = this.content.stream()
                .sorted(comparator)
                .collect(Collectors.toList());
        return new PaginatedResult<>(sortedContent, this.page, this.size, this.totalElements);
    }

    public Stream<T> stream() {
        return this.content.stream();
    }

    public List<T> getContent() {
        return content;
    }

    public int getPage() {
        return page;
    }

    public int getSize() {
        return size;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public boolean hasNext() {
        return page + 1 < totalPages;
    }

    public boolean isHasNext() {
        return hasNext();
    }

    public boolean hasPrevious() {
        return page > 0;
    }

    public boolean isHasPrevious() {
        return hasPrevious();
    }
}
