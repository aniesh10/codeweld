"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // This function runs when the user submits a search
  const handleSearch = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    if (!query) return;

    setIsLoading(true);
    setResults([]); // Clear old results

    try {
      // Send the text to our hidden Matchmaker API
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchQuery: query }),
      });

      const data = await response.json();
      
      if (data.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-3xl mx-auto mt-20">
        
        {/* The Header */}
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Needle.</h1>
        <p className="text-gray-500 mb-8 text-lg">
          Describe your problem. Find the right open-source tool.
        </p>

        {/* The Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-4 mb-12">
          <input
            type="text"
            className="flex-1 p-4 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="e.g., I need a fast way to watermark images..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-black text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-all"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* The Results Area */}
        <div className="space-y-6">
          {results.map((project, index) => (
            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <a 
                  href={project.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xl font-semibold text-blue-600 hover:underline"
                >
                  {project.name}
                </a>
                <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full font-medium">
                  ⭐ {project.stars}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {project.description}
              </p>
            </div>
          ))}
          
          {/* Message if a search finished but found nothing */}
          {results.length === 0 && !isLoading && query && (
            <p className="text-gray-500 text-center mt-12">No results found for that query.</p>
          )}
        </div>

      </div>
    </main>
  );
}