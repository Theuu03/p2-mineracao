"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { parseCsv } from "@/lib/csv";

type DocumentRow = { date: string; source: string; category: string; title: string; text: string; url: string; license: string };
type Tfidf = { vocabulary_size: number; documents: { term: string; weight: number }[][] };
const MAX_DOCUMENTS = 50;
const MAX_TOTAL_CHARS = 250_000;
function makeBatches(documents: DocumentRow[]) {
  const batches: DocumentRow[][] = []; let batch: DocumentRow[] = []; let characters = 0;
  for (const document of documents) {
    if (batch.length >= 20 || characters + document.text.length > 50_000) { batches.push(batch); batch = []; characters = 0; }
    batch.push(document); characters += document.text.length;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

function parseTextFile(input: string): DocumentRow[] {
  const blocks = input.split(/^=== DOCUMENTO \d{2} ===\s*$/m).slice(1);
  return blocks.map((block, index) => {
    const textStart = block.search(/^texto:\s*$/im);
    if (textStart < 0) throw new Error(`Falta o campo “texto:” no documento ${index + 1}.`);
    const metadata = block.slice(0, textStart);
    const text = block.slice(textStart).replace(/^texto:\s*\r?\n?/im, "").trim();
    const read = (field: string) => metadata.match(new RegExp(`^${field}:\\s*(.*)$`, "im"))?.[1]?.trim() ?? "";
    return { date: read("data"), source: read("fonte"), category: read("categoria"), title: read("titulo"), url: read("url"), license: read("licenca"), text };
  });
}

function parseRows(rows: string[][]): DocumentRow[] {
  if (rows.length < 3) throw new Error("Inclua o cabeçalho e pelo menos dois documentos.");
  const header = rows[0].map((value) => value.trim().toLocaleLowerCase("pt-BR"));
  const required = ["data", "fonte", "categoria", "titulo", "texto"];
  const indexes = required.map((name) => header.indexOf(name));
  if (indexes.some((index) => index < 0)) throw new Error("Colunas obrigatórias: data, fonte, categoria, titulo, texto. URL e licença são recomendadas.");
  const urlIndex = header.indexOf("url"), licenseIndex = header.indexOf("licenca");
  return rows.slice(1).filter((row) => row.some((value) => value.trim())).map((row) => {
    const [date, source, category, title, text] = indexes.map((column) => row[column]?.trim() ?? "");
    return { date, source, category, title, text, url: urlIndex < 0 ? "" : row[urlIndex]?.trim() ?? "", license: licenseIndex < 0 ? "" : row[licenseIndex]?.trim() ?? "" };
  });
}

function validateDocuments(documents: DocumentRow[]): DocumentRow[] {
  if (documents.length < 2 || documents.length > MAX_DOCUMENTS) throw new Error(`A análise aceita de 2 a ${MAX_DOCUMENTS} documentos.`);
  let total = 0;
  documents.forEach((document, index) => {
    const dateMatch = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(document.date);
    const normalizedDate = dateMatch ? `${dateMatch[1]}-${dateMatch[2] ?? "01"}-${dateMatch[3] ?? "01"}` : "";
    const parsedDate = new Date(`${normalizedDate}T00:00:00Z`);
    if (!dateMatch || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== normalizedDate) throw new Error(`Data inválida no documento ${index + 1}; use AAAA-MM-DD (ou AAAA-MM se a fonte só informar mês/ano).`);
    if (!document.source || !document.title || !document.text) throw new Error(`Fonte, título e texto são obrigatórios no documento ${index + 1}.`);
    if (document.text.length > 25_000) throw new Error(`O texto do documento ${index + 1} ultrapassa 25.000 caracteres.`);
    total += document.text.length;
  });
  if (total > MAX_TOTAL_CHARS) throw new Error("O conteúdo total ultrapassa 250.000 caracteres.");
  return documents;
}

export default function HistoricalPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [terms, setTerms] = useState<Tfidf | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const years = useMemo(() => {
    const counts = new Map<string, number>();
    documents.forEach((document) => counts.set(document.date.slice(0, 4), (counts.get(document.date.slice(0, 4)) ?? 0) + 1));
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [documents]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    setError(""); setNotice(""); setTerms(null); setDocuments([]); setBusy(true);
    try {
      if (!/\.(csv|txt)$/i.test(file.name) || file.size > 1_000_000) throw new Error("Envie um arquivo TXT ou CSV de até 1 MB.");
      const content = await file.text();
      const parsed = /\.txt$/i.test(file.name) ? parseTextFile(content) : parseRows(parseCsv(content));
      const valid = validateDocuments(parsed);
      const batches = makeBatches(valid);
      const chunks = await Promise.all(batches.map((batch) => api<Tfidf>("/nlp/tfidf", { method: "POST", body: JSON.stringify({ documents: batch.map((document) => document.text), top_terms: 8 }) })));
      setDocuments(valid);
      setTerms({ vocabulary_size: chunks[0]?.vocabulary_size ?? 0, documents: chunks.flatMap((chunk) => chunk.documents) });
      setNotice(`Análise calculada sobre ${valid.length} documentos enviados. Nenhum documento foi salvo.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível ler esse arquivo."); }
    finally { setBusy(false); }
  }

  return <main className="course-page"><div className="course-shell"><Link href="/" className="course-back">← Texto em Dados</Link><span className="section-kicker">COVID-19 · EXPLORAÇÃO DOCUMENTAL</span><h1>Leia a história nos textos.</h1><p className="course-intro">Importe até 50 matérias em TXT estruturado ou CSV para comparar documentos por TF-IDF e inspecionar período, fonte e categoria. Esta página não apresenta contagens históricas sem documentos de origem.</p>
    <section className="local-progress-note"><strong>Formato de texto pronto para colar</strong><span>No arquivo TXT, cada registro começa com <code>=== DOCUMENTO 01 ===</code> e contém os campos data, fonte, categoria, titulo, url, licenca e texto. Para CSV, use as colunas data,fonte,categoria,titulo,texto (url e licenca recomendadas). Consulte <code>datasets/modelos/INSTRUCOES.md</code>.</span></section>
    <label className="file-button history-upload">Selecionar matérias TXT/CSV<input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={upload} /></label>
    {busy && <p className="course-intro" role="status">Validando metadados e calculando TF-IDF…</p>}{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
    {documents.length > 0 && <><div className="teacher-metrics"><article><strong>{documents.length}</strong><span>documentos enviados</span></article><article><strong>{terms?.vocabulary_size ?? "—"}</strong><span>termos no vocabulário</span></article><article><strong>{new Set(documents.map((document) => document.source)).size}</strong><span>fontes declaradas</span></article><article><strong>{new Set(documents.map((document) => document.category).filter(Boolean)).size}</strong><span>categorias declaradas</span></article></div>
      <h2>Documentos por ano</h2><div className="history-years">{years.map(([year, count]) => <div key={year}><span>{year}</span><div><i style={{ width: `${Math.max(4, count / Math.max(...years.map(([, amount]) => amount)) * 100)}%` }} /></div><b>{count}</b></div>)}</div>
      <h2>Termos mais representativos por documento</h2><div className="history-docs">{documents.map((document, index) => <article key={`${document.date}-${index}`}><small>{document.date} · {document.source} · {document.category || "sem categoria"}</small><strong>{document.title}</strong>{document.url && <a href={document.url} target="_blank" rel="noreferrer">Abrir documento original ↗</a>}{document.license && <small>Licença: {document.license}</small>}<div className="history-tags">{terms?.documents[index]?.map((item) => <span key={item.term}>{item.term} <b>{item.weight.toFixed(3)}</b></span>)}</div></article>)}</div>
      <p className="course-intro">TF-IDF destaca termos relativamente informativos dentro dos textos enviados. Os pesos não indicam importância social nem comprovam tendências temporais; a interpretação depende da seleção e qualidade das fontes.</p></>}
    <div className="local-progress-note"><strong>Processamento temporário</strong><span>Os textos são enviados à API PLN em lotes de até 20 documentos e 50.000 caracteres. Cada matéria pode ter até 25.000 caracteres e o conjunto até 250.000. Os documentos não são persistidos. Confirme a licença antes de enviar material protegido.</span></div>
  </div></main>;
}
