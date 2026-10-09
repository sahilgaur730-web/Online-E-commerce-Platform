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
      style={{ top: 'var(--navbar-height, 64px)' }}
      className="sticky z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xs transition-[top] duration-150"
    >
      <div className="w-full max-w-[1280px] mx-auto px-3 md:px-6">
        <div
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
          className="touch-scroll-track flex lg:grid lg:grid-cols-7 items-center gap-2 sm:gap-3 lg:gap-2.5 py-2 snap-x snap-mandatory lg:snap-none w-full"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                type="button"
                aria-label={cat.name}
                style={{
                  scrollSnapAlign: 'start',
                  transition:
                    'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
                }}
                onClick={() => onSelectCategory(cat.slug)}
                className={`snap-start shrink-0 lg:w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 md:px-3.5 md:py-2 rounded-full md:rounded-md cursor-pointer select-none border md:border-transparent hover:[transform:translateY(-2px)] active:[transform:translateY(0)] ${
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
                <span className="text-xs font-semibold whitespace-nowrap truncate">
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
