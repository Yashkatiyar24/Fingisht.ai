Python ML/NLP microservice (FastAPI)

Files:
- requirements.txt - Python dependencies
- model_utils.py - simple TF-IDF + LogisticRegression wrapper
- train.py - command-line training script
- app.py - FastAPI app that loads `ai_model.joblib` on startup and exposes `/predict`

Quick start (macOS):

1) Create and activate venv

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/ai/requirements.txt
```

2) Train the model using a labeled CSV

CSV should contain either `category_name` or `category_id`, plus `merchant` and/or `description` columns. Example:

Date,Amount,Merchant,Description,category_name
2024-01-15,45.50,Starbucks,Coffee,Coffee

```bash
python backend/ai/train.py --csv labeled_transactions.csv --model-out backend/ai/ai_model.joblib
```

3) Run the FastAPI service

```bash
uvicorn backend.ai.app:app --reload --port 8001
```

4) Predict from frontend (example POST body):

{
  "texts": ["starbucks latte coffee", "amazon books purchase"]
}

Response:

{
  "predictions": ["Coffee", "Books"]
}

Frontend integration:
- The frontend will attempt to call the ML service at the URL configured in the `VITE_ML_URL` environment variable.
- If `VITE_ML_URL` is not set the frontend falls back to `http://localhost:8001` by default.

Set `VITE_ML_URL` in your frontend `.env` or environment when running the dev server, e.g.:

```
VITE_ML_URL=http://localhost:8001

Troubleshooting (macOS / wheel build failures)
--------------------------------------------
If you see errors building scikit-learn or numpy (Cython / OpenMP compile errors) when running
`pip install -r backend/ai/requirements.txt`, it's usually because pip is attempting to compile
native extensions on your machine. Two safe options:

1) Use conda/mambaforge (recommended)

```bash
# create an env with prebuilt scientific packages (conda/mamba recommended)
conda create -n fingishai python=3.11 -y
conda activate fingishai
conda install -c conda-forge scikit-learn=1.3 pandas numpy fastapi uvicorn joblib nltk python-multipart pydantic -y
# then run training or start the service
python backend/ai/train.py --csv labeled_transactions.csv --model-out backend/ai/ai_model.joblib
python -m uvicorn backend.ai.app:app --reload --port 8001
```

2) Use a Python version with matching wheel availability (e.g. 3.11) and then use pip.

If you prefer pip and your system Python is 3.13 or newer (where wheels may be missing), switch
to Python 3.11 (pyenv or conda) and retry `pip install -r backend/ai/requirements.txt`.

If neither option is possible, you can keep using the frontend — it will gracefully fall back to
client-side heuristics (rules/TF-IDF) when the ML service isn't reachable.
```
