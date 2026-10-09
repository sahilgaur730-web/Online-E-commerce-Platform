import React, { useState } from 'react';
import {
  Smartphone,
  Shirt,
  Laptop,
  Home,
  Flame,
  ShieldCheck,
  Award,
  ChevronRight,
  X,
} from 'lucide-react';

export function StoryHighlights({ onSelectCategory, onOpenStreak }) {
  const [activeStory, setActiveStory] = useState(null);

  const stories = [
    {
      id: 'deals',
      title: 'Mega Deals',
      categorySlug: 'electronics',
      icon: Flame,
      color: 'from-amber-500 to-red-500',
      badge: 'LIVE',
      preview: {
        headline: 'Mega Deals Flash Offers',
        subhead: 'Up to 75% Off on Flagship Electronics & Audio',
        tag: 'Ending in 3h 42m',
      },
    },
    {
      id: 'mobiles',
      title: 'Mobiles',
      categorySlug: 'smartphones',
      icon: Smartphone,
      color: 'from-blue-600 to-cyan-500',
      badge: 'NEW',
      preview: {
        headline: 'Next-Gen Smartphones & 5G Devices',
        subhead: 'Exchange bonus up to ₹7,000 on top brands',
        tag: 'Apple, Samsung, OnePlus',
      },
    },
    {
      id: 'fashion',
      title: 'Fashion',
      categorySlug: 'fashion',
      icon: Shirt,
      color: 'from-pink-500 to-rose-600',
      preview: {
        headline: 'Trending Styles & Wardrobe Essentials',
        subhead: 'Min 50% Off on Top Apparel & Footwear',
        tag: 'Free Returns & Exchanges',
      },
    },
    {
      id: 'electronics',
      title: 'Laptops',
      categorySlug: 'electronics',
      icon: Laptop,
      color: 'from-purple-600 to-indigo-600',
      preview: {
        headline: 'Pro Laptops & High-Performance Workstations',
        subhead: 'Zero Cost EMI Available on HDFC & ICICI',
        tag: 'MacBook, ROG, ThinkPad',
      },
    },
    {
      id: 'home',
      title: 'Home Living',
      categorySlug: 'home-kitchen',
      icon: Home,
      color: 'from-emerald-500 to-teal-600',
      preview: {
        headline: 'Smart Home, Kitchen & Modern Decor',
        subhead: 'Verified Quality with ShopKart Assured',
        tag: 'Save Extra with SuperCoins',
      },
    },
    {
      id: 'assured',
      title: 'Assured Zone',
      categorySlug: 'all',
      icon: ShieldCheck,
      color: 'from-blue-700 to-blue-900',
      badge: 'ASSURED',
      preview: {
        headline: 'ShopKart Assured Guarantee',
        subhead: '6-Stage Rigorous Quality Inspection & Fast Delivery',
        tag: '100% Certified Sellers',
      },
    },
    {
      id: 'streak',
      title: 'Streak Coins',
      categorySlug: 'streak',
      icon: Award,
      color: 'from-amber-400 to-yellow-600',
      badge: '+50',
      isStreak: true,
      preview: {
        headline: 'Daily 7-Day SuperCoin Streak Rewards',
        subhead: 'Claim up to 50 SuperCoins & VIP status today',
        tag: 'Daily Login Reward',
      },
    },
  ];

  const handleStoryClick = (story) => {
    if (story.isStreak && onOpenStreak) {
      onOpenStreak();
      return;
    }
    setActiveStory(story);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-2">
      <div className="bg-white rounded-xs p-3.5 shadow-xs border border-gray-200">
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-1 scrollbar-none">
          {stories.map((story) => {
            const Icon = story.icon;
            return (
              <button
                key={story.id}
                onClick={() => handleStoryClick(story)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group focus:outline-none"
              >
                {/* Circular Gradient Ring */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr ${story.color} transition-transform duration-200 group-hover:scale-105 relative shadow-xs`}
                >
                  <div className="w-full h-full rounded-full bg-white p-1 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center text-gray-800 group-hover:bg-blue-50 transition">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0A3B74]" />
                    </div>
                  </div>
                  {story.badge && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#FF7A00] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow-xs">
                      {story.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-gray-800 text-center truncate max-w-[70px]">
                  {story.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Story Spotlight Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xs shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveStory(null)}
              className="absolute top-3 right-3 text-white/90 hover:text-white transition z-10 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`p-6 bg-gradient-to-tr ${activeStory.color} text-white space-y-2`}>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-black uppercase tracking-wider inline-block">
                {activeStory.preview.tag}
              </span>
              <h3 className="text-xl font-black leading-snug tracking-tight">
                {activeStory.preview.headline}
              </h3>
              <p className="text-xs text-white/90 leading-relaxed">
                {activeStory.preview.subhead}
              </p>
            </div>

            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => {
                  const slug = activeStory.categorySlug;
                  setActiveStory(null);
                  if (onSelectCategory) onSelectCategory(slug === 'all' ? '' : slug);
                }}
                className="w-full py-2.5 bg-[#0A3B74] hover:bg-[#002F6C] text-white font-bold text-xs uppercase tracking-wider rounded-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Explore {activeStory.title}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
