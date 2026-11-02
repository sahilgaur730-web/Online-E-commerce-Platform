import React, { useState, useEffect, useCallback } from 'react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../api/client';
import { FALLBACK_CATEGORIES, filterFallbackProducts } from '../data/fallbackProducts';
import { Filter, Star, X, RotateCcw, SlidersHorizontal } from 'lucide-react';

export function CatalogPage({ initialCategory, initialKeyword, onSelectProduct, onWishlistToggle, wishlistIds = [] }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [keyword, setKeyword] = useState(initialKeyword || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [sortDir, setSortDir] = useState('desc');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Available brands list
  const [availableBrands, setAvailableBrands] = useState([]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(data && data.length > 0 ? data : FALLBACK_CATEGORIES);
      const brands = await api.getBrands();
      setAvailableBrands(brands || ['Apple', 'Samsung', 'Sony', 'OnePlus', 'Nike', "Levi's", 'Philips', 'LG', 'ASUS', 'Google', 'Bose', 'Dell', 'Lenovo', 'Zara', 'Ray-Ban', 'adidas', 'Jordan', 'Dyson', 'Instant Pot', 'Bowflex', 'Garmin', 'Decathlon', 'Lululemon']);
    } catch (e) {
      console.error('Failed to load categories, using fallback:', e);
      setCategories(FALLBACK_CATEGORIES);
      setAvailableBrands(['Apple', 'Samsung', 'Sony', 'OnePlus', 'Nike', "Levi's", 'Philips', 'LG', 'ASUS', 'Google', 'Bose', 'Dell', 'Lenovo', 'Zara', 'Ray-Ban', 'adidas', 'Jordan', 'Dyson', 'Instant Pot', 'Bowflex', 'Garmin', 'Decathlon', 'Lululemon']);
    }
  }, []);

  const fetchFilteredProducts = useCallback(async () => {
    let catId = undefined;
    if (selectedCategory) {
      const matched = categories.find((c) => c.slug === selectedCategory);
      if (matched) catId = matched.id;
    }

    try {
      setLoading(true);
      const res = await api.getProducts({
        keyword: keyword || undefined,
        categoryId: catId,
        brand: selectedBrand || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
        sortBy,
        sortDir,
        size: 30,
      });

      if (res && res.content && res.content.length > 0) {
        const items =
          selectedCategory === 'top-offers'
            ? res.content.filter((p) => p.topOffer || (p.discountPercentage && p.discountPercentage >= 10))
            : res.content;
        setProducts(items);
        setTotalCount(selectedCategory === 'top-offers' ? items.length : res.totalElements);
      } else {
        // Fallback filter
        const fallbackRes = filterFallbackProducts({
          keyword,
          categoryId: catId,
          categorySlug: selectedCategory,
          brand: selectedBrand,
          minPrice,
          maxPrice,
          minRating,
          sortBy,
          sortDir,
          size: 30,
        });
        setProducts(fallbackRes.content);
        setTotalCount(fallbackRes.totalElements);
      }
    } catch (err) {
      console.error('Failed to load catalog products, falling back to local dataset:', err);
      const fallbackRes = filterFallbackProducts({
        keyword,
        categoryId: catId,
        categorySlug: selectedCategory,
        brand: selectedBrand,
        minPrice,
        maxPrice,
        minRating,
        sortBy,
        sortDir,
        size: 30,
      });
      setProducts(fallbackRes.content);
      setTotalCount(fallbackRes.totalElements);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, categories, keyword, selectedBrand, minPrice, maxPrice, minRating, sortBy, sortDir]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setSelectedCategory(initialCategory || '');
    setKeyword(initialKeyword || '');
  }, [initialCategory, initialKeyword]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setKeyword('');
    setSortBy('popularity');
  };

  const sortTabs = [
    { label: 'Popularity', key: 'popularity', dir: 'desc' },
    { label: 'Price -- Low to High', key: 'price_asc', dir: 'asc' },
    { label: 'Price -- High to Low', key: 'price_desc', dir: 'desc' },
    { label: 'Newest First', key: 'newest', dir: 'desc' },
  ];

  const activeFilterCount = [
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    minRating,
    keyword,
  ].filter(Boolean).length;

  const renderFilterContent = () => (
    <>
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-gray-600" /> Filters
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-sk-navy font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> CLEAR ALL
          </button>
        )}
      </div>

      {/* Active Filter Badges */}
      {(selectedCategory || selectedBrand || minRating) && (
        <div className="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-gray-100">
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              Category: {selectedCategory}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
            </span>
          )}
          {selectedBrand && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              Brand: {selectedBrand}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedBrand('')} />
            </span>
          )}
          {minRating && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              <span className="flex items-center gap-0.5">{minRating}<Star className="w-2.5 h-2.5 fill-current text-amber-500 inline" /> & above</span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => setMinRating('')} />
            </span>
          )}
        </div>
      )}

      {/* Categories */}
      <div className="mb-5 pb-4 border-b border-gray-100">
        <h4 className="text-xs font-bold text-gray-800 uppercase mb-2.5">Category</h4>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          <button
            onClick={() => setSelectedCategory('')}
            className={`w-full text-left text-xs py-1 px-1.5 rounded transition cursor-pointer ${
              selectedCategory === '' ? 'bg-blue-50 font-bold text-sk-navy' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`w-full text-left text-xs py-1 px-1.5 rounded transition cursor-pointer ${
                selectedCategory === c.slug ? 'bg-blue-50 font-bold text-sk-navy' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-5 pb-4 border-b border-gray-100">
        <h4 className="text-xs font-bold text-gray-800 uppercase mb-2.5">Price Range (₹)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-sk-navy focus:outline-none"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-sk-navy focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={() => { setMinPrice('0'); setMaxPrice('10000'); }}
            className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-gray-700 cursor-pointer"
          >
            Under ₹10k
          </button>
          <button
            onClick={() => { setMinPrice('10000'); setMaxPrice('50000'); }}
            className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-gray-700 cursor-pointer"
          >
            ₹10k - ₹50k
          </button>
          <button
            onClick={() => { setMinPrice('50000'); setMaxPrice(''); }}
            className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-gray-700 cursor-pointer"
          >
            ₹50k+
          </button>
        </div>
      </div>

      {/* Customer Ratings */}
      <div className="mb-5 pb-4 border-b border-gray-100">
        <h4 className="text-xs font-bold text-gray-800 uppercase mb-2.5">Customer Ratings</h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <label key={r} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="ratingFilter"
                checked={minRating === String(r)}
                onChange={() => setMinRating(String(r))}
                className="text-sk-navy focus:ring-0"
              />
              <span className="flex items-center gap-1 font-medium">
                <span>{r}</span>
                <Star className="w-3 h-3 fill-current text-amber-500 inline" />
                <span>& above</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brand Checkboxes */}
      <div>
        <h4 className="text-xs font-bold text-gray-800 uppercase mb-2.5">Brand</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {availableBrands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBrand.toLowerCase() === brand.toLowerCase()}
                onChange={(e) => setSelectedBrand(e.target.checked ? brand : '')}
                className="rounded text-sk-navy focus:ring-0"
              />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3 md:px-6 py-4">
      {/* Mobile Sticky Filter Trigger Toolbar (< 768px / 375px) */}
      <div className="md:hidden flex items-center justify-between bg-white border border-gray-200 rounded-xs p-2.5 shadow-2xs mb-3 gap-2">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-sm transition cursor-pointer"
          aria-label="Open filter drawer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-sk-navy" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-sk-orange text-white text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[11px] font-bold text-sk-navy hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
          <span className="text-[11px] text-gray-500 font-medium">
            {products.length} Items
          </span>
        </div>
      </div>

      {/* Mobile Slide-over Filter Drawer (< 768px) */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
            <div className="p-4 bg-sk-navy text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-sk-orange" />
                <h3 className="font-bold text-sm tracking-wide uppercase">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] bg-sk-orange text-white px-2 py-0.5 rounded-full font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 hover:text-amber-300 rounded transition cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {renderFilterContent()}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex-1 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xs hover:bg-gray-100 transition cursor-pointer"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-white bg-sk-orange hover:bg-sk-orange-hover rounded-xs transition cursor-pointer shadow-xs"
              >
                Apply ({products.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Left Filters Sidebar (Desktop >= 768px) */}
        <aside className="hidden md:block w-64 bg-white rounded-xs p-4 shadow-xs border border-gray-200 shrink-0">
          {renderFilterContent()}
        </aside>

        {/* Right Product Grid & Sorting Area */}
        <div className="flex-1 bg-white rounded-xs p-4 shadow-xs border border-gray-200 w-full">
          {/* Header & Sorting Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {keyword ? `Results for "${keyword}"` : selectedCategory ? `${selectedCategory.toUpperCase()} Catalog` : 'All Products'}
              </h2>
              <span className="text-xs text-gray-500">
                (Showing {products.length} of {totalCount} items)
              </span>
            </div>

            {/* Sorting Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-xs font-bold text-gray-600 mr-2 shrink-0">Sort By</span>
              {sortTabs.map((tab) => {
                const isActive = sortBy === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setSortBy(tab.key);
                      setSortDir(tab.dir);
                    }}
                    className={`text-xs px-3 py-1.5 font-medium transition rounded-xs whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'text-sk-navy font-bold border-b-2 border-sk-navy'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 sm:gap-4 py-12">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-64 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-gray-400 mb-3 text-lg font-semibold">No products found</div>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Try checking your spelling or use more general terms, or reset applied filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="bg-sk-navy hover:bg-sk-navy-dark text-white text-xs font-bold px-5 py-2 rounded-xs transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 sm:gap-4 pt-4">
              {products.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelectProduct={onSelectProduct}
                  onWishlistToggle={onWishlistToggle}
                  isWishlisted={wishlistIds.includes(prod.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
