import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Shirt,
  Home,
  Tv,
  Dumbbell,
  Tag,
  ChevronDown,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 1,
    name: 'Mobiles & Tablets',
    slug: 'mobiles',
    icon: Smartphone,
    hasFlyout: true,
    subcategories: [
      { name: 'All Smartphones', query: '' },
      { name: 'Flagship 5G Mobiles', query: '5G' },
      { name: 'iPads & Tablets', query: 'iPad' },
      { name: 'Mobile Accessories', query: 'Accessories' },
      { name: 'Smart Chargers & Cables', query: 'Charger' },
    ],
  },
  {
    id: 2,
    name: 'Electronics',
    slug: 'electronics',
    icon: Laptop,
    hasFlyout: true,
    subcategories: [
      { name: 'All Electronics', query: '' },
      { name: 'Audio & Headphones', query: 'Headphones' },
      { name: 'Cameras & Photography', query: 'Camera' },
      { name: 'Gaming Accessories', query: 'Gaming' },
      { name: 'Laptops & Workstations', query: 'Laptop' },
      { name: 'Smart Wearables', query: 'Smartwatch' },
    ],
  },
  {
    id: 3,
    name: 'Fashion',
    slug: 'fashion',
    icon: Shirt,
    hasFlyout: true,
    subcategories: [
      { name: 'All Fashion', query: '' },
      { name: "Men's Casual & Formal", query: 'Men' },
      { name: "Women's Western & Ethnic", query: 'Women' },
      { name: 'Footwear & Running Shoes', query: 'Shoes' },
      { name: 'Watches & Luggage', query: 'Watch' },
    ],
  },
  {
    id: 4,
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    icon: Home,
    hasFlyout: true,
    subcategories: [
      { name: 'All Home & Kitchen', query: '' },
      { name: 'Kitchen & Cookware', query: 'Cookware' },
      { name: 'Small Home Appliances', query: 'Kitchen' },
      { name: 'Modern Living Room Decor', query: 'Decor' },
      { name: 'Bedding, Cushions & Linen', query: 'Bedding' },
    ],
  },
  {
    id: 5,
    name: 'Appliances',
    slug: 'appliances',
    icon: Tv,
    hasFlyout: true,
    subcategories: [
      { name: 'All Home Appliances', query: '' },
      { name: '4K Ultra HD Smart TVs', query: 'TV' },
      { name: 'Air Conditioners', query: 'AC' },
      { name: 'Smart Inverter Refrigerators', query: 'Refrigerator' },
      { name: 'Front & Top Load Washers', query: 'Washing' },
    ],
  },
  {
    id: 6,
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    icon: Dumbbell,
    hasFlyout: false,
  },
  {
    id: 7,
    name: 'Top Offers',
    slug: 'top-offers',
    icon: Tag,
    special: true,
    hasFlyout: false,
  },
];

export function CategoryBar({ selectedCategory, onSelectCategory }) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const containerRef = useRef(null);

  // Close flyout menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (cat) => {
    if (cat.hasFlyout) {
      setActiveMenuId((prev) => (prev === cat.id ? null : cat.id));
    }
    onSelectCategory(cat.slug, '');
  };

  const handleSubcategoryClick = (sub, cat) => {
    setActiveMenuId(null);
    onSelectCategory(cat.slug, sub.query || '');
  };

  return (
    <nav
      ref={containerRef}
      aria-label="Secondary Category Navigation"
      style={{ top: 'var(--navbar-height, 64px)' }}
      className="sticky z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs transition-[top] duration-150"
    >
      <div className="w-full max-w-[1280px] mx-auto px-3 md:px-6">
        {/* =========================================================================
            DESKTOP SECONDARY CATEGORY BAR (>= 768px)
            Uniform 2rem (32px) gap, centered alignment, active bottom border indicator,
            and interactive mega-menu flyouts.
            ========================================================================= */}
        <div
          style={{
            gap: '2rem',
            justifyContent: 'center',
          }}
          className="hidden md:flex items-center w-full py-0"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.slug;
            const isFlyoutOpen = activeMenuId === cat.id;

            return (
              <div
                key={cat.id}
                className="relative group flex items-center h-10"
                onMouseEnter={() => {
                  if (cat.hasFlyout) setActiveMenuId(cat.id);
                }}
                onMouseLeave={() => {
                  if (cat.hasFlyout) setActiveMenuId(null);
                }}
              >
                <button
                  type="button"
                  aria-haspopup={cat.hasFlyout ? 'true' : undefined}
                  aria-expanded={cat.hasFlyout ? isFlyoutOpen : undefined}
                  onClick={() => handleCategoryClick(cat)}
                  className={`inline-flex items-center gap-1.5 h-full px-1 border-b-2 cursor-pointer select-none transition-all duration-150 font-medium text-xs whitespace-nowrap outline-none -mb-px ${
                    isSelected
                      ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                      : 'border-b-2 border-transparent text-gray-700 hover:text-blue-600 hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isSelected
                        ? 'text-blue-600'
                        : cat.special
                        ? 'text-[#FF7A00]'
                        : 'text-gray-500 group-hover:text-blue-600'
                    }`}
                  />
                  <span>{cat.name}</span>

                  {/* Subtle chevron indicator for categories with mega-menu */}
                  {cat.hasFlyout && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isFlyoutOpen
                          ? 'rotate-180 text-blue-600'
                          : 'text-gray-400 group-hover:text-blue-600'
                      }`}
                    />
                  )}
                </button>

                {/* Accessible Hover / Click Flyout Subcategory Menu */}
                {cat.hasFlyout && isFlyoutOpen && (
                  <div
                    role="menu"
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 w-60 bg-white rounded-md shadow-2xl border border-gray-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="px-3 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1 flex items-center justify-between">
                      <span>{cat.name}</span>
                      <span className="text-[9px] text-blue-600 font-semibold">Explore All</span>
                    </div>

                    <div className="py-0.5">
                      {cat.subcategories.map((sub, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          role="menuitem"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubcategoryClick(sub, cat);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors flex items-center justify-between group/item cursor-pointer"
                        >
                          <span>{sub.name}</span>
                          <span className="text-[11px] text-blue-500 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* =========================================================================
            MOBILE SECONDARY CATEGORY BAR (< 768px)
            Horizontal swipe scrolling track with smooth snap and touch support
            ========================================================================= */}
        <div
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
          className="md:hidden touch-scroll-track flex items-center overflow-x-auto gap-2 py-2 snap-x snap-mandatory w-full"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                type="button"
                aria-label={cat.name}
                style={{ scrollSnapAlign: 'start' }}
                onClick={() => onSelectCategory(cat.slug)}
                className={`snap-start shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold select-none cursor-pointer border transition-colors ${
                  isSelected
                    ? 'bg-[#0A3B74] text-white border-[#0A3B74] shadow-xs'
                    : 'bg-gray-100/80 text-gray-700 border-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                <span className="whitespace-nowrap">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
