'use client';

import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Listing } from '../../lib/types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const vibeIcon = new L.DivIcon({
  className: 'vibe-marker',
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, #FF5A5F 0%, #E04E52 100%);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    transition: all 0.2s ease;
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

const highlightedIcon = new L.DivIcon({
  className: 'vibe-marker-highlighted',
  html: `<div style="
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #FF5A5F 0%, #E04E52 100%);
    border: 3.5px solid white;
    box-shadow: 0 0 0 5px rgba(255,90,95,0.25), 0 4px 16px rgba(0,0,0,0.3);
    transform: scale(1.1);
    transition: all 0.2s ease;
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

interface VibeMapProps {
  listings: Listing[];
  highlightedId?: string | null;
}

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    const coords = listings
      .filter((l) => l.latitude && l.longitude && l.latitude !== 0)
      .map((l) => [l.latitude!, l.longitude!] as [number, number]);
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 13);
    } else {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [listings, map]);
  return null;
}

const VibeMap = ({ listings, highlightedId }: VibeMapProps) => {
  const geoListings = useMemo(
    () => listings.filter((l) => l.latitude && l.longitude && l.latitude !== 0),
    [listings]
  );

  const center: [number, number] = geoListings.length > 0
    ? [geoListings[0].latitude!, geoListings[0].longitude!]
    : [39.8283, -98.5795];

  return (
    <div className="w-full h-full relative bg-[#F5EDE6]">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        {/* Carto Positron - Modern, clean map style */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds listings={geoListings} />
        {geoListings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.latitude!, listing.longitude!]}
            icon={highlightedId === listing.id ? highlightedIcon : vibeIcon}
          >
            <Popup>
              <div className="w-48 font-body">
                <div className="relative w-full h-24 rounded-lg overflow-hidden mb-2 bg-[#F5EDE6]">
                  {/* Using standard img since Leaflet popups don't support Next Image well */}
                  <img
                    src={listing.picture_url}
                    alt={listing.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400';
                    }}
                  />
                </div>
                <p className="font-semibold text-sm text-[#1A1A1A] truncate">{listing.name}</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">{listing.neighborhood}</p>
                {listing.rating && listing.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-3 h-3 text-[#FF5A5F]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[11px] font-medium text-[#1A1A1A]">{listing.rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-baseline gap-1 mt-2 pt-2 border-t border-[#D4A574]/20">
                  <span className="text-sm font-bold text-[#1A1A1A]">{listing.price}</span>
                  <span className="text-[11px] text-[#6B7280]">night</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Empty State */}
      {geoListings.length === 0 && (
        <div className="absolute inset-0 bg-[#FDF8F4]/90 backdrop-blur-sm flex flex-col items-center justify-center z-[1000]">
          <div className="w-16 h-16 rounded-full bg-[#F5EDE6] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#D4A574]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-[#6B7280] text-sm font-medium">No location data available</p>
          <p className="text-[#9CA3AF] text-xs mt-1">Try a different search</p>
        </div>
      )}
    </div>
  );
};

export default VibeMap;
