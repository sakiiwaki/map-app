'use client';

import { useState } from 'react';

type Props = {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
};

export default function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = '場所を検索（例: サウナ、カフェ）...',
}: Props) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '検索中...' : '検索'}
      </button>
    </form>
  );
}
