"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCompletionPercent, modules } from "@/lib/course";
import { clearProgress, LearningProgress, readProgress } from "@/lib/progress";

export default function ProgressPage() {
  const [progress, setProgress] = useState<LearningProgress>({ completedModules: [], attempts: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setProgress(readProgress());
      setLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const percent = getCompletionPercent(progress.completedModules);
  const recent = [...progress.attempts].reverse().slice(0, 8);

  function reset() {
    if (!window.confirm("Apagar o progresso e o histórico de tentativas deste navegador?")) return;
    setProgress(clearProgress());
  }

  return <main className="course-page"><div className="course-shell progress-shell"><Link href="/modulos" className="course-back">← Voltar à trilha</Link><span className="section-kicker">ACOMPANHAMENTO LOCAL</span><h1>Seu percurso.</h1><p className="course-intro">Este resumo é salvo apenas neste navegador. Ainda não existe sincronização com uma conta ou servidor.</p>
    <div className="progress-overview"><div className="progress-percent">{loaded ? percent : "—"}<small>%</small></div><div className="progress-meter"><span style={{ width: `${loaded ? percent : 0}%` }} /></div><div className="progress-detail"><span>{progress.completedModules.length} de {modules.length} módulos aprovados</span><span>{progress.attempts.length} tentativas registradas</span></div></div>
    <section className="progress-modules"><div className="quiz-heading"><div><span className="lesson-label">TRILHA</span><h2>Módulos</h2></div><Link href="/modulos" className="underlined-link">Explorar módulos →</Link></div>{modules.map((item, index) => {const done = progress.completedModules.includes(item.slug); const latest = [...progress.attempts].reverse().find((attempt) => attempt.moduleSlug === item.slug); return <div className="progress-module" key={item.slug}><span className="course-row-number">{String(index + 1).padStart(2, "0")}</span><Link href={`/modulos/${item.slug}`}>{item.title}</Link><span className={done ? "progress-state done" : "progress-state"}>{done ? "CONCLUÍDO" : latest ? `${latest.score}% · REFAZER` : "PENDENTE"}</span></div>;})}</section>
    <section className="progress-history"><div className="quiz-heading"><div><span className="lesson-label">HISTÓRICO</span><h2>Tentativas recentes</h2></div></div>{recent.length ? <div className="attempt-list">{recent.map((attempt, index) => {const courseModule = modules.find((item) => item.slug === attempt.moduleSlug);return <div className="attempt-row" key={`${attempt.completedAt}-${index}`}><span>{courseModule?.title ?? "Módulo"}</span><strong>{attempt.score}%</strong><time dateTime={attempt.completedAt}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(attempt.completedAt))}</time></div>;})}</div> : <p className="empty-history">Nenhuma tentativa ainda. Abra um módulo para estudar e responder ao questionário.</p>}</section>
    <div className="progress-footer"><span>Os dados ficam no armazenamento local deste dispositivo.</span>{progress.attempts.length > 0 && <button type="button" onClick={reset} className="clear-progress">Apagar progresso local</button>}</div>
  </div></main>;
}
