'use client';

import React, { useRef } from 'react';

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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="relative flex items-center max-w-[1800px] mx-auto px-6">
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 z-10 w-8 h-8 rounded-full bg-white border shadow-md flex items-center justify-center hover:scale-110 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto no-scrollbar py-3 px-10 scroll-smooth"
        >
          {CATEGORIES.map(({ icon, label, query }) => (
            <button
              key={label}
              onClick={() => onSearch(query)}
              className="flex flex-col items-center gap-1.5 min-w-[56px] opacity-60 hover:opacity-100 hover:border-b-2 hover:border-black pb-1 transition-all flex-shrink-0"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-semibold whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-12 z-10 w-8 h-8 rounded-full bg-white border shadow-md flex items-center justify-center hover:scale-110 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold hover:shadow-md transition-shadow ml-4 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filters
        </button>
      </div>
    </div>
  );
};

export default CategoryBar;
