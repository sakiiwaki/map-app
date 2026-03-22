import { useState, useCallback } from 'react';
import type { PlaceResult } from '@/app/api/proxy/places/route';

export type SearchFilters = {
  power_outlet?: boolean | null;
  wifi?: boolean | null;
  min_rating?: number | null;
};

type SearchState = {
  results: PlaceResult[];
  isLoading: boolean;
  error: string | null;
};

type UseSearchReturn = SearchState & {
  search: (query: string, lat?: number, lng?: number, filters?: SearchFilters) => Promise<void>;
  reset: () => void;
};

export function useSearch(): UseSearchReturn {
  const [state, setState] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
  });

  const search = useCallback(
    async (query: string, lat?: number, lng?: number, filters: SearchFilters = {}) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const params = new URLSearchParams({ q: query });
        if (lat != null) params.set('lat', String(lat));
        if (lng != null) params.set('lng', String(lng));

        const res = await fetch(`/api/proxy/places?${params}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? 'Search failed');
        }

        let data: { results: PlaceResult[] } = await res.json();

        // クライアントサイドでフィルタを適用（MCPサーバー未接続時のフォールバック）
        let results = data.results;
        if (filters.min_rating != null) {
          results = results.filter((p) => (p.rating ?? 0) >= (filters.min_rating ?? 0));
        }

        setState({ results, isLoading: false, error: null });
      } catch (err) {
        setState({ results: [], isLoading: false, error: String(err) });
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ results: [], isLoading: false, error: null });
  }, []);

  return { ...state, search, reset };
}
