import React from 'react';

export default function SearchBar({ query, setQuery, onAnalyze, loading }) {
  const minLen = 3;
  const maxLen = 200;
  const isValid = query.trim().length >= minLen && query.length <= maxLen;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isValid && !loading) {
      onAnalyze();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
      <div className="glass rounded-2xl p-2 transition-all duration-300 focus-within:border-[#f59e0b]/40 focus-within:shadow-[0_0_30px_rgba(245,158,11,0.12)] animate-pulse-glow">
        <div className="flex items-center gap-2">
          {/* Search icon */}
          <div className="pl-4 text-[#9ca3af]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, maxLen))}
            onKeyDown={handleKeyDown}
            placeholder="Enter a product idea..."
            disabled={loading}
            className="flex-1 min-w-0 bg-transparent text-[#f9fafb] text-base sm:text-lg placeholder-[#6b7280] outline-none py-2 sm:py-3 px-2 disabled:opacity-50"
            autoFocus
          />

          {/* Analyze button */}
          <button
            onClick={onAnalyze}
            disabled={!isValid || loading}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold text-sm transition-all duration-300
              disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0
              bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-[#0a0f1e]
              hover:from-[#fbbf24] hover:to-[#f59e0b] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]
              active:scale-95"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="hidden sm:inline">Analyzing...</span>
                <span className="sm:hidden">Wait...</span>
              </>
            ) : (
              <>
                <span>Analyze <span className="hidden sm:inline">Market</span></span>
                <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Character count */}
      <div className="flex justify-between items-center mt-2 px-2">
        <p className="text-xs text-[#6b7280]">
          {query.trim().length < minLen && query.length > 0 && (
            <span className="text-[#ef4444]">Minimum {minLen} characters required</span>
          )}
        </p>
        <p className={`text-xs ${query.length > maxLen * 0.9 ? 'text-[#f59e0b]' : 'text-[#6b7280]'}`}>
          {query.length}/{maxLen}
        </p>
      </div>
    </div>
  );
}
