'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from './components/Header';
import LensSearch from './components/LensSearch';
import ListingCard from './components/ListingCard';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import CategoryBar from './components/CategoryBar';
import { Listing } from '../lib/types';
import { searchText, searchSimilar } from '../lib/api';

const VibeMap = dynamic(() => import('./components/VibeMap'), { ssr: false });

const CITIES = ["Ashville", "Washington", "Boston", "New York", "Cambridge", "Jersey City", "Newark", "Rhode Island"];

function HomeContent() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState("Ashville");
  const [targetMigrationCity, setTargetMigrationCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [highlightedListing, setHighlightedListing] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<{metadata: number; visuals: number}>({metadata: 0, visuals: 0});
  const [initialLoad, setInitialLoad] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`)
      .then(r => r.json())
      .then(d => setDbStats({ metadata: d.collections?.airbnb_metadata || 0, visuals: d.collections?.airbnb_visuals || 0 }))
      .catch(() => {});

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchResults = useCallback(async (query: string, city?: string) => {
    const activeCity = city || currentCity;
    setLoading(true);
    setTargetMigrationCity("");
    setError(null);
    setExpandedQuery(null);
    try {
      const searchQuery = query.trim() || `Stunning layout in ${activeCity}`;
      const data = await searchText(searchQuery, activeCity);
      setListings(data.results);
      if (data.expanded_query) setExpandedQuery(data.expanded_query);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      setError(msg);
      setListings([]);
    }
    setLoading(false);
    setInitialLoad(false);
  }, [currentCity]);

  useEffect(() => {
    fetchResults(`Cozy stay in ${currentCity}`);
  }, [currentCity, fetchResults]);

  const handleSearchResults = (results: Listing[], expanded?: string) => {
    setListings(results);
    setTargetMigrationCity("");
    setError(null);
    setExpandedQuery(expanded || null);
    setInitialLoad(false);
  };

  const handleStyleMigration = async (listingId: string, city: string) => {
    setLoading(true);
    setTargetMigrationCity(city);
    setError(null);
    setExpandedQuery(null);
    try {
      const data = await searchSimilar(listingId, city);
      setListings(data.results);
      if (data.expanded_query) setExpandedQuery(data.expanded_query);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Migration failed';
      setError(msg);
      setListings([]);
    }
    setLoading(false);
  };

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategorySearch = (query: string) => {
    fetchResults(query);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header
        showMiniSearch={scrolled}
        onMiniSearchClick={scrollToSearch}
        currentCity={currentCity}
      />

      {error && <Toast message={error} onDismiss={() => setError(null)} />}

      {/* Hero */}
      <section
        className="relative h-[460px] sm:h-[500px] w-full bg-cover bg-center flex flex-col items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.3) 100%), url("https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1600")',
        }}
      >
        <div className="flex flex-col items-center gap-5 animate-in slide-in-from-bottom-6 fade-in duration-700">
          <span className="text-white/70 text-[11px] font-bold tracking-[0.25em] uppercase bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
            AI-Powered Style Discovery
          </span>
          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-center drop-shadow-2xl leading-tight">
            Airbnb<span className="text-[#FF5A5F]">Lens</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base font-medium max-w-lg text-center leading-relaxed">
            Find your perfect vibe. Search by photo, describe your aesthetic, or teleport styles across 8 cities.
          </p>

          <div ref={searchRef} className="mt-3 relative z-20">
            <LensSearch
              onSearch={handleSearchResults}
              onError={setError}
              city={currentCity}
              cities={CITIES}
              onCityChange={setCurrentCity}
            />
          </div>
        </div>

        {/* City Pills */}
        <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto no-scrollbar">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setCurrentCity(city)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 whitespace-nowrap border
                ${currentCity === city
                  ? 'bg-white text-black border-white shadow-lg scale-105'
                  : 'bg-white/15 text-white border-white/25 hover:bg-white/30 backdrop-blur-sm'}`}
            >
              {city}
            </button>
          ))}
        </div>
      </section>

      {/* Category Bar */}
      <CategoryBar onSearch={handleCategorySearch} />

      {/* Expanded Query Banner */}
      {expandedQuery && !loading && (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 mt-4">
          <div className="px-4 py-2 bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-300">
            <span className="text-sm">✨</span>
            <p className="text-sm">
              <span className="font-semibold text-violet-700">Beast Engine expanded:</span>{' '}
              <span className="text-violet-900 italic">&ldquo;{expandedQuery}&rdquo;</span>
            </p>
          </div>
        </div>
      )}

      {/* Split Screen */}
      <div className="max-w-[1800px] mx-auto">
        <div className="flex">
          {/* Listing Grid */}
          <div className="w-full lg:w-1/2 xl:w-[55%] px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#222222]">
                  {targetMigrationCity ? (
                    <span>Style migrated to <span className="text-[#FF5A5F]">{targetMigrationCity}</span></span>
                  ) : (
                    <span>
                      {listings.length} stays in <span className="text-[#FF5A5F]">{currentCity}</span>
                    </span>
                  )}
                </h2>
                {dbStats.metadata > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    From {dbStats.metadata.toLocaleString()} indexed listings
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live</span>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                {[...Array(Math.min(listings.length || 8, 12))].map((_, i) => (
                  <div key={i} className="flex flex-col gap-2 animate-pulse">
                    <div className="aspect-square bg-gray-100 rounded-xl" />
                    <div className="h-3.5 bg-gray-100 rounded-md w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                    <div className="h-3.5 bg-gray-100 rounded-md w-1/4 mt-0.5" />
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 animate-in fade-in duration-300">
                {listings.map((item, idx) => (
                  <ListingCard
                    key={item.id || idx}
                    listing={item}
                    CITIES={CITIES}
                    onStyleMigrate={handleStyleMigration}
                    onHover={(l) => setHighlightedListing(l?.id || null)}
                    isHighlighted={highlightedListing === item.id}
                  />
                ))}
              </div>
            ) : !initialLoad ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-semibold text-base">No stays found</p>
                <p className="text-gray-400 text-sm mt-1 mb-4">Try a different city or vibe</p>
                <button
                  className="bg-[#FF5A5F] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#E04E52] transition-colors"
                  onClick={() => fetchResults('')}
                >
                  Reset Search
                </button>
              </div>
            ) : null}
          </div>

          {/* Map */}
          <div className="hidden lg:block lg:w-1/2 xl:w-[45%] sticky top-16 h-[calc(100vh-64px)]">
            <VibeMap listings={listings} highlightedId={highlightedListing} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-[#F7F7F7] mt-8">
        <div className="max-w-[1800px] mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-[#FF5A5F]" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.01.415c0 2.516-1.128 4.348-3.14 5.285l-.36.157c-.732.317-1.526.48-2.36.48-1.72 0-3.252-.827-4.453-2.17-.932 1.03-2.06 1.87-3.455 2.463l-.185.07-.357.122c-1.8.595-3.77.522-5.405-.186l-.307-.14c-2.008-.96-3.226-2.764-3.226-5.156 0-1.035.22-1.937.862-3.23l.198-.4c.917-1.843 5.03-10.45 6.97-14.25l.533-1.04C12.533 1.963 13.992 1 16 1z" />
              </svg>
              <span className="font-bold text-[#222222] text-sm">airbnb<span className="text-[#FF5A5F]">lens</span></span>
            </div>
            <p className="text-xs text-gray-400">
              AirbnbLens Beast Engine — {dbStats.metadata.toLocaleString()} listings indexed
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
    </ErrorBoundary>
  );
}
