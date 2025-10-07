'use client';

import { useEffect, useRef } from 'react';
import { useMapLoader } from '@/features/map/useMapLoader';

export default function MapCanvas() {
  const mapRef = useRef<HTMLDivElement>(null);
  const { google, isLoaded, isError } = useMapLoader();

  useEffect(() => {
    if (!isLoaded || !google || !mapRef.current) return;

    new google.maps.Map(mapRef.current, {
      center: { lat: 35.68, lng: 139.76 }, // 東京駅
      zoom: 14,
    });
  }, [isLoaded, google]);

  if (isError) {
    return <p className="text-red-500">地図の読み込みに失敗しました。</p>;
  }

  if (!isLoaded) {
    return <p className="text-gray-500">地図を読み込み中...</p>;
  }

  return <div ref={mapRef} className="w-full h-96 border rounded-lg shadow" />;
}
