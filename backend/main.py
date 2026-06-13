"""
FastAPI backend for the Amazon Market Gap Detector.
Exposes /api/analyze, /api/health, /api/sample-queries, /api/categories.
"""

import logging
import os
import time
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from amazon_api import AmazonAPIClient
from data_loader import DataLoader
from ml_engine import MLEngine

# ── Logging setup ────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
)
logger = logging.getLogger(__name__)

# ── Load environment ─────────────────────────────────────────────────────
load_dotenv()

# ── FastAPI app ──────────────────────────────────────────────────────────
app = FastAPI(
    title="Amazon Market Gap Detector API",
    description="Analyse Amazon product niches for market gaps using ML.",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global singletons (populated on startup) ─────────────────────────────
data_loader: DataLoader = None  # type: ignore[assignment]
ml_engine: MLEngine = None  # type: ignore[assignment]
amazon_api: AmazonAPIClient = None  # type: ignore[assignment]


# ── Startup event ────────────────────────────────────────────────────────
@app.on_event("startup")
def startup_event() -> None:
    global data_loader, ml_engine, amazon_api

    csv_path = os.getenv("KAGGLE_CSV_PATH", "data/amazon_products.csv")
    logger.info("Starting up — CSV path: %s", csv_path)

    data_loader = DataLoader(csv_path)
    ml_engine = MLEngine(data_loader)
    amazon_api = AmazonAPIClient()

    logger.info(
        "ML Engine ready. Loaded %d products from Kaggle dataset.",
        len(ml_engine.all_products),
    )


# ── Request / response models ───────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    product_idea: str = Field(
        ..., min_length=3, max_length=200, description="Product idea to analyse"
    )


class ScoresResponse(BaseModel):
    competition: float
    demand: float
    opportunity: float


class SentimentResponse(BaseModel):
    positive: int
    neutral: int
    negative: int
    total: int
    overall_sentiment: str
    avg_compound: float
    sentiment_ratio: float


class RecommendationResponse(BaseModel):
    label: str
    code: str
    color: str
    emoji: str


class AnalyzeResponse(BaseModel):
    query: str
    data_source: str
    similar_products: List[Dict[str, Any]]
    scores: ScoresResponse
    sentiment: SentimentResponse
    recommendation: RecommendationResponse
    market_insight: str
    analysis_time_ms: float
    live_reviews_fetched: int


class ErrorResponse(BaseModel):
    error: str
    detail: str


# ── Endpoints ────────────────────────────────────────────────────────────


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> Dict[str, Any]:
    """Run a full market-gap analysis for a product idea."""
    start = time.time()
    query = request.product_idea.strip()

    try:
        # 1. Try live Amazon data first
        live_products: List[Dict[str, Any]] = amazon_api.search_products(query, count=20)

        live_reviews: Dict[str, List[Dict[str, Any]]] = {}
        data_source: str

        if live_products:
            data_source = "live"
            # Fetch reviews for top 3 ASINs
            for product in live_products[:3]:
                asin = product.get("id", "")
                if asin:
                    reviews = amazon_api.get_product_reviews(asin, count=10)
                    if reviews:
                        live_reviews[asin] = reviews
        else:
            data_source = "kaggle"
            live_products = data_loader.search_local(query, top_k=20)

        # 2. Find similar products via ML
        similar = ml_engine.find_similar_products(query, live_products, top_k=10)

        # 3. Compute scores
        competition = ml_engine.compute_competition_score(similar)
        demand = ml_engine.compute_demand_score(similar)
        opportunity = ml_engine.compute_opportunity_score(competition, demand)

        # 4. Sentiment
        sentiment = ml_engine.analyze_sentiment(similar, live_reviews)

        # 5. Insight & recommendation
        insight = ml_engine.generate_market_insight(
            query, competition, demand, opportunity, sentiment, similar, data_source
        )
        recommendation = ml_engine.get_recommendation(opportunity)

        # 6. Total live reviews fetched
        total_live_reviews = sum(len(v) for v in live_reviews.values())

        elapsed_ms = round((time.time() - start) * 1000, 1)

        return {
            "query": query,
            "data_source": data_source,
            "similar_products": similar,
            "scores": {
                "competition": competition,
                "demand": demand,
                "opportunity": opportunity,
            },
            "sentiment": sentiment,
            "recommendation": recommendation,
            "market_insight": insight,
            "analysis_time_ms": elapsed_ms,
            "live_reviews_fetched": total_live_reviews,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Analysis failed for query '%s'", query)
        raise HTTPException(
            status_code=500,
            detail={"error": "Analysis failed", "detail": str(exc)},
        )


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    """Basic health / readiness probe."""
    return {
        "status": "ok",
        "model_loaded": ml_engine is not None,
        "kaggle_products": len(ml_engine.all_products) if ml_engine else 0,
        "api_key_configured": amazon_api.is_configured if amazon_api else False,
    }


@app.get("/api/sample-queries")
def sample_queries() -> Dict[str, List[str]]:
    """Return a curated list of sample queries for the UI."""
    return {
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
            "Mini Projector for Bedroom",
        ]
    }


@app.get("/api/categories")
def categories() -> Dict[str, List[str]]:
    """Return unique product categories from the Kaggle dataset."""
    if data_loader is None:
        return {"categories": []}
    return {"categories": data_loader.get_categories()}
