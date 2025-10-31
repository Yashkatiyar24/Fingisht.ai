
from typing import List
import re
import os
import json
from collections import Counter, defaultdict

# Defer heavy imports (scikit-learn) so the module can import in lightweight envs.
HAS_SKLEARN = False
try:
    # import only if available
    from sklearn.pipeline import Pipeline  # type: ignore
    from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore
    from sklearn.linear_model import LogisticRegression  # type: ignore
    from sklearn.preprocessing import LabelEncoder  # type: ignore
    HAS_SKLEARN = True
except Exception:
    HAS_SKLEARN = False

MODEL_PATH = 'ai_model.joblib'


def preprocess_text(text: str) -> str:
    # simple normalisation
    text = (text or '')
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# Prefer joblib for compatibility, but fall back to pickle/json if unavailable.
try:
    import joblib  # type: ignore
    _HAS_JOBLIB = True
except Exception:
    import pickle as _pickle
    _HAS_JOBLIB = False


if HAS_SKLEARN:
    # Original sklearn-backed model
    class CategoryModel:
        def __init__(self):
            self.le = LabelEncoder()
            self.pipeline = Pipeline([
                ('tfidf', TfidfVectorizer(preprocessor=preprocess_text, ngram_range=(1, 2), max_features=20000)),
                ('clf', LogisticRegression(max_iter=200))
            ])

        def fit(self, texts: List[str], labels: List[str]):
            y = self.le.fit_transform(labels)
            self.pipeline.fit(texts, y)

        def predict(self, texts: List[str]) -> List[str]:
            preds = self.pipeline.predict(texts)
            return self.le.inverse_transform(preds)

        def predict_proba(self, texts: List[str]):
            if hasattr(self.pipeline.named_steps['clf'], 'predict_proba'):
                probs = self.pipeline.predict_proba(texts)
                return probs
            return None

        def save(self, path: str = MODEL_PATH):
            if _HAS_JOBLIB:
                joblib.dump({'le': self.le, 'pipeline': self.pipeline}, path)
            else:
                with open(path, 'wb') as fh:
                    _pickle.dump({'le': self.le, 'pipeline': self.pipeline}, fh)

        @classmethod
        def load(cls, path: str = MODEL_PATH):
            if not os.path.exists(path):
                raise FileNotFoundError(path)
            if _HAS_JOBLIB:
                obj = joblib.load(path)
            else:
                with open(path, 'rb') as fh:
                    obj = _pickle.load(fh)
            inst = cls()
            inst.le = obj['le']
            inst.pipeline = obj['pipeline']
            return inst

else:
    # Lightweight fallback: token overlap + label priors. Good enough for demo/testing.
    class CategoryModel:
        def __init__(self):
            # token counts per label
            self.label_token_counts = defaultdict(Counter)
            # document counts per label
            self.label_doc_counts = Counter()
            self.labels = []
            self.total_docs = 0

        def _tokens(self, text: str):
            t = preprocess_text(text)
            if not t:
                return []
            return t.split()

        def fit(self, texts: List[str], labels: List[str]):
            for txt, lab in zip(texts, labels):
                self.label_doc_counts[lab] += 1
                self.total_docs += 1
                for tok in set(self._tokens(txt)):
                    self.label_token_counts[lab][tok] += 1
            self.labels = list(self.label_doc_counts.keys())

        def predict(self, texts: List[str]) -> List[str]:
            preds = []
            for txt in texts:
                toks = self._tokens(txt)
                if not toks or not self.labels:
                    preds.append('')
                    continue
                scores = {}
                for lab in self.labels:
                    # prior: proportion of docs
                    prior = self.label_doc_counts[lab] / max(1, self.total_docs)
                    score = prior
                    # token match score
                    for tok in toks:
                        score += self.label_token_counts[lab].get(tok, 0)
                    scores[lab] = score
                # pick best label
                best = max(scores.items(), key=lambda x: x[1])[0]
                preds.append(best)
            return preds

        def predict_proba(self, texts: List[str]):
            out = []
            for txt in texts:
                toks = self._tokens(txt)
                if not toks or not self.labels:
                    out.append([])
                    continue
                scores = []
                for lab in self.labels:
                    prior = self.label_doc_counts[lab] / max(1, self.total_docs)
                    score = prior
                    for tok in toks:
                        score += self.label_token_counts[lab].get(tok, 0)
                    scores.append(score)
                # normalize
                ssum = sum(scores) or 1.0
                probs = [s / ssum for s in scores]
                out.append(probs)
            return out

        def save(self, path: str = MODEL_PATH):
            data = {
                'fallback': True,
                'labels': self.labels,
                'label_doc_counts': dict(self.label_doc_counts),
                'label_token_counts': {k: dict(v) for k, v in self.label_token_counts.items()},
                'total_docs': self.total_docs,
            }
            if _HAS_JOBLIB:
                joblib.dump(data, path)
            else:
                with open(path, 'w', encoding='utf-8') as fh:
                    json.dump(data, fh)

        @classmethod
        def load(cls, path: str = MODEL_PATH):
            if not os.path.exists(path):
                raise FileNotFoundError(path)
            # Try joblib first (it may have been saved by the sklearn-backed model)
            data = None
            if _HAS_JOBLIB:
                try:
                    data = joblib.load(path)
                except Exception:
                    data = None
            if data is None:
                # try json or pickle
                try:
                    with open(path, 'r', encoding='utf-8') as fh:
                        data = json.load(fh)
                except Exception:
                    try:
                        with open(path, 'rb') as fh:
                            data = _pickle.load(fh)
                    except Exception as e:
                        raise RuntimeError('Unable to load model file: ' + str(e))

            # If the saved object looks like sklearn pipeline dict, we can't load it without sklearn
            if isinstance(data, dict) and data.get('fallback'):
                inst = cls()
                inst.labels = data.get('labels', [])
                inst.label_doc_counts = Counter(data.get('label_doc_counts', {}))
                ltc = data.get('label_token_counts', {})
                inst.label_token_counts = defaultdict(Counter, {k: Counter(v) for k, v in ltc.items()})
                inst.total_docs = data.get('total_docs', 0)
                return inst
            else:
                # We couldn't interpret the file as fallback format. If sklearn is available this may work,
                # otherwise signal the caller to retrain with a compatible model.
                raise RuntimeError('Saved model is not compatible with fallback loader; please install scikit-learn or retrain.')

