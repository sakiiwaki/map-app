'use client';

import type { Filters } from '@/features/filters/useFilters';

type Props = {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
};

type TriStateBooleanProps = {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
};

function TriStateBoolean({ label, value, onChange }: TriStateBooleanProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-700 w-28">{label}</span>
      <div className="flex gap-1">
        {(
          [
            { label: '指定なし', val: null },
            { label: 'あり', val: true },
            { label: 'なし', val: false },
          ] as { label: string; val: boolean | null }[]
        ).map(({ label: l, val }) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange(val)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              value === val
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
}: Props) {
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">フィルター</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-blue-600 hover:underline"
          >
            リセット
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <TriStateBoolean
          label="コンセント"
          value={filters.power_outlet}
          onChange={(v) => onFilterChange('power_outlet', v)}
        />
        <TriStateBoolean
          label="Wi-Fi"
          value={filters.wifi}
          onChange={(v) => onFilterChange('wifi', v)}
        />

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700 w-28">最低評価</span>
          <select
            value={filters.min_rating ?? ''}
            onChange={(e) =>
              onFilterChange('min_rating', e.target.value ? Number(e.target.value) : null)
            }
            className="text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">指定なし</option>
            <option value="3.0">3.0 以上</option>
            <option value="3.5">3.5 以上</option>
            <option value="4.0">4.0 以上</option>
            <option value="4.5">4.5 以上</option>
          </select>
        </div>
      </div>
    </div>
  );
}
