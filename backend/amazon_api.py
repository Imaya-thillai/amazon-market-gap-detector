"""
Amazon Real-Time Data API client with in-memory caching.
Uses RapidAPI's Real-Time Amazon Data endpoint.
"""

import hashlib
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


class AmazonAPIClient:
    """Client for the Real-Time Amazon Data API on RapidAPI."""

    def __init__(self) -> None:
        self.api_key: str = os.getenv("RAPIDAPI_KEY", "")
        self.api_host: str = os.getenv(
            "RAPIDAPI_HOST", "real-time-amazon-data.p.rapidapi.com"
        )
        self.base_url: str = f"https://{self.api_host}"
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl: int = int(os.getenv("CACHE_TTL_SECONDS", "3600"))
        self.max_cache_entries: int = int(os.getenv("MAX_CACHE_ENTRIES", "500"))
        self.timeout: int = 15  # seconds

        if self.api_key:
            logger.info("AmazonAPIClient initialized with API key configured.")
        else:
            logger.warning(
                "AmazonAPIClient initialized WITHOUT API key. "
                "Live searches will fail; falling back to Kaggle data."
            )

    @property
    def is_configured(self) -> bool:
        """Return True if the API key is set."""
        return bool(self.api_key)

    # ------------------------------------------------------------------ #
    #  Internal helpers
    # ------------------------------------------------------------------ #

    def _cache_key(self, prefix: str, value: str) -> str:
        raw = f"{prefix}:{value}".encode("utf-8")
        return hashlib.md5(raw).hexdigest()

    def _get_cached(self, key: str) -> Optional[List[Dict[str, Any]]]:
        entry = self.cache.get(key)
        if entry is None:
            return None
        if time.time() - entry["timestamp"] > self.cache_ttl:
            del self.cache[key]
            return None
        logger.debug("Cache hit for key %s", key)
        return entry["data"]

    def _set_cache(self, key: str, data: List[Dict[str, Any]]) -> None:
        # Evict oldest entries when cache is full
        if len(self.cache) >= self.max_cache_entries:
            oldest_key = min(self.cache, key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]
        self.cache[key] = {"data": data, "timestamp": time.time()}

    def _headers(self) -> Dict[str, str]:
        return {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.api_host,
        }

    @staticmethod
    def _parse_price(raw: Any) -> float:
        """Strip currency symbols and commas, return float."""
        if raw is None:
            return 0.0
        text = str(raw)
        text = re.sub(r"[^\d.]", "", text)
        try:
            return round(float(text), 2)
        except (ValueError, TypeError):
            return 0.0

    @staticmethod
    def _safe_float(value: Any, default: float = 0.0) -> float:
        try:
            return float(value)
        except (ValueError, TypeError):
            return default

    @staticmethod
    def _safe_int(value: Any, default: int = 0) -> int:
        if value is None:
            return default
        text = str(value).replace(",", "")
        try:
            return int(float(text))
        except (ValueError, TypeError):
            return default

    # ------------------------------------------------------------------ #
    #  Public API
    # ------------------------------------------------------------------ #

    def search_products(self, query: str, count: int = 20) -> List[Dict[str, Any]]:
        """
        Search Amazon for products matching *query*.
        Returns a list of normalised product dicts (max *count*).
        On any error the method returns [] and logs a warning.
        """
        cache_key = self._cache_key("search", query.lower().strip())
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached[:count]

        try:
            response = requests.get(
                f"{self.base_url}/search",
                headers=self._headers(),
                params={
                    "query": query,
                    "page": "1",
                    "country": "US",
                    "sort_by": "RELEVANCE",
                    "product_condition": "ALL",
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            body = response.json()

            raw_products = (
                body.get("data", {}).get("products", [])
                if isinstance(body.get("data"), dict)
                else []
            )

            products: List[Dict[str, Any]] = []
            for p in raw_products[:count]:
                products.append(
                    {
                        "id": p.get("asin", ""),
                        "title": p.get("product_title", "Unknown Product"),
                        "category": p.get("product_category", "General") or "General",
                        "price": self._parse_price(p.get("product_price")),
                        "rating": self._safe_float(p.get("product_star_rating"), 0.0),
                        "review_count": self._safe_int(p.get("product_num_ratings"), 0),
                        "url": p.get("product_url", ""),
                        "image": p.get("product_photo", ""),
                        "is_prime": bool(p.get("is_prime", False)),
                        "source": "live",
                    }
                )

            self._set_cache(cache_key, products)
            logger.info(
                "Fetched %d live products for query '%s'.", len(products), query
            )
            return products

        except Exception as exc:
            logger.warning("search_products failed for '%s': %s", query, exc)
            return []

    def get_product_reviews(
        self, asin: str, count: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Fetch top reviews for a single ASIN.
        Returns list of { "text": str, "rating": float }.
        """
        cache_key = self._cache_key("reviews", asin)
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached[:count]

        try:
            response = requests.get(
                f"{self.base_url}/product-reviews",
                headers=self._headers(),
                params={
                    "asin": asin,
                    "country": "US",
                    "sort_by": "TOP_REVIEWS",
                    "verified_purchases_only": "false",
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            body = response.json()

            raw_reviews = (
                body.get("data", {}).get("reviews", [])
                if isinstance(body.get("data"), dict)
                else []
            )

            reviews: List[Dict[str, Any]] = []
            for r in raw_reviews[:count]:
                reviews.append(
                    {
                        "text": r.get("review_comment", ""),
                        "rating": self._safe_float(r.get("review_star_rating"), 0.0),
                    }
                )

            self._set_cache(cache_key, reviews)
            logger.info("Fetched %d reviews for ASIN %s.", len(reviews), asin)
            return reviews

        except Exception as exc:
            logger.warning("get_product_reviews failed for ASIN %s: %s", asin, exc)
            return []

    def get_best_sellers(self, category: str) -> List[Dict[str, Any]]:
        """
        Fetch best-seller products for a given category.
        Returns normalised product list.
        """
        cache_key = self._cache_key("bestsellers", category.lower().strip())
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        try:
            response = requests.get(
                f"{self.base_url}/best-sellers",
                headers=self._headers(),
                params={
                    "category": category,
                    "country": "US",
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            body = response.json()

            raw_products = (
                body.get("data", {}).get("products", [])
                if isinstance(body.get("data"), dict)
                else []
            )

            products: List[Dict[str, Any]] = []
            for p in raw_products:
                products.append(
                    {
                        "id": p.get("asin", ""),
                        "title": p.get("product_title", "Unknown Product"),
                        "category": p.get("product_category", "General") or "General",
                        "price": self._parse_price(p.get("product_price")),
                        "rating": self._safe_float(p.get("product_star_rating"), 0.0),
                        "review_count": self._safe_int(p.get("product_num_ratings"), 0),
                        "url": p.get("product_url", ""),
                        "image": p.get("product_photo", ""),
                        "is_prime": bool(p.get("is_prime", False)),
                        "source": "live",
                    }
                )

            self._set_cache(cache_key, products)
            logger.info(
                "Fetched %d best-sellers for category '%s'.", len(products), category
            )
            return products

        except Exception as exc:
            logger.warning("get_best_sellers failed for '%s': %s", category, exc)
            return []
