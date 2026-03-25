'use client';

import React, { useMemo } from 'react';
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
    width: 24px; height: 24px; border-radius: 50%;
    background: #FF5A5F; border: 2.5px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    transition: transform 0.2s;
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

const highlightedIcon = new L.DivIcon({
  className: 'vibe-marker-highlighted',
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    background: #FF5A5F; border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(255,90,95,0.3), 0 4px 12px rgba(0,0,0,0.3);
    transform: scale(1.2);
    transition: transform 0.2s;
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

interface VibeMapProps {
  listings: Listing[];
  highlightedId?: string | null;
}

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  React.useEffect(() => {
    const coords = listings
      .filter((l) => l.latitude && l.longitude && l.latitude !== 0)
      .map((l) => [l.latitude!, l.longitude!] as [number, number]);
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 13);
    } else {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
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
    <div className="w-full h-full relative">
      <MapContainer center={center} zoom={11} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds listings={geoListings} />
        {geoListings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.latitude!, listing.longitude!]}
            icon={highlightedId === listing.id ? highlightedIcon : vibeIcon}
          >
            <Popup>
              <div className="w-44">
                <img
                  src={listing.picture_url}
                  alt={listing.name}
                  className="w-full h-20 object-cover rounded-lg mb-1.5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400';
                  }}
                />
                <p className="font-semibold text-xs truncate">{listing.name}</p>
                <p className="text-[10px] text-gray-500">{listing.neighborhood}</p>
                <p className="text-xs font-bold mt-0.5">{listing.price} <span className="font-normal text-gray-400">night</span></p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {geoListings.length === 0 && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000]">
          <p className="text-gray-400 text-sm font-medium">No map data for these results</p>
        </div>
      )}
    </div>
  );
};

export default VibeMap;
