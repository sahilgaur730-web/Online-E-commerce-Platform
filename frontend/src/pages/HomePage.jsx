import React, { useState, useEffect } from 'react';
import { HeroCarousel } from '../components/HeroCarousel';
import { StoryHighlights } from '../components/StoryHighlights';
import { ProductCard } from '../components/ProductCard';
import { api } from '../api/client';
import {
  getFallbackDeals,
  getFallbackFeatured,
  getFallbackTopOffers,
} from '../data/fallbackProducts';
import { Clock, ChevronRight, Zap, ShieldCheck } from 'lucide-react';

export function HomePage({
  onSelectProduct,
  onSelectCategory,
  onViewCatalog,
  onWishlistToggle,
  wishlistIds = [],
  onOpenStreak,
}) {
  const [deals, setDeals] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [topOffers, setTopOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dealsData, featData, topData] = await Promise.all([
          api.getDeals(),
          api.getFeaturedProducts(),
          api.getTopOffers(),
        ]);
        setDeals(dealsData && dealsData.length > 0 ? dealsData : getFallbackDeals());
        setFeatured(featData && featData.length > 0 ? featData : getFallbackFeatured());
        setTopOffers(topData && topData.length > 0 ? topData : getFallbackTopOffers());
      } catch (err) {
        console.error('Failed to load homepage data, falling back to local catalog:', err);
        setDeals(getFallbackDeals());
        setFeatured(getFallbackFeatured());
        setTopOffers(getFallbackTopOffers());
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-4 pb-8">
      {/* Instagram-style circular story highlights carousel */}
      <StoryHighlights
        onSelectCategory={onSelectCategory}
        onOpenStreak={onOpenStreak}
      />

      {/* Hero Carousel */}
      <HeroCarousel onSelectCategory={onSelectCategory} />

      {/* Deals of the Day Strip */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-4 rounded-xs shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#FF7A00] fill-current" /> Deals of the Day
              </h2>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-xs">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span>14h : 22m : 45s Left</span>
              </div>
            </div>
            <button
              onClick={() => onViewCatalog({ dealOfTheDay: true })}
              className="bg-[#0A3B74] hover:bg-[#002F6C] text-white font-bold text-xs px-4 py-2 rounded-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              VIEW ALL <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 py-6">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-64 bg-gray-100 animate-pulse rounded-xs" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {deals.map((prod) => (
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

      {/* Value Guarantee Strip */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-blue-50/70 border border-blue-200 rounded-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0A3B74] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">ShopKart Assured Guarantee</h3>
              <p className="text-xs text-gray-600">6 Quality Checks • Fast Dispatched • Easy 7-Day Returns</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#0A3B74]">Verified Sellers Platform</span>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-4 rounded-xs shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Top Offers on Electronics & Mobiles
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Handpicked premium devices at best prices</p>
            </div>
            <button
              onClick={() => onViewCatalog({ topOffer: true })}
              className="bg-[#0A3B74] hover:bg-[#002F6C] text-white font-bold text-xs px-4 py-2 rounded-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              VIEW ALL <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {topOffers.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelectProduct={onSelectProduct}
                onWishlistToggle={onWishlistToggle}
                isWishlisted={wishlistIds.includes(prod.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Recommendations Collection */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-4 rounded-xs shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Featured Recommendations
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Based on popular customer trends</p>
            </div>
            <button
              onClick={() => onViewCatalog()}
              className="bg-[#0A3B74] hover:bg-[#002F6C] text-white font-bold text-xs px-4 py-2 rounded-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              VIEW ALL <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {featured.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelectProduct={onSelectProduct}
                onWishlistToggle={onWishlistToggle}
                isWishlisted={wishlistIds.includes(prod.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
