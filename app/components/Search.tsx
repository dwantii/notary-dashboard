"use client";

import { useState } from "react";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/search?q=" + encodeURIComponent(query));
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-md border border-gray-700 bg-black/30 px-3 py-2 text-white"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-600 bg-gray-800 px-4 py-2"
        >
          Search
        </button>
      </form>

      {loading && <div className="text-gray-400">Searching...</div>}

      <div className="flex flex-col gap-3">
        {results.length === 0 && !loading ? (
          <div className="text-gray-500">No results.</div>
        ) : (
          results.map((item, i) => (
            <div
              key={i}
              className="border border-gray-700 rounded-md p-3 bg-black/20"
            >
              <h3 className="font-bold text-white">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}