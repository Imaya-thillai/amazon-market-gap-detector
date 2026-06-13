import React, { useState } from 'react';

export default function ProductTable({ products }) {
  const [sortField, setSortField] = useState('similarity_score');
  const [sortDir, setSortDir] = useState('desc');

  if (!products || products.length === 0) return null;

  const sorted = [...products].sort((a, b) => {
    const aVal = a[sortField] ?? 0;
    const bVal = b[sortField] ?? 0;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-[#4b5563] ml-1">↕</span>;
    return <span className="text-[#f59e0b] ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  const formatNumber = (n) => {
    if (n == null) return '—';
    return Number(n).toLocaleString();
  };

  const matchColor = (pct) => {
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#3b82f6';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const renderStars = (rating) => {
    if (rating == null) return '—';
    const r = Number(rating);
    const full = Math.floor(r);
    const hasHalf = r - full >= 0.25;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '★';
    if (hasHalf) stars += '½';
    return (
      <span className="text-[#f59e0b] whitespace-nowrap">
        {stars} <span className="text-[#9ca3af] text-xs ml-1">{r.toFixed(1)}</span>
      </span>
    );
  };

  return (
    <div className="rounded-xl bg-[#111827] border border-[#1f2937] overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2937]">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-semibold text-[#f9fafb]">Similar Products Found</h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/20">
            {products.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f2937] text-[#9ca3af]">
              <th className="px-4 py-3 text-left font-medium w-10">#</th>
              <th className="px-4 py-3 text-left font-medium w-14">Image</th>
              <th className="px-4 py-3 text-left font-medium min-w-[200px]">Title</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium cursor-pointer select-none hover:text-[#f9fafb]" onClick={() => toggleSort('price')}>
                Price <SortIcon field="price" />
              </th>
              <th className="px-4 py-3 text-right font-medium cursor-pointer select-none hover:text-[#f9fafb]" onClick={() => toggleSort('rating')}>
                Rating <SortIcon field="rating" />
              </th>
              <th className="px-4 py-3 text-right font-medium cursor-pointer select-none hover:text-[#f9fafb]" onClick={() => toggleSort('review_count')}>
                Reviews <SortIcon field="review_count" />
              </th>
              <th className="px-4 py-3 text-right font-medium cursor-pointer select-none hover:text-[#f9fafb]" onClick={() => toggleSort('similarity_score')}>
                Match <SortIcon field="similarity_score" />
              </th>
              <th className="px-4 py-3 text-center font-medium">Source</th>
              <th className="px-4 py-3 text-center font-medium w-14">Link</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((product, idx) => {
              const matchPct = Math.round(product.similarity_score ?? 0);
              const mc = matchColor(matchPct);
              return (
                <tr
                  key={idx}
                  className={`border-b border-[#1f2937]/50 transition-colors duration-150 hover:bg-[#1f2937]/40 ${
                    idx % 2 === 0 ? 'bg-transparent' : 'bg-[#0d1117]/30'
                  }`}
                >
                  {/* Rank */}
                  <td className="px-4 py-3 text-[#6b7280] font-mono text-xs">{idx + 1}</td>

                  {/* Image */}
                  <td className="px-4 py-3">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-[#1f2937]"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-lg bg-[#1f2937] items-center justify-center text-[#6b7280] ${product.image ? 'hidden' : 'flex'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </td>

                  {/* Title + Prime */}
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-[#f9fafb] font-medium line-clamp-2 leading-snug max-w-xs">
                        {product.title || 'Untitled Product'}
                      </span>
                      {product.is_prime && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/20 uppercase tracking-wide">
                          Prime
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-[#9ca3af] text-xs max-w-[140px] truncate">
                    {product.category || '—'}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-right font-mono text-[#f9fafb]">
                    {product.price != null ? `$${Number(product.price).toFixed(2)}` : '—'}
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3 text-right">{renderStars(product.rating)}</td>

                  {/* Reviews */}
                  <td className="px-4 py-3 text-right text-[#9ca3af] font-mono text-xs">
                    {formatNumber(product.review_count)}
                  </td>

                  {/* Match */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-[#1f2937] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${matchPct}%`, backgroundColor: mc }}
                        />
                      </div>
                      <span className="text-xs font-bold font-mono" style={{ color: mc }}>
                        {matchPct}%
                      </span>
                    </div>
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        product.source === 'live'
                          ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20'
                          : 'bg-[#6b7280]/15 text-[#9ca3af] border border-[#6b7280]/20'
                      }`}
                    >
                      {product.source === 'live' ? 'LIVE' : 'KAGGLE'}
                    </span>
                  </td>

                  {/* Link */}
                  <td className="px-4 py-3 text-center">
                    {product.url ? (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                        title="View on Amazon"
                      >
                        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-[#374151]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
