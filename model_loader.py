git add model_loader.py requirements.txt
git commit -m "remove transformer model - run on free tier without OOM"
git push"""
model_loader.py - Transformer model disabled (free tier deployment)
App runs on scikit-learn ensemble + NLP + NewsAPI + sentiment analysis.
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class FakeNewsDetectorModels:
    def __init__(self, model_dir: Optional[str] = None):
        self._available = False
        logger.info("Transformer model disabled - using scikit-learn ensemble")

    def available(self) -> bool:
        return False

    def predict(self, text: str) -> Dict[str, Any]:
        return {
            "prediction": "UNAVAILABLE",
            "confidence": 0.0,
            "fake_probability": 0.0,
            "real_probability": 0.0,
            "success": False,
        }


# Global singleton used by app.py
model_detector = FakeNewsDetectorModels()
