# 🔍 Amazon Market Gap Detector

> **"Discover market gaps before your competitors"**

## Overview

The Amazon Market Gap Detector is an AI-powered market intelligence platform that helps entrepreneurs and Amazon sellers identify untapped product opportunities. By combining real-time Amazon marketplace data with advanced machine learning techniques, the system analyzes product competition, consumer demand, and market sentiment to deliver actionable business insights.

The platform implements a sophisticated 3-layer data strategy: it first queries live Amazon product listings and reviews through the Real-Time Amazon Data API, then enriches analysis with a pre-loaded Kaggle dataset of 42,000+ Amazon products, and seamlessly falls back to historical data when API quotas are exceeded — ensuring uninterrupted service at all times.

## 👥 Team

- **Imaya Thillai S**
- **Jeffrey Ryan R**

## 📊 Data Sources

| Layer | Source | Purpose |
|-------|--------|---------|
| **Live** | [Real-Time Amazon Data API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data/) (RapidAPI by letscrape) | Real-time product search, pricing, ratings, and customer reviews |
| **Base** | [Amazon Products Sales Dataset](https://www.kaggle.com/datasets/ikramshah512/amazon-products-sales-dataset-42k-items-2025) (Kaggle, 42K+ items) | ML model pre-training, TF-IDF vectorization, embedding generation |
| **Fallback** | Auto-switch to Kaggle dataset | Transparent failover when API quota is exceeded or network errors occur |

## 🤖 ML Techniques Used

- **Sentence Transformers** (`all-MiniLM-L6-v2`) — Semantic similarity using dense vector embeddings for understanding product meaning beyond keywords
- **TF-IDF Vectorization** — Term Frequency-Inverse Document Frequency for keyword-level matching and relevance scoring
- **Hybrid Similarity** — 70% semantic similarity + 30% TF-IDF similarity for robust product matching
- **VADER Sentiment Analysis** — Lexicon and rule-based sentiment analysis on real Amazon customer reviews
- **Multi-Factor Weighted Scoring** — Custom scoring algorithms for competition (35% competitors + 35% reviews + 30% ratings), demand (40% reviews + 35% ratings + 25% volume), and opportunity assessment

## 🛠️ Tech Stack

### Backend
- **Runtime**: Python 3.11
- **Framework**: FastAPI + Uvicorn
- **ML Libraries**: scikit-learn, sentence-transformers, VADER Sentiment
- **Data Processing**: pandas, numpy
- **HTTP Client**: requests, httpx
- **Configuration**: python-dotenv, pydantic

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS v3
- **HTTP Client**: Axios
- **Design**: Custom dark theme with glassmorphism effects

### Deployment
- **Backend**: Render (render.yaml)
- **Frontend**: Vercel (vercel.json)

## 🚀 Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- RapidAPI account (free tier available) — subscribe to [Real-Time Amazon Data](https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data/) by letscrape
- Kaggle dataset: [Amazon Products Sales Dataset](https://www.kaggle.com/datasets/ikramshah512/amazon-products-sales-dataset-42k-items-2025) → Download and save as `backend/data/amazon_products.csv`

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your RAPIDAPI_KEY
uvicorn main:app --reload
```

The backend will start at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173` with API proxy to the backend.

## 📡 API Endpoints

### `POST /api/analyze`

Analyze a product idea and return market intelligence.

**Request:**
```json
{
  "product_idea": "Portable Smart Security Camera"
}
```

**Response:**
```json
{
  "query": "Portable Smart Security Camera",
  "data_source": "live",
  "similar_products": [...],
  "scores": {
    "competition": 62.5,
    "demand": 71.3,
    "opportunity": 59.8
  },
  "sentiment": {
    "positive": 18,
    "neutral": 5,
    "negative": 2,
    "total": 25,
    "overall_sentiment": "Positive",
    "avg_compound": 0.72,
    "sentiment_ratio": 0.72
  },
  "recommendation": {
    "label": "Moderate Opportunity",
    "code": "RISKY",
    "color": "yellow",
    "emoji": "⚠️"
  },
  "market_insight": "...",
  "analysis_time_ms": 2340.5,
  "live_reviews_fetched": 15
}
```

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "kaggle_products": 100,
  "api_key_configured": true
}
```

### `GET /api/sample-queries`

Get sample product ideas for demo purposes.

**Response:**
```json
{
  "queries": [
    "Portable Smart Security Camera",
    "Wireless Noise Cancelling Headphones",
    "Smart Pet Feeder with Camera",
    "Foldable Laptop Stand",
    "UV Water Purifier Bottle",
    "Smart Baby Monitor",
    "Ergonomic Gaming Mouse",
    "Portable Espresso Maker",
    "Electric Lunch Box",
    "Mini Projector for Bedroom"
  ]
}
```

### `GET /api/categories`

Get list of unique product categories from the Kaggle dataset.

**Response:**
```json
{
  "categories": ["Electronics|Headphones", "Computers&Accessories|LaptopAccessories", ...]
}
```

## 📐 Scoring Methodology

### Competition Score (0-100)

Measures how competitive the market is for a product category:

```
competitor_factor = min(num_products / 10, 1.0) × 100 × 0.35
review_factor = (log₁₀(avg_reviews) / log₁₀(85000)) × 100 × 0.35
rating_factor = ((avg_rating - 1) / 4) × 100 × 0.30
competition_score = competitor_factor + review_factor + rating_factor
```

**Higher = more competitive** (red = avoid, green = opportunity)

### Demand Score (0-100)

Measures consumer demand and interest:

```
review_factor = (log₁₀(avg_reviews) / log₁₀(85000)) × 100 × 0.40
rating_factor = ((avg_rating - 1) / 4) × 100 × 0.35
volume_factor = min(num_products / 10, 1.0) × 100 × 0.25
demand_score = review_factor + rating_factor + volume_factor
```

**Higher = more demand** (green = good, red = low demand)

### Opportunity Score (0-100)

Combined score indicating market opportunity:

```
opportunity_score = (demand × 0.65) - (competition × 0.35) + 35
```

**Recommendation thresholds:**
- ✅ **≥ 65**: Strong Opportunity — **LAUNCH**
- ⚠️ **40-64**: Moderate Opportunity — **RISKY**
- ❌ **< 40**: Saturated Market — **AVOID**

## 🔮 Future Improvements

1. **Real-time price tracking** with historical price charts and trend analysis
2. **Keyword gap analysis** using Amazon search volume and autocomplete data
3. **Competitor brand analysis** with market share estimation and SWOT analysis
4. **Multi-country market comparison** (US, UK, EU, IN, JP) with currency normalization
5. **Export analysis report as PDF** with charts, recommendations, and product comparisons
6. **Price elasticity modeling** to suggest optimal pricing strategies
7. **Seasonal demand forecasting** using time-series analysis on historical data
8. **Niche score calculator** combining multiple market signals for micro-niche identification

## 📄 License

This project is built for educational and research purposes. Amazon product data is fetched through authorized API access.

---

**Built with ❤️ by Imaya Thillai S & Jeffrey Ryan R**
