import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../api/client';
import { Filter, Star, X, RotateCcw } from 'lucide-react';

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

  // Available brands list
  const [availableBrands, setAvailableBrands] = useState([]);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data || []);
      const brands = await api.getBrands();
      setAvailableBrands(brands || ['Apple', 'Samsung', 'Sony', 'OnePlus', 'Nike', "Levi's", 'Philips', 'LG', 'ASUS']);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFilteredProducts = async () => {
    try {
      setLoading(true);
      let catId = undefined;
      if (selectedCategory) {
        const matched = categories.find((c) => c.slug === selectedCategory);
        if (matched) catId = matched.id;
      }

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

      setProducts(res?.content || []);
      setTotalCount(res?.totalElements || 0);
    } catch (err) {
      console.error('Failed to load catalog products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setSelectedCategory(initialCategory || '');
    setKeyword(initialKeyword || '');
  }, [initialCategory, initialKeyword]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [selectedCategory, keyword, selectedBrand, minPrice, maxPrice, minRating, sortBy, sortDir, categories]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Left Filters Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-xs p-4 shadow-xs border border-gray-200 shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-600" /> Filters
            </h3>
            {(selectedCategory || selectedBrand || minPrice || maxPrice || minRating || keyword) && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-[#2874F0] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
                className={`w-full text-left text-xs py-1 px-1.5 rounded transition ${
                  selectedCategory === '' ? 'bg-blue-50 font-bold text-[#2874F0]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`w-full text-left text-xs py-1 px-1.5 rounded transition ${
                    selectedCategory === c.slug ? 'bg-blue-50 font-bold text-[#2874F0]' : 'text-gray-700 hover:bg-gray-50'
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
                  className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs p-1.5 border border-gray-300 rounded focus:border-[#2874F0] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => { setMinPrice('0'); setMaxPrice('10000'); }}
                className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-gray-700"
              >
                Under ₹10k
              </button>
              <button
                onClick={() => { setMinPrice('10000'); setMaxPrice('50000'); }}
                className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-gray-700"
              >
                ₹10k - ₹50k
              </button>
              <button
                onClick={() => { setMinPrice('50000'); setMaxPrice(''); }}
                className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-gray-700"
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
                    className="text-[#2874F0] focus:ring-0"
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
                    className="rounded text-[#2874F0] focus:ring-0"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

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
                        ? 'text-[#2874F0] font-bold border-b-2 border-[#2874F0]'
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 py-12">
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
                className="bg-[#2874F0] hover:bg-blue-600 text-white text-xs font-bold px-5 py-2 rounded-xs transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-4">
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
