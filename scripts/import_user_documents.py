"""Copy the user's COVID source files and prepare non-verified local imports.

Run with the bundled workspace Python and docx/pdfplumber packages:
  python scripts/import_user_documents.py --articles PATH.docx --official PATH.pdf
"""

from __future__ import annotations

import argparse
import csv
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

import pdfplumber
from docx import Document


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "datasets" / "importados"
DATE = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{4})$")
URL_DATE = re.compile(r"/(20\d{2})/(\d{2})/(\d{2})/")
URL_LINE = re.compile(r"^https?://", re.IGNORECASE)


def date_value(lines: list[str], url: str, lower: int, upper: int) -> str:
    for line in reversed(lines[max(0, lower):upper]):
        value = line.strip()
        match = DATE.fullmatch(value)
        if match:
            day, month, year = match.groups()
            return f"{year}-{int(month):02d}-{int(day):02d}"
        if re.fullmatch(r"20\d{2}", value):
            return value
    match = URL_DATE.search(url)
    if match:
        return "-".join(match.groups())
    return ""


def latest_nonempty(lines: list[str], start: int, stop: int) -> int:
    return next((i for i in range(stop - 1, start - 1, -1) if lines[i].strip()), stop - 1)


def extract_articles(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    paragraphs = [paragraph.text.strip() for paragraph in Document(path).paragraphs]
    url_positions = [i for i, line in enumerate(paragraphs) if URL_LINE.match(line)]
    if len(url_positions) != 50:
        raise ValueError(f"Esperava 50 links de matérias no DOCX, encontrei {len(url_positions)}.")

    articles: list[dict[str, str]] = []
    urls = [paragraphs[i] for i in url_positions]
    for number, url_index in enumerate(url_positions):
        url = urls[number]
        previous_url = url_positions[number - 1] if number else 0
        title_index = latest_nonempty(paragraphs, previous_url + 1, url_index)
        raw_title = paragraphs[title_index].strip()
        if not raw_title:
            raw_title = f"Matéria {number + 1:02d}"
        source = ""
        title = raw_title
        for separator in (" – ", " — ", " - ", " | "):
            if separator in raw_title:
                source, title = raw_title.split(separator, 1)
                break
        if not source:
            source = urlparse(url).netloc.removeprefix("www.")

        date = date_value(paragraphs, url, max(previous_url + 1, title_index - 6), url_index)
        if not date:
            date = date_value(paragraphs, url, previous_url + 1, url_index)

        if number + 1 < len(url_positions):
            next_url_index = url_positions[number + 1]
            next_title_index = latest_nonempty(paragraphs, url_index + 1, next_url_index)
            next_date = date_value(paragraphs, urls[number + 1], max(url_index + 1, next_title_index - 6), next_url_index)
            body_end = next_title_index
            if next_date:
                for candidate in range(next_title_index - 1, url_index, -1):
                    if date_value(paragraphs, urls[number + 1], candidate, candidate + 1) == next_date:
                        body_end = candidate
                        break
        else:
            body_end = len(paragraphs)

        body = "\n".join(line for line in paragraphs[url_index + 1:body_end] if line)
        section = "COVID-19"
        for line in reversed(paragraphs[:title_index]):
            if line.upper().startswith("FASE "):
                section = line
                break
        articles.append({
            "date": date,
            "source": source.strip(),
            "category": section,
            "title": title.strip(),
            "url": url,
            "license": "Não informada; verificar condições antes de redistribuir.",
            "text": body.strip(),
        })
    return articles, paragraphs


def write_article_text(articles: list[dict[str, str]], path: Path) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as stream:
        stream.write("# Extraído do DOCX fornecido; preserve as fontes e confira a licença.\n")
        for i, article in enumerate(articles, 1):
            stream.write(f"\n=== DOCUMENTO {i:02d} ===\n")
            stream.write(f"data: {article['date']}\n")
            stream.write(f"fonte: {article['source']}\n")
            stream.write(f"categoria: {article['category']}\n")
            stream.write(f"titulo: {article['title']}\n")
            stream.write(f"url: {article['url']}\n")
            stream.write(f"licenca: {article['license']}\n")
            stream.write("texto:\n")
            stream.write(article["text"] + "\n")


def extract_official_claims(path: Path, output: Path) -> int:
    with pdfplumber.open(path) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    matches = list(re.finditer(r"(?m)^\s*(\d{1,2})\.\s+", text))
    sections = {
        "Dados Globais (OMS)": "Globais (OMS)",
        "Dados Nacionais (Ministério da Saúde)": "Nacionais (Ministério da Saúde)",
        "Dados de São Paulo e Lins (SEADE e Prefeitura de Lins)": "São Paulo e Lins",
        "Evolução Temporal, Características e Outras Informações Úteis": "Evolução temporal e características",
        "Principais Fontes Oficiais e Links Úteis": "Fontes e links listados no PDF",
    }
    current_section = "Não identificada"
    claims: list[tuple[str, str, str, str]] = []
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        number = match.group(1)
        raw = re.sub(r"\s+", " ", text[match.end():end]).strip()
        header = next((name for name in sections if raw.startswith(name)), None)
        if header:
            current_section = sections[header]
            continue
        if not raw or not raw[0].isupper():
            continue
        if number == "5" and raw.startswith("Principais Fontes"):
            current_section = sections["Principais Fontes Oficiais e Links Úteis"]
            continue
        source_match = re.search(r"\(Fonte:\s*(.*?)\)", raw, re.IGNORECASE)
        named_sources = source_match.group(1).strip() if source_match else "Fonte não especificada por item"
        claim_text = re.sub(r"\s*\(Fonte:.*?\)\s*$", "", raw).strip()
        claims.append((number, current_section, claim_text, named_sources))

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(["numero_no_pdf", "secao", "afirmacao_extraida", "fonte_mencionada", "status_de_verificacao", "observacao"])
        for number, section, claim, source in claims:
            writer.writerow([number, section, claim, source, "NAO_VERIFICADA", "Transcrição do PDF fornecido; validar afirmação, data, unidade e URL na fonte primária antes de tratar como dado oficial."])
    return len(claims)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--articles", type=Path, required=True, help="DOCX que contém as matérias")
    parser.add_argument("--official", type=Path, required=True, help="PDF com afirmações/dados oficiais")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    article_copy = OUT / args.articles.name
    official_copy = OUT / args.official.name
    shutil.copy2(args.articles, article_copy)
    shutil.copy2(args.official, official_copy)

    articles, _ = extract_articles(args.articles)
    article_text = OUT / "50_materias_para_importar.txt"
    write_article_text(articles, article_text)
    claim_count = extract_official_claims(args.official, OUT / "afirmacoes_do_pdf_para_revisao.csv")
    lengths = [len(article["text"]) for article in articles]
    missing_dates = sum(not article["date"] for article in articles)
    over_limit = sum(length > 5000 for length in lengths)
    print(f"Original DOCX copiado: {article_copy}")
    print(f"Original PDF copiado: {official_copy}")
    print(f"Matérias extraídas: {len(articles)}; sem data legível: {missing_dates}; textos acima de 5.000 caracteres: {over_limit}")
    print(f"Texto pronto para /historico: {article_text}; caracteres por matéria min/max: {min(lengths)}/{max(lengths)}")
    print(f"Afirmações extraídas do PDF para revisão (marcadas NÃO_VERIFICADA): {claim_count}")


if __name__ == "__main__":
    main()
