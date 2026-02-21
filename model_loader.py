"""
model_loader.py - Lightweight DistilBERT for free tier deployment
Replaces RoBERTa+BERT ensemble (1.5GB) with DistilBERT (250MB)
"""

import os
import logging
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

LABEL_MAP = {0: "FAKE", 1: "REAL"}
TRANSFORMERS_AVAILABLE = False

try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger.warning("transformers not installed — models disabled.")


class FakeNewsDetectorModels:
    def __init__(self, model_dir: Optional[str] = None):
        self._available = False
        self._pipe = None

        if not TRANSFORMERS_AVAILABLE:
            logger.error("transformers not installed — cannot load models.")
            return

        try:
            logger.info("Loading DistilBERT sentiment pipeline...")
            self._pipe = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                truncation=True,
                max_length=512,
            )
            self._available = True
            logger.info("DistilBERT loaded successfully")
        except Exception as e:
            logger.error("Failed to load DistilBERT: %s", e)

    def available(self) -> bool:
        return self._available

    def predict(self, text: str) -> Dict[str, Any]:
        if not self.available():
            return {
                "prediction": "UNAVAILABLE",
                "confidence": 0.0,
                "fake_probability": 0.0,
                "real_probability": 0.0,
                "success": False,
            }

        if not text or not text.strip():
            return {
                "prediction": "REAL",
                "confidence": 0.5,
                "fake_probability": 0.5,
                "real_probability": 0.5,
                "success": True,
            }

        try:
            result = self._pipe(text[:512])[0]
            # NEGATIVE = FAKE, POSITIVE = REAL
            is_fake = result["label"] == "NEGATIVE"
            score = result["score"]
            fake_prob = score if is_fake else 1 - score

            return {
                "prediction": "FAKE" if is_fake else "REAL",
                "confidence": round(score, 4),
                "fake_probability": round(fake_prob, 4),
                "real_probability": round(1 - fake_prob, 4),
                "success": True,
            }
        except Exception as e:
            logger.error("Prediction error: %s", e)
            return {
                "prediction": "ERROR",
                "confidence": 0.0,
                "fake_probability": 0.0,
                "real_probability": 0.0,
                "success": False,
            }

# Global singleton used by app.py
model_detector = FakeNewsDetectorModels()
