import React from 'react';

const descriptions = {
  LAUNCH: 'The market shows strong potential. Consider entering with a differentiated product.',
  RISKY: 'The market has moderate competition. Proceed with caution and a unique value proposition.',
  AVOID: 'The market is highly saturated. Consider a different product category.',
};

const colorMap = {
  green: {
    bg: 'from-[#10b981]/20 to-[#059669]/10',
    border: 'border-[#10b981]/30',
    text: '#10b981',
    glow: '0 0 40px rgba(16,185,129,0.15)',
  },
  yellow: {
    bg: 'from-[#f59e0b]/20 to-[#d97706]/10',
    border: 'border-[#f59e0b]/30',
    text: '#f59e0b',
    glow: '0 0 40px rgba(245,158,11,0.15)',
  },
  red: {
    bg: 'from-[#ef4444]/20 to-[#dc2626]/10',
    border: 'border-[#ef4444]/30',
    text: '#ef4444',
    glow: '0 0 40px rgba(239,68,68,0.15)',
  },
};

export default function RecommendationBadge({ recommendation }) {
  if (!recommendation) return null;

  const { label = 'ANALYZE', code = 'RISKY', color = 'yellow', emoji = '⚡' } = recommendation;
  const palette = colorMap[color] || colorMap.yellow;
  const desc = descriptions[code] || descriptions.RISKY;

  return (
    <div
      className={`w-full rounded-xl bg-gradient-to-r ${palette.bg} border ${palette.border} p-6 animate-banner`}
      style={{ boxShadow: palette.glow }}
    >
      <div className="flex items-center gap-4">
        {/* Emoji */}
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: `${palette.text}15` }}
        >
          {emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3
              className="text-xl font-bold uppercase tracking-wide"
              style={{ color: palette.text }}
            >
              {label}
            </h3>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${palette.text}20`,
                color: palette.text,
                border: `1px solid ${palette.text}30`,
              }}
            >
              {code}
            </span>
          </div>
          <p className="text-sm text-[#d1d5db] leading-relaxed">{desc}</p>
        </div>

        {/* Decorative icon */}
        <div className="hidden sm:block flex-shrink-0" style={{ color: `${palette.text}40` }}>
          {code === 'LAUNCH' && (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          )}
          {code === 'RISKY' && (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {code === 'AVOID' && (
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
