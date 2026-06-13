import React, { useState, useEffect, useRef } from 'react';

export default function LoadingSpinner() {
  const messages = [
    'Searching Amazon marketplace...',
    'Fetching live product data...',
    'Running ML similarity analysis...',
    'Analyzing customer sentiment...',
    'Computing market scores...',
    'Generating insights...',
  ];

  const [msgIndex, setMsgIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0f1e]/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-[#1f2937]" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#f59e0b] border-r-[#f59e0b] animate-spin-slow" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#3b82f6] animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '1.8s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🔍</span>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p
            key={msgIndex}
            className="text-lg font-medium text-[#f9fafb] animate-fade-in"
          >
            {messages[msgIndex]}
          </p>
          <p className="mt-2 text-sm text-[#9ca3af]">This usually takes 10–30 seconds</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {messages.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= msgIndex ? 'bg-[#f59e0b] scale-100' : 'bg-[#374151] scale-75'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
