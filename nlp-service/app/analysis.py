"""Deterministic, stateless text analysis functions for the learning lab."""

from collections import Counter
import re
from typing import Iterable

from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import TfidfVectorizer


TOKEN_PATTERN = re.compile(r"[\w\d]+(?:['’][\w]+)?", re.UNICODE)
PORTUGUESE_STOPWORDS = frozenset(
    "a à as o os um uma uns umas de da do das dos em no na nos nas por para com sem e ou que se ao aos como também mais menos isso este esta esse essa são é foi ser ter há pela pelo pelas pelos entre sobre"
    .split()
)

# A small, transparent teaching lexicon. It is a baseline, not a trained model.
SENTIMENT_LEXICON = {
    "bom": 1, "boa": 1, "bons": 1, "boas": 1, "benefício": 1,
    "beneficios": 1, "confiança": 1, "eficaz": 1, "eficácia": 1,
    "esperança": 1, "funciona": 1, "seguro": 1, "segura": 1,
    "protege": 1, "proteção": 1, "positivo": 1, "positiva": 1,
    "avanço": 1, "melhora": 1, "ótimo": 1, "ótima": 1,
    "ruim": -1, "péssimo": -1, "péssima": -1, "risco": -1,
    "perigo": -1, "medo": -1, "falha": -1, "falhou": -1,
    "morte": -1, "mortes": -1, "doença": -1, "negativo": -1,
    "negativa": -1, "preocupação": -1, "preocupante": -1,
    "ineficaz": -1, "dúvida": -1, "incerto": -1,
}


def tokenize(text: str) -> list[str]:
    """Split Portuguese text into lowercase Unicode word tokens."""
    return [match.group(0).lower() for match in TOKEN_PATTERN.finditer(text)]


def remove_stopwords(tokens: Iterable[str]) -> list[str]:
    """Filter a short, task-specific list; negation words are deliberately kept."""
    return [token for token in tokens if token not in PORTUGUESE_STOPWORDS]


def ngrams(tokens: list[str], n: int = 2) -> list[str]:
    if n < 1 or n > 5:
        raise ValueError("n precisa estar entre 1 e 5")
    return [" ".join(tokens[index:index + n]) for index in range(max(0, len(tokens) - n + 1))]


def frequencies(text: str, *, exclude_stopwords: bool = True, n: int = 1) -> dict:
    tokens = tokenize(text)
    if exclude_stopwords:
        tokens = remove_stopwords(tokens)
    counted_tokens = tokens if n == 1 else ngrams(tokens, n)
    counts = Counter(counted_tokens)
    total = sum(counts.values())
    items = [
        {"term": term, "count": count, "relative_frequency": count / total if total else 0.0}
        for term, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:50]
    ]
    return {"total_tokens": len(tokens), "counted_units": total, "items": items}


def _vectorizer() -> TfidfVectorizer:
    return TfidfVectorizer(
        tokenizer=tokenize,
        preprocessor=None,
        token_pattern=None,
        lowercase=False,
        norm="l2",
        smooth_idf=True,
    )


def tfidf(documents: list[str], *, top_terms: int = 8) -> dict:
    vectorizer = _vectorizer()
    matrix = vectorizer.fit_transform(documents)
    terms = vectorizer.get_feature_names_out()
    document_terms = []
    for row_index in range(matrix.shape[0]):
        row = matrix.getrow(row_index)
        order = row.data.argsort()[::-1][:top_terms]
        ranked = [
            {"term": str(terms[row.indices[index]]), "weight": float(row.data[index])}
            for index in order
        ]
        document_terms.append(ranked)
    return {
        "vocabulary_size": len(terms),
        "document_count": len(documents),
        "documents": document_terms,
    }


def cosine_similarity(first: str, second: str) -> float:
    vectorizer = _vectorizer()
    matrix = vectorizer.fit_transform([first, second])
    return float((matrix[0] @ matrix[1].T).toarray()[0][0])


def topic_model(documents: list[str], *, topic_count: int = 2, top_terms: int = 6) -> dict:
    vectorizer = TfidfVectorizer(
        tokenizer=tokenize,
        preprocessor=None,
        token_pattern=None,
        lowercase=False,
        stop_words=list(PORTUGUESE_STOPWORDS),
    )
    matrix = vectorizer.fit_transform(documents)
    model = LatentDirichletAllocation(
        n_components=topic_count,
        random_state=42,
        learning_method="batch",
        max_iter=20,
    )
    model.fit(matrix)
    terms = vectorizer.get_feature_names_out()
    topics = []
    for topic_index, weights in enumerate(model.components_):
        indices = weights.argsort()[::-1][:top_terms]
        topics.append({"topic": topic_index + 1, "terms": [str(terms[index]) for index in indices]})
    assignments = model.transform(matrix).argmax(axis=1).tolist()
    return {
        "algorithm": "Latent Dirichlet Allocation (LDA)",
        "topic_count": topic_count,
        "document_topics": [int(index + 1) for index in assignments],
        "topics": topics,
        "note": "Temas são distribuições exploratórias; nomes e interpretações exigem revisão humana.",
    }


def sentiment_baseline(text: str) -> dict:
    tokens = tokenize(text)
    scored = [{"token": token, "score": SENTIMENT_LEXICON[token]} for token in tokens if token in SENTIMENT_LEXICON]
    score = sum(item["score"] for item in scored)
    label = "positive" if score > 0 else "negative" if score < 0 else "neutral_or_unknown"
    return {
        "label": label,
        "score": score,
        "matched_terms": scored,
        "method": "small Portuguese teaching lexicon",
        "warning": "Baseline didático sem validação populacional; não é modelo treinado e pode errar negação, ironia e contexto.",
    }

