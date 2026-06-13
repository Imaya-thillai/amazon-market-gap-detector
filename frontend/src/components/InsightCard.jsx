import React from 'react';

export default function InsightCard({ insight, recommendation }) {
  if (!insight) return null;

  const accentColors = {
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
  };

  const accent = accentColors[recommendation?.color] || '#3b82f6';

  return (
    <div
      className="rounded-xl bg-[#111827] border border-[#1f2937] p-6 animate-slide-up"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: accent,
        animationDelay: '0.4s',
        animationFillMode: 'both',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🧠</span>
        <h3 className="text-lg font-semibold text-[#f9fafb]">AI Market Insight</h3>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {insight.split('\n').filter(Boolean).map((paragraph, idx) => (
          <p key={idx} className="text-sm text-[#d1d5db] leading-relaxed">
            {paragraph.startsWith('- ') || paragraph.startsWith('• ') ? (
              <span className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                <span>{paragraph.replace(/^[-•]\s*/, '')}</span>
              </span>
            ) : (
              paragraph
            )}
          </p>
        ))}
      </div>

      {/* Decorative bottom bar */}
      <div className="mt-5 pt-4 border-t border-[#1f2937]">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#6b7280]">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Powered by ML-driven analysis</span>
        </div>
      </div>
    </div>
  );
}
