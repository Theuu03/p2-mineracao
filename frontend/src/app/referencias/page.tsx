import Link from "next/link";
import { modules } from "@/lib/course";

export const metadata = { title: "Referências | Texto em Dados", description: "Fontes de estudo indicadas nos módulos da disciplina." };

export default function ReferencesPage() {
  const references = [...new Map(modules.map((item) => [item.reference.url, item.reference])).values()];
  return <main className="course-page"><div className="course-shell"><Link href="/" className="course-back">← Texto em Dados</Link><span className="section-kicker">LEITURAS E DOCUMENTAÇÃO</span><h1>Referências para aprofundar.</h1><p className="course-intro">As leituras abaixo são vinculadas aos módulos. Consulte a fonte original para conferir escopo, versão e condições de uso.</p><div className="reference-list">{references.map((reference, index) => <a className="reference-row" href={reference.url} target="_blank" rel="noreferrer" key={reference.url}><span>{String(index + 1).padStart(2, "0")}</span><strong>{reference.label}</strong><small>{reference.url.replace(/^https?:\/\//, "")}</small><b aria-hidden="true">↗</b></a>)}</div></div></main>;
}
