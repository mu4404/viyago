/**
 * @file TravelMap.tsx
 * @description OpenStreetMap + Leaflet 기반 무료 실제 지도 컴포넌트입니다.
 * Google Maps API 없이 장소 마커와 동선을 표시합니다.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Map, Navigation2, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { Activity } from './TravelPlanView';

interface GeocodedPlace {
  place: string;
  lat: number;
  lng: number;
}

interface TravelMapProps {
  activities: Activity[];
  destination: string;
}

const createNumberedIcon = (number: number, isFirst: boolean, isLast: boolean) => {
  const bg = isFirst ? '#6366f1' : isLast ? '#06b6d4' : '#1e293b';
  const border = isFirst ? '#a5b4fc' : isLast ? '#67e8f9' : '#94a3b8';

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        width: 28px; height: 28px; border-radius: 50%;
        background: ${bg}; border: 2px solid ${border};
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 12px; font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      ">${number}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
};

const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [40, 40], maxZoom: 15 });
  }, [map, positions]);

  return null;
};

export const TravelMap: React.FC<TravelMapProps> = ({ activities, destination }) => {
  const [geocoded, setGeocoded] = useState<GeocodedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const spots = useMemo(
    () => activities.filter((act) => act.type !== 'transport'),
    [activities],
  );

  const spotInputs = useMemo(
    () =>
      spots.map((s) => ({
        place: s.place,
        placeEn: s.placeEn,
      })),
    [spots],
  );

  useEffect(() => {
    if (spotInputs.length === 0) {
      setGeocoded([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchGeocoding = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:5001/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ places: spotInputs, destination }),
        });

        if (!response.ok) {
          throw new Error('Geocoding API failed');
        }

        const data = await response.json();
        if (!cancelled) {
          setGeocoded(data.results ?? []);
        }
      } catch (err) {
        console.warn('TravelMap geocoding failed:', err);
        if (!cancelled) {
          setError('지도 좌표를 불러오지 못했습니다.');
          setGeocoded([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchGeocoding();
    return () => { cancelled = true; };
  }, [spotInputs, destination]);

  const markers = useMemo(() => {
    return spots
      .map((spot, idx) => {
        const coord = geocoded.find((g) => g.place === spot.place);
        if (!coord) return null;
        return { spot, idx, lat: coord.lat, lng: coord.lng };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [spots, geocoded]);

  const positions: [number, number][] = markers.map((m) => [m.lat, m.lng]);
  const defaultCenter: [number, number] = positions[0] ?? [37.5665, 126.978];

  return (
    <div className="p-6 rounded-3xl glassmorphism border border-cyan-500/10 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Map className="w-5 h-5 text-cyan-400" />
          실시간 동선 지도
        </h3>
        <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-full flex items-center">
          <Navigation2 className="w-3 h-3 mr-1" /> {destination}
        </span>
      </div>

      <div className="relative w-full h-[260px] md:h-[320px] rounded-2xl bg-slate-950/70 border border-slate-800/60 overflow-hidden shadow-inner">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-sm">장소 좌표를 찾는 중...</span>
          </div>
        ) : spots.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            표시할 이동 장소가 없습니다.
          </div>
        ) : markers.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-500 text-sm px-4 text-center">
            <span>{error ?? '장소를 지도에서 찾지 못했습니다.'}</span>
            <span className="text-xs text-gray-600">AI가 실제 장소명을 생성하면 표시됩니다.</span>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={13}
            className="w-full h-full rounded-2xl z-0"
            scrollWheelZoom={false}
            attributionControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            />
            <FitBounds positions={positions} />
            {positions.length > 1 && (
              <Polyline
                positions={positions}
                pathOptions={{
                  color: '#22d3ee',
                  weight: 3,
                  opacity: 0.7,
                  dashArray: '8, 8',
                }}
              />
            )}
            {markers.map((marker, i) => (
              <Marker
                key={`${marker.spot.place}-${i}`}
                position={[marker.lat, marker.lng]}
                icon={createNumberedIcon(
                  marker.idx + 1,
                  i === 0,
                  i === markers.length - 1,
                )}
              >
                <Popup>
                  <strong>{marker.spot.place}</strong>
                  <br />
                  <span style={{ fontSize: '12px' }}>{marker.spot.time}</span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {!isLoading && markers.length > 0 && (
        <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
          <span>
            {markers.length}/{spots.length}개 장소 표시
          </span>
          <span className="text-gray-600">OpenStreetMap · 무료</span>
        </div>
      )}
    </div>
  );
};
