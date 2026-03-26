'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Header from './components/Header';
import LensSearch from './components/LensSearch';
import ListingCard from './components/ListingCard';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import CategoryBar from './components/CategoryBar';
import { Listing } from '../lib/types';
import { searchText, searchSimilar } from '../lib/api';

const VibeMap = dynamic(() => import('./components/VibeMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#F5EDE6] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#FF5A5F] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#6B7280]">Loading map...</span>
      </div>
    </div>
  )
});

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
    <main className="min-h-screen bg-[#FDF8F4]">
      <Header
        showMiniSearch={scrolled}
        onMiniSearchClick={scrollToSearch}
        currentCity={currentCity}
      />

      {error && <Toast message={error} onDismiss={() => setError(null)} />}

      {/* Hero - Bold Editorial Style */}
      <section className="relative h-[520px] sm:h-[580px] w-full overflow-hidden">
        {/* Background Image with Warm Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=80")',
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A]/80 via-[#1A1A1A]/50 to-[#C17F59]/30" />
        {/* Grain Texture */}
        <div className="absolute inset-0 grain-overlay" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-8 fade-in duration-1000">
            {/* Eyebrow */}
            <span className="text-[#D4A574] text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase">
              Visual Search Engine
            </span>

            {/* Main Headline - Using Display Font */}
            <h1 className="font-display text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-center leading-[0.95]">
              Airbnb<span className="text-[#FF5A5F]">Lens</span>
            </h1>

            {/* Subheadline */}
            <p className="text-white/70 text-base sm:text-lg font-normal max-w-md text-center leading-relaxed tracking-wide">
              Discover stays by aesthetic. Upload a photo, describe your vibe, or teleport styles across cities.
            </p>

            {/* Search Component */}
            <div ref={searchRef} className="mt-4 relative z-20">
              <LensSearch
                onSearch={handleSearchResults}
                onError={setError}
                city={currentCity}
                cities={CITIES}
                onCityChange={setCurrentCity}
              />
            </div>
          </div>

          {/* City Pills - Positioned at Bottom */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2.5 px-4 overflow-x-auto no-scrollbar">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setCurrentCity(city)}
                className={`px-5 py-2 rounded-full text-[11px] font-semibold transition-all duration-300 whitespace-nowrap
                  ${currentCity === city
                    ? 'bg-white text-[#1A1A1A] shadow-lg shadow-white/20 scale-105'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-sm border border-white/10'}`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#FF5A5F]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-48 h-48 bg-[#D4A574]/10 rounded-full blur-3xl" />
      </section>

      {/* Category Bar */}
      <CategoryBar onSearch={handleCategorySearch} />

      {/* Expanded Query Banner - Warm Colors */}
      {expandedQuery && !loading && (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 mt-4">
          <div className="px-4 py-3 bg-gradient-to-r from-[#FDF8F4] to-[#F5EDE6] border border-[#D4A574]/30 rounded-xl flex items-center gap-3 animate-in fade-in duration-300 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#FF5A5F]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#FF5A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm">
              <span className="font-semibold text-[#C17F59]">Query expanded:</span>{' '}
              <span className="text-[#1A1A1A] italic">&ldquo;{expandedQuery}&rdquo;</span>
            </p>
          </div>
        </div>
      )}

      {/* Split Screen Layout */}
      <div className="max-w-[1800px] mx-auto">
        <div className="flex">
          {/* Listing Grid */}
          <div className="w-full lg:w-1/2 xl:w-[55%] px-4 sm:px-6 py-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#1A1A1A]">
                  {targetMigrationCity ? (
                    <span>Style migrated to <span className="text-[#FF5A5F]">{targetMigrationCity}</span></span>
                  ) : (
                    <span>
                      {listings.length} stays in <span className="text-[#FF5A5F]">{currentCity}</span>
                    </span>
                  )}
                </h2>
                {dbStats.metadata > 0 && (
                  <p className="text-xs text-[#6B7280] mt-1">
                    Searching {dbStats.metadata.toLocaleString()} indexed listings
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F5EDE6] rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-[#6B7280] font-medium">Live</span>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10">
                {[...Array(Math.min(listings.length || 8, 12))].map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="aspect-square skeleton rounded-2xl" />
                    <div className="h-4 skeleton rounded-lg w-3/4" />
                    <div className="h-3 skeleton rounded-lg w-1/2" />
                    <div className="h-4 skeleton rounded-lg w-1/3" />
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 animate-in fade-in duration-500">
                {listings.map((item, idx) => (
                  <ListingCard
                    key={item.id || idx}
                    listing={item}
                    CITIES={CITIES}
                    onStyleMigrate={handleStyleMigration}
                    onHover={(l) => setHighlightedListing(l?.id || null)}
                    isHighlighted={highlightedListing === item.id}
                    isPriority={idx < 4}
                  />
                ))}
              </div>
            ) : !initialLoad ? (
              <div className="py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-[#F5EDE6] flex items-center justify-center mx-auto mb-5">
                  <svg className="w-10 h-10 text-[#D4A574]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="font-display text-[#1A1A1A] font-semibold text-lg">No stays found</p>
                <p className="text-[#6B7280] text-sm mt-2 mb-6">Try a different city or describe another vibe</p>
                <button
                  className="bg-[#FF5A5F] text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-[#E04E52] transition-all hover:shadow-lg hover:shadow-[#FF5A5F]/20"
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

      {/* Footer - Warm Theme */}
      <footer className="border-t border-[#D4A574]/20 bg-[#F5EDE6] mt-12">
        <div className="max-w-[1800px] mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <svg className="w-7 h-7 text-[#FF5A5F]" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.01.415c0 2.516-1.128 4.348-3.14 5.285l-.36.157c-.732.317-1.526.48-2.36.48-1.72 0-3.252-.827-4.453-2.17-.932 1.03-2.06 1.87-3.455 2.463l-.185.07-.357.122c-1.8.595-3.77.522-5.405-.186l-.307-.14c-2.008-.96-3.226-2.764-3.226-5.156 0-1.035.22-1.937.862-3.23l.198-.4c.917-1.843 5.03-10.45 6.97-14.25l.533-1.04C12.533 1.963 13.992 1 16 1z" />
              </svg>
              <span className="font-display font-bold text-[#1A1A1A] text-lg">
                airbnb<span className="text-[#FF5A5F]">lens</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <span className="w-2 h-2 rounded-full bg-[#FF5A5F]" />
              <span>{dbStats.metadata.toLocaleString()} listings indexed</span>
            </div>
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
