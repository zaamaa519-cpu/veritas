#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
VERITAS AI - PROFESSIONAL FAKE NEWS DETECTOR
Version 4.1.0 - Self-Improving Adaptive Quiz Engine

Key improvements over v3:
- Logistic Regression meta-learner replaces heuristic weight averaging
- Online learning from user feedback (partial_fit + EMA)
- Improved confidence calibration
- JWT-only user identification (body user_id vulnerability fixed)
- 7-day MongoDB verification cache (reduces API costs)
- Domain-based NewsAPI filtering (more reliable than source-name matching)
- Structured logging throughout (no bare print statements)
- Consistent error handling with logger.error/warning
- /api/feedback endpoint for user corrections
- /api/admin/retrain endpoint for batch model retraining
"""

import os
import sys
import io
import json
import logging
import hashlib
import time
import re
import pickle
import math
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

# Fix encoding on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

from dotenv import load_dotenv
load_dotenv()

# Structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("veritas_ai")

_wz_log = logging.getLogger("werkzeug")
_wz_log.addFilter(type("NoFavicon", (logging.Filter,), {
    "filter": lambda self, r: "favicon.ico" not in r.getMessage()
})())

try:
    import torch
    torch.set_grad_enabled(False)
    logger.info("PyTorch gradients disabled globally for inference")
except ImportError:
    torch = None
    logger.warning("PyTorch not available")

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import openai
from newsapi import NewsApiClient
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.sentiment import SentimentIntensityAnalyzer
from pymongo import MongoClient, errors as pymongo_errors
from bson import ObjectId
import jwt
import requests
from urllib.parse import urlparse

try:
    from sklearn.linear_model import SGDClassifier
    from sklearn.preprocessing import StandardScaler
    import numpy as np
    SKLEARN_AVAILABLE = True
    logger.info("scikit-learn available - learned ensemble enabled")
except ImportError:
    SKLEARN_AVAILABLE = False
    np = None
    logger.warning("scikit-learn not available - falling back to weighted voting")

TRANSFORMER_MODELS_AVAILABLE = False
model_detector = None
LABEL_MAP = {0: "REAL", 1: "FAKE"}

try:
    from model_loader import model_detector as _model_detector
    model_detector = _model_detector
    TRANSFORMER_MODELS_AVAILABLE = bool(model_detector and model_detector.available())
    if TRANSFORMER_MODELS_AVAILABLE:
        logger.info(f"Transformer models loaded")
    else:
        logger.warning("Transformer model_loader found but models not available")
except Exception as _e:
    logger.warning(f"Transformer models not loaded: {_e}")

bcrypt = Bcrypt()
auth_bp = oauth_bp = None
try:
    from auth import auth_bp as _auth_bp, bcrypt as _bcrypt
    auth_bp, bcrypt = _auth_bp, _bcrypt
except Exception:
    pass
try:
    from oauth import oauth_bp as _oauth_bp
    oauth_bp = _oauth_bp
except Exception:
    pass

for _pkg, _path in [
    ("punkt",         "tokenizers/punkt"),
    ("punkt_tab",     "tokenizers/punkt_tab"),
    ("stopwords",     "corpora/stopwords"),
    ("vader_lexicon", "sentiment/vader_lexicon"),
]:
    try:
        nltk.data.find(_path)
    except (LookupError, OSError):
        # OSError raised on Python 3.14 due to a punkt_tab path resolution
        # bug in NLTK. Downloading re-creates the correct directory structure.
        try:
            nltk.download(_pkg, quiet=True)
        except Exception as _dl_err:
            logger.warning(f"NLTK download failed for {_pkg}: {_dl_err}")

# =========================================================================
#  FLASK APP
# =========================================================================
app = Flask(__name__)

@app.route("/favicon.ico")
def favicon():
    return Response(status=204)

app.secret_key       = os.getenv("SECRET_KEY", "veritas-ai-secret-key-change-in-prod")
JWT_SECRET_KEY       = os.getenv("JWT_SECRET_KEY", app.secret_key)
JWT_ALGORITHM        = "HS256"
JWT_EXPIRES_MINUTES  = int(os.getenv("JWT_EXPIRES_MINUTES", "4320"))

app.config["GOOGLE_CLIENT_ID"]     = os.getenv("GOOGLE_CLIENT_ID")
app.config["GOOGLE_CLIENT_SECRET"] = os.getenv("GOOGLE_CLIENT_SECRET")
app.config["TWITTER_API_KEY"]      = os.getenv("TWITTER_API_KEY")
app.config["TWITTER_API_SECRET"]   = os.getenv("TWITTER_API_SECRET")
app.config["TWITTER_BEARER_TOKEN"] = os.getenv("TWITTER_BEARER_TOKEN")

MONGO_URI = os.getenv("MONGODB_URI")
mongo_client = mongo_db = None

if MONGO_URI:
    try:
        mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        mongo_db     = mongo_client.get_database("veritas_ai")
        mongo_client.admin.command("ping")
        logger.info("MongoDB connected - database: veritas_ai")
    except Exception as _e:
        mongo_client = mongo_db = None
        logger.error(f"MongoDB connection failed: {_e}")
        raise RuntimeError(f"MongoDB connection required: {_e}") from _e
else:
    raise RuntimeError("MONGODB_URI environment variable is required")

_cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
).split(",")
CORS(app, resources={r"/api/*": {"origins": _cors_origins}}, supports_credentials=True)

@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"]        = "DENY"
    response.headers["X-XSS-Protection"]       = "1; mode=block"
    response.headers["Referrer-Policy"]        = "strict-origin-when-cross-origin"
    if os.getenv("DEBUG", "True").lower() == "false":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

bcrypt.init_app(app)
if auth_bp:
    app.register_blueprint(auth_bp)
    logger.info("Authentication routes registered")
else:
    logger.warning("auth.py not found - authentication routes disabled")

if oauth_bp:
    app.register_blueprint(oauth_bp)
    logger.info("OAuth routes registered")
else:
    logger.warning("oauth.py not found - OAuth routes disabled")

_openai_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY")
if _openai_key and _openai_key.strip() and _openai_key != "your_openai_api_key_here":
    openai.api_key = _openai_key
    logger.info("OpenAI API configured")
else:
    openai.api_key = None
    logger.warning("OpenAI API key not configured")

_newsapi_key = os.getenv("NEWSAPI_KEY")
if _newsapi_key and _newsapi_key.strip() and _newsapi_key != "your_newsapi_key_here":
    try:
        newsapi = NewsApiClient(api_key=_newsapi_key)
        logger.info("NewsAPI configured")
    except Exception as _e:
        newsapi = None
        logger.warning(f"NewsAPI error: {_e}")
else:
    newsapi = None
    logger.warning("NewsAPI key not configured")


# =========================================================================
#  NLP DETECTOR
# =========================================================================

class AdvancedFakeNewsDetector:
    """Rule-based NLP producing a rich feature vector for the meta-learner."""

    SENSATIONAL = [
        "shocking","explosive","unbelievable","incredible","stunning","outrageous",
        "bombshell","unprecedented","catastrophic","devastating","miracle",
        "revolutionary","game-changing","exclusive","breaking","urgent","alert",
    ]
    CONSPIRACY = [
        "cover-up","conspiracy","hidden truth","they dont want you to know",
        "mainstream media wont tell you","wake up","globalist","deep state",
        "illuminati","new world order","fake news media","censored",
    ]
    VAGUE = [
        "experts say","studies show","reports indicate","sources claim",
        "they say","it is believed","allegedly",
    ]
    EMOTIONAL = [
        "terrifying","horrifying","disgusting","outraged","furious",
        "appalled","shocked","sickening","amazing",
    ]

    def __init__(self):
        self.sia = SentimentIntensityAnalyzer()

    def extract_features(self, text: str) -> Dict:
        if not text or len(text.strip()) < 5:
            return {k: 0.0 for k in self._feature_keys()}
        tl    = text.lower()
        words = word_tokenize(tl)
        nw    = max(len(words), 1)

        sent = self.sia.polarity_scores(text)
        return {
            "all_caps_ratio":      sum(1 for c in text if c.isupper()) / max(len(text), 1),
            "exclamation_ratio":   min(text.count("!") / 10.0, 1.0),
            "sensational_ratio":   sum(1 for w in self.SENSATIONAL if w in tl) / len(self.SENSATIONAL),
            "conspiracy_ratio":    sum(1 for p in self.CONSPIRACY  if p in tl) / len(self.CONSPIRACY),
            "vague_ratio":         sum(1 for p in self.VAGUE       if p in tl) / len(self.VAGUE),
            "emotional_ratio":     sum(1 for w in self.EMOTIONAL   if w in tl) / len(self.EMOTIONAL),
            "quote_ratio":         min(text.count('"') / 2 / 5.0, 1.0),
            "date_ratio":          min(len(re.findall(r'\b(?:\d{1,2}/\d{1,2}/\d{4}|\w+ \d{1,2},? \d{4})\b', text)) / 3.0, 1.0),
            "source_ratio":        min(len(re.findall(r'\b(?:according to|said|reported|stated by)\s+(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', text)) / 3.0, 1.0),
            "sentiment_extreme":   1.0 if abs(sent["compound"]) > 0.7 else 0.0,
            "sentiment_negative":  max(-sent["compound"], 0.0),
            "pronoun_ratio":       sum(1 for w in words if w in {"i","me","my","mine","we","us","our"}) / nw,
            "sentiment_compound":  (sent["compound"] + 1) / 2,
        }

    @staticmethod
    def _feature_keys():
        return [
            "all_caps_ratio","exclamation_ratio","sensational_ratio","conspiracy_ratio",
            "vague_ratio","emotional_ratio","quote_ratio","date_ratio","source_ratio",
            "sentiment_extreme","sentiment_negative","pronoun_ratio","sentiment_compound",
        ]

    def analyze(self, text: str) -> Dict:
        feats = self.extract_features(text)
        fs = (
            feats["all_caps_ratio"]    * 0.10 +
            feats["exclamation_ratio"] * 0.06 +
            feats["sensational_ratio"] * 0.14 +
            feats["conspiracy_ratio"]  * 0.16 +
            feats["vague_ratio"]       * 0.10 +
            feats["emotional_ratio"]   * 0.12 +
            feats["sentiment_extreme"] * 0.08 +
            feats["pronoun_ratio"]     * 0.05 -
            feats["quote_ratio"]       * 0.10 -
            feats["date_ratio"]        * 0.12 -
            feats["source_ratio"]      * 0.15
        )
        fs   = max(0.0, min(1.0, fs + 0.5))
        pred = "FAKE" if fs > 0.60 else "REAL"
        conf = fs if pred == "FAKE" else (1 - fs)
        return {
            "prediction": pred, "confidence": conf,
            "features": feats, "credibility_score": (1 - fs) * 100,
            "sentiment": self.sia.polarity_scores(text),
        }


detector = AdvancedFakeNewsDetector()


# =========================================================================
#  SOURCE VERIFIER
# =========================================================================

class SourceVerifier:
    TIER1 = {
        "reuters.com","apnews.com","afp.com","bbc.com","bbc.co.uk",
        "theguardian.com","aljazeera.com","nytimes.com","washingtonpost.com",
        "wsj.com","bloomberg.com","npr.org","pbs.org","usatoday.com","time.com",
        "nature.com","sciencemag.org","scientificamerican.com",
        "technologyreview.com","arstechnica.com",
        "who.int","cdc.gov","nih.gov","nasa.gov",
    }
    FACTCHECK = {
        "snopes.com","factcheck.org","politifact.com","fullfact.org",
        "checkyourfact.com","truthorfiction.com","africacheck.org",
    }
    UNRELIABLE = {
        "naturalnews.com","infowars.com","beforeitsnews.com",
        "yournewswire.com","worldnewsdailyreport.com",
    }
    SATIRE = {
        "theonion.com","clickhole.com","babylonbee.com",
        "waterfordwhispersnews.com","thebeaverton.com","reductress.com",
    }

    def __init__(self):
        self.twitter_bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        self.newsapi_key          = os.getenv("NEWSAPI_KEY")
        self.google_api_key       = os.getenv("GOOGLE_API_KEY")
        self.google_cx            = os.getenv("GOOGLE_SEARCH_CX")
        self._mem: Dict[str, Tuple[float, Dict]] = {}
        self._mem_ttl = 3600
        self._db_ttl  = 7  # days

    def verify_claim(self, headline: str) -> Dict:
        key = hashlib.md5(headline.encode()).hexdigest()
        if key in self._mem:
            ts, cached = self._mem[key]
            if time.time() - ts < self._mem_ttl:
                return cached
        if mongo_db is not None:
            try:
                doc = mongo_db.verification_cache.find_one({"key": key})
                if doc and doc.get("expires_at", datetime.min) > datetime.utcnow():
                    result = doc["result"]
                    self._mem[key] = (time.time(), result)
                    return result
            except Exception:
                pass

        result = self._run(headline)
        self._mem[key] = (time.time(), result)
        if mongo_db is not None:
            try:
                mongo_db.verification_cache.update_one(
                    {"key": key},
                    {"$set": {
                        "key": key, "headline": headline[:500], "result": result,
                        "created_at": datetime.utcnow(),
                        "expires_at": datetime.utcnow() + timedelta(days=self._db_ttl),
                    }},
                    upsert=True,
                )
            except Exception:
                pass
        return result

    def _run(self, headline: str) -> Dict:
        r = {
            "verified": False, "confidence": 0.0, "sources_found": 0,
            "trusted_sources": [], "fact_check_results": {},
            "twitter_verification": {}, "credibility_tier": "unknown",
            "explanation": "", "details": [],
        }

        fc = self._factcheck(headline)
        r["fact_check_results"] = fc
        if fc.get("found"):
            r["confidence"]       = fc.get("confidence", 0.5)
            r["verified"]         = fc.get("verified", False)
            r["credibility_tier"] = fc.get("tier", "unknown")
            r["details"].append(f"Fact-checked by {fc.get('source', 'unknown')}")

        news = self._newsapi(headline)
        r["sources_found"]   = news.get("count", 0)
        r["trusted_sources"] = news.get("sources", [])
        if news.get("count", 0) > 0:
            r["details"].append(f"Found in {news['count']} trusted news sources")
            t1 = sum(1 for s in news["sources"] if self._is_tier1(s.get("url","")))
            if t1 >= 2:
                r["confidence"] = max(r["confidence"], 0.85)
                r["verified"]   = True
                r["credibility_tier"] = "high"

        if self.twitter_bearer_token:
            tw = self._twitter(headline)
            r["twitter_verification"] = tw
            if tw.get("verified_mentions", 0) >= 2:
                r["confidence"] = max(r["confidence"], 0.75)
                r["details"].append(f"{tw['verified_mentions']} verified Twitter mentions")

        if self.google_api_key and self.google_cx:
            gs = self._google(headline)
            if gs.get("tier1_sources", 0) > 0:
                r["confidence"] = max(r["confidence"], 0.80)
                r["details"].append(f"Google: {gs['tier1_sources']} tier-1 sources")

        c = r["confidence"]
        if   c >= 0.75: r["credibility_tier"] = "high";        r["verified"] = True
        elif c >= 0.50: r["credibility_tier"] = "medium"
        elif c >= 0.30: r["credibility_tier"] = "low"
        else:           r["credibility_tier"] = "unverified"

        r["explanation"] = self._explain(r)
        return r

    def _factcheck(self, headline: str) -> Dict:
        if not self.google_api_key or not self.google_cx:
            return {"found": False}
        try:
            q = (f"{headline} site:snopes.com OR site:factcheck.org "
                 "OR site:politifact.com OR site:fullfact.org")
            resp = requests.get(
                "https://www.googleapis.com/customsearch/v1",
                params={"key": self.google_api_key, "cx": self.google_cx, "q": q, "num": 5},
                timeout=8,
            )
            if resp.status_code == 200:
                for item in resp.json().get("items", []):
                    combo  = (item.get("title","") + " " + item.get("snippet","")).lower()
                    source = item.get("displayLink", "fact-checker")
                    if any(w in combo for w in ["false","fake","misleading","debunked","pants on fire"]):
                        return {"found": True, "verified": False, "rating": "FALSE",
                                "confidence": 0.92, "tier": "unreliable", "source": source,
                                "explanation": f"Flagged as false by {source}"}
                    if any(w in combo for w in ["true","correct","accurate","verified","mostly true"]):
                        return {"found": True, "verified": True, "rating": "TRUE",
                                "confidence": 0.90, "tier": "high", "source": source,
                                "explanation": f"Verified as accurate by {source}"}
        except Exception as e:
            logger.warning(f"Fact-check API error: {e}")
        return {"found": False}

    def _newsapi(self, headline: str) -> Dict:
        if not self.newsapi_key:
            return {"count": 0, "sources": []}
        try:
            resp = requests.get(
                "https://newsapi.org/v2/everything",
                params={
                    "apiKey": self.newsapi_key, "q": headline, "language": "en",
                    "sortBy": "relevancy", "pageSize": 20,
                    "from": (datetime.now() - timedelta(days=30)).isoformat(),
                },
                timeout=8,
            )
            if resp.status_code == 200:
                articles = resp.json().get("articles", [])
                trusted  = [
                    {"source": a.get("source", {}).get("name"), "url": a.get("url",""),
                     "title": a.get("title"), "publishedAt": a.get("publishedAt")}
                    for a in articles
                    if self._is_tier1(a.get("url",""))
                ]
                return {"count": len(trusted), "sources": trusted}
        except Exception as e:
            logger.warning(f"NewsAPI error: {e}")
        return {"count": 0, "sources": []}

    def _twitter(self, headline: str) -> Dict:
        if not self.twitter_bearer_token:
            return {"checked": False}
        try:
            kw    = self._keywords(headline)
            query = " ".join(kw[:5])
            resp  = requests.get(
                "https://api.twitter.com/2/tweets/search/recent",
                headers={"Authorization": f"Bearer {self.twitter_bearer_token}"},
                params={
                    "query": f"{query} -is:retweet has:links", "max_results": 20,
                    "tweet.fields": "author_id,created_at", "user.fields": "verified,verified_type",
                    "expansions": "author_id",
                },
                timeout=8,
            )
            if resp.status_code == 200:
                data  = resp.json()
                users = {u["id"]: u for u in data.get("includes", {}).get("users", [])}
                ver   = [
                    u for t in data.get("data", [])
                    if (u := users.get(t.get("author_id"), {})).get("verified")
                    or u.get("verified_type") in ["blue","business","government"]
                ]
                return {"checked": True, "verified_mentions": len(ver),
                        "sources": ver[:5], "total_mentions": len(data.get("data",[]))}
            return {"checked": False, "error": f"Twitter {resp.status_code}"}
        except Exception as e:
            logger.warning(f"Twitter API error: {e}")
            return {"checked": False, "error": str(e)}

    def _google(self, headline: str) -> Dict:
        if not self.google_api_key or not self.google_cx:
            return {"tier1_sources": 0, "sources": []}
        try:
            resp = requests.get(
                "https://www.googleapis.com/customsearch/v1",
                params={"key": self.google_api_key, "cx": self.google_cx, "q": headline, "num": 10},
                timeout=8,
            )
            if resp.status_code == 200:
                items = resp.json().get("items", [])
                tier1 = [
                    {"title": i.get("title"), "url": i.get("link"), "snippet": i.get("snippet")}
                    for i in items if self._is_tier1(i.get("link",""))
                ]
                return {"tier1_sources": len(tier1), "sources": tier1}
        except Exception as e:
            logger.warning(f"Google Search error: {e}")
        return {"tier1_sources": 0, "sources": []}

    def check_url_credibility(self, url: str) -> Dict:
        domain = urlparse(url).netloc.lower().replace("www.", "")
        if self._is_tier1(url):
            return {"credibility": "high",       "tier": 1, "description": "Highly trusted source"}
        if any(f in domain for f in self.FACTCHECK):
            return {"credibility": "high",       "tier": 1, "description": "Fact-checking organisation"}
        if any(s in domain for s in self.SATIRE):
            return {"credibility": "satire",     "tier": 4, "description": "Known satire – not factual news"}
        if any(u in domain for u in self.UNRELIABLE):
            return {"credibility": "unreliable", "tier": 4, "description": "Known misinformation source"}
        return {"credibility": "unknown",    "tier": 3, "description": "Source credibility unestablished"}

    def _is_tier1(self, url: str) -> bool:
        domain = urlparse(url).netloc.lower().replace("www.","")
        return any(t in domain for t in self.TIER1)

    @staticmethod
    def _keywords(text: str) -> List[str]:
        stop = {"the","a","an","and","or","but","in","on","at","to","for","of","is","was","are"}
        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        return [w for w, _ in Counter(w for w in words if w not in stop).most_common(10)]

    @staticmethod
    def _explain(r: Dict) -> str:
        d = r.get("details", [])
        if not d:
            return "No external verification data available. Treat with caution."
        s = "Verification: " + "; ".join(d)
        return s + (" -> VERIFIED." if r.get("verified") else " -> Unable to verify.")


# =========================================================================
#  X (TWITTER) REALITY VALIDATION ENGINE — NON-INTRUSIVE INTELLIGENCE LAYER
# =========================================================================

class XRealityEngine:
    """
    Social Reality Validation Layer
    Does NOT classify content.
    Detects misinformation behavior patterns.
    """
    
    def __init__(self, bearer_token: str, cache_collection=None):
        self.bearer = bearer_token
        self.base = "https://api.twitter.com/2"
        self.cache = cache_collection
    
    def analyze(self, text: str) -> Dict:
        if not self.bearer:
            return {"enabled": False, "social_fake_prob": 0.0, "evidence": {}}
        
        # Check cache first
        cache_key = hashlib.md5(text.encode()).hexdigest()
        if self.cache is not None:
            try:
                cached = self.cache.find_one({"_id": cache_key})
                if cached and cached.get("expires", datetime.min) > datetime.utcnow():
                    return cached["result"]
            except Exception as e:
                logger.warning(f"Cache read error: {e}")
        
        try:
            tweets = self._search(text)
            if not tweets:
                result = {"enabled": True, "social_fake_prob": 0.0, "evidence": {"note": "no_social_signal"}}
            else:
                metrics = self._compute_metrics(tweets)
                score = self._score(metrics)
                result = {
                    "enabled": True,
                    "social_fake_prob": round(score, 4),
                    "evidence": metrics
                }
            
            # Cache result
            if self.cache is not None:
                try:
                    self.cache.update_one(
                        {"_id": cache_key},
                        {"$set": {
                            "result": result,
                            "expires": datetime.utcnow() + timedelta(hours=6)
                        }},
                        upsert=True
                    )
                except Exception as e:
                    logger.warning(f"Cache write error: {e}")
            
            return result
            
        except Exception as e:
            logger.error(f"X Reality Engine error: {e}")
            return {"enabled": False, "social_fake_prob": 0.0, "error": str(e)}
    
    # ----------------------------
    # X Data Collection
    # ----------------------------
    def _search(self, text: str) -> List[Dict]:
        keywords = self._keywords(text)
        q = " ".join(keywords[:6])
        
        url = f"{self.base}/tweets/search/recent"
        headers = {"Authorization": f"Bearer {self.bearer}"}
        params = {
            "query": f"{q} -is:retweet",
            "max_results": 50,
            "tweet.fields": "public_metrics,created_at,author_id",
            "user.fields": "verified,public_metrics",
            "expansions": "author_id"
        }
        
        r = requests.get(url, headers=headers, params=params, timeout=8)
        if r.status_code != 200:
            logger.warning(f"Twitter API error: {r.status_code}")
            return []
        
        data = r.json()
        users = {u["id"]: u for u in data.get("includes", {}).get("users", [])}
        
        enriched = []
        for t in data.get("data", []):
            u = users.get(t["author_id"], {})
            enriched.append({
                "text": t.get("text", ""),
                "likes": t.get("public_metrics", {}).get("like_count", 0),
                "retweets": t.get("public_metrics", {}).get("retweet_count", 0),
                "replies": t.get("public_metrics", {}).get("reply_count", 0),
                "created_at": t.get("created_at"),
                "verified": u.get("verified", False),
                "followers": u.get("public_metrics", {}).get("followers_count", 1),
                "following": u.get("public_metrics", {}).get("following_count", 1),
            })
        return enriched
    
    # ----------------------------
    # Metrics
    # ----------------------------
    def _compute_metrics(self, tweets: List[Dict]) -> Dict:
        if not tweets:
            return {}
        
        # Virality
        avg_rt = sum(t["retweets"] for t in tweets) / len(tweets)
        avg_lk = sum(t["likes"] for t in tweets) / len(tweets)
        
        # Bot amplification
        bot_like = sum(
            1 for t in tweets
            if (t["followers"] / max(t["following"], 1)) > 10 and not t["verified"]
        ) / len(tweets)
        
        # Verified contradiction
        verified_tweets = [t for t in tweets if t["verified"]]
        verified_negative = 0
        if verified_tweets:
            verified_negative = sum(
                1 for t in verified_tweets if self._negation_signal(t["text"])
            ) / len(verified_tweets)
        
        # Emotional spike
        emotional = sum(
            1 for t in tweets if self._emotional_signal(t["text"])
        ) / len(tweets)
        
        # Centralized propagation (echo chamber)
        unique_texts = len(set(t["text"] for t in tweets))
        low_diversity = unique_texts / len(tweets)
        
        return {
            "avg_retweets": avg_rt,
            "avg_likes": avg_lk,
            "bot_amplification": bot_like,
            "verified_contradiction": verified_negative,
            "emotional_spike": emotional,
            "text_diversity": low_diversity,
            "sample_size": len(tweets)
        }
    
    # ----------------------------
    # Scoring Logic
    # ----------------------------
    def _score(self, m: Dict) -> float:
        if not m:
            return 0.0
        
        score = 0.0
        
        # Bot amplification
        score += m["bot_amplification"] * 0.25
        
        # Verified contradiction
        score += m["verified_contradiction"] * 0.30
        
        # Emotional virality
        score += m["emotional_spike"] * 0.15
        
        # Centralized propagation
        if m["text_diversity"] < 0.4:
            score += 0.15
        
        # Virality anomaly
        if m["avg_retweets"] > 50:
            score += 0.15
        
        return min(score, 1.0)
    
    # ----------------------------
    # Helpers
    # ----------------------------
    @staticmethod
    def _keywords(text: str) -> List[str]:
        words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
        stop = {"that", "with", "this", "from", "they", "have", "were", "which", "would"}
        return [w for w in words if w not in stop]
    
    @staticmethod
    def _negation_signal(text: str) -> bool:
        t = text.lower()
        return any(x in t for x in ["fake", "false", "misleading", "not true", "debunked", "hoax", "wrong"])
    
    @staticmethod
    def _emotional_signal(text: str) -> bool:
        t = text.lower()
        return any(x in t for x in ["shocking", "terrifying", "disgusting", "outrage", "horrible", "insane"])


# =========================================================================
#  CLAIM EXTRACTOR
# =========================================================================

class ClaimExtractor:
    _PATS = [
        r"\b\d+%?\b",
        r"\b(?:study|research|report|data|statistics)\b",
        r"\b(?:announced|confirmed|stated|revealed)\b",
        r"\b(?:according to|as per|reported by)\b",
    ]

    @classmethod
    def extract_claims(cls, text: str) -> List[str]:
        return [
            s.strip() for s in sent_tokenize(text)
            if any(re.search(p, s, re.IGNORECASE) for p in cls._PATS)
        ][:5]


# =========================================================================
#  LEARNED ENSEMBLE META-MODEL
# =========================================================================

class LearnedEnsemble:
    """
    7-feature logistic regression meta-model.
    Features: [nlp_fake, transformer_fake, twitter_sig, newsapi_sig,
               factcheck_sig, source_cred, claim_unverified_ratio]
    Falls back to weighted average if sklearn/model unavailable.
    """

    FEATURE_NAMES = [
        "nlp_fake_prob", "transformer_fake", "twitter_signal",
        "newsapi_signal", "factcheck_signal", "source_credibility",
        "claim_unverified_ratio",
    ]
    N = len(FEATURE_NAMES)
    MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "ensemble_model.pkl")
    # Default weights (index-aligned to FEATURE_NAMES)
    _W = [0.07, 0.20, 0.25, 0.20, 0.15, 0.10, 0.03]

    def __init__(self, mongo_database=None):
        self.mongo_db       = mongo_database
        self.model          = None
        self.scaler         = None
        self._last_update   = None
        self._ema: Dict[str, float] = {}
        self._load()

    def _load(self):
        if not SKLEARN_AVAILABLE:
            return
        try:
            if os.path.exists(self.MODEL_PATH):
                with open(self.MODEL_PATH, "rb") as f:
                    saved = pickle.load(f)
                self.model  = saved.get("model")
                self.scaler = saved.get("scaler")
                logger.info("Loaded persisted ensemble model")
        except Exception as e:
            logger.warning(f"Could not load ensemble model: {e}")

    def _save(self):
        if not SKLEARN_AVAILABLE or self.model is None:
            return
        try:
            os.makedirs(os.path.dirname(self.MODEL_PATH), exist_ok=True)
            with open(self.MODEL_PATH, "wb") as f:
                pickle.dump({"model": self.model, "scaler": self.scaler}, f)
        except Exception as e:
            logger.warning(f"Could not save ensemble model: {e}")

    @staticmethod
    def build_features(
        nlp_result: Dict,
        transformer_result: Optional[Dict],
        verification_result: Dict,
        claim_verification: List[Dict],
    ) -> List[float]:
        nlp_fake = (nlp_result.get("confidence", 0.5)
                    if nlp_result.get("prediction") == "FAKE"
                    else 1 - nlp_result.get("confidence", 0.5))

        if transformer_result:
            tc = transformer_result.get("confidence", 0.5)
            t_fake = tc if transformer_result.get("prediction") == "FAKE" else 1 - tc
        else:
            t_fake = 0.5

        tw  = verification_result.get("twitter_verification", {}).get("verified_mentions", 0)
        tw_sig = 1 - min(tw / 5.0, 1.0)

        sc     = verification_result.get("sources_found", 0)
        ns_sig = 1 - min(sc / 5.0, 1.0)

        fc  = verification_result.get("fact_check_results", {})
        if fc.get("found"):
            fc_sig = 0.0 if fc.get("verified") else 1.0
        else:
            fc_sig = 0.5

        tier_map = {"high": 0.0, "medium": 0.33, "low": 0.67,
                    "unverified": 0.5, "unreliable": 1.0, "unknown": 0.5}
        src_cred = tier_map.get(verification_result.get("credibility_tier", "unknown"), 0.5)

        if claim_verification:
            unv   = sum(1 for c in claim_verification if not c.get("verified"))
            c_rat = unv / len(claim_verification)
        else:
            c_rat = 0.5

        return [nlp_fake, t_fake, tw_sig, ns_sig, fc_sig, src_cred, c_rat]

    def predict(self, fv: List[float]) -> Tuple[str, float]:
        if SKLEARN_AVAILABLE and self.model is not None:
            try:
                X = np.array(fv).reshape(1, -1)
                if self.scaler:
                    X = self.scaler.transform(X)
                proba   = self.model.predict_proba(X)[0]
                classes = list(self.model.classes_)
                fi      = classes.index(1) if 1 in classes else 1
                fp      = float(proba[fi])
                return ("FAKE" if fp >= 0.5 else "REAL", fp)
            except Exception as e:
                logger.warning(f"Ensemble model inference error: {e}")
        fp = sum(v * w for v, w in zip(fv, self._W)) / sum(self._W)
        fp = max(0.0, min(1.0, fp))
        return ("FAKE" if fp >= 0.5 else "REAL", fp)

    def update_from_feedback(self, fv: List[float], true_label: int):
        if not SKLEARN_AVAILABLE:
            return
        try:
            if self.mongo_db is not None:
                self.mongo_db.feedback_training.insert_one({
                    "features": fv, "label": true_label, "created_at": datetime.utcnow()
                })
            if hasattr(self.model, "partial_fit"):
                X = np.array(fv).reshape(1, -1)
                if self.scaler:
                    X = self.scaler.transform(X)
                self.model.partial_fit(X, np.array([true_label]), classes=[0, 1])
                self._save()
                logger.info("Ensemble updated via partial_fit")
        except Exception as e:
            logger.warning(f"Feedback update error: {e}")

    def retrain_from_feedback(self) -> bool:
        if not SKLEARN_AVAILABLE or self.mongo_db is None:
            return False
        try:
            docs = list(self.mongo_db.feedback_training.find({}))
            if len(docs) < 20:
                logger.info(f"Not enough feedback ({len(docs)} samples, need 20)")
                return False
            X  = np.array([d["features"] for d in docs])
            y  = np.array([d["label"]    for d in docs])
            sc = StandardScaler()
            Xs = sc.fit_transform(X)
            m  = SGDClassifier(loss="log_loss", max_iter=1000, random_state=42, class_weight="balanced")
            m.fit(Xs, y)
            self.model  = m
            self.scaler = sc
            self._save()
            logger.info(f"Ensemble retrained on {len(docs)} samples")
            return True
        except Exception as e:
            logger.error(f"Batch retrain failed: {e}")
            return False

    def maybe_refresh(self):
        if self._last_update and (datetime.utcnow() - self._last_update).seconds < 3600:
            return
        self._last_update = datetime.utcnow()
        if self.mongo_db is None:
            return
        try:
            recent = list(self.mongo_db.predictions.find().sort("timestamp", -1).limit(500))
            if len(recent) < 50:
                return
            hits: Dict[str, List[float]] = defaultdict(list)
            for pred in recent:
                hits[pred.get("method","")].append(1.0 if pred.get("confidence", 0) > 0.7 else 0.0)
            for comp, h in hits.items():
                acc = sum(h) / len(h)
                old = self._ema.get(comp, acc)
                self._ema[comp] = 0.1 * acc + 0.9 * old
        except Exception as e:
            logger.warning(f"Ensemble refresh error: {e}")


# =========================================================================
#  INIT SINGLETONS
# =========================================================================

source_verifier  = SourceVerifier()
claim_extractor  = ClaimExtractor()
x_reality_engine = XRealityEngine(
    os.getenv("TWITTER_BEARER_TOKEN"), 
    mongo_db.x_reality_cache if mongo_db is not None else None
)
learned_ensemble = LearnedEnsemble(mongo_db)

logger.info("All components initialised")


# =========================================================================
#  UTILITIES
# =========================================================================

def create_access_token(user_id: str) -> str:
    payload = {
        "sub": str(user_id),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRES_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user_id() -> Optional[str]:
    """Authenticate from Bearer token ONLY. Never trust request body for user identity."""
    h = request.headers.get("Authorization", "")
    if not h.startswith("Bearer "):
        return None
    token = h.split(" ", 1)[1].strip()
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return str(payload.get("sub"))
    except Exception:
        return None


def mongo_insert_one(col: str, doc: Dict):
    if mongo_db is None:
        return
    try:
        mongo_db[col].insert_one(doc)
    except pymongo_errors.PyMongoError as e:
        logger.error(f"MongoDB insert error in '{col}': {e}")


def log_interaction(action: str, meta: Optional[Dict] = None, user_id=None):
    if mongo_db is not None:
        try:
            mongo_db.user_interactions.insert_one({
                "user_id": user_id, "action_type": action,
                "metadata": meta or {}, "timestamp": datetime.utcnow(),
            })
        except Exception as e:
            logger.error(f"Interaction log failed: {e}")


# =========================================================================
#  ROUTES
# =========================================================================

@app.route("/")
def home():
    return jsonify({
        "service": "Veritas AI - Professional Fake News Detector",
        "version": "4.1.0",
        "status": "operational",
        "features": {
            "learned_ensemble":    SKLEARN_AVAILABLE,
            "transformer_models":  TRANSFORMER_MODELS_AVAILABLE,
            "nlp_analysis":        True,
            "source_verification": True,
            "twitter_verification":bool(source_verifier.twitter_bearer_token),
            "news_api":            newsapi is not None,
            "google_search":       bool(source_verifier.google_api_key),
            "openai":              openai.api_key is not None,
            "online_learning":     SKLEARN_AVAILABLE,
            "claim_extraction":    True,
        },
    }), 200


@app.route("/api/health", methods=["GET"])
def health_check():
    try:
        if mongo_db is not None:
            mongo_client.admin.command("ping")
            db_s = "connected"
            pc = mongo_db.predictions.count_documents({})
            uc = mongo_db.users.count_documents({})
        else:
            db_s = "not configured"; pc = uc = 0
    except Exception as e:
        db_s = f"error: {e}"; pc = uc = 0
    return jsonify({
        "status": "healthy", "version": "4.1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": {"type": "MongoDB", "status": db_s,
                     "stats": {"predictions": pc, "users": uc}},
        "services": {
            "learned_ensemble": SKLEARN_AVAILABLE,
            "transformers": TRANSFORMER_MODELS_AVAILABLE,
            "nlp": True,
            "twitter": bool(source_verifier.twitter_bearer_token),
            "newsapi": newsapi is not None,
            "google": bool(source_verifier.google_api_key),
            "openai": openai.api_key is not None,
        },
    }), 200


@app.route("/api/auth/register", methods=["POST"])
def api_register():
    return jsonify({"error": "Use Next.js auth at /api/auth/register"}), 410

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    return jsonify({"error": "Use Next.js auth at /api/auth/login"}), 410


# -------------------------------------------------------------------------
#  PREDICT  (main endpoint)
# -------------------------------------------------------------------------

@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data     = request.get_json() or {}
        headline = (data.get("headline") or data.get("text") or data.get("article") or "").strip()
        if not headline:
            return jsonify({"error": "Missing headline / text in request body"}), 400
        if len(headline) > 10_000:
            return jsonify({"error": "Input too long (max 10 000 chars)"}), 400

        source_url = data.get("source_url", "").strip()
        user_id    = get_current_user_id()  # JWT only

        # STEP 1: URL fast-path
        url_cred: Dict = {}
        vr:       Dict = {}

        if source_url:
            url_cred = source_verifier.check_url_credibility(source_url)
            if url_cred.get("credibility") == "satire":
                return jsonify({
                    "prediction": "SATIRE", "confidence": 0.99,
                    "method": "url_credibility",
                    "source_verification": {
                        "verified": False, "sources_found": 0,
                        "credibility_tier": "satire",
                        "explanation": "Known satire publication - content is intentionally fictional.",
                        "twitter_verified": 0, "fact_checked": False,
                    },
                    "url_credibility": url_cred,
                    "timestamp": datetime.utcnow().isoformat(),
                }), 200

            if url_cred.get("credibility") == "unreliable":
                vr = {
                    "verified": False, "confidence": 0.95,
                    "credibility_tier": "unreliable",
                    "explanation": "Known misinformation source",
                    "sources_found": 0, "fact_check_results": {},
                    "twitter_verification": {}, "trusted_sources": [],
                }

        if not vr:
            vr = source_verifier.verify_claim(headline)

        # STEP 2: Claims
        raw_claims = claim_extractor.extract_claims(headline)
        cv: List[Dict] = []
        for c in raw_claims[:3]:
            cr = source_verifier.verify_claim(c)
            cv.append({"claim": c, "verified": cr.get("verified", False),
                       "confidence": cr.get("confidence", 0.5)})

        # STEP 3: NLP
        comps: Dict = {}
        if data.get("use_nlp", True):
            try:
                comps["nlp"] = detector.analyze(headline)
            except Exception as e:
                logger.error(f"NLP error: {e}")

        # STEP 4: Transformer
        if data.get("use_transformer", True) and TRANSFORMER_MODELS_AVAILABLE and model_detector:
            try:
                t = model_detector.predict(headline)
                comps["transformer"] = {
                    "prediction": t.get("prediction", "UNKNOWN"),
                    "confidence": t.get("confidence", 0.5),
                    "raw_score":  t.get("raw_score", 0.5),
                }
            except Exception as e:
                logger.error(f"Transformer error: {e}")

        # STEP 5: Learned ensemble
        learned_ensemble.maybe_refresh()
        nlp_r = comps.get("nlp", {"prediction": "REAL", "confidence": 0.5})
        t_r   = comps.get("transformer")
        fv    = LearnedEnsemble.build_features(nlp_r, t_r, vr, cv)
        raw_label, fake_prob = learned_ensemble.predict(fv)

        # ---- X REALITY VALIDATION LAYER ----
        x_result = x_reality_engine.analyze(headline)
        x_social_fake = x_result.get("social_fake_prob", 0.0)
        
        # Confidence modulation (NOT replacement)
        twitter_verified_mentions = x_result.get("evidence", {}).get("verified_mentions", 0)
        TWITTER_WEIGHT  = 0.40
        ENSEMBLE_WEIGHT = 0.60

        if twitter_verified_mentions >= 3:
            twitter_score = max(0.0, x_social_fake - 0.4)  # strong REAL signal
        elif twitter_verified_mentions >= 1:
            twitter_score = max(0.0, x_social_fake - 0.2)  # mild REAL signal
        elif x_social_fake > 0.0:
            twitter_score = x_social_fake                   # strong FAKE signal
        else:
            twitter_score = fake_prob                        # no Twitter data, ignore it
            TWITTER_WEIGHT  = 0.0
            ENSEMBLE_WEIGHT = 1.0
        fake_prob = min(1.0, (ENSEMBLE_WEIGHT * fake_prob) + (TWITTER_WEIGHT * twitter_score))


        # STEP 6: Confidence adjustment
        conf = fake_prob if raw_label == "FAKE" else (1 - fake_prob)
        preds = [comps[k]["prediction"] for k in ("nlp","transformer") if k in comps]
        if preds and all(p == raw_label for p in preds):
            conf = min(conf * 1.08, 1.0)
        if len(preds) >= 2 and len(set(preds)) > 1:
            conf *= 0.88
        if vr.get("verified") and raw_label == "REAL":
            conf = min(conf * 1.05, 1.0)

        final = raw_label if conf >= 0.60 else "UNVERIFIED"
        method = ("learned_ensemble" if SKLEARN_AVAILABLE and learned_ensemble.model
                  else "weighted_fallback")

        # STEP 7: Persist
        if mongo_db is not None and user_id:
            try:
                mongo_db.predictions.insert_one({
                    "user_id": user_id, "headline": headline,
                    "prediction": final, "confidence": conf,
                    "method": method, "feature_vector": fv,
                    "source_verification": vr, "url_credibility": url_cred,
                    "claim_verification": cv,
                    "component_results": {
                        k: {kk: vv for kk, vv in v.items() if kk != "features"}
                        for k, v in comps.items()
                    },
                    "timestamp": datetime.utcnow(),
                })
            except Exception as e:
                logger.error(f"Failed to save prediction: {e}")

        # Seed quiz candidate pool from high-confidence predictions
        _maybe_add_quiz_candidate(headline, final, conf, comps, fv)

        log_interaction("prediction", {
            "headline_length": len(headline), "method": method,
            "sources_checked": vr.get("sources_found", 0),
        }, user_id=user_id)

        return jsonify({
            "prediction":      final,
            "confidence":      round(conf, 4),
            "fake_probability":round(fake_prob, 4),
            "method":          method,
            "source_verification": {
                "verified":         vr.get("verified", False),
                "sources_found":    vr.get("sources_found", 0),
                "trusted_sources":  vr.get("trusted_sources", [])[:3],
                "credibility_tier": vr.get("credibility_tier", "unknown"),
                "explanation":      vr.get("explanation", ""),
                "twitter_verified": vr.get("twitter_verification", {}).get("verified_mentions", 0),
                "fact_checked":     vr.get("fact_check_results", {}).get("found", False),
            },
            "url_credibility":  url_cred or None,
            "claim_verification": cv,
            "ensemble_features": {
                name: round(val, 4)
                for name, val in zip(LearnedEnsemble.FEATURE_NAMES, fv)
            },
            "component_results": {
                k: {kk: vv for kk, vv in v.items() if kk != "features"}
                for k, v in comps.items()
            },
            "x_reality": {
                "enabled": x_result.get("enabled", False),
                "social_fake_probability": round(x_social_fake, 4),
                "evidence": x_result.get("evidence", {})
            },
            "timestamp": datetime.utcnow().isoformat(),
        }), 200

    except Exception as e:
        logger.exception("Prediction pipeline error")
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500


# -------------------------------------------------------------------------
#  FEEDBACK + ADMIN RETRAIN
# -------------------------------------------------------------------------

@app.route("/api/feedback", methods=["POST"])
def submit_feedback():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401
    try:
        data  = request.get_json() or {}
        pid   = data.get("prediction_id", "").strip()
        label = data.get("correct_label", "").upper().strip()
        if not pid:
            return jsonify({"error": "prediction_id required"}), 400
        if label not in ("REAL", "FAKE"):
            return jsonify({"error": "correct_label must be REAL or FAKE"}), 400
        try:
            doc = mongo_db.predictions.find_one({"_id": ObjectId(pid)})
        except Exception:
            return jsonify({"error": "Invalid prediction_id"}), 400
        if not doc:
            return jsonify({"error": "Prediction not found"}), 404
        fv = doc.get("feature_vector")
        if not fv or len(fv) != LearnedEnsemble.N:
            return jsonify({"error": "Feature vector missing in stored prediction"}), 422
        learned_ensemble.update_from_feedback(fv, 1 if label == "FAKE" else 0)
        mongo_insert_one("feedback", {
            "user_id": user_id, "prediction_id": pid,
            "correct_label": label, "timestamp": datetime.utcnow()
        })
        return jsonify({"message": "Feedback received - ensemble updated",
                        "online_learning": SKLEARN_AVAILABLE}), 200
    except Exception as e:
        logger.exception("Feedback error")
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/retrain", methods=["POST"])
def admin_retrain():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401
    ok = learned_ensemble.retrain_from_feedback()
    return jsonify({"retrained": ok}), 200 if ok else 503


# -------------------------------------------------------------------------
#  URL VERIFY + COMPARE SOURCES
# -------------------------------------------------------------------------

@app.route("/api/verify-url", methods=["POST"])
def verify_url():
    try:
        url = (request.get_json() or {}).get("url", "").strip()
        if not url:
            return jsonify({"error": "url required"}), 400
        return jsonify({"url": url, "credibility": source_verifier.check_url_credibility(url)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/compare-sources", methods=["POST"])
def compare_sources():
    try:
        d  = request.get_json() or {}
        hl = (d.get("headline") or d.get("text") or "").strip()
        if not hl:
            return jsonify({"error": "headline required"}), 400
        vr = source_verifier.verify_claim(hl)
        return jsonify({
            "headline": hl,
            "sources_found":    vr.get("sources_found", 0),
            "trusted_sources":  vr.get("trusted_sources", []),
            "credibility_tier": vr.get("credibility_tier", "unknown"),
            "explanation":      vr.get("explanation", ""),
            "twitter_verification": vr.get("twitter_verification", {}),
            "fact_check":       vr.get("fact_check_results", {}),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
#  HISTORY + STATS
# -------------------------------------------------------------------------

@app.route("/api/history", methods=["GET"])
def get_history():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401
    try:
        page  = max(int(request.args.get("page", 1)), 1)
        limit = min(int(request.args.get("limit", 10)), 50)
        skip  = (page - 1) * limit
        cursor = (
            mongo_db.predictions
            .find({"user_id": user_id}, {"_id": 0, "feature_vector": 0})
            .sort("timestamp", -1).skip(skip).limit(limit)
        )
        items = []
        for doc in cursor:
            if isinstance(doc.get("timestamp"), datetime):
                doc["timestamp"] = doc["timestamp"].isoformat()
            items.append(doc)
        total = mongo_db.predictions.count_documents({"user_id": user_id})
        return jsonify({"history": items, "total": total, "page": page, "limit": limit}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stats", methods=["GET"])
def get_stats():
    try:
        user_id = get_current_user_id()
        q = {"user_id": user_id} if user_id else {}
        total = mongo_db.predictions.count_documents(q) if mongo_db is not None else 0
        fake  = mongo_db.predictions.count_documents({**q, "prediction": "FAKE"})  if mongo_db is not None else 0
        real  = mongo_db.predictions.count_documents({**q, "prediction": "REAL"})  if mongo_db is not None else 0
        unv   = mongo_db.predictions.count_documents({**q, "prediction": "UNVERIFIED"}) if mongo_db is not None else 0
        return jsonify({
            "total": total, "fake": fake, "real": real, "unverified": unv,
            "fake_ratio": round(fake / total, 3) if total else 0,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
#  NEWS CACHE
# -------------------------------------------------------------------------

def get_cached_news(topic: str, cache_hours: int = 1):
    tn = topic.lower()
    if mongo_db is not None:
        try:
            entry = mongo_db.news_cache.find_one({"topic": tn})
            if entry and entry.get("expires_at", datetime.min) > datetime.utcnow():
                return entry.get("articles", []), True
        except Exception:
            pass
    if not newsapi:
        return [], False
    cat_map = {
        "world": "general", "technology": "technology", "business": "business",
        "science": "science", "health": "health", "entertainment": "entertainment",
        "sports": "sports", "general": "general",
    }
    try:
        resp = newsapi.get_top_headlines(category=cat_map.get(tn, "general"), language="en", page_size=50)
        arts = resp.get("articles", [])
        _rel = ["bbc","reuters","associated press","wall street journal","cnn","washington post",
                "new york times","bloomberg","abc news","cbs news","nbc news","usa today","time",
                "guardian","independent","financial times","axios","politico","the hill","npr","pbs"]
        filt = [a for a in arts
                if a.get("title") and a.get("description")
                and any(n in (a.get("source",{}).get("name") or "").lower() for n in _rel)]
        final = (filt or arts)[:15]
        if mongo_db is not None:
            try:
                mongo_db.news_cache.update_one(
                    {"topic": tn},
                    {"$set": {"articles": final, "cached_at": datetime.utcnow(),
                              "expires_at": datetime.utcnow() + timedelta(hours=cache_hours)}},
                    upsert=True,
                )
            except Exception:
                pass
        return final, False
    except Exception as e:
        logger.error(f"News cache error: {e}")
        return [], False


@app.route("/api/news", methods=["GET"])
def get_news():
    topic = request.args.get("topic", "general")
    arts, cached = get_cached_news(topic)
    return jsonify({"articles": arts, "cached": cached, "topic": topic}), 200


@app.route("/api/trending", methods=["GET"])
def get_trending():
    arts, _ = get_cached_news("general")
    return jsonify({"trending": arts[:5]}), 200


# -------------------------------------------------------------------------
#  REPORT
# -------------------------------------------------------------------------

@app.route("/api/report", methods=["POST"])
def report_content():
    try:
        user_id = get_current_user_id()
        d       = request.get_json() or {}
        content = (d.get("content") or d.get("headline") or "").strip()
        reason  = d.get("reason", "unspecified").strip()
        if not content:
            return jsonify({"error": "content required"}), 400
        mongo_insert_one("reports", {
            "content": content, "reason": reason,
            "user_id": user_id, "timestamp": datetime.utcnow(),
        })
        label_str = d.get("correct_label", "").upper().strip()
        if label_str in ("REAL", "FAKE") and d.get("prediction_id"):
            try:
                pd_doc = mongo_db.predictions.find_one({"_id": ObjectId(d["prediction_id"])})
                if pd_doc and pd_doc.get("feature_vector"):
                    learned_ensemble.update_from_feedback(
                        pd_doc["feature_vector"], 1 if label_str == "FAKE" else 0
                    )
            except Exception:
                pass
        return jsonify({"message": "Report submitted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
#  QUIZ ENGINE  (self-improving, adaptive)
# =========================================================================
# Architecture:
#   quiz_candidates  – auto-populated from high-confidence /api/predict calls
#   quiz_attempts    – per-user answer log (with candidate _id reference)
#   user_stats       – per-user accuracy broken down by topic
#
# Flow:
#   /api/predict  →  saves candidate if confidence > QUIZ_CANDIDATE_THRESHOLD
#   /api/quiz/questions  →  picks questions targeting user's weak topics
#   /api/quiz/submit     →  records answer, triggers ensemble feedback if consensus reached
# -------------------------------------------------------------------------

QUIZ_CANDIDATE_THRESHOLD  = 0.90   # min confidence for auto-generated questions
QUIZ_CONSENSUS_THRESHOLD  = 0.80   # fraction of agreement before using as training label
QUIZ_MIN_RESPONSES        = 10     # responses needed before consensus check
QUIZ_CANDIDATE_EXPIRY_DAYS = 30    # expire old candidates


# Topic keywords (lightweight, no extra model needed)
_TOPIC_KEYWORDS: Dict[str, List[str]] = {
    "politics":     ["president","government","election","congress","senate","democrat","republican","parliament","minister","policy","vote","law","military","war","nato"],
    "health":       ["covid","virus","vaccine","cancer","drug","medicine","doctor","hospital","disease","health","fda","who","clinical","study","treatment"],
    "technology":   ["ai","robot","tech","software","app","google","apple","microsoft","crypto","bitcoin","hack","cyber","data","algorithm","5g","internet"],
    "science":      ["nasa","climate","earth","space","research","scientist","study","nature","physics","biology","chemistry","discovery","experiment"],
    "business":     ["stock","market","economy","bank","finance","company","startup","billion","investment","trade","gdp","inflation","fed","revenue"],
    "entertainment":["celebrity","movie","music","singer","actor","award","grammy","oscar","hollywood","netflix","sport","game","football","basketball"],
}


def _classify_topic(headline: str) -> str:
    hl = headline.lower()
    scores = {topic: sum(1 for kw in kws if kw in hl)
              for topic, kws in _TOPIC_KEYWORDS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


def _maybe_add_quiz_candidate(headline: str, prediction: str, confidence: float,
                               component_results: Dict, feature_vector: List[float]):
    """
    Called from /api/predict after final result is computed.
    Only stores REAL/FAKE predictions above threshold to avoid garbage questions.
    """
    if mongo_db is None:
        return
    if prediction not in ("REAL", "FAKE"):
        return
    if confidence < QUIZ_CANDIDATE_THRESHOLD:
        return
    try:
        # Dedup: skip if identical headline seen in last 30 days
        recent_cutoff = datetime.utcnow() - timedelta(days=QUIZ_CANDIDATE_EXPIRY_DAYS)
        existing = mongo_db.quiz_candidates.find_one({
            "headline": headline,
            "created_at": {"$gte": recent_cutoff},
        })
        if existing:
            return

        topic = _classify_topic(headline)

        # Build readable explanation from component signals
        explanation_parts = []
        nlp = component_results.get("nlp", {})
        if nlp.get("confidence", 0) > 0.75:
            explanation_parts.append(
                f"NLP analysis found this {nlp['prediction'].lower()} "
                f"with {nlp['confidence']*100:.0f}% confidence"
            )
        transformer = component_results.get("transformer", {})
        if transformer.get("confidence", 0) > 0.75:
            explanation_parts.append(
                f"AI transformer model classified it as {transformer['prediction'].lower()} "
                f"({transformer['confidence']*100:.0f}% confidence)"
            )
        explanation = ". ".join(explanation_parts) if explanation_parts else \
            f"Our ensemble model detected this as {prediction.lower()} with high confidence."

        mongo_db.quiz_candidates.insert_one({
            "headline":          headline,
            "prediction":        prediction,          # system's ground-truth label
            "confidence":        confidence,
            "topic":             topic,
            "feature_vector":    feature_vector,
            "component_results": {
                k: {kk: vv for kk, vv in v.items() if kk != "features"}
                for k, v in component_results.items()
            },
            "explanation":       explanation,
            "created_at":        datetime.utcnow(),
            "expires_at":        datetime.utcnow() + timedelta(days=QUIZ_CANDIDATE_EXPIRY_DAYS),
            "used_count":        0,
            "responses":         [],           # filled by /api/quiz/submit
            "consensus_label":   None,         # set when consensus is reached
        })
    except Exception as e:
        logger.warning(f"Failed to add quiz candidate: {e}")


def _check_candidate_consensus(candidate_id):
    """
    After a quiz answer is recorded, check if consensus has been reached
    on this candidate and feed it back into the learned ensemble.
    """
    if mongo_db is None:
        return
    try:
        doc = mongo_db.quiz_candidates.find_one({"_id": candidate_id})
        if not doc:
            return
        responses = doc.get("responses", [])
        if len(responses) < QUIZ_MIN_RESPONSES:
            return
        if doc.get("consensus_label"):
            return  # already processed

        fake_votes  = sum(1 for r in responses if r.get("answer") == "FAKE")
        total_votes = len(responses)
        fake_ratio  = fake_votes / total_votes

        if fake_ratio >= QUIZ_CONSENSUS_THRESHOLD:
            consensus = "FAKE"
        elif (1 - fake_ratio) >= QUIZ_CONSENSUS_THRESHOLD:
            consensus = "REAL"
        else:
            return  # no strong consensus yet

        # Store consensus
        mongo_db.quiz_candidates.update_one(
            {"_id": candidate_id},
            {"$set": {"consensus_label": consensus, "consensus_at": datetime.utcnow()}}
        )

        # Feed back into learned ensemble if feature vector available
        fv = doc.get("feature_vector")
        if fv and len(fv) == LearnedEnsemble.N:
            true_label = 1 if consensus == "FAKE" else 0
            learned_ensemble.update_from_feedback(fv, true_label)
            logger.info(
                f"Consensus reached on candidate {candidate_id}: {consensus} "
                f"({fake_ratio*100:.0f}% agreement, {total_votes} responses) → ensemble updated"
            )
    except Exception as e:
        logger.warning(f"Consensus check error: {e}")


def _get_user_weak_topics(user_id: str) -> List[str]:
    """
    Returns topics ordered worst→best accuracy for this user.
    Falls back to all topics if no data.
    """
    all_topics = list(_TOPIC_KEYWORDS.keys()) + ["general"]
    if mongo_db is None or not user_id:
        return all_topics

    try:
        # Get all attempts that reference a quiz_candidate (have candidate_id)
        pipeline = [
            {"$match": {"userId": user_id, "candidate_id": {"$exists": True}}},
            {"$group": {
                "_id": "$topic",
                "total":   {"$sum": 1},
                "correct": {"$sum": {"$cond": ["$is_correct", 1, 0]}}
            }},
        ]
        results = list(mongo_db.quiz_attempts.aggregate(pipeline))
        accuracy = {r["_id"]: r["correct"] / r["total"] for r in results if r["total"] > 0}

        # Topics with data sorted worst→best, then unseen topics appended
        seen   = sorted(accuracy.keys(), key=lambda t: accuracy[t])
        unseen = [t for t in all_topics if t not in accuracy]
        return seen + unseen
    except Exception as e:
        logger.warning(f"Weak topic lookup error: {e}")
        return all_topics


def _static_questions() -> List[Dict]:
    return [
        {"id": "q1", "difficulty": "easy",
         "headline": "Scientists discover water on Mars",
         "correct_answer": "REAL",
         "explanation": "NASA confirmed water ice on Mars in peer-reviewed studies."},
        {"id": "q2", "difficulty": "easy",
         "headline": "Drinking bleach cures all diseases!!",
         "correct_answer": "FAKE",
         "explanation": "Dangerous health misinformation. Bleach is toxic."},
        {"id": "q3", "difficulty": "medium",
         "headline": "Study shows moderate coffee consumption linked to longer lifespan",
         "correct_answer": "REAL",
         "explanation": "Multiple large-scale studies support this."},
        {"id": "q4", "difficulty": "hard",
         "headline": "Experts say 5G causes COVID-19, mainstream media won't cover it",
         "correct_answer": "FAKE",
         "explanation": "Debunked conspiracy theory. 5G and COVID-19 are unrelated."},
    ]


@app.route("/api/quiz/questions", methods=["GET"])
def get_quiz_questions():
    """
    Adaptive question selection:
    1. Queries quiz_candidates pool (auto-generated from /api/predict)
    2. Prioritises topics where this user has lowest accuracy
    3. Mixes in borderline-confidence questions (0.4-0.65) for challenge
    4. Falls back to static questions if pool is empty
    """
    try:
        user_id  = get_current_user_id()
        limit    = min(int(request.args.get("limit", 10)), 20)
        diff     = request.args.get("difficulty", "mixed")

        questions = []

        if mongo_db is not None:
            now = datetime.utcnow()
            base_filter = {"expires_at": {"$gt": now}, "prediction": {"$in": ["REAL", "FAKE"]}}

            if diff != "mixed":
                # Map difficulty to confidence bands
                conf_bands = {
                    "easy":   {"$gte": 0.90},
                    "medium": {"$gte": 0.70, "$lt": 0.90},
                    "hard":   {"$gte": 0.50, "$lt": 0.70},
                }
                if diff in conf_bands:
                    base_filter["confidence"] = conf_bands[diff]

            # Get user weak topics for personalised selection
            weak_topics = _get_user_weak_topics(user_id) if user_id else list(_TOPIC_KEYWORDS.keys())

            selected_ids = set()
            qs_raw       = []

            # Phase 1: target weak topics (70% of limit)
            target_count = max(1, int(limit * 0.7))
            for topic in weak_topics:
                if len(qs_raw) >= target_count:
                    break
                topic_filter = {**base_filter, "topic": topic, "_id": {"$nin": list(selected_ids)}}
                batch = list(
                    mongo_db.quiz_candidates
                    .find(topic_filter)
                    .sort("used_count", 1)   # least-shown first
                    .limit(target_count - len(qs_raw))
                )
                for q in batch:
                    selected_ids.add(q["_id"])
                    qs_raw.append(q)

            # Phase 2: fill remainder from any topic (or borderline for challenge)
            remain = limit - len(qs_raw)
            if remain > 0:
                fill_filter = {**base_filter, "_id": {"$nin": list(selected_ids)}}
                # Mix in uncertain predictions for extra challenge
                fill_filter["confidence"] = {"$lt": 0.80}
                batch = list(
                    mongo_db.quiz_candidates
                    .find(fill_filter)
                    .sort("used_count", 1)
                    .limit(remain)
                )
                for q in batch:
                    selected_ids.add(q["_id"])
                    qs_raw.append(q)

            # Phase 3: if still not enough, grab high-confidence from any topic
            if len(qs_raw) < limit:
                fill_filter = {**base_filter, "_id": {"$nin": list(selected_ids)}}
                batch = list(
                    mongo_db.quiz_candidates
                    .find(fill_filter)
                    .sort("used_count", 1)
                    .limit(limit - len(qs_raw))
                )
                qs_raw.extend(batch)

            # Increment used_count for selected candidates
            if selected_ids:
                mongo_db.quiz_candidates.update_many(
                    {"_id": {"$in": list(selected_ids)}},
                    {"$inc": {"used_count": 1}}
                )

            # Shape output — include candidate_id so submit can reference it
            for q in qs_raw:
                conf  = q.get("confidence", 0.9)
                # Map confidence to difficulty label
                if conf >= 0.90:   diff_label = "easy"
                elif conf >= 0.70: diff_label = "medium"
                else:              diff_label = "hard"

                questions.append({
                    "id":             str(q["_id"]),
                    "candidate_id":   str(q["_id"]),
                    "headline":       q["headline"],
                    "correct_answer": q["prediction"],
                    "topic":          q.get("topic", "general"),
                    "difficulty":     diff_label,
                    "explanation":    q.get("explanation", ""),
                    "source":         "ai_generated",
                    # Include key signal hints (educational)
                    "signals": {
                        "nlp_confidence":         round(q.get("component_results", {}).get("nlp", {}).get("confidence", 0), 2),
                        "transformer_confidence": round(q.get("component_results", {}).get("transformer", {}).get("confidence", 0), 2),
                    }
                })

        # Fallback to static questions if pool empty
        if not questions:
            questions = _static_questions()[:limit]

        return jsonify({
            "questions":   questions,
            "count":       len(questions),
            "personalised": bool(user_id and mongo_db is not None),
            "source":      "adaptive_pool" if questions and questions[0].get("source") == "ai_generated" else "static",
        }), 200

    except Exception as e:
        logger.error(f"Quiz questions error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/quiz/submit", methods=["POST"])
def submit_quiz():
    """
    Records answer, awards points, and — when consensus is reached across
    multiple users — feeds the headline back into the ensemble as training data.

    Body: {
      question_id: str,          # MongoDB _id of quiz_candidate (or static "q1" etc)
      answer: "REAL" | "FAKE",
      candidate_id: str,         # same as question_id for AI-generated questions
    }
    """
    try:
        user_id  = get_current_user_id()
        d        = request.get_json() or {}
        q_id     = d.get("question_id", "").strip()
        answer   = (d.get("answer") or "").upper().strip()
        cand_id  = d.get("candidate_id", "").strip()

        if not q_id or answer not in ("REAL", "FAKE"):
            return jsonify({"error": "question_id and valid answer (REAL|FAKE) required"}), 400

        correct     = None
        explanation = ""
        topic       = "general"
        is_candidate = False
        cand_oid    = None

        # Try to resolve from quiz_candidates first
        if mongo_db is not None and (cand_id or q_id):
            try:
                lookup_id = cand_id or q_id
                cand_oid  = ObjectId(lookup_id)
                doc = mongo_db.quiz_candidates.find_one({"_id": cand_oid})
                if doc:
                    correct      = doc.get("prediction")
                    explanation  = doc.get("explanation", "")
                    topic        = doc.get("topic", "general")
                    is_candidate = True
            except Exception:
                pass  # not a valid ObjectId — fall through to static

        # Fallback to static questions
        if correct is None and mongo_db is not None:
            doc = mongo_db.quiz_questions.find_one({"id": q_id})
            if doc:
                correct     = doc.get("correct_answer")
                explanation = doc.get("explanation", "")

        if correct is None:
            for q in _static_questions():
                if q["id"] == q_id:
                    correct     = q["correct_answer"]
                    explanation = q.get("explanation", "")
                    break

        if correct is None:
            return jsonify({"error": "Question not found"}), 404

        is_correct = answer == correct
        # Dynamic points: harder questions (lower candidate confidence) worth more
        pts = 10 if is_correct else 0

        if user_id and mongo_db is not None:
            # Log attempt with topic for personalisation
            attempt_doc = {
                "userId":      user_id,
                "question_id": q_id,
                "answer":      answer,
                "is_correct":  is_correct,
                "topic":       topic,
                "points":      pts,
                "timestamp":   datetime.utcnow(),
            }
            if cand_oid:
                attempt_doc["candidate_id"] = cand_oid

            mongo_insert_one("quiz_attempts", attempt_doc)

            mongo_db.user_stats.update_one(
                {"userId": user_id},
                {"$inc": {
                    "totalPoints":   pts,
                    "totalAttempts": 1,
                    "correctAnswers": 1 if is_correct else 0,
                    f"topic_attempts.{topic}": 1,
                    f"topic_correct.{topic}":  1 if is_correct else 0,
                }},
                upsert=True,
            )

        # Push response to candidate and check for consensus
        if is_candidate and cand_oid and mongo_db is not None:
            try:
                mongo_db.quiz_candidates.update_one(
                    {"_id": cand_oid},
                    {"$push": {"responses": {
                        "user_id":    user_id,
                        "answer":     answer,
                        "is_correct": is_correct,
                        "timestamp":  datetime.utcnow(),
                    }}}
                )
                # Check consensus in background (synchronous but fast)
                _check_candidate_consensus(cand_oid)
            except Exception as e:
                logger.warning(f"Candidate response update error: {e}")

        # Build educational explanation for the response
        detector_says = f"Our detector classified this as {correct} with high confidence."
        full_explanation = explanation or detector_says

        return jsonify({
            "is_correct":       is_correct,
            "correct_answer":   correct,
            "points_earned":    pts,
            "explanation":      full_explanation,
            "topic":            topic,
            "educational_note": (
                "This question was generated from a real headline analysed by Veritas AI."
                if is_candidate else
                "This is a curated example question."
            ),
        }), 200

    except Exception as e:
        logger.error(f"Quiz submit error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/quiz/user-stats", methods=["GET"])
def quiz_user_stats():
    """Per-topic accuracy breakdown for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401
    try:
        stats = mongo_db.user_stats.find_one({"userId": user_id}, {"_id": 0}) if mongo_db is not None else {}
        if not stats:
            return jsonify({"stats": {}, "topic_accuracy": {}}), 200

        topic_attempts = stats.get("topic_attempts", {})
        topic_correct  = stats.get("topic_correct",  {})
        topic_accuracy = {
            t: round(topic_correct.get(t, 0) / max(topic_attempts.get(t, 1), 1), 3)
            for t in topic_attempts
        }
        weak_topics = sorted(topic_accuracy, key=topic_accuracy.get)

        return jsonify({
            "total_points":   stats.get("totalPoints", 0),
            "total_attempts": stats.get("totalAttempts", 0),
            "correct_answers":stats.get("correctAnswers", 0),
            "overall_accuracy": round(
                stats.get("correctAnswers", 0) / max(stats.get("totalAttempts", 1), 1), 3
            ),
            "topic_accuracy": topic_accuracy,
            "weak_topics":    weak_topics[:3],
            "badges":         stats.get("badges", []),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quiz/pool-stats", methods=["GET"])
def quiz_pool_stats():
    """Admin view of the candidate pool health."""
    try:
        if mongo_db is None:
            return jsonify({"error": "MongoDB not configured"}), 503
        total      = mongo_db.quiz_candidates.count_documents({})
        active     = mongo_db.quiz_candidates.count_documents({"expires_at": {"$gt": datetime.utcnow()}})
        with_consensus = mongo_db.quiz_candidates.count_documents({"consensus_label": {"$ne": None}})
        by_topic   = list(mongo_db.quiz_candidates.aggregate([
            {"$group": {"_id": "$topic", "count": {"$sum": 1}}}
        ]))
        by_pred    = list(mongo_db.quiz_candidates.aggregate([
            {"$group": {"_id": "$prediction", "count": {"$sum": 1}}}
        ]))
        return jsonify({
            "total_candidates":      total,
            "active_candidates":     active,
            "with_consensus":        with_consensus,
            "by_topic":              {r["_id"]: r["count"] for r in by_topic},
            "by_prediction":         {r["_id"]: r["count"] for r in by_pred},
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/quiz/leaderboard", methods=["GET"])
def quiz_leaderboard():
    try:
        if mongo_db is None:
            return jsonify({"leaderboard": []}), 200
        limit = min(int(request.args.get("limit", 10)), 50)
        board = list(
            mongo_db.user_stats
            .find({}, {"_id": 0, "userId": 1, "totalPoints": 1, "correctAnswers": 1})
            .sort("totalPoints", -1).limit(limit)
        )
        return jsonify({"leaderboard": board}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------------------------
#  CHATBOT
# -------------------------------------------------------------------------

@app.route("/api/chatbot/message", methods=["POST"])
def chatbot_message():
    try:
        if not openai.api_key:
            return jsonify({"error": "OpenAI not configured", "response": "AI chatbot unavailable."}), 503
        d       = request.get_json() or {}
        message = (d.get("message") or "").strip()
        if not message:
            return jsonify({"error": "message required"}), 400
        history  = d.get("history", [])
        messages = [{
            "role": "system",
            "content": (
                "You are Veritas, an expert AI assistant specialising in media literacy "
                "and fake-news detection. Help users verify claims and think critically "
                "about news sources. Be concise, factual, and educational."
            )
        }]
        for t in history[-6:]:
            if t.get("role") in ("user", "assistant"):
                messages.append({"role": t["role"], "content": t["content"]})
        messages.append({"role": "user", "content": message})
        resp  = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=messages,
                                             max_tokens=500, temperature=0.7)
        reply = resp.choices[0].message["content"].strip()
        return jsonify({"response": reply, "model": "gpt-3.5-turbo"}), 200
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return jsonify({"error": "Chatbot error", "response": "An error occurred. Please try again."}), 500


@app.route("/api/chatbot/scenarios", methods=["GET"])
def get_scenarios():
    return jsonify({"scenarios": [
        {"id": 1, "title": "Viral Social Media Post",
         "scenario": 'A post claims "Scientists confirm 5G causes COVID-19!" with 50K shares.',
         "steps": ["Check the source", "Find the original study", "Cross-reference fact-checkers", "Check scientific consensus"],
         "redFlags": ["Sensational claim", "No source cited", "Contradicts science"],
         "verdict": "FAKE"},
        {"id": 2, "title": "Breaking News Alert",
         "scenario": "BREAKING: Major policy change announced by government!",
         "steps": ["Check multiple outlets", "Look for official sources", "Verify with independent sources"],
         "redFlags": ["Only one source", "No official confirmation", "Vague details"],
         "verdict": "UNVERIFIED"},
        {"id": 3, "title": "Emotional Story",
         "scenario": "Elderly woman loses life savings to scam - share to warn others!",
         "steps": ["Verify with local news", "Look for specific details", "Be cautious of share requests"],
         "redFlags": ["Emotional manipulation", "Requests for shares", "Vague details"],
         "verdict": "SUSPICIOUS"},
    ], "count": 3}), 200


# -------------------------------------------------------------------------
#  BADGE SYSTEM
# -------------------------------------------------------------------------

def check_and_award_badges(user_id: str, db):
    if not user_id or db is None:
        return
    try:
        stats  = db.user_stats.find_one({"userId": user_id})
        total  = db.quiz_attempts.count_documents({"userId": user_id})
        corr   = db.quiz_attempts.count_documents({"userId": user_id, "is_correct": True})
        streak = (stats or {}).get("currentStreak", 0)
        for name, met, pts in [
            ("First Steps",   total >= 1,    10),
            ("Quiz Novice",   total >= 10,   50),
            ("Truth Seeker",  total >= 50,  100),
            ("Fact Master",   total >= 100, 200),
            ("Perfect Score", corr  >= 10,  150),
            ("Streak Master", streak >= 7,  100),
        ]:
            if met and not db.user_badges.find_one({"userId": user_id, "badgeName": name}):
                db.user_badges.insert_one({"userId": user_id, "badgeName": name, "earnedAt": datetime.utcnow()})
                db.user_stats.update_one(
                    {"userId": user_id},
                    {"$inc": {"badgesEarned": 1, "totalPoints": pts}, "$push": {"badges": name}},
                )
    except Exception as e:
        logger.error(f"Badge check error: {e}")


# =========================================================================
#  ERROR HANDLERS
# =========================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "available": [
            "/api/predict (POST)", "/api/feedback (POST)",
            "/api/verify-url (POST)", "/api/compare-sources (POST)",
            "/api/history (GET)", "/api/stats (GET)",
            "/api/news (GET)", "/api/trending (GET)",
            "/api/quiz/questions (GET)", "/api/quiz/submit (POST)",
            "/api/quiz/leaderboard (GET)", "/api/quiz/user-stats (GET)",
            "/api/quiz/pool-stats (GET)",
            "/api/chatbot/message (POST)", "/api/chatbot/scenarios (GET)",
            "/api/report (POST)", "/api/health (GET)",
            "/api/admin/retrain (POST)",
        ],
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed", "hint": "Check GET vs POST"}), 405


# =========================================================================
#  ENTRY POINT
# =========================================================================

if __name__ == "__main__":
    host  = os.getenv("HOST",  "0.0.0.0")
    port  = int(os.getenv("PORT",  "8000"))
    debug = os.getenv("DEBUG", "True").lower() == "true"

    logger.info("=" * 65)
    logger.info("  VERITAS AI v4.1.0 - Self-Improving Adaptive Quiz Engine")
    logger.info("=" * 65)
    logger.info(f"  Server    : http://{host}:{port}")
    logger.info(f"  MongoDB   : {'connected' if mongo_db is not None else 'not connected'}")
    logger.info(f"  Ensemble  : {'learned (sklearn)' if SKLEARN_AVAILABLE else 'weighted fallback'}")
    logger.info(f"  Transform : {'loaded' if TRANSFORMER_MODELS_AVAILABLE else 'not loaded'}")
    logger.info(f"  NewsAPI   : {'configured' if newsapi else 'not configured'}")
    logger.info(f"  Twitter   : {'configured' if source_verifier.twitter_bearer_token else 'not configured'}")
    logger.info(f"  Google    : {'configured' if source_verifier.google_api_key else 'not configured'}")
    logger.info(f"  OpenAI    : {'configured' if openai.api_key else 'not configured'}")
    logger.info("=" * 65)
    logger.info("  Recommended: gunicorn app:app --workers 2 --threads 4 --timeout 120")
    logger.info("=" * 65)

    app.run(debug=debug, host=host, port=port, use_reloader=False)
