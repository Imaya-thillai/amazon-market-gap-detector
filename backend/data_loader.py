"""
DataLoader – reads and cleans the Kaggle Amazon products CSV,
builds a TF-IDF index for local similarity search.
"""

import logging
import re
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class DataLoader:
    """Load, clean, and search the local Kaggle Amazon products CSV."""

    def __init__(self, csv_path: str) -> None:
        logger.info("Loading Kaggle CSV from: %s", csv_path)
        self.csv_path = csv_path

        # ── Load raw data ────────────────────────────────────────────
        try:
            self.df: pd.DataFrame = pd.read_csv(csv_path, on_bad_lines="skip", nrows=2000)
        except Exception as exc:
            logger.error("Failed to load CSV '%s': %s", csv_path, exc)
            self.df = pd.DataFrame()
            self.vectorizer = TfidfVectorizer()
            self.tfidf_matrix = None
            return

        # ── Normalise column names (strip whitespace / lowercase) ────
        self.df.columns = self.df.columns.str.strip().str.lower()

        # ── Drop rows without a product name ─────────────────────────
        if "product_title" in self.df.columns:
            self.df.dropna(subset=["product_title"], inplace=True)
        else:
            logger.warning("Column 'product_title' not found in CSV.")

        # ── Clean prices ─────────────────────────────────────────────
        for col in ("discounted_price", "original_price"):
            if col in self.df.columns:
                self.df[col] = self.df[col].apply(self._clean_price)

        # ── Clean rating ─────────────────────────────────────────────
        if "product_rating" in self.df.columns:
            self.df["product_rating"] = pd.to_numeric(self.df["product_rating"], errors="coerce").fillna(3.5)

        # ── Clean total_reviews ───────────────────────────────────────
        if "total_reviews" in self.df.columns:
            self.df["total_reviews"] = (
                self.df["total_reviews"]
                .astype(str)
                .str.replace(",", "", regex=False)
            )
            self.df["total_reviews"] = pd.to_numeric(
                self.df["total_reviews"], errors="coerce"
            ).fillna(0).astype(int)

        # ── Clean purchased_last_month ────────────────────────────────
        if "purchased_last_month" in self.df.columns:
            self.df["purchased_last_month"] = (
                self.df["purchased_last_month"]
                .astype(str)
                .str.replace("+", "", regex=False)
                .str.replace("K", "000", regex=False)
                .str.replace("M", "000000", regex=False)
                .str.replace("bought in past month", "", regex=False)
                .str.replace(r"\D", "", regex=True)
            )
            self.df["purchased_last_month"] = pd.to_numeric(
                self.df["purchased_last_month"], errors="coerce"
            ).fillna(0).astype(int)

        # ── Clean is_best_seller ─────────────────────────────────────
        if "is_best_seller" in self.df.columns:
            self.df["is_best_seller"] = self.df["is_best_seller"].astype(bool)

        # ── Clean discount_percentage ────────────────────────────────
        if "discount_percentage" in self.df.columns:
            self.df["discount_percentage"] = (
                self.df["discount_percentage"]
                .astype(str)
                .str.replace("%", "", regex=False)
            )
            self.df["discount_percentage"] = pd.to_numeric(
                self.df["discount_percentage"], errors="coerce"
            ).fillna(0)

        # ── Fill text NaNs ───────────────────────────────────────────
        for col in ("about_product", "review_title", "review_content", "product_category"):
            if col in self.df.columns:
                self.df[col] = self.df[col].fillna("")

        # ── Build TF-IDF index ───────────────────────────────────────
        self._build_tfidf_index()

        logger.info(
            "DataLoader ready – %d products across %d categories.",
            len(self.df),
            self.df["product_category"].nunique() if "product_category" in self.df.columns else 0,
        )

    # ------------------------------------------------------------------ #
    #  Internal helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _clean_price(raw: Any) -> float:
        """Strip currency symbols and commas, return float."""
        if raw is None or (isinstance(raw, float) and np.isnan(raw)):
            return 0.0
        text = str(raw)
        text = re.sub(r"[₹$€£,]", "", text).strip()
        try:
            return round(float(text), 2)
        except (ValueError, TypeError):
            return 0.0

    def _build_tfidf_index(self) -> None:
        if self.df.empty:
            self.vectorizer = TfidfVectorizer()
            self.tfidf_matrix = None
            return

        name_col = self.df.get("product_title", pd.Series(dtype=str)).fillna("")

        # Create corpus just from titles since about_product is not in the new CSV
        corpus = [str(n) for n in name_col.tolist()]

        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            stop_words="english",
            ngram_range=(1, 2),
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    # ------------------------------------------------------------------ #
    #  Public API
    # ------------------------------------------------------------------ #

    def search_local(self, query: str, top_k: int = 20) -> List[Dict[str, Any]]:
        """
        Return the *top_k* most similar products to *query*
        using TF-IDF cosine similarity.
        """
        if self.tfidf_matrix is None or self.df.empty:
            return []

        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        top_indices = scores.argsort()[::-1][:top_k]

        results: List[Dict[str, Any]] = []
        for idx in top_indices:
            if scores[idx] <= 0:
                continue
            row = self.df.iloc[idx]
            sample_reviews = self._extract_sample_reviews(row)
            results.append(
                {
                    "id": str(idx),
                    "title": str(row.get("product_title", "Unknown")),
                    "category": str(row.get("product_category", "General")) or "General",
                    "price": float(row.get("discounted_price", 0.0)),
                    "rating": float(row.get("product_rating", 3.5)),
                    "review_count": int(row.get("total_reviews", 0)),
                    "monthly_sales": int(row.get("purchased_last_month", 0)),
                    "url": str(row.get("product_page_url", "")),
                    "image": str(row.get("product_image_url", "")),
                    "is_prime": False,
                    "is_best_seller": bool(row.get("is_best_seller", False)),
                    "source": "kaggle",
                    "sample_reviews": sample_reviews,
                }
            )
        return results

    def get_all_products(self, limit: int = 5000) -> List[Dict[str, Any]]:
        """Return first *limit* rows as normalised product dicts."""
        if self.df.empty:
            return []

        products: List[Dict[str, Any]] = []
        for _, row in self.df.head(limit).iterrows():
            sample_reviews = self._extract_sample_reviews(row)
            products.append(
                {
                    "id": str(_),
                    "title": str(row.get("product_title", "Unknown")),
                    "category": str(row.get("product_category", "General")) or "General",
                    "price": float(row.get("discounted_price", 0.0)),
                    "rating": float(row.get("product_rating", 3.5)),
                    "review_count": int(row.get("total_reviews", 0)),
                    "monthly_sales": int(row.get("purchased_last_month", 0)),
                    "url": str(row.get("product_page_url", "")),
                    "image": str(row.get("product_image_url", "")),
                    "is_prime": False,
                    "is_best_seller": bool(row.get("is_best_seller", False)),
                    "source": "kaggle",
                    "sample_reviews": sample_reviews,
                }
            )
        return products

    def get_categories(self) -> List[str]:
        """Return a sorted list of unique categories."""
        if "product_category" not in self.df.columns or self.df.empty:
            return []
        cats = self.df["product_category"].dropna().unique().tolist()
        return sorted([str(c) for c in cats if str(c).strip()])

    # ------------------------------------------------------------------ #
    #  Review helper
    # ------------------------------------------------------------------ #

    @staticmethod
    def _extract_sample_reviews(row: pd.Series) -> List[str]:
        """Build a list with one combined review string when data exists."""
        title = str(row.get("review_title", "")).strip()
        content = str(row.get("review_content", "")).strip()
        if title or content:
            combined = f"{title}: {content}" if title and content else title or content
            return [combined]
        return []
