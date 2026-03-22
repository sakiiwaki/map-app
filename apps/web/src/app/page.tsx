'use client';

import { useState, useCallback } from 'react';
import SearchBar from '@/components/ui/SearchBar';
import FilterPanel from '@/components/ui/FilterPanel';
import MapCanvas from '@/components/map/MapCanvas';
import { useSearch } from '@/features/search/useSearch';
import { useFilters } from '@/features/filters/useFilters';
import type { PlaceResult } from '@/app/api/proxy/places/route';

export default function Home() {
  const { results, isLoading, error, search } = useSearch();
  const { filters, setFilter, reset: resetFilters, hasActiveFilters, toQueryObject } = useFilters();
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [lastQuery, setLastQuery] = useState('');

  const handleSearch = useCallback(
    async (query: string) => {
      setLastQuery(query);
      setSelectedPlace(null);
      await search(query, undefined, undefined, toQueryObject() as Parameters<typeof search>[3]);
    },
    [search, toQueryObject],
  );

  const handleFilterChange = useCallback(
    async <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
      setFilter(key, value);
      // フィルタが変わったら再検索
      if (lastQuery) {
        const updatedFilters = { ...toQueryObject(), [key]: value };
        await search(lastQuery, undefined, undefined, updatedFilters as Parameters<typeof search>[3]);
      }
    },
    [setFilter, lastQuery, search, toQueryObject],
  );

  return (
    <section className="flex flex-col gap-4">
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={() => {
          resetFilters();
          if (lastQuery) search(lastQuery);
        }}
        hasActiveFilters={hasActiveFilters}
      />

      {error && <p className="text-red-500 text-sm">エラー: {error}</p>}

      <MapCanvas places={results} onMarkerClick={setSelectedPlace} />

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-500">{results.length} 件見つかりました</p>
          <ul className="flex flex-col gap-2">
            {results.map((place) => (
              <li
                key={place.place_id}
                onClick={() => setSelectedPlace(place)}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                  selectedPlace?.place_id === place.place_id
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{place.name}</p>
                    <p className="text-sm text-slate-500">{place.address}</p>
                  </div>
                  {place.rating != null && (
                    <span className="text-sm text-slate-600 whitespace-nowrap">
                      ⭐ {place.rating}
                      <span className="text-slate-400"> ({place.user_ratings_total})</span>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
