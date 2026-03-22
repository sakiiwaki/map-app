'use client';

import { useEffect, useRef } from 'react';
import { useMapLoader } from '@/features/map/useMapLoader';
import type { PlaceResult } from '@/app/api/proxy/places/route';

type Props = {
  places?: PlaceResult[];
  onMarkerClick?: (place: PlaceResult) => void;
};

export default function MapCanvas({ places = [], onMarkerClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const { google, isLoaded, isError } = useMapLoader();

  // マップの初期化
  useEffect(() => {
    if (!isLoaded || !google || !mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: { lat: 35.681236, lng: 139.767125 }, // 東京駅
      zoom: 14,
    });
  }, [isLoaded, google]);

  // 検索結果のマーカーを更新
  useEffect(() => {
    if (!mapInstanceRef.current || !google) return;

    // 既存マーカーを削除
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (places.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    places.forEach((place) => {
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: mapInstanceRef.current!,
        title: place.name,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="max-width:200px">
            <strong>${place.name}</strong><br/>
            <span style="color:#666;font-size:0.85em">${place.address}</span><br/>
            ${place.rating != null ? `⭐ ${place.rating} (${place.user_ratings_total ?? 0}件)` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        onMarkerClick?.(place);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: place.lat, lng: place.lng });
    });

    mapInstanceRef.current.fitBounds(bounds);
  }, [places, google, onMarkerClick]);

  if (isError) {
    return <p className="text-red-500">地図の読み込みに失敗しました。</p>;
  }

  if (!isLoaded) {
    return <p className="text-gray-500">地図を読み込み中...</p>;
  }

  return <div ref={mapRef} className="w-full h-96 border rounded-lg shadow" />;
}
