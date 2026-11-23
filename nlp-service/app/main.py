"""HTTP API for stateless, size-limited text analysis."""

import os
import asyncio
from collections import defaultdict, deque
from time import monotonic
from typing import Annotated

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.analysis import cosine_similarity, frequencies, sentiment_baseline, tfidf, tokenize, topic_model

TextValue = Annotated[str, StringConstraints(min_length=1, max_length=5_000)]
DocumentTextValue = Annotated[str, StringConstraints(min_length=1, max_length=25_000)]
DocumentList = Annotated[list[DocumentTextValue], Field(min_length=2, max_length=20)]

app = FastAPI(
    title="Texto em Dados — serviço PLN",
    version="0.1.0",
    description="Operações textuais sem estado. O serviço não persiste textos recebidos.",
)
allowed_origins = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

_requests_by_client: dict[str, deque[float]] = defaultdict(deque)
_rate_limit_lock = asyncio.Lock()
_RATE_LIMIT = 30
_RATE_WINDOW_SECONDS = 60
_MAX_JSON_BYTES = 300_000


@app.middleware("http")
async def protect_lab_resources(request: Request, call_next):
    if request.method == "POST" and request.url.path.startswith("/v1/"):
        content_length = request.headers.get("content-length")
        if content_length and content_length.isdigit() and int(content_length) > _MAX_JSON_BYTES:
            return JSONResponse(status_code=413, content={"detail": "A solicitação excede o limite permitido."})
        client_ip = request.client.host if request.client else "unknown"
        now = monotonic()
        async with _rate_limit_lock:
            timestamps = _requests_by_client[client_ip]
            while timestamps and now - timestamps[0] >= _RATE_WINDOW_SECONDS:
                timestamps.popleft()
            if len(timestamps) >= _RATE_LIMIT:
                return JSONResponse(status_code=429, content={"detail": "Limite temporário de análises atingido. Tente novamente em instantes."})
            timestamps.append(now)
    return await call_next(request)


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class TextRequest(StrictModel):
    text: TextValue


class FrequencyRequest(TextRequest):
    exclude_stopwords: bool = True
    ngram: int = Field(default=1, ge=1, le=5)


class SimilarityRequest(StrictModel):
    first: TextValue
    second: TextValue


class DocumentsRequest(StrictModel):
    documents: DocumentList

    @field_validator("documents")
    @classmethod
    def total_payload_limit(cls, documents: list[str]) -> list[str]:
        if sum(map(len, documents)) > 50_000:
            raise ValueError("O limite combinado é 50.000 caracteres.")
        return documents


class TfidfRequest(DocumentsRequest):
    top_terms: int = Field(default=8, ge=1, le=20)


class TopicsRequest(DocumentsRequest):
    topic_count: int = Field(default=2, ge=2, le=8)
    top_terms: int = Field(default=6, ge=1, le=20)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "nlp-service", "stateless": True}


@app.post("/v1/tokenize")
async def tokenize_endpoint(payload: TextRequest) -> dict:
    tokens = tokenize(payload.text)
    return {
        "tokens": tokens,
        "total_tokens": len(tokens),
        "method": "Unicode word tokenization; lowercase pt-BR",
        "note": "Tokenização lexical simples; não resolve contexto nem desambiguação.",
    }


@app.post("/v1/frequency")
async def frequency_endpoint(payload: FrequencyRequest) -> dict:
    return frequencies(payload.text, exclude_stopwords=payload.exclude_stopwords, n=payload.ngram)


@app.post("/v1/similarity")
async def similarity_endpoint(payload: SimilarityRequest) -> dict:
    try:
        score = cosine_similarity(payload.first, payload.second)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Os textos precisam conter termos para comparação.") from error
    return {
        "score": score,
        "algorithm": "TF-IDF + similaridade do cosseno",
        "note": "O escore compara vetores lexicais desta dupla; não mede verdade nem equivalência semântica completa.",
    }


@app.post("/v1/tfidf")
async def tfidf_endpoint(payload: TfidfRequest) -> dict:
    try:
        return tfidf(payload.documents, top_terms=payload.top_terms)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Os documentos precisam conter termos para vetorização.") from error


@app.post("/v1/topics")
async def topics_endpoint(payload: TopicsRequest) -> dict:
    if payload.topic_count > len(payload.documents):
        raise HTTPException(status_code=422, detail="Use no máximo tantos tópicos quanto documentos.")
    try:
        return topic_model(payload.documents, topic_count=payload.topic_count, top_terms=payload.top_terms)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Os documentos não têm vocabulário suficiente para modelar tópicos.") from error


@app.post("/v1/sentiment-baseline")
async def sentiment_endpoint(payload: TextRequest) -> dict:
    return sentiment_baseline(payload.text)

