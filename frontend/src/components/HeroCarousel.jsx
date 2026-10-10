import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'MEGA DEALS FESTIVAL',
    subtitle: 'Exclusive Flash Offers on Top Tech & Lifestyle Brands',
    badge: 'UP TO 80% OFF',
    desc: 'Laptops, Flagship Mobiles, Wireless Headphones & Smart Accessories',
    cta: 'Shop Mega Deals',
    bg: 'from-[#0A3B74] to-[#1E56A0]',
    accentColor: 'text-[#FFE500]',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    category: 'electronics',
  },
  {
    id: 2,
    title: 'FLAGSHIP SMARTPHONE FEST',
    subtitle: 'Upgrade to Next-Gen AI & Pro Camera Phones',
    badge: 'EXTRA ₹5,000 OFF ON EXCHANGE',
    desc: 'Apple iPhone 15, Galaxy S24 Ultra, OnePlus 12 & more with No Cost EMI',
    cta: 'Explore Smartphones',
    bg: 'from-[#1A237E] to-[#283593]',
    accentColor: 'text-[#00E5FF]',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    category: 'mobiles',
  },
  {
    id: 3,
    title: 'SMART LIVING APPLIANCES',
    subtitle: 'Premium Living for Modern Homes',
    badge: 'STARTING AT ₹2,199',
    desc: '4K OLED Smart TVs, Digital Air Fryers & High-Performance Audio Systems',
    cta: 'Upgrade Your Home',
    bg: 'from-[#1B5E20] to-[#2E7D32]',
    accentColor: 'text-[#FFE082]',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
    category: 'appliances',
  },
];

export function HeroCarousel({ onSelectCategory }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="relative overflow-hidden bg-gray-900 text-white select-none">
      <div className={`w-full bg-gradient-to-r ${slide.bg} transition-colors duration-700`}>
        <div className="w-full max-w-[1280px] mx-auto px-3 md:px-6 py-6 md:py-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 h-[560px] sm:h-[500px] md:h-[400px]">
          {/* Text Content */}
          <div className="w-full max-w-xl space-y-2.5 md:space-y-3 z-10 h-[260px] sm:h-[220px] md:h-[260px] flex flex-col justify-center">
            <span className="inline-block bg-[#FF7A00] text-white text-xs font-bold tracking-wider px-3 py-1 rounded-sm uppercase self-start">
              {slide.badge}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {slide.title}
            </h1>
            <p className={`text-base sm:text-lg md:text-xl font-semibold ${slide.accentColor}`}>
              {slide.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-gray-200 line-clamp-2">
              {slide.desc}
            </p>
            <div className="pt-1.5 md:pt-2">
              <button
                type="button"
                onClick={() => onSelectCategory(slide.category)}
                className="bg-[#FF7A00] hover:bg-[#E66A00] text-white font-bold px-6 py-2.5 rounded-sm shadow-md transition text-sm cursor-pointer"
              >
                {slide.cta}
              </button>
            </div>
          </div>

          {/* Banner Product Showcase Image */}
          <div className="shrink-0 relative">
            <div className="w-64 h-48 sm:h-52 md:w-80 md:h-64 rounded-sm overflow-hidden bg-black/20 p-2 shadow-lg">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover rounded-sm transform hover:scale-105 transition duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Isolated Navigation Controls Overlay (CLS-Free & Pointer-Events Isolated) */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{ pointerEvents: 'none' }}
        aria-hidden="false"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
          }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            pointerEvents: 'auto',
            margin: 0,
            padding: 0,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          className="left-2 sm:left-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors duration-150 border border-white/20 shadow-lg cursor-pointer focus:outline-none active:outline-none select-none m-0 p-0"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrent((prev) => (prev + 1) % SLIDES.length);
          }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            pointerEvents: 'auto',
            margin: 0,
            padding: 0,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          className="right-2 sm:right-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors duration-150 border border-white/20 shadow-lg cursor-pointer focus:outline-none active:outline-none select-none m-0 p-0"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto">
        {SLIDES.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === current ? 'w-7 bg-[#FF7A00]' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
