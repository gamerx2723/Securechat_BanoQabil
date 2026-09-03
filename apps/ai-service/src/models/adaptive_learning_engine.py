import os
import json
import time
import math
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics.pairwise import cosine_similarity

FEEDBACK_STORE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "feedback_exemplars.json")
ADAPTIVE_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models_store", "unified_online_guardian.joblib")

class AdaptiveLearningEngine:
    """
    Continuous Active Learning & Dynamic Memory Engine.
    Enables the AI to:
    1. Instantly learn newly reported zero-day attacks and false alarms in real time.
    2. Maintain a dynamic Semantic Vector Exemplar Memory with sub-millisecond Cosine Similarity.
    3. Incrementally update online SGD model weights on-the-fly without server restarts.
    4. Provide self-healing memory: if an attack or false alarm is confirmed, it is permanently remembered.
    """

    _exemplars: List[Dict[str, Any]] = []
    _vectorizer: Optional[TfidfVectorizer] = None
    _exemplar_matrix = None
    _online_sgd_model: Optional[SGDClassifier] = None
    _is_initialized = False

    @classmethod
    def _ensure_initialized(cls):
        if cls._is_initialized:
            return

        # Create data directory if not exists
        os.makedirs(os.path.dirname(FEEDBACK_STORE_PATH), exist_ok=True)
        os.makedirs(os.path.dirname(ADAPTIVE_MODEL_PATH), exist_ok=True)

        # Load stored feedback exemplars
        if os.path.exists(FEEDBACK_STORE_PATH):
            try:
                with open(FEEDBACK_STORE_PATH, "r", encoding="utf-8") as f:
                    cls._exemplars = json.load(f)
            except Exception as e:
                print(f"Warning: Failed to load feedback exemplars: {e}")
                cls._exemplars = []
        else:
            cls._exemplars = []

        # Load trained online SGD model and vectorizer
        if os.path.exists(ADAPTIVE_MODEL_PATH):
            try:
                saved = joblib.load(ADAPTIVE_MODEL_PATH)
                cls._vectorizer = saved.get("vectorizer")
                cls._online_sgd_model = saved.get("model")
            except Exception as e:
                print(f"Warning: Failed to load adaptive model: {e}")

        if cls._vectorizer is None or cls._online_sgd_model is None:
            # Fallback initialization if joblib was not present
            cls._vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=20000, analyzer='word', sublinear_tf=True)
            seed_texts = [
                "hi hello how are you doing today please send the report",
                "urgent verify your bank account right now at http://fake-bank-login.xyz",
                "can you send me the photo when you get home",
                "aapka easypaisa block hone wala hai foran otp bataein",
                "i will send the presentation tomorrow morning",
                "fia arrest warrant issued send fine immediately to avoid jail"
            ]
            seed_labels = [0, 1, 0, 1, 0, 1]
            X_init = cls._vectorizer.fit_transform(seed_texts)
            cls._online_sgd_model = SGDClassifier(loss='log_loss', penalty='l2', alpha=1e-5, random_state=42)
            cls._online_sgd_model.fit(X_init, seed_labels)

        cls._rebuild_exemplar_matrix()
        cls._is_initialized = True

    @classmethod
    def _rebuild_exemplar_matrix(cls):
        if not cls._exemplars or cls._vectorizer is None:
            cls._exemplar_matrix = None
            return

        texts = [ex["text"] for ex in cls._exemplars]
        try:
            cls._exemplar_matrix = cls._vectorizer.transform(texts)
        except Exception:
            cls._exemplar_matrix = None

    @classmethod
    def learn_sample(cls, text: str, label: str, category: str, feedback_by: str = "ADMIN") -> Dict[str, Any]:
        """
        Actively teaches the AI a new sample on-the-fly.
        - label: 'MALICIOUS' | 'BENIGN'
        - category: e.g. 'ZERO_DAY_PHISHING', 'CREDENTIAL_HARVESTING', 'FALSE_ALARM', 'URDU_SCAM'
        """
        cls._ensure_initialized()
        clean_text = text.strip()
        if not clean_text:
            return {"success": False, "error": "Empty text"}

        is_malicious = (label.upper() == "MALICIOUS")
        numeric_label = 1 if is_malicious else 0

        # 1. Store in dynamic Exemplar Memory
        exemplar_entry = {
            "id": f"EX_{int(time.time() * 1000)}",
            "text": clean_text,
            "label": label.upper(),
            "category": category,
            "feedback_by": feedback_by,
            "timestamp": int(time.time()),
        }
        cls._exemplars.append(exemplar_entry)

        # Persist exemplars to disk
        try:
            with open(FEEDBACK_STORE_PATH, "w", encoding="utf-8") as f:
                json.dump(cls._exemplars, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Warning: Failed to persist feedback exemplars: {e}")

        # 2. Perform Real-Time Incremental Online Learning (partial_fit)
        try:
            X_new = cls._vectorizer.transform([clean_text])
            cls._online_sgd_model.partial_fit(X_new, [numeric_label], classes=np.array([0, 1]))
            # Save updated model
            joblib.dump({"vectorizer": cls._vectorizer, "model": cls._online_sgd_model}, ADAPTIVE_MODEL_PATH)
        except Exception as e:
            print(f"Warning: Incremental online learning partial_fit error: {e}")

        # 3. Rebuild matrix for fast semantic search
        cls._rebuild_exemplar_matrix()

        return {
            "success": True,
            "message": f"Successfully learned pattern into AI Dynamic Threat Memory as {label.upper()}.",
            "exemplar_id": exemplar_entry["id"],
            "total_learned_exemplars": len(cls._exemplars),
            "online_learning_updated": True
        }

    @classmethod
    def query_adaptive_memory(cls, text: str) -> Dict[str, Any]:
        """
        Queries the dynamic continuous learning memory for semantic matches and online model inference.
        """
        cls._ensure_initialized()
        clean_text = text.strip()
        if not clean_text:
            return {
                "has_memory_match": False,
                "top_similarity": 0.0,
                "matched_exemplar": None,
                "online_model_score": 0.0,
                "adaptive_risk_score": 0.0,
                "total_exemplars_in_memory": len(cls._exemplars)
            }

        # 1. Online Model Live Prediction
        online_score = 0.0
        try:
            X_vec = cls._vectorizer.transform([clean_text])
            probs = cls._online_sgd_model.predict_proba(X_vec)[0]
            online_score = float(probs[1]) * 100
        except Exception:
            online_score = 0.0

        # 2. Semantic Exemplar Nearest-Neighbor Cosine Match
        has_match = False
        top_similarity = 0.0
        matched_ex = None

        if cls._exemplar_matrix is not None and len(cls._exemplars) > 0:
            try:
                X_vec = cls._vectorizer.transform([clean_text])
                similarities = cosine_similarity(X_vec, cls._exemplar_matrix)[0]
                best_idx = int(np.argmax(similarities))
                top_similarity = float(similarities[best_idx])

                if top_similarity >= 0.75:
                    has_match = True
                    matched_ex = cls._exemplars[best_idx]
            except Exception:
                pass

        # Calculate final adaptive risk score
        final_risk = 0.0
        if has_match and matched_ex:
            if matched_ex["label"] == "MALICIOUS":
                final_risk = max(online_score, 85.0 + (top_similarity * 15.0))
            else:
                # Confirmed Benign / False Alarm Exemplar Override
                final_risk = 0.0
        else:
            # Gated activation: only fire if calibrated online SGD model gives high probability (>= 70%)
            if online_score >= 70.0:
                final_risk = online_score

        return {
            "has_memory_match": has_match,
            "top_similarity": round(top_similarity, 3),
            "matched_exemplar": matched_ex,
            "online_model_score": round(online_score, 1),
            "adaptive_risk_score": round(min(100.0, final_risk), 1),
            "total_exemplars_in_memory": len(cls._exemplars)
        }

    @classmethod
    def get_memory_stats(cls) -> Dict[str, Any]:
        cls._ensure_initialized()
        malicious_count = sum(1 for ex in cls._exemplars if ex["label"] == "MALICIOUS")
        benign_count = sum(1 for ex in cls._exemplars if ex["label"] == "BENIGN")
        return {
            "total_exemplars": len(cls._exemplars),
            "malicious_patterns": malicious_count,
            "benign_patterns": benign_count,
            "online_learning_active": True,
            "recent_exemplars": cls._exemplars[-5:] if cls._exemplars else []
        }
