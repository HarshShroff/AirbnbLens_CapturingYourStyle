'use client';

import { useState, useCallback, useRef } from 'react';
import { searchText, searchImage } from '../../lib/api';
import { Listing } from '../../lib/types';

interface LensSearchProps {
  onSearch: (results: Listing[], expanded?: string) => void;
  onError: (message: string) => void;
  city: string;
  cities: string[];
  onCityChange: (city: string) => void;
}

const PRESET_QUERIES = [
  { label: 'Minimalist', query: 'Minimalist modern loft', icon: '🔲' },
  { label: 'Rustic', query: 'Rustic cozy cabin fireplace', icon: '🪵' },
  { label: 'Industrial', query: 'Industrial warehouse brick', icon: '🏭' },
  { label: 'Bohemian', query: 'Bohemian eclectic colorful', icon: '🎨' },
];

const LensSearch = ({ onSearch, onError, city, cities, onCityChange }: LensSearchProps) => {
  const [isLensOpen, setIsLensOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleTextSearch = useCallback(async (searchQuery?: string, searchCity?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q) return;
    const activeCity = searchCity ?? city;
    setLoading(true);
    try {
      const data = await searchText(q, activeCity);
      const expanded = data.expanded_query || undefined;
      onSearch(data.results, expanded);
      setIsLensOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      onError(msg);
    }
    setLoading(false);
  }, [query, city, onSearch, onError]);

  const handleDebouncedSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) return;
    debounceRef.current = setTimeout(() => handleTextSearch(value), 600);
  }, [handleTextSearch]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { onError('Image must be under 10MB'); return; }
    setLoading(true);
    try {
      const data = await searchImage(file, city);
      onSearch(data.results);
      setIsLensOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image search failed';
      onError(msg);
    }
    setLoading(false);
  };

  const openLensPanel = () => {
    setIsLensOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  return (
    <div className={`relative transition-all duration-300 ${isLensOpen ? 'w-[480px] sm:w-[540px]' : 'w-[340px] sm:w-[440px]'}`}>
      {/* Main Search Bar */}
      <div
        className="flex items-center bg-white border border-[#D4A574]/30 rounded-full pl-4 pr-2 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {/* City Selector */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className="flex items-center gap-1 text-sm font-semibold text-[#1A1A1A] hover:text-[#FF5A5F] transition-colors pr-3 border-r border-[#D4A574]/30"
          >
            {city}
            <svg className={`w-3.5 h-3.5 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* City Dropdown */}
          {showCityDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
              <div className="absolute top-full left-0 mt-2 bg-white border border-[#D4A574]/30 rounded-xl shadow-xl z-50 py-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200">
                {cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onCityChange(c);
                      setShowCityDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      c === city ? 'bg-[#FDF8F4] text-[#FF5A5F] font-semibold' : 'text-[#1A1A1A] hover:bg-[#FDF8F4]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search Input */}
        <div className="flex-1 flex items-center pl-3">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Describe your ideal stay..."
            value={query}
            onChange={(e) => handleDebouncedSearch(e.target.value)}
            onFocus={openLensPanel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                handleTextSearch();
              }
            }}
            className="w-full text-sm outline-none placeholder-[#9CA3AF] bg-transparent text-[#1A1A1A]"
          />
        </div>

        {/* Search Button */}
        <button
          className="w-10 h-10 rounded-full bg-[#FF5A5F] flex items-center justify-center text-white ml-2 hover:bg-[#E04E52] active:scale-95 transition-all duration-200 flex-shrink-0 shadow-md hover:shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            if (debounceRef.current) clearTimeout(debounceRef.current);
            handleTextSearch();
          }}
        >
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
          ) : (
            <svg className="w-4.5 h-4.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Expanded Panel */}
      {isLensOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsLensOpen(false)} />
          <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white border border-[#D4A574]/30 rounded-2xl p-5 shadow-2xl z-40 animate-in fade-in slide-in-from-top-3 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-semibold text-lg text-[#1A1A1A]">Visual Search</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Upload a photo or choose a style preset</p>
              </div>
              <button
                onClick={() => setIsLensOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F5EDE6] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#D4A574]/30 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Image Upload Zone */}
            <div className="relative border-2 border-dashed border-[#D4A574]/40 rounded-xl py-8 px-4 flex flex-col items-center gap-3 bg-[#FDF8F4] hover:bg-[#F5EDE6] hover:border-[#D4A574] transition-all duration-200 cursor-pointer group">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 rounded-full bg-white border border-[#D4A574]/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
                <svg className="w-6 h-6 text-[#FF5A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1A1A1A]">Drop an image or click to upload</p>
                <p className="text-xs text-[#6B7280] mt-1">JPG, PNG, or WebP up to 10MB</p>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#D4A574]/20" />
              <span className="text-xs font-medium text-[#6B7280]">or try a preset</span>
              <div className="flex-1 h-px bg-[#D4A574]/20" />
            </div>

            {/* Preset Queries */}
            <div className="grid grid-cols-2 gap-3">
              {PRESET_QUERIES.map(({ label, query: presetQuery, icon }) => (
                <button
                  key={label}
                  className="flex items-center gap-3 p-3.5 border border-[#D4A574]/30 rounded-xl hover:border-[#FF5A5F] hover:bg-[#FDF8F4] transition-all duration-200 text-left group"
                  onClick={() => {
                    setQuery(presetQuery);
                    handleTextSearch(presetQuery);
                  }}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LensSearch;
