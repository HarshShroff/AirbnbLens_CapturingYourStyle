'use client';

import React, { useState, useCallback, useRef } from 'react';
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
];

function findCityInText(text: string, cities: string[]): string | null {
  const lower = text.toLowerCase();
  for (const c of cities) {
    if (lower.includes(c.toLowerCase())) return c;
  }
  return null;
}

const LensSearch = ({ onSearch, onError, city, cities, onCityChange }: LensSearchProps) => {
  const [isLensOpen, setIsLensOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [whereValue, setWhereValue] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    debounceRef.current = setTimeout(() => handleTextSearch(value), 500);
  }, [handleTextSearch]);

  const handleWhereChange = (value: string) => {
    setWhereValue(value);
    const matched = findCityInText(value, cities);
    if (matched) onCityChange(matched);
  };

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

  return (
    <div className={`relative transition-all duration-300 ${isLensOpen ? 'w-[520px]' : 'w-[380px] sm:w-[420px]'}`}>
      <div
        className="flex items-center bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-full pl-5 pr-2 py-2 shadow-lg hover:shadow-xl transition-all cursor-text"
        onClick={() => setIsLensOpen(true)}
      >
        <div className="flex-1 flex flex-col items-start overflow-hidden">
          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wide">Where</span>
          <input
            type="text"
            placeholder="Search destinations"
            value={whereValue}
            onChange={(e) => handleWhereChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
            className="w-full text-sm outline-none placeholder-gray-400 bg-transparent text-[#222222]"
          />
        </div>
        <div className="h-8 border-l border-gray-200 mx-4" />
        <div className="flex-1 flex flex-col items-start overflow-hidden">
          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wide">Vibe</span>
          <input
            type="text"
            placeholder="Describe your style..."
            value={query}
            onChange={(e) => handleDebouncedSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { if (debounceRef.current) clearTimeout(debounceRef.current); handleTextSearch(); }}}
            className="w-full text-sm outline-none placeholder-gray-400 bg-transparent text-[#222222]"
          />
        </div>
        <button
          className="w-9 h-9 rounded-full bg-[#FF5A5F] flex items-center justify-center text-white ml-3 hover:bg-[#E04E52] active:scale-95 transition-all flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); if (debounceRef.current) clearTimeout(debounceRef.current); handleTextSearch(); }}
        >
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {isLensOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsLensOpen(false)} />
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-200 rounded-2xl p-5 shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#222222]">Visual Search</h3>
              <button onClick={() => setIsLensOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 px-4 flex flex-col items-center gap-3 bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer relative">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#FF5A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#222222]">Upload a photo</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, or WebP · Max 10MB</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {PRESET_QUERIES.map(({ label, query: presetQuery, icon }) => (
                <button
                  key={label}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:border-[#222222] hover:shadow-sm transition-all text-left"
                  onClick={() => { setQuery(presetQuery); handleTextSearch(presetQuery); }}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs font-semibold text-[#222222]">{label}</span>
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
