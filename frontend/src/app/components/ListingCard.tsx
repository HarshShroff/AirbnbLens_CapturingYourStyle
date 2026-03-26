'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Listing } from '../../lib/types';

interface ListingCardProps {
  listing: Listing;
  CITIES: string[];
  onStyleMigrate: (id: string, city: string) => void;
  onHover?: (listing: Listing | null) => void;
  isHighlighted?: boolean;
  isPriority?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800';

function formatProperty(listing: Listing): string {
  const parts: string[] = [];
  if (listing.property_type) parts.push(listing.property_type);
  if (listing.rating && listing.rating > 0) parts.push(`★ ${listing.rating.toFixed(2)}`);
  if (listing.bedrooms && listing.bedrooms > 0) parts.push(`${listing.bedrooms} bed${listing.bedrooms > 1 ? 's' : ''}`);
  if (listing.bathrooms) parts.push(listing.bathrooms);
  return parts.join(' · ');
}

const ListingCard = ({ listing, CITIES, onStyleMigrate, onHover, isHighlighted, isPriority = false }: ListingCardProps) => {
  const [showTeleportMenu, setShowTeleportMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const propertyInfo = formatProperty(listing);

  return (
    <a
      href={listing.listing_url || '#'}
      target={listing.listing_url ? '_blank' : undefined}
      rel={listing.listing_url ? 'noopener noreferrer' : undefined}
      className={`group relative flex flex-col gap-3 cursor-pointer transition-all duration-300 ${isHighlighted ? 'scale-[1.02]' : ''}`}
      onMouseEnter={() => onHover?.(listing)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-[#F5EDE6]"
        onMouseLeave={() => setShowTeleportMenu(false)}
      >
        <Image
          src={imgError ? FALLBACK_IMAGE : listing.picture_url}
          alt={listing.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgError(true)}
          loading={isPriority ? "eager" : "lazy"}
          priority={isPriority}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Rating Badge - Only show if real rating exists */}
        {listing.rating && listing.rating > 0 && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#1A1A1A] px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-sm">
            <svg className="w-3 h-3 text-[#FF5A5F]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {listing.rating.toFixed(1)}
          </div>
        )}

        {/* Heart Favorite */}
        <button
          className="absolute top-3 right-3 z-10 transition-transform hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
        >
          <svg
            className={`w-7 h-7 drop-shadow-md transition-all duration-200 ${isFavorited ? 'text-[#FF5A5F] fill-[#FF5A5F]' : 'text-white/90 fill-black/20 hover:fill-black/30'}`}
            viewBox="0 0 32 32"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z" />
          </svg>
        </button>

        {/* Style Teleport Button */}
        <button
          className="absolute top-3 right-12 z-10 w-7 h-7 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowTeleportMenu(!showTeleportMenu);
          }}
          title="Teleport style to another city"
        >
          <svg className="w-4 h-4 text-[#FF5A5F]" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        </button>

        {/* Teleport Menu */}
        {showTeleportMenu && (
          <div className="absolute top-12 right-3 bg-white rounded-xl shadow-2xl overflow-hidden text-xs w-44 z-30 animate-in slide-in-from-top-2 duration-200 border border-[#F5EDE6]">
            <div className="px-3 py-2 bg-[#FDF8F4] border-b border-[#F5EDE6] font-semibold text-[9px] text-[#6B7280] uppercase tracking-wider">
              Teleport Style To
            </div>
            <div className="max-h-40 overflow-y-auto">
              {CITIES.filter((c) => c !== listing.city).map((c) => (
                <div
                  key={c}
                  className="px-4 py-2.5 hover:bg-[#FF5A5F] hover:text-white cursor-pointer font-medium transition-colors text-[#1A1A1A]"
                  onClick={(e) => {
                    e.preventDefault();
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
      </div>

      {/* Card Info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-[15px] text-[#1A1A1A] truncate">
                {listing.neighborhood || listing.name}
              </h3>
              {listing.city && (
                <span className="text-[#6B7280] text-[13px] flex-shrink-0">
                  · {listing.city}
                </span>
              )}
            </div>
            {propertyInfo ? (
              <p className="text-[#6B7280] text-[13px] truncate mt-0.5">{propertyInfo}</p>
            ) : listing.description ? (
              <p className="text-[#6B7280] text-[13px] truncate mt-0.5">
                {listing.description.replace(/<\/?[^>]+(>|$)/g, '').slice(0, 60)}
              </p>
            ) : null}
            {listing.reviews !== undefined && listing.reviews > 0 && (
              <p className="text-[#9CA3AF] text-[12px] mt-0.5">
                {listing.reviews.toLocaleString()} review{listing.reviews !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-semibold text-[15px] text-[#1A1A1A]">{listing.price}</span>
          <span className="text-[#6B7280] text-[14px]">night</span>
        </div>
      </div>
    </a>
  );
};

export default ListingCard;
