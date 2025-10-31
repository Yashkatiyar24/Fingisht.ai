from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from backend.ai.model_utils import CategoryModel, preprocess_text

app = FastAPI()
model = None


class PredictRequest(BaseModel):
    texts: List[str]


class PredictResponse(BaseModel):
    predictions: List[str]


@app.on_event('startup')
async def load_model():
    global model
    try:
        model = CategoryModel.load('ai_model.joblib')
        print('Model loaded')
    except Exception as e:
        print('Model not found at startup, run training first:', e)
        model = None


@app.post('/predict', response_model=PredictResponse)
async def predict(req: PredictRequest):
    if model is None:
        return PredictResponse(predictions=[])
    processed = [preprocess_text(t) for t in req.texts]
    preds = model.predict(processed)
    return PredictResponse(predictions=list(preds))
