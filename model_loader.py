"""
model_loader.py - Transformer Model Loader for Fake News Detection

Architecture matches Colab training exactly:
  - OptimizedTransformerModel (AutoModel + Dropout + Linear head)
  - BertRobertaEnsemble (60% RoBERTa, 40% BERT)
  - Weights loaded from best_roberta.pt and best_bert.pt

Saved checkpoint format (from Colab Cell 37):
  torch.save({
      "roberta": roberta_model.state_dict(),
      "bert":    bert_model.state_dict(),
      "weights": [0.6, 0.4]
  }, final_model_path)
"""

import os
import logging
from typing import Dict, Any, Optional

import torch
import torch.nn as nn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Label map matches Colab: 0 = FAKE, 1 = REAL ───────────────────────────
# (true_df['label'] = 1, fake_df['label'] = 0)
LABEL_MAP = {0: "FAKE", 1: "REAL"}

# ── Optional transformers import ───────────────────────────────────────────
TRANSFORMERS_AVAILABLE = False
try:
    from transformers import AutoModel, AutoTokenizer  # type: ignore
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger.warning("transformers not installed — models disabled.")


# ══════════════════════════════════════════════════════════════════════════════
# Model architecture — must match Colab Cell 32 EXACTLY
# ══════════════════════════════════════════════════════════════════════════════

class OptimizedTransformerModel(nn.Module):
    """
    Matches the architecture trained in Colab.

    Structure:
        AutoModel (backbone)  →  Dropout(0.3)  →  Linear(hidden, 2)

    The CLS token (outputs[0][:, 0, :]) is used as the pooled representation,
    identical to what was used during training.
    """

    def __init__(self, model_name: str, num_classes: int = 2, dropout_rate: float = 0.3):
        super().__init__()
        self.model_name = model_name
        self.transformer = AutoModel.from_pretrained(model_name)
        hidden_size = self.transformer.config.hidden_size  # 768 for base models
        self.dropout = nn.Dropout(dropout_rate)
        self.classifier = nn.Linear(hidden_size, num_classes)

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        outputs = self.transformer(input_ids=input_ids, attention_mask=attention_mask)
        cls_token = outputs[0][:, 0, :]   # CLS token — same as training
        cls_token = self.dropout(cls_token)
        return self.classifier(cls_token)


# ══════════════════════════════════════════════════════════════════════════════
# Ensemble — matches Colab Cell 34 EXACTLY
# ══════════════════════════════════════════════════════════════════════════════

class BertRobertaEnsemble:
    """
    Weighted soft-voting ensemble.
    Weights: 60% RoBERTa + 40% BERT  (stored in checkpoint under "weights").
    """

    def __init__(
        self,
        roberta_model: OptimizedTransformerModel,
        bert_model: OptimizedTransformerModel,
        roberta_tokenizer,
        bert_tokenizer,
        device: torch.device,
        roberta_weight: float = 0.6,
        bert_weight: float = 0.4,
    ):
        self.roberta = roberta_model
        self.bert = bert_model
        self.roberta_tok = roberta_tokenizer
        self.bert_tok = bert_tokenizer
        self.device = device
        self.roberta_weight = roberta_weight
        self.bert_weight = bert_weight

        self.roberta.eval()
        self.bert.eval()

    def _get_probs(self, model: OptimizedTransformerModel, tokenizer, text: str):
        """Tokenize + forward pass → softmax probabilities (numpy [2])."""
        enc = tokenizer(
            text,
            max_length=256,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        input_ids = enc["input_ids"].to(self.device)
        attention_mask = enc["attention_mask"].to(self.device)

        with torch.no_grad():
            logits = model(input_ids, attention_mask)
            return torch.softmax(logits, dim=1).cpu().numpy()[0]

    def predict(self, text: str) -> Dict[str, Any]:
        """Return prediction dict matching Colab Cell 34 output format."""
        p_roberta = self._get_probs(self.roberta, self.roberta_tok, text)
        p_bert    = self._get_probs(self.bert,    self.bert_tok,    text)

        # Weighted average of softmax probabilities
        probs = self.roberta_weight * p_roberta + self.bert_weight * p_bert

        # probs[0] = FAKE probability, probs[1] = REAL probability
        label_idx = int(probs.argmax())
        prediction = LABEL_MAP[label_idx]

        return {
            "prediction":       prediction,
            "confidence":       float(probs[label_idx]),
            "fake_probability": float(probs[0]),
            "real_probability": float(probs[1]),
            "success":          True,
        }


# ══════════════════════════════════════════════════════════════════════════════
# Main loader class
# ══════════════════════════════════════════════════════════════════════════════

class FakeNewsDetectorModels:
    """
    Loads trained weights from:
        best_roberta.pt  — RoBERTa state_dict
        best_bert.pt     — BERT state_dict

    Or, if the combined checkpoint exists:
        final_bert_roberta_ensemble.pt  — {"roberta": ..., "bert": ..., "weights": ...}

    Falls back gracefully to untrained base models with a clear warning
    so the app still starts; predictions will be random until real weights
    are present.
    """

    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            model_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_dir = model_dir
        self.ensemble: Optional[BertRobertaEnsemble] = None
        self._available = False

        if not TRANSFORMERS_AVAILABLE:
            logger.error("transformers not installed — cannot load models.")
            return

        self.device = self._get_device()
        logger.info("Using device: %s", self.device)

        self._load_ensemble()

    # ── Device selection ──────────────────────────────────────────────────

    @staticmethod
    def _get_device() -> torch.device:
        if torch.cuda.is_available():
            return torch.device("cuda")
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return torch.device("mps")
        return torch.device("cpu")

    # ── Weight loading helpers ────────────────────────────────────────────

    def _load_state_dict(
        self,
        model: OptimizedTransformerModel,
        path: str,
        model_name: str,
    ) -> bool:
        """
        Load a state_dict into model from path.
        Handles both bare state_dicts and nested checkpoint dicts.
        Returns True on success, False on any failure.
        """
        if not os.path.exists(path):
            logger.warning("⚠️  Weight file not found: %s", path)
            return False

        try:
            checkpoint = torch.load(path, map_location=self.device)

            # Unwrap common checkpoint wrappers
            if isinstance(checkpoint, dict):
                for key in ("model_state_dict", "state_dict", model_name):
                    if key in checkpoint:
                        checkpoint = checkpoint[key]
                        break
                # If no wrapper key found, assume the dict IS the state_dict

            missing, unexpected = model.load_state_dict(checkpoint, strict=False)

            if missing:
                logger.warning(
                    "%s — missing keys in checkpoint: %s", model_name, missing
                )
            if unexpected:
                logger.warning(
                    "%s — unexpected keys in checkpoint: %s", model_name, unexpected
                )

            if not missing and not unexpected:
                logger.info("✅ %s weights loaded perfectly (strict match)", model_name)
            else:
                logger.info(
                    "✅ %s weights loaded (non-strict: %d missing, %d unexpected)",
                    model_name, len(missing), len(unexpected),
                )

            return True

        except Exception as exc:
            logger.error("❌ Failed to load %s weights from %s: %s", model_name, path, exc)
            return False

    # ── Main loader ───────────────────────────────────────────────────────

    def _load_ensemble(self) -> None:
        """
        Loading strategy (tries in order):

        1. Combined checkpoint  final_bert_roberta_ensemble.pt
              keys: {"roberta": state_dict, "bert": state_dict, "weights": [r, b]}

        2. Separate checkpoints  best_roberta.pt  +  best_bert.pt

        3. Base pretrained weights only (untrained — warns loudly)
        """
        combined_path  = os.path.join(self.model_dir, "final_bert_roberta_ensemble.pt")
        roberta_path   = os.path.join(self.model_dir, "best_roberta.pt")
        bert_path      = os.path.join(self.model_dir, "best_bert.pt")

        # ── Initialise architecture ───────────────────────────────────────
        logger.info("Initialising RoBERTa architecture (roberta-base)…")
        roberta_model = OptimizedTransformerModel("roberta-base").to(self.device)

        logger.info("Initialising BERT architecture (bert-base-uncased)…")
        bert_model = OptimizedTransformerModel("bert-base-uncased").to(self.device)

        logger.info("Loading tokenizers…")
        roberta_tokenizer = AutoTokenizer.from_pretrained("roberta-base")
        bert_tokenizer    = AutoTokenizer.from_pretrained("bert-base-uncased")

        roberta_weight = 0.6
        bert_weight    = 0.4
        weights_loaded = False

        # ── Strategy 1: combined checkpoint ──────────────────────────────
        if os.path.exists(combined_path):
            logger.info("Found combined checkpoint: %s", combined_path)
            try:
                ckpt = torch.load(combined_path, map_location=self.device)

                if isinstance(ckpt, dict) and "roberta" in ckpt and "bert" in ckpt:
                    r_missing, r_unexpected = roberta_model.load_state_dict(
                        ckpt["roberta"], strict=False
                    )
                    b_missing, b_unexpected = bert_model.load_state_dict(
                        ckpt["bert"], strict=False
                    )

                    if not any([r_missing, r_unexpected, b_missing, b_unexpected]):
                        logger.info("✅ Both models loaded from combined checkpoint (strict match)")
                    else:
                        logger.info(
                            "✅ Combined checkpoint loaded (non-strict). "
                            "RoBERTa missing=%d unexpected=%d | "
                            "BERT missing=%d unexpected=%d",
                            len(r_missing), len(r_unexpected),
                            len(b_missing), len(b_unexpected),
                        )

                    # Restore ensemble weights if saved
                    if "weights" in ckpt:
                        roberta_weight, bert_weight = ckpt["weights"]
                        logger.info(
                            "Ensemble weights from checkpoint: RoBERTa=%.0f%% BERT=%.0f%%",
                            roberta_weight * 100, bert_weight * 100,
                        )

                    weights_loaded = True

                else:
                    logger.warning(
                        "Combined checkpoint exists but doesn't have 'roberta'/'bert' keys. "
                        "Keys found: %s — falling back to separate files.",
                        list(ckpt.keys()) if isinstance(ckpt, dict) else type(ckpt),
                    )

            except Exception as exc:
                logger.error("Failed to load combined checkpoint: %s", exc)

        # ── Strategy 2: separate .pt files ───────────────────────────────
        if not weights_loaded:
            r_ok = self._load_state_dict(roberta_model, roberta_path, "roberta")
            b_ok = self._load_state_dict(bert_model,    bert_path,    "bert")

            if r_ok and b_ok:
                weights_loaded = True
            elif r_ok or b_ok:
                loaded = "RoBERTa" if r_ok else "BERT"
                missing = "BERT" if r_ok else "RoBERTa"
                logger.warning(
                    "Only %s weights loaded; %s is using untrained base weights. "
                    "Predictions will be degraded.",
                    loaded, missing,
                )
                weights_loaded = True  # still usable, just warn

        # ── Strategy 3: untrained fallback ───────────────────────────────
        if not weights_loaded:
            logger.warning(
                "⚠️  NO TRAINED WEIGHTS FOUND. "
                "Looked for:\n"
                "  %s\n  %s\n  %s\n"
                "Models will produce RANDOM predictions. "
                "Place your .pt files in: %s",
                combined_path, roberta_path, bert_path, self.model_dir,
            )

        # ── Set eval mode ─────────────────────────────────────────────────
        roberta_model.eval()
        bert_model.eval()

        # ── Build ensemble ────────────────────────────────────────────────
        self.ensemble = BertRobertaEnsemble(
            roberta_model=roberta_model,
            bert_model=bert_model,
            roberta_tokenizer=roberta_tokenizer,
            bert_tokenizer=bert_tokenizer,
            device=self.device,
            roberta_weight=roberta_weight,
            bert_weight=bert_weight,
        )

        self._available = True
        logger.info(
            "✅ Ensemble ready — RoBERTa %.0f%% + BERT %.0f%% | device=%s | trained=%s",
            roberta_weight * 100, bert_weight * 100, self.device, weights_loaded,
        )

    # ── Public API ────────────────────────────────────────────────────────

    def available(self) -> bool:
        return self._available and self.ensemble is not None

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Predict whether text is FAKE or REAL.

        Returns:
            {
                "prediction":       "FAKE" | "REAL",
                "confidence":       float  (0–1),
                "fake_probability": float  (0–1),
                "real_probability": float  (0–1),
                "success":          bool,
            }
        """
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
            return self.ensemble.predict(text)
        except Exception as exc:
            logger.error("Prediction error: %s", exc, exc_info=True)
            return {
                "prediction": "ERROR",
                "confidence": 0.0,
                "fake_probability": 0.0,
                "real_probability": 0.0,
                "success": False,
            }


# ── Global singleton used by app.py ───────────────────────────────────────
model_detector = FakeNewsDetectorModels()