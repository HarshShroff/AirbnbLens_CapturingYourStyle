'use client';

import { useRef, useState } from 'react';

interface CategoryBarProps {
  onSearch: (query: string) => void;
}

const CATEGORIES = [
  { icon: '🪵', label: 'Rustic Cabin', query: 'Rustic cozy cabin fireplace wood' },
  { icon: '🏢', label: 'Minimalist Loft', query: 'Minimalist modern loft clean lines' },
  { icon: '🎨', label: 'Artistic', query: 'Artistic eclectic colorful creative' },
  { icon: '🌆', label: 'Industrial', query: 'Industrial chic warehouse exposed brick' },
  { icon: '🏖️', label: 'Beach House', query: 'Beach house ocean view coastal' },
  { icon: '🏡', label: 'Cottage', query: 'Charming cottage garden cozy' },
  { icon: '💎', label: 'Luxury', query: 'Luxury elegant premium upscale' },
  { icon: '🌿', label: 'Nature Retreat', query: 'Nature retreat forest mountain cabin' },
  { icon: '🏛️', label: 'Classic', query: 'Classic traditional elegant timeless' },
  { icon: '🎭', label: 'Bohemian', query: 'Bohemian boho eclectic colorful tapestry' },
  { icon: '🪟', label: 'Amazing Views', query: 'Stunning views panoramic skyline' },
  { icon: '🏰', label: 'Castles', query: 'Castle historic stone grand estate' },
  { icon: '🌃', label: 'Urban Chic', query: 'Urban chic city downtown modern' },
  { icon: '🏠', label: 'Cozy Home', query: 'Cozy warm comfortable homey inviting' },
];

const CategoryBar = ({ onSearch }: CategoryBarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (label: string, query: string) => {
    setActiveCategory(label);
    onSearch(query);
  };

  return (
    <div className="sticky top-16 z-40 bg-[#FDF8F4]/95 backdrop-blur-md border-b border-[#D4A574]/20">
      <div className="relative flex items-center max-w-[1800px] mx-auto px-4 sm:px-6">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-4 sm:left-6 z-10 w-8 h-8 rounded-full bg-white border border-[#D4A574]/30 shadow-md flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-200"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Categories */}
        <div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto no-scrollbar py-4 px-12 scroll-smooth"
        >
          {CATEGORIES.map(({ icon, label, query }) => (
            <button
              key={label}
              onClick={() => handleCategoryClick(label, query)}
              className={`flex flex-col items-center gap-2 min-w-[60px] pb-2 transition-all duration-200 flex-shrink-0 border-b-2 ${
                activeCategory === label
                  ? 'opacity-100 border-[#1A1A1A]'
                  : 'opacity-50 border-transparent hover:opacity-80 hover:border-[#D4A574]'
              }`}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-[10px] font-semibold whitespace-nowrap text-[#1A1A1A]">{label}</span>
            </button>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-[100px] sm:right-[120px] z-10 w-8 h-8 rounded-full bg-white border border-[#D4A574]/30 shadow-md flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-200"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4 text-[#1A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Filters Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ml-4 flex-shrink-0 ${
            showFilters
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
              : 'bg-white text-[#1A1A1A] border-[#D4A574]/30 hover:border-[#1A1A1A] hover:shadow-md'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t border-[#D4A574]/20 bg-white animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-[1800px] mx-auto px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                  Price Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-[#D4A574]/30 rounded-lg text-sm focus:outline-none focus:border-[#FF5A5F] transition-colors"
                  />
                  <span className="text-[#6B7280]">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-[#D4A574]/30 rounded-lg text-sm focus:outline-none focus:border-[#FF5A5F] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                  Bedrooms
                </label>
                <select className="w-full px-3 py-2 border border-[#D4A574]/30 rounded-lg text-sm focus:outline-none focus:border-[#FF5A5F] transition-colors bg-white">
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                  Property Type
                </label>
                <select className="w-full px-3 py-2 border border-[#D4A574]/30 rounded-lg text-sm focus:outline-none focus:border-[#FF5A5F] transition-colors bg-white">
                  <option value="">Any</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="loft">Loft</option>
                  <option value="cabin">Cabin</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-[#FF5A5F] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#E04E52] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryBar;
