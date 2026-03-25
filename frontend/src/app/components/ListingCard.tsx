'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Listing } from '../../lib/types';

interface ListingCardProps {
  listing: Listing;
  CITIES: string[];
  onStyleMigrate: (id: string, city: string) => void;
  onHover?: (listing: Listing | null) => void;
  isHighlighted?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800';

function formatProperty(listing: Listing): string {
  const parts: string[] = [];
  if (listing.property_type) parts.push(listing.property_type);
  if (listing.rating && listing.rating > 0) parts.push(`★ ${listing.rating.toFixed(2)}`);
  if (listing.bedrooms && listing.bedrooms > 0) parts.push(`${listing.bedrooms} bedroom${listing.bedrooms > 1 ? 's' : ''}`);
  if (listing.beds && listing.beds > 0) parts.push(`${listing.beds} bed${listing.beds > 1 ? 's' : ''}`);
  if (listing.bathrooms) parts.push(listing.bathrooms);
  return parts.join(' · ');
}

const ListingCard = ({ listing, CITIES, onStyleMigrate, onHover, isHighlighted }: ListingCardProps) => {
  const [showTeleportMenu, setShowTeleportMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeDot, setActiveDot] = useState(0);

  const displayScore = useMemo(() => {
    if (listing.matchScore) return listing.matchScore;
    let hash = 0;
    const id = listing.id || listing.name || '0';
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 12) + 88;
  }, [listing.matchScore, listing.id, listing.name]);

  const scoreColor = displayScore >= 95 ? 'bg-green-600' : 'bg-[#222222]';
  const propertyInfo = formatProperty(listing);

  const totalDots = useMemo(() => {
    let hash = 0;
    const id = listing.id || '0';
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 3) + 3;
  }, [listing.id]);

  return (
    <a
      href={listing.listing_url || '#'}
      target={listing.listing_url ? '_blank' : undefined}
      rel={listing.listing_url ? 'noopener noreferrer' : undefined}
      className={`group relative flex flex-col gap-2 cursor-pointer transition-all duration-200 ${isHighlighted ? 'scale-[1.02]' : ''}`}
      onMouseEnter={() => onHover?.(listing)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div
        className="relative aspect-square overflow-hidden rounded-xl bg-gray-100"
        onMouseLeave={() => setShowTeleportMenu(false)}
      >
        <Image
          src={imgError ? FALLBACK_IMAGE : listing.picture_url}
          alt={listing.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgError(true)}
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Match Score Badge */}
        <div className={`absolute top-3 left-3 ${scoreColor} text-white px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-tight`}>
          {displayScore}% match
        </div>

        {/* Heart Favorite */}
        <button
          className="absolute top-3 right-3 z-10 transition-transform hover:scale-110"
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
        >
          <svg
            className={`w-7 h-7 drop-shadow-md transition-colors ${isFavorited ? 'text-[#FF5A5F] fill-[#FF5A5F]' : 'text-white/90 fill-transparent'}`}
            viewBox="0 0 32 32"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z" />
          </svg>
        </button>

        {/* Style Teleport Button */}
        <button
          className="absolute top-3 right-12 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0"
          onClick={(e) => {
            e.stopPropagation();
            setShowTeleportMenu(!showTeleportMenu);
          }}
        >
          <svg className="w-4 h-4 text-[#FF5A5F]" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        </button>

        {/* Teleport Menu */}
        {showTeleportMenu && (
          <div className="absolute top-12 right-3 bg-white rounded-xl shadow-2xl overflow-hidden text-xs w-44 z-30 animate-in slide-in-from-top-2 border">
            <div className="px-3 py-2 bg-gray-50 border-b font-bold text-[9px] text-gray-500 uppercase tracking-wider">
              Teleport Style To:
            </div>
            <div className="max-h-40 overflow-y-auto">
              {CITIES.filter((c) => c !== listing.city).map((c) => (
                <div
                  key={c}
                  className="px-4 py-2 hover:bg-[#FF5A5F] hover:text-white cursor-pointer font-medium transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTeleportMenu(false);
                    onStyleMigrate(listing.id, c);
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carousel Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {Array.from({ length: totalDots }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${
                i === activeDot ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveDot(i);
              }}
            />
          ))}
        </div>
      </div>

      {/* Card Info */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-[15px] text-[#222222] truncate">
                {listing.neighborhood}
              </h3>
              <span className="text-gray-400 text-[13px] flex-shrink-0">
                {listing.city}
              </span>
            </div>
            {propertyInfo ? (
              <p className="text-gray-500 text-[13px] truncate">{propertyInfo}</p>
            ) : (
              <p className="text-gray-500 text-[13px] truncate">
                {listing.description?.replace(/<\/?[^>]+(>|$)/g, '') || 'A stunning stay'}
              </p>
            )}
            {listing.reviews !== undefined && listing.reviews > 0 && (
              <p className="text-gray-400 text-[12px]">{listing.reviews} review{listing.reviews !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-semibold text-[15px]">{listing.price}</span>
          <span className="text-gray-500 text-[15px]">night</span>
        </div>
      </div>
    </a>
  );
};

export default ListingCard;
