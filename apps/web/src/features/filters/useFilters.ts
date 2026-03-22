import { useState, useCallback } from 'react';

export type Filters = {
  power_outlet: boolean | null;
  wifi: boolean | null;
  min_rating: number | null;
};

const DEFAULT_FILTERS: Filters = {
  power_outlet: null,
  wifi: null,
  min_rating: null,
};

type UseFiltersReturn = {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  reset: () => void;
  hasActiveFilters: boolean;
  toQueryObject: () => Record<string, string | boolean | number>;
};

export function useFilters(): UseFiltersReturn {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters =
    filters.power_outlet !== null ||
    filters.wifi !== null ||
    filters.min_rating !== null;

  const toQueryObject = useCallback(() => {
    const obj: Record<string, string | boolean | number> = {};
    if (filters.power_outlet !== null) obj['power_outlet'] = filters.power_outlet;
    if (filters.wifi !== null) obj['wifi'] = filters.wifi;
    if (filters.min_rating !== null) obj['min_rating'] = filters.min_rating;
    return obj;
  }, [filters]);

  return { filters, setFilter, reset, hasActiveFilters, toQueryObject };
}
