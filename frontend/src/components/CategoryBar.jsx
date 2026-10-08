import React from 'react';
import {
  Smartphone,
  Laptop,
  Shirt,
  Home,
  Tv,
  Dumbbell,
  Tag,
  ChevronRight,
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
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between overflow-x-auto py-2.5 gap-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex flex-col items-center justify-center min-w-[90px] px-2 py-1 rounded transition group cursor-pointer text-center ${
                  isSelected ? 'text-[#2874F0]' : 'text-gray-700 hover:text-[#2874F0]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition mb-1 ${
                    isSelected
                      ? 'bg-blue-50 text-[#2874F0]'
                      : 'text-gray-600 group-hover:bg-blue-50 group-hover:text-[#2874F0]'
                  } ${cat.special ? 'text-[#FB641B]' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[12px] font-semibold tracking-tight whitespace-nowrap">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
