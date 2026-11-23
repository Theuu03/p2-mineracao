import Link from "next/link";
import { modules } from "@/lib/course";

export const metadata = {
  title: "Módulos | Texto em Dados",
  description: "Trilha progressiva de mineração de texto e processamento de linguagem natural.",
};

export default function ModulesPage() {
  return (
    <main className="course-page">
      <div className="course-shell">
        <Link href="/" className="course-back">← Texto em Dados</Link>
        <span className="section-kicker">TRILHA DE APRENDIZAGEM</span>
        <h1>Do texto à interpretação.</h1>
        <p className="course-intro">Dez módulos para aprender fundamentos, experimentar técnicas e construir uma análise crítica. Questionários têm cinco questões e feedback explicativo.</p>
        <div className="local-progress-note"><strong>Progresso local</strong><span>As tentativas ficam neste navegador. Ainda não há conta nem sincronização entre dispositivos.</span></div>
        <div className="course-list">
          {modules.map((item, index) => (
            <Link href={`/modulos/${item.slug}`} className="course-row" key={item.slug}>
              <span className="course-row-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="course-row-copy"><strong>{item.title}</strong><small>{item.summary}</small></span>
              <span className="course-row-meta">{item.questions.length} QUESTÕES</span>
              <span className="course-row-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
        <div className="course-actions"><Link href="/progresso" className="button button-primary">Ver meu percurso local →</Link><Link href="/#laboratorio" className="underlined-link">Abrir laboratório de texto ↗</Link></div>
      </div>
    </main>
  );
}
