import React from 'react';
import {
  Smartphone,
  Laptop,
  Shirt,
  Home,
  Tv,
  Dumbbell,
  Tag,
} from 'lucide-react';

const CATEGORIES = [
  { id: 1, name: 'Mobiles & Tablets', slug: 'mobiles', icon: Smartphone },
  { id: 2, name: 'Electronics', slug: 'electronics', icon: Laptop },
  { id: 3, name: 'Fashion', slug: 'fashion', icon: Shirt },
  { id: 4, name: 'Home & Kitchen', slug: 'home-kitchen', icon: Home },
  { id: 5, name: 'Appliances', slug: 'appliances', icon: Tv },
  { id: 6, name: 'Sports & Fitness', slug: 'sports-fitness', icon: Dumbbell },
  { id: 7, name: 'Top Offers', slug: 'top-offers', icon: Tag, special: true },
];

export function CategoryBar({ selectedCategory, onSelectCategory }) {
  return (
    <nav
      aria-label="Product Categories"
      className="sticky top-[56px] sm:top-[60px] lg:top-[64px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xs"
    >
      <div className="w-full max-w-[1280px] mx-auto px-3 md:px-6">
        <div
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
          className="flex items-center gap-2 sm:gap-3 md:justify-between overflow-x-auto py-2 scrollbar-none snap-x snap-mandatory"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                type="button"
                style={{ scrollSnapAlign: 'start' }}
                onClick={() => onSelectCategory(cat.slug)}
                className={`snap-start shrink-0 inline-flex items-center gap-2 px-3 py-1.5 md:px-3.5 md:py-2 rounded-full md:rounded-md transition-all duration-200 cursor-pointer select-none border md:border-transparent ${
                  isSelected
                    ? 'bg-[#0A3B74] text-white border-[#0A3B74] shadow-xs'
                    : 'bg-gray-50 md:bg-transparent text-gray-700 hover:text-[#0A3B74] hover:bg-blue-50/70 border-gray-200'
                }`}
              >
                <div
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'text-white'
                      : cat.special
                      ? 'text-[#FF7A00]'
                      : 'text-gray-600 group-hover:text-[#0A3B74]'
                  }`}
                >
                  <Icon className="w-4 h-4 md:w-4.5 md:h-4.5" />
                </div>
                <span className="text-xs font-semibold whitespace-nowrap">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
