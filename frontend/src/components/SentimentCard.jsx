import React, { useState, useEffect } from 'react';

export default function SentimentCard({ sentiment }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!sentiment) return null;

  const { positive = 0, neutral = 0, negative = 0, total = 0, overall_sentiment = 'neutral', avg_compound = 0, sentiment_ratio = 0 } = sentiment;

  const posPct = total > 0 ? (positive / total) * 100 : 33.3;
  const neuPct = total > 0 ? (neutral / total) * 100 : 33.3;
  const negPct = total > 0 ? (negative / total) * 100 : 33.4;

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  const posLen = (posPct / 100) * circumference;
  const neuLen = (neuPct / 100) * circumference;
  const negLen = (negPct / 100) * circumference;

  const posOffset = 0;
  const neuOffset = posLen;
  const negOffset = posLen + neuLen;

  const sentimentColor = {
    positive: '#10b981',
    neutral: '#6b7280',
    negative: '#ef4444',
    mixed: '#f59e0b',
  };

  const overallColor = sentimentColor[overall_sentiment.toLowerCase()] || '#6b7280';

  const compoundColor = avg_compound > 0.2 ? '#10b981' : avg_compound < -0.2 ? '#ef4444' : '#f59e0b';

  return (
    <div className="rounded-xl bg-[#111827] border border-[#1f2937] p-6 animate-scale-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <svg className="w-5 h-5 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-[#f9fafb]">Customer Sentiment</h3>
      </div>

      <div className="flex flex-col items-center gap-5">
        {/* Donut Chart */}
        <div className="relative w-40 h-40">
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
            {/* Background */}
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="10" />

            {/* Positive segment */}
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeLinecap="butt"
              strokeDasharray={animated ? `${posLen} ${circumference - posLen}` : `0 ${circumference}`}
              strokeDashoffset={0}
              className="transition-all duration-1000 ease-out"
              style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.3))' }}
            />

            {/* Neutral segment */}
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke="#6b7280"
              strokeWidth="10"
              strokeLinecap="butt"
              strokeDasharray={animated ? `${neuLen} ${circumference - neuLen}` : `0 ${circumference}`}
              strokeDashoffset={animated ? -neuOffset : 0}
              className="transition-all duration-1000 ease-out"
              style={{ transitionDelay: '0.2s' }}
            />

            {/* Negative segment */}
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke="#ef4444"
              strokeWidth="10"
              strokeLinecap="butt"
              strokeDasharray={animated ? `${negLen} ${circumference - negLen}` : `0 ${circumference}`}
              strokeDashoffset={animated ? -negOffset : 0}
              className="transition-all duration-1000 ease-out"
              style={{ transitionDelay: '0.4s', filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.3))' }}
            />
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-[#f9fafb]">{total}</span>
            <span className="text-[10px] text-[#9ca3af] uppercase tracking-wide">reviews</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 flex-wrap justify-center">
          {[
            { label: 'Positive', count: positive, pct: posPct, color: '#10b981' },
            { label: 'Neutral', count: neutral, pct: neuPct, color: '#6b7280' },
            { label: 'Negative', count: negative, pct: negPct, color: '#ef4444' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="text-xs">
                <span className="text-[#f9fafb] font-medium">{item.label}</span>
                <span className="text-[#9ca3af] ml-1">
                  {item.count} ({item.pct.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="w-full grid grid-cols-2 gap-3 mt-2">
          {/* Overall sentiment */}
          <div className="rounded-lg bg-[#0a0f1e] p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">Overall</p>
            <p className="text-sm font-bold capitalize" style={{ color: overallColor }}>
              {overall_sentiment}
            </p>
          </div>

          {/* Compound score */}
          <div className="rounded-lg bg-[#0a0f1e] p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">Compound</p>
            <p className="text-sm font-bold font-mono" style={{ color: compoundColor }}>
              {Number(avg_compound).toFixed(3)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
