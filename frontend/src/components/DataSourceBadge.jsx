import React from 'react';

export default function DataSourceBadge({ dataSource, analysisTime, reviewsFetched }) {
  const isLive = dataSource === 'live';

  return (
    <div className="flex flex-wrap items-center gap-3 animate-fade-in">
      {/* Source badge */}
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          isLive
            ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'
            : 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#10b981]' : 'bg-[#f59e0b]'} animate-pulse`} />
        {isLive ? 'Live Amazon Data' : 'Historical Dataset (API quota reached)'}
      </span>

      {/* Analysis time */}
      {analysisTime != null && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {analysisTime.toFixed(0)}ms
        </span>
      )}

      {/* Reviews fetched */}
      {reviewsFetched != null && reviewsFetched > 0 && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {reviewsFetched} reviews analyzed
        </span>
      )}
    </div>
  );
}
