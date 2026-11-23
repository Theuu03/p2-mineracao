"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getModule, modules } from "@/lib/course";
import { readProgress, recordAttempt } from "@/lib/progress";
import { api, refreshSession } from "@/lib/api";

type ServerQuiz = { questions: { id: string; prompt: string; options: { id: string; body: string }[] }[] };
type ServerFeedback = { answers: { correct: boolean; explanation: string }[]; score: number; passed: boolean };

export default function ModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const courseModule = getModule(slug);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const [serverQuiz, setServerQuiz] = useState<ServerQuiz | null>(null);
  const [serverFeedback, setServerFeedback] = useState<ServerFeedback | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const progress = readProgress();
      setIsCompleted(progress.completedModules.includes(slug));
      setAttemptCount(progress.attempts.filter((attempt) => attempt.moduleSlug === slug).length);
      void (async () => {
        try {
          await refreshSession();
          const [quiz, serverProgress] = await Promise.all([
            api<ServerQuiz>(`/modules/${slug}/quiz`),
            api<{ modules: { moduleSlug: string; completed: boolean }[]; attempts: { moduleSlug: string }[] }>("/learning/progress"),
          ]);
          setServerQuiz(quiz);
          setIsCompleted(serverProgress.modules.find((item) => item.moduleSlug === slug)?.completed ?? false);
          setAttemptCount(serverProgress.attempts.filter((attempt) => attempt.moduleSlug === slug).length);
        } catch { /* Visitantes continuam com a demonstração local. */ }
      })();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [slug]);

  if (!courseModule) {
    return <main className="course-page"><div className="course-shell"><Link href="/modulos" className="course-back">← Todos os módulos</Link><h1>Módulo não encontrado.</h1><p className="course-intro">Confira o endereço ou volte à trilha para escolher um módulo publicado.</p></div></main>;
  }

  const activeModule = courseModule;
  const moduleIndex = modules.findIndex((item) => item.slug === slug);
  const nextModule = modules[moduleIndex + 1];
  const activeQuestions = serverQuiz?.questions.map((question) => ({ prompt: question.prompt, options: question.options.map((option) => option.body), answer: -1, explanation: "" })) ?? activeModule.questions;

  async function submitQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.keys(answers).length !== activeModule.questions.length) return;
    if (serverQuiz) {
      try {
        const result = await api<ServerFeedback>(`/modules/${slug}/quiz/attempts`, {
          method: "POST",
          body: JSON.stringify({ answers: serverQuiz.questions.map((question, index) => ({ questionId: question.id, optionId: question.options[answers[index]].id })) }),
        });
        setServerFeedback(result);
        setScore(Math.round(Number(result.score)));
        setPassed(result.passed);
        setSubmitted(true);
        setAttemptCount((current) => current + 1);
        setIsCompleted((current) => current || result.passed);
        setStorageNotice("Tentativa salva na sua conta.");
        return;
      } catch (error) {
        setStorageNotice(error instanceof Error ? error.message : "Falha ao salvar no servidor. A tentativa não foi registrada.");
        return;
      }
    }
    const correct = activeModule.questions.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0);
    const percentage = Math.round((correct / activeModule.questions.length) * 100);
    const isPassing = percentage >= 70;
    setScore(percentage);
    setPassed(isPassing);
    setSubmitted(true);
    try {
      const progress = recordAttempt({ moduleSlug: slug, score: percentage, passed: isPassing, completedAt: new Date().toISOString() });
      setAttemptCount(progress.attempts.filter((attempt) => attempt.moduleSlug === slug).length);
      setIsCompleted(progress.completedModules.includes(slug));
      setStorageNotice("Tentativa registrada neste navegador.");
    } catch {
      setStorageNotice("Não foi possível salvar neste navegador. A correção continua visível nesta página.");
    }
  }

  return (
    <main className="course-page">
      <div className="course-shell module-shell">
        <Link href="/modulos" className="course-back">← Todos os módulos</Link>
        <div className="module-hero"><span className="section-kicker">MÓDULO {String(moduleIndex + 1).padStart(2, "0")} · {courseModule.questions.length} QUESTÕES</span><h1>{courseModule.title}</h1><p className="course-intro">{courseModule.summary}</p><div className="module-badges"><span>{isCompleted ? "CONCLUÍDO NESTE NAVEGADOR" : "CONCLUSÃO: 70% NO QUESTIONÁRIO"}</span><span>{attemptCount} {attemptCount === 1 ? "TENTATIVA" : "TENTATIVAS"}</span></div></div>

        <section className="lesson-card"><span className="lesson-label">O QUE VOCÊ VAI APRENDER</span><ul className="outcome-list">{courseModule.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></section>
        <section className="lesson-card"><span className="lesson-label">ENTENDA O CONCEITO</span><p>{courseModule.concept}</p></section>
        <section className="lesson-card"><span className="lesson-label">COMO FUNCIONA</span><p>{courseModule.howItWorks}</p></section>
        <section className="lesson-case"><span className="lesson-label">EXEMPLO NO CONTEXTO DA PANDEMIA</span><p>{courseModule.covidContext}</p></section>
        <section className="lesson-practice"><span className="lesson-label">EXPERIMENTE</span><p>{courseModule.practice}</p><Link href="/#laboratorio" className="underlined-link">Ir ao laboratório de texto ↗</Link></section>
        <section className="lesson-card"><span className="lesson-label">INTERPRETE COM CUIDADO</span><p>{courseModule.limitations}</p></section>
        <section className="lesson-reference"><span className="lesson-label">PARA APROFUNDAR</span><a href={courseModule.reference.url} target="_blank" rel="noreferrer">{courseModule.reference.label} ↗</a><small>Referência externa; consulte a publicação original para detalhes e condições de uso.</small></section>

        <section className="quiz-section" id="questionario"><div className="quiz-heading"><div><span className="lesson-label">TESTE SEU CONHECIMENTO</span><h2>Questionário do módulo</h2></div><span className="quiz-threshold">{activeQuestions.length} QUESTÕES · APROVAÇÃO 70%</span></div>
          <form onSubmit={submitQuiz}>
            {activeQuestions.map((question, questionIndex) => <fieldset className="question-card" key={`${slug}-${questionIndex}`}><legend><span>{String(questionIndex + 1).padStart(2, "0")}</span>{question.prompt}</legend><div className="answer-list">{question.options.map((option, optionIndex) => { const serverCorrect = serverQuiz ? serverFeedback?.answers[questionIndex]?.correct && answers[questionIndex] === optionIndex : answers[questionIndex] === question.answer; return <label className={submitted && serverCorrect ? "answer-option answer-correct" : submitted && answers[questionIndex] === optionIndex ? "answer-option answer-wrong" : "answer-option"} key={option}><input type="radio" name={`question-${questionIndex}`} value={optionIndex} checked={answers[questionIndex] === optionIndex} disabled={submitted} onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} /><span>{option}</span></label>})}</div>{submitted && <p className="answer-explanation"><strong>{(serverQuiz ? serverFeedback?.answers[questionIndex]?.correct : answers[questionIndex] === question.answer) ? "Correto." : "Reveja este ponto."}</strong> {serverQuiz ? serverFeedback?.answers[questionIndex]?.explanation : question.explanation}</p>}</fieldset>)}
            {!submitted ? <button className="button button-primary quiz-submit" type="submit" disabled={Object.keys(answers).length !== activeQuestions.length}>Corrigir questionário →</button> : <div className={passed ? "quiz-result quiz-pass" : "quiz-result quiz-retry"} role="status"><strong>{score}% — {passed ? "Módulo concluído" : "Tente novamente"}</strong><span>{passed ? "Você atingiu a nota mínima de 70%." : "Revise o conteúdo e refaça quando quiser."}</span><small>{storageNotice}</small><button className="button quiz-retake" type="button" onClick={() => { setAnswers({}); setSubmitted(false); setScore(null); setServerFeedback(null); }}>Refazer questionário</button></div>}
          </form>
        </section>
        <div className="module-navigation"><Link href="/modulos">← Voltar à trilha</Link>{nextModule ? <Link href={`/modulos/${nextModule.slug}`}>Próximo: {nextModule.title} →</Link> : <Link href="/progresso">Ver percurso completo →</Link>}</div>
      </div>
    </main>
  );
}
