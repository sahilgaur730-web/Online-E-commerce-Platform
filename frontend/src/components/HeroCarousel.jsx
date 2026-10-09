import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'THE BIG BILLION DAYS',
    subtitle: 'India’s Biggest Shopping Celebration is LIVE!',
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
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-8 min-h-[300px]">
          {/* Text Content */}
          <div className="max-w-xl space-y-3 z-10">
            <span className="inline-block bg-[#FF7A00] text-white text-xs font-bold tracking-wider px-3 py-1 rounded-sm uppercase">
              {slide.badge}
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {slide.title}
            </h1>
            <p className={`text-lg md:text-xl font-semibold ${slide.accentColor}`}>
              {slide.subtitle}
            </p>
            <p className="text-sm text-gray-200">
              {slide.desc}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onSelectCategory(slide.category)}
                className="bg-[#FF7A00] hover:bg-[#E66A00] text-white font-bold px-6 py-2.5 rounded-sm shadow-md transition text-sm cursor-pointer"
              >
                {slide.cta}
              </button>
            </div>
          </div>

          {/* Banner Product Showcase Image */}
          <div className="shrink-0 relative">
            <div className="w-64 h-56 md:w-80 md:h-64 rounded-sm overflow-hidden bg-black/20 p-2 shadow-lg">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover rounded-sm transform hover:scale-105 transition duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-r-sm transition cursor-pointer"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => setCurrent((prev) => (prev + 1) % SLIDES.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-l-sm transition cursor-pointer"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {SLIDES.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              idx === current ? 'w-6 bg-[#FF7A00]' : 'w-2 bg-white/50'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
