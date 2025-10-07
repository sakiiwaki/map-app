import { useEffect, useState } from 'react';
import { loadGoogleMapsApi } from '@/lib/google-maps';

type MapLoaderState = {
  google: typeof google | null;
  isLoaded: boolean;
  isError: boolean;
};

export function useMapLoader(): MapLoaderState {
  const [googleObj, setGoogleObj] = useState<typeof google | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window === 'undefined') return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ Google Maps API Key が設定されていません。');
      setIsError(true);
      return;
    }

    loadGoogleMapsApi()
      .then((google) => {
        setGoogleObj(google);
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('❌ Google Maps API の読み込みに失敗:', err);
        setIsError(true);
      });
  }, []);

  return { google: googleObj, isLoaded, isError };
}
