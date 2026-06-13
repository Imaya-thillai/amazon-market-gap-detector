import React, { useState, useEffect } from 'react';

export default function ScoreCard({ title, score, description, type }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const end = Math.round(score);
    if (end <= 0) {
      setAnimatedScore(0);
      return;
    }
    let start = 0;
    const duration = 1200;
    const stepTime = Math.max(Math.floor(duration / end), 15);
    const timer = setInterval(() => {
      start += 1;
      setAnimatedScore(start);
      if (start >= end) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [score]);

  const getColor = (val) => {
    if (type === 'competition') {
      if (val > 65) return { ring: '#ef4444', glow: 'rgba(239,68,68,0.15)', label: 'High', bg: 'rgba(239,68,68,0.08)' };
      if (val >= 40) return { ring: '#f59e0b', glow: 'rgba(245,158,11,0.15)', label: 'Medium', bg: 'rgba(245,158,11,0.08)' };
      return { ring: '#10b981', glow: 'rgba(16,185,129,0.15)', label: 'Low', bg: 'rgba(16,185,129,0.08)' };
    }
    // demand & opportunity
    if (val > 65) return { ring: '#10b981', glow: 'rgba(16,185,129,0.15)', label: 'High', bg: 'rgba(16,185,129,0.08)' };
    if (val >= 40) return { ring: '#f59e0b', glow: 'rgba(245,158,11,0.15)', label: 'Medium', bg: 'rgba(245,158,11,0.08)' };
    return { ring: '#ef4444', glow: 'rgba(239,68,68,0.15)', label: 'Low', bg: 'rgba(239,68,68,0.08)' };
  };

  const color = getColor(score);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const icons = {
    competition: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    demand: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    opportunity: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  };

  return (
    <div
      className="relative rounded-xl p-6 animate-scale-in card-hover"
      style={{
        background: `linear-gradient(135deg, ${color.bg}, #111827)`,
        border: `1px solid ${color.ring}22`,
        boxShadow: `0 0 30px ${color.glow}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: color.ring }}>{icons[type]}</span>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#9ca3af]">{title}</h3>
      </div>

      {/* Ring + Score */}
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={color.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-100 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${color.glow})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-[#f9fafb]">{animatedScore}</span>
            <span className="text-xs font-medium" style={{ color: color.ring }}>{color.label}</span>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#9ca3af] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
