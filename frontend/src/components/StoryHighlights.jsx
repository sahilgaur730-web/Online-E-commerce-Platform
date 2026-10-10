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
      categorySlug: 'mobiles',
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

  const renderBadge = (badge) => {
    if (!badge) return null;

    let badgeContent = null;
    let badgeBgClass = '';

    switch (badge) {
      case 'LIVE':
        badgeBgClass = 'bg-[#EF4444] text-white shadow-xs';
        badgeContent = (
          <span className="inline-flex items-center gap-1 leading-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            <span>LIVE</span>
          </span>
        );
        break;

      case 'NEW':
        badgeBgClass = 'bg-[#2563EB] text-white shadow-xs';
        badgeContent = <span className="leading-none">NEW</span>;
        break;

      case 'ASSURED':
        badgeBgClass = 'bg-[#059669] text-white shadow-xs';
        badgeContent = (
          <span className="inline-flex items-center gap-0.5 leading-none">
            <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
            <span>ASSURED</span>
          </span>
        );
        break;

      case '+50':
        badgeBgClass = 'bg-[#D97706] text-white shadow-xs';
        badgeContent = <span className="leading-none">+50</span>;
        break;

      default:
        badgeBgClass = 'bg-gray-800 text-white shadow-xs';
        badgeContent = <span className="leading-none">{badge}</span>;
        break;
    }

    return (
      <span
        style={{
          position: 'absolute',
          top: '-6px',
          right: '-8px',
          zIndex: 10,
        }}
        className={`font-black tracking-wider uppercase text-[9px] px-1.5 py-0.5 rounded-full border border-white whitespace-nowrap select-none pointer-events-none shadow-xs ${badgeBgClass}`}
      >
        {badgeContent}
      </span>
    );
  };

  const handleStoryClick = (story) => {
    if (story.isStreak && onOpenStreak) {
      onOpenStreak();
      return;
    }
    setActiveStory(story);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3 md:px-6 pt-2">
      <div className="bg-white rounded-md shadow-xs border border-gray-200 overflow-visible">
        {/* =========================================================================
            DESKTOP PROMO CARDS (>= 768px)
            display: flex; justify-content: space-between; align-items: center; width: 100%;
            Zero layout shift, standardized absolute badge anchors top: -6px; right: -8px.
            ========================================================================= */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
          className="hidden md:flex px-4 py-3"
        >
          {stories.map((story) => {
            const Icon = story.icon;

            return (
              <button
                key={story.id}
                type="button"
                aria-label={story.title}
                onClick={() => handleStoryClick(story)}
                className="flex flex-col items-center justify-center flex-1 cursor-pointer group focus:outline-none select-none category-item-lift py-1"
              >
                {/* 48x48px Squircle Card Container */}
                <div className="relative w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-xs group-hover:border-[#0A3B74]/30 group-hover:bg-blue-50/50 transition-colors duration-200 overflow-visible">
                  <Icon className="w-5 h-5 text-[#0A3B74] group-hover:text-[#FF7A00] transition-colors duration-200" />

                  {/* Standardized Absolute Floating Pill Badge */}
                  {renderBadge(story.badge)}
                </div>

                {/* Uniform Baseline Typography */}
                <span
                  style={{ fontSize: '0.8125rem' }}
                  className="font-medium text-slate-700 group-hover:text-[#0A3B74] text-center w-full truncate leading-5 h-5 flex items-center justify-center tracking-tight transition-colors duration-150 mt-2"
                >
                  {story.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            MOBILE HORIZONTAL SWIPE PROMO STRIP (< 768px)
            overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
            Consistent 16px item padding to prevent clipping and layout jumps.
            ========================================================================= */}
        <div
          style={{
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            padding: '16px',
          }}
          className="md:hidden flex items-center gap-5 touch-scroll-track snap-x snap-mandatory w-full"
        >
          {stories.map((story) => {
            const Icon = story.icon;

            return (
              <button
                key={story.id}
                type="button"
                aria-label={story.title}
                style={{ scrollSnapAlign: 'start' }}
                onClick={() => handleStoryClick(story)}
                className="flex flex-col items-center justify-start gap-2 shrink-0 cursor-pointer group focus:outline-none select-none snap-start py-1"
              >
                {/* 48x48px Squircle Card Container */}
                <div className="relative w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-xs group-hover:border-[#0A3B74]/30 group-hover:bg-blue-50/50 transition-colors duration-200 overflow-visible">
                  <Icon className="w-5 h-5 text-[#0A3B74] group-hover:text-[#FF7A00] transition-colors duration-200" />
                  {renderBadge(story.badge)}
                </div>

                <span
                  style={{ fontSize: '0.75rem' }}
                  className="font-medium text-slate-700 text-center truncate max-w-[80px] leading-4"
                >
                  {story.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Story Spotlight Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
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
