"""
MLEngine – hybrid TF-IDF / semantic similarity search,
competition & demand scoring, VADER sentiment analysis,
and market-insight generation.
"""

import logging
import math
from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from data_loader import DataLoader

logger = logging.getLogger(__name__)


class MLEngine:
    """Core ML engine for the Amazon Market Gap Detector."""

    def __init__(self, data_loader: DataLoader) -> None:
        self.data_loader = data_loader

        # ── Load Kaggle product corpus ───────────────────────────────
        self.all_products: List[Dict[str, Any]] = data_loader.get_all_products(limit=5000)
        self.product_titles: List[str] = [
            p.get("title", "") for p in self.all_products
        ]
        logger.info("MLEngine: loaded %d Kaggle products.", len(self.all_products))

        # ── TF-IDF on product titles ─────────────────────────────────
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=8000,
            stop_words="english",
            ngram_range=(1, 2),
        )
        if self.product_titles:
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.product_titles)
        else:
            self.tfidf_matrix = None

        # ── Sentence-transformer embeddings (optional) ───────────────
        self.use_embeddings: bool = False
        self.st_model: Any = None
        self.product_embeddings: Optional[np.ndarray] = None

        try:
            from sentence_transformers import SentenceTransformer

            self.st_model = SentenceTransformer("all-MiniLM-L6-v2")
            if self.product_titles:
                self.product_embeddings = self.st_model.encode(
                    self.product_titles,
                    batch_size=64,
                    show_progress_bar=False,
                    convert_to_numpy=True,
                )
            self.use_embeddings = True
            logger.info("MLEngine: sentence-transformers loaded ✓")
        except Exception as exc:
            logger.warning(
                "MLEngine: sentence-transformers unavailable (%s). "
                "Falling back to TF-IDF only.",
                exc,
            )

        # ── VADER sentiment analyser ─────────────────────────────────
        self.vader = SentimentIntensityAnalyzer()

        logger.info(
            "MLEngine initialised (embeddings=%s, products=%d).",
            self.use_embeddings,
            len(self.all_products),
        )

    # ------------------------------------------------------------------ #
    #  1. Similarity search
    # ------------------------------------------------------------------ #

    def find_similar_products(
        self,
        query: str,
        live_products: List[Dict[str, Any]],
        top_k: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Return the *top_k* products most similar to *query*.
        Prefers live products when available; falls back to Kaggle.
        """

        use_live = bool(live_products)
        candidate_products = live_products if use_live else self.all_products
        if not candidate_products:
            return []

        candidate_titles = [p.get("title", "") for p in candidate_products]

        # ── Semantic similarity (sentence-transformers) ──────────────
        semantic_scores: Optional[np.ndarray] = None
        if self.use_embeddings and self.st_model is not None:
            query_emb = self.st_model.encode([query], convert_to_numpy=True)
            candidate_embs = self.st_model.encode(
                candidate_titles,
                batch_size=64,
                show_progress_bar=False,
                convert_to_numpy=True,
            )
            semantic_scores = sklearn_cosine(query_emb, candidate_embs).flatten()

        # ── TF-IDF similarity ────────────────────────────────────────
        if use_live:
            # Build a temporary TF-IDF matrix for live products
            tfidf_vec = TfidfVectorizer(
                max_features=5000, stop_words="english", ngram_range=(1, 2)
            )
            tfidf_mat = tfidf_vec.fit_transform(candidate_titles + [query])
            query_vec = tfidf_mat[-1]
            product_mat = tfidf_mat[:-1]
            tfidf_scores = sklearn_cosine(query_vec, product_mat).flatten()
        else:
            # Use pre-built Kaggle TF-IDF matrix
            if self.tfidf_matrix is not None:
                query_vec = self.tfidf_vectorizer.transform([query])
                tfidf_scores = sklearn_cosine(query_vec, self.tfidf_matrix).flatten()
                # Slice to match candidate length
                tfidf_scores = tfidf_scores[: len(candidate_products)]
            else:
                tfidf_scores = np.zeros(len(candidate_products))

        # ── Hybrid score ─────────────────────────────────────────────
        if semantic_scores is not None:
            hybrid = 0.7 * semantic_scores + 0.3 * tfidf_scores
        else:
            hybrid = tfidf_scores

        top_indices = hybrid.argsort()[::-1][:top_k]

        results: List[Dict[str, Any]] = []
        for idx in top_indices:
            product = dict(candidate_products[idx])  # shallow copy
            product["similarity_score"] = round(float(hybrid[idx]) * 100, 1)
            results.append(product)

        return results

    # ------------------------------------------------------------------ #
    #  2. Competition score
    # ------------------------------------------------------------------ #

    def compute_competition_score(self, products: List[Dict[str, Any]]) -> float:
        if not products:
            return 0.0

        n = min(len(products), 10)

        # Factor 1 – number of competitors (35 %)
        competitor_factor = min(n / 10, 1.0) * 100 * 0.35

        # Factor 2 – average review count (35 %)
        review_counts = [p.get("review_count", 0) for p in products[:n]]
        avg_reviews = max(float(np.mean(review_counts)), 1)
        review_factor = (
            math.log10(max(avg_reviews, 0.01)) / math.log10(85000)
        ) * 100 * 0.35

        # Factor 3 – average rating (30 %)
        ratings = [p.get("rating", 0.0) for p in products[:n] if p.get("rating", 0) > 0]
        avg_rating = float(np.mean(ratings)) if ratings else 3.5
        rating_factor = ((avg_rating - 1) / 4) * 100 * 0.30

        score = competitor_factor + review_factor + rating_factor
        return round(min(max(score, 0), 100), 1)

    # ------------------------------------------------------------------ #
    #  3. Demand score
    # ------------------------------------------------------------------ #

    def compute_demand_score(self, products: List[Dict[str, Any]]) -> float:
        if not products:
            return 0.0

        # Factor 1 – monthly sales (40 %)
        sales = [p.get("monthly_sales", 0) for p in products]
        avg_sales = max(float(np.mean(sales)), 1)
        sales_factor = (
            math.log10(max(avg_sales, 0.01)) / math.log10(10000)
        ) * 100 * 0.40

        # Factor 2 – average review count (35 %)
        review_counts = [p.get("review_count", 0) for p in products]
        avg_reviews = max(float(np.mean(review_counts)), 1)
        review_factor = (
            math.log10(max(avg_reviews, 0.01)) / math.log10(85000)
        ) * 100 * 0.35

        # Factor 3 – average rating (25 %)
        ratings = [p.get("rating", 0.0) for p in products if p.get("rating", 0) > 0]
        avg_rating = float(np.mean(ratings)) if ratings else 3.5
        rating_factor = ((avg_rating - 1) / 4) * 100 * 0.25

        score = sales_factor + review_factor + rating_factor
        return round(min(max(score, 0), 100), 1)

    # ------------------------------------------------------------------ #
    #  4. Opportunity score
    # ------------------------------------------------------------------ #

    @staticmethod
    def compute_opportunity_score(competition: float, demand: float) -> float:
        score = (demand * 0.65) - (competition * 0.35) + 35
        return round(min(max(score, 0), 100), 1)

    # ------------------------------------------------------------------ #
    #  5. Sentiment analysis
    # ------------------------------------------------------------------ #

    def analyze_sentiment(
        self,
        products: List[Dict[str, Any]],
        live_reviews: Dict[str, List[Dict[str, Any]]],
    ) -> Dict[str, Any]:
        """
        Aggregate sentiment from live API reviews and Kaggle sample reviews.
        """
        all_texts: List[str] = []

        # Live reviews
        for _asin, reviews in live_reviews.items():
            for r in reviews:
                text = r.get("text", "").strip()
                if text:
                    all_texts.append(text)

        # Kaggle sample reviews
        for p in products:
            for review_text in p.get("sample_reviews", []):
                text = str(review_text).strip()
                if text:
                    all_texts.append(text)

        # Cap at 30
        all_texts = all_texts[:30]

        if not all_texts:
            return {
                "positive": 0,
                "neutral": 0,
                "negative": 0,
                "total": 0,
                "overall_sentiment": "Neutral",
                "avg_compound": 0.0,
                "sentiment_ratio": 0.0,
            }

        positive = 0
        neutral = 0
        negative = 0
        compound_sum = 0.0

        for text in all_texts:
            scores = self.vader.polarity_scores(text)
            compound = scores["compound"]
            compound_sum += compound

            if compound >= 0.05:
                positive += 1
            elif compound <= -0.05:
                negative += 1
            else:
                neutral += 1

        total = len(all_texts)
        avg_compound = round(compound_sum / total, 4)
        sentiment_ratio = round(positive / total, 4) if total else 0.0

        if avg_compound >= 0.05:
            overall = "Positive"
        elif avg_compound <= -0.05:
            overall = "Negative"
        else:
            overall = "Neutral"

        return {
            "positive": positive,
            "neutral": neutral,
            "negative": negative,
            "total": total,
            "overall_sentiment": overall,
            "avg_compound": avg_compound,
            "sentiment_ratio": sentiment_ratio,
        }

    # ------------------------------------------------------------------ #
    #  6. Market insight
    # ------------------------------------------------------------------ #

    def generate_market_insight(
        self,
        query: str,
        competition: float,
        demand: float,
        opportunity: float,
        sentiment: Dict[str, Any],
        products: List[Dict[str, Any]],
        data_source: str,
    ) -> str:
        source_label = (
            "live Amazon data" if data_source == "live" else "historical dataset"
        )

        # Average review count for insight
        review_counts = [p.get("review_count", 0) for p in products]
        avg_reviews = int(np.mean(review_counts)) if review_counts else 0

        # Sentence 1 – competitive landscape
        if competition >= 70:
            comp_desc = (
                f"The market for \"{query}\" is highly competitive with a competition "
                f"score of {competition}/100, indicating established players dominate "
                f"this space based on {source_label}."
            )
        elif competition >= 40:
            comp_desc = (
                f"The market for \"{query}\" shows moderate competition at "
                f"{competition}/100, suggesting room for differentiated offerings "
                f"based on {source_label}."
            )
        else:
            comp_desc = (
                f"The market for \"{query}\" has relatively low competition at "
                f"{competition}/100, indicating a potential gap based on {source_label}."
            )

        # Sentence 2 – demand analysis
        if demand >= 60:
            demand_desc = (
                f"Consumer demand is strong (score: {demand}/100) with an average "
                f"of {avg_reviews:,} reviews per product, signalling active buyer interest."
            )
        elif demand >= 35:
            demand_desc = (
                f"Consumer demand is moderate (score: {demand}/100) with an average "
                f"of {avg_reviews:,} reviews per product, indicating a developing market."
            )
        else:
            demand_desc = (
                f"Consumer demand is currently low (score: {demand}/100) with an average "
                f"of {avg_reviews:,} reviews per product; the market may be niche."
            )

        # Sentence 3 – recommendation
        if opportunity >= 65:
            rec_desc = (
                f"With an opportunity score of {opportunity}/100, this niche presents a "
                f"strong entry point — consider launching a differentiated product with "
                f"competitive pricing and superior reviews."
            )
        elif opportunity >= 40:
            rec_desc = (
                f"The opportunity score of {opportunity}/100 suggests cautious optimism — "
                f"success would require clear differentiation and a solid marketing strategy."
            )
        else:
            rec_desc = (
                f"An opportunity score of {opportunity}/100 signals a saturated or "
                f"low-potential market — entry is risky without a significant competitive "
                f"advantage."
            )

        return f"{comp_desc} {demand_desc} {rec_desc}"

    # ------------------------------------------------------------------ #
    #  7. Recommendation label
    # ------------------------------------------------------------------ #

    @staticmethod
    def get_recommendation(opportunity_score: float) -> Dict[str, str]:
        if opportunity_score >= 65:
            return {
                "label": "Strong Opportunity",
                "code": "LAUNCH",
                "color": "green",
                "emoji": "✅",
            }
        elif opportunity_score >= 40:
            return {
                "label": "Moderate Opportunity",
                "code": "RISKY",
                "color": "yellow",
                "emoji": "⚠️",
            }
        else:
            return {
                "label": "Saturated Market",
                "code": "AVOID",
                "color": "red",
                "emoji": "❌",
            }
