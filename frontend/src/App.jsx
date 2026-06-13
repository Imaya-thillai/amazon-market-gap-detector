import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import LoadingSpinner from './components/LoadingSpinner';
import ScoreCard from './components/ScoreCard';
import ProductTable from './components/ProductTable';
import SentimentCard from './components/SentimentCard';
import RecommendationBadge from './components/RecommendationBadge';
import InsightCard from './components/InsightCard';
import DataSourceBadge from './components/DataSourceBadge';

const DEFAULT_SAMPLES = [
  'Ergonomic laptop stand',
  'Portable blender for smoothies',
  'Smart home doorbell camera',
  'Eco-friendly yoga mat',
  'Wireless earbuds for running',
];

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [samples, setSamples] = useState(DEFAULT_SAMPLES);

  // Try fetching sample queries from API
  useEffect(() => {
    axios
      .get('/api/sample-queries')
      .then((res) => {
        if (res.data && Array.isArray(res.data.queries) && res.data.queries.length > 0) {
          setSamples(res.data.queries.slice(0, 5));
        }
      })
      .catch(() => {
        // keep defaults
      });
  }, []);

  const handleAnalyze = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 3) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await axios.post('/api/analyze', { product_idea: trimmed });
      setResults(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        'An unexpected error occurred. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = (sample) => {
    setQuery(sample);
    setResults(null);
    setError(null);
    // Auto-trigger with a small delay so query state updates
    setTimeout(() => {
      setLoading(true);
      setError(null);
      setResults(null);
      axios
        .post('/api/analyze', { product_idea: sample })
        .then((res) => setResults(res.data))
        .catch((err) => {
          const msg =
            err.response?.data?.detail ||
            err.response?.data?.error ||
            err.message ||
            'An unexpected error occurred.';
          setError(msg);
        })
        .finally(() => setLoading(false));
    }, 50);
  };

  const r = results; // shorthand

  return (
    <div className="min-h-screen flex flex-col font-inter">
      {/* Loading Overlay */}
      {loading && <LoadingSpinner />}

      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-40 glass-strong">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🔍</span>
            <span className="text-lg font-bold text-[#f9fafb] group-hover:text-[#f59e0b] transition-colors">
              MarketGap
            </span>
          </a>

          {/* Tagline */}
          <p className="hidden md:block text-sm text-[#9ca3af]">
            Discover market gaps before your competitors
          </p>

          {/* GitHub */}
          <a
            href="https://github.com/Imaya-thillai/amazon-market-gap-detector"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9ca3af] hover:text-[#f9fafb] transition-colors"
            title="GitHub"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </a>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="gradient-hero pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#f9fafb] mb-4 animate-fade-in leading-tight">
            Find Your{' '}
            <span className="text-gradient-amber">Market Opportunity</span>
          </h1>

          {/* Subheading */}
          <p
            className="text-lg sm:text-xl text-[#9ca3af] max-w-2xl mx-auto mb-10 animate-fade-in leading-relaxed"
            style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
          >
            Enter a product idea and our AI will analyze the Amazon marketplace to find gaps and opportunities
          </p>

          {/* Search Bar */}
          <SearchBar query={query} setQuery={setQuery} onAnalyze={handleAnalyze} loading={loading} />

          {/* Sample Queries */}
          <div
            className="mt-8 flex flex-wrap justify-center gap-2 animate-fade-in"
            style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
          >
            <span className="text-xs text-[#6b7280] mr-1 self-center">Try:</span>
            {samples.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSampleClick(s)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full text-xs font-medium
                  bg-[#1f2937] text-[#d1d5db] border border-[#374151]
                  hover:bg-[#374151] hover:text-[#f9fafb] hover:border-[#4b5563]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Error ─── */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 animate-slide-down">
          <div className="rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 p-5 flex items-start gap-3">
            <svg className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-[#ef4444] mb-1">Analysis Failed</h4>
              <p className="text-sm text-[#fca5a5]">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-[#ef4444] hover:text-[#fca5a5]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ─── Results Dashboard ─── */}
      {r && (
        <section className="flex-1 py-10">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 space-y-8">
            {/* Data Source + Recommendation */}
            <div className="space-y-4 animate-slide-up">
              <DataSourceBadge
                dataSource={r.data_source}
                analysisTime={r.analysis_time_ms}
                reviewsFetched={r.sentiment?.total}
              />
              <RecommendationBadge recommendation={r.recommendation} />
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ScoreCard
                title="Competition"
                score={r.scores?.competition ?? 0}
                description="Measures market saturation based on number of similar products, reviews, and established brands."
                type="competition"
              />
              <ScoreCard
                title="Demand"
                score={r.scores?.demand ?? 0}
                description="Estimates consumer interest through search trends, review velocity, and price range analysis."
                type="demand"
              />
              <ScoreCard
                title="Opportunity"
                score={r.scores?.opportunity ?? 0}
                description="Combined metric balancing demand potential against competitive pressure in the market."
                type="opportunity"
              />
            </div>

            {/* Sentiment + Insight side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SentimentCard sentiment={r.sentiment} />
              <InsightCard insight={r.market_insight} recommendation={r.recommendation} />
            </div>

            {/* Product Table */}
            <ProductTable products={r.similar_products} />
          </div>
        </section>
      )}

      {/* ─── Empty State ─── */}
      {!r && !loading && !error && (
        <section className="flex-1 flex items-center justify-center py-20">
          <div className="text-center animate-fade-in max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#111827] border border-[#1f2937] flex items-center justify-center">
              <svg className="w-10 h-10 text-[#374151]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#6b7280] mb-2">No Analysis Yet</h3>
            <p className="text-sm text-[#4b5563]">
              Enter a product idea above to discover market gaps and opportunities on Amazon
            </p>
          </div>
        </section>
      )}

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#1f2937] py-6 mt-auto">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 text-center">
          <p className="text-xs text-[#6b7280]">
            Built by{' '}
            <span className="text-[#9ca3af] font-medium">Imaya Thillai S</span>
            {' & '}
            <span className="text-[#9ca3af] font-medium">Jeffrey Ryan R</span>
            {' | '}
            <span className="text-[#f59e0b]">Amazon Market Gap Detector</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
