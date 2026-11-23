"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
import { modules } from "@/lib/course";

type Tool = "tokens" | "clean" | "frequency";

const examples = [
  {
    label: "Texto demonstrativo",
    text: "A vacinação protege as pessoas. A informação clara também protege a comunidade.",
  },
  {
    label: "Texto sobre prevenção",
    text: "Lavar as mãos e manter ambientes ventilados ajudam a reduzir a transmissão de doenças respiratórias.",
  },
];

const stopwords = new Set(
  "a à as o os um uma uns umas de da do das dos em no na nos nas por para com sem e ou que se ao aos como também mais menos isso este esta esse essa são é foi ser ter há pela pelo pelas pelos entre sobre".split(" "),
);

function tokenize(text: string) {
  return text.toLocaleLowerCase("pt-BR").match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu) ?? [];
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20"/><path d="M8 7h8M8 10h7"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/></>,
    code: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11"/><path d="m9 12 2 2 4-4"/></>,
    moon: <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a8.5 8.5 0 1 0 12 12Z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2z"/><path d="m19 14 1.2 2.3L23 17l-2.8 1L19 21l-1.2-3-2.8-1 2.8-.7z"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Home() {
  const [text, setText] = useState(examples[0].text);
  const [tool, setTool] = useState<Tool>("frequency");
  const [dark, setDark] = useState(false);
  const [notice, setNotice] = useState("");

  const tokens = useMemo(() => tokenize(text), [text]);
  const filtered = useMemo(() => tokens.filter((word) => !stopwords.has(word)), [tokens]);
  const frequencies = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR")).slice(0, 8);
  }, [filtered]);

  async function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(txt|csv)$/i.test(file.name)) return setNotice("Envie um arquivo .txt ou .csv.");
    if (file.size > 1_000_000) return setNotice("O limite para esta demonstração é 1 MB.");
    setText(await file.text());
    setNotice(`“${file.name}” carregado apenas nesta sessão. O conteúdo não é enviado nem salvo.`);
  }

  function exportCsv() {
    const rows = [["termo", "frequencia"], ...frequencies.map(([word, count]) => [word, String(count)])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    link.download = "frequencia-de-termos.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className={dark ? "site theme-dark" : "site"}>
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Texto em Dados, início">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">texto<span>em</span>dados</span>
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          <a href="#disciplina">A disciplina</a><a href="#trilha">Trilha de aprendizagem</a><Link href="/laboratorio">Laboratório</Link><Link href="/historico">Matérias</Link><Link href="/dados-oficiais">Dados oficiais</Link><a href="#projeto">O projeto</a>
        </nav>
        <div className="header-actions">
          <button className="theme-button" onClick={() => setDark(!dark)} aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}><Icon name={dark ? "sun" : "moon"} size={18} /></button>
          <Link className="access-status" href="/entrar">ÁREA DO ESTUDANTE ↗</Link>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> DISCIPLINA · ENGENHARIA DE SOFTWARE</div>
            <h1>Das palavras<br />à <span>compreensão.</span></h1>
            <p className="hero-lede">Aprenda a transformar linguagem em conhecimento — explorando mineração de texto e PLN com o contexto informacional da pandemia.</p>
            <div className="hero-actions"><a className="button button-primary" href="#trilha">Explorar a trilha <Icon name="arrow" size={17} /></a><Link className="text-link" href="/laboratorio">Experimentar laboratório <span>↗</span></Link></div>
            <div className="hero-caption"><span className="caption-dot" /> Um espaço aberto para investigar, aprender e questionar.</div>
          </div>
          <div className="hero-visual" aria-label="Ilustração de palavras sendo organizadas em dados">
            <div className="visual-topline"><span>LINGUAGEM NATURAL</span><span className="live-indicator">ESTUDO APLICADO</span></div>
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="visual-core"><div className="core-symbol"><i /><i /><i /><i /></div><span>texto</span><small>em análise</small></div>
            <div className="float-label label-token"><b>vacinação</b><span>termo</span></div>
            <div className="float-label label-context"><b>contexto</b><span>significado</span></div>
            <div className="float-label label-pattern"><b>▂ ▅ ▃ ▇ ▄</b><span>padrões</span></div>
            <div className="visual-foot"><span>01 — 03</span><span>OBSERVAR · PROCESSAR · INTERPRETAR</span></div>
          </div>
          <div className="hero-bottom"><span>MINERAÇÃO DE TEXTO &amp; PLN</span><span>APRENDER COM DADOS REAIS, LER COM SENSO CRÍTICO</span></div>
        </section>

        <section className="intro-section section-wrap" id="disciplina">
          <div className="section-kicker">01 / A DISCIPLINA</div>
          <div className="intro-grid"><h2>Informação também<br />se <em>investiga.</em></h2><div className="intro-text"><p>Em uma crise de saúde pública, circulam milhões de mensagens, notícias e comunicados. Como encontrar sinais relevantes sem perder de vista a origem e o contexto de cada texto?</p><p>Nesta disciplina, você aprende métodos computacionais para organizar e analisar linguagem — e desenvolve o olhar crítico necessário para interpretar o que os resultados realmente dizem.</p><a href="#projeto" className="underlined-link">Conheça a proposta do projeto <Icon name="arrow" size={16} /></a></div></div>
          <div className="principles"><article><span className="principle-icon"><Icon name="book" /></span><div><b>Aprender fazendo</b><p>Conceitos acompanhados de exemplos e experimentos guiados.</p></div></article><article><span className="principle-icon"><Icon name="chart" /></span><div><b>Evidências visíveis</b><p>Resultados explicáveis, com fonte e método em primeiro plano.</p></div></article><article><span className="principle-icon"><Icon name="shield" /></span><div><b>Leitura responsável</b><p>Limitações, privacidade e vieses fazem parte da análise.</p></div></article></div>
        </section>

        <section className="learning-section" id="trilha"><div className="section-wrap"><div className="section-kicker">02 / PERCURSO DE APRENDIZAGEM</div><div className="learning-heading"><div><h2>Uma ideia de cada vez.</h2><p>Do texto bruto à interpretação — com etapas que constroem conhecimento.</p></div><span className="module-count">10 MÓDULOS · DO BÁSICO AO PROJETO</span></div>
          <div className="module-grid">{modules.map((courseModule, index) => <Link className="module-card" href={`/modulos/${courseModule.slug}`} key={courseModule.slug}><span className="module-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{courseModule.title}</h3><p>{courseModule.summary}</p></div><span className="module-arrow">↗</span></Link>)}</div>
          <div className="course-actions"><Link href="/modulos" className="underlined-link">Ver toda a trilha e o progresso local <Icon name="arrow" size={16} /></Link><Link href="/progresso" className="underlined-link">Meu percurso neste navegador <Icon name="arrow" size={16} /></Link></div>
        </div></section>

        <section className="lab-section" id="laboratorio"><div className="section-wrap"><div className="section-kicker">03 / EXPERIMENTO ABERTO</div><div className="lab-heading"><div><span className="lab-tag"><Icon name="spark" size={15} /> LABORATÓRIO DE TEXTO</span><h2>Veja o que existe<br />dentro de um texto.</h2><p>Experimente uma sequência simples de pré-processamento e observe como uma frase vira uma tabela de termos.</p></div><div className="lab-note"><span>DEMONSTRAÇÃO NO NAVEGADOR</span><p>Seu texto é processado localmente nesta página. Nada é enviado ou armazenado.</p></div></div>
          <div className="lab-workspace"><div className="lab-input"><div className="panel-heading"><div><span className="panel-step">ETAPA 1</span><h3>Escolha um texto</h3></div><label className="upload-button"><Icon name="upload" size={16} /> Importar arquivo<input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={loadFile} /></label></div>
              <div className="example-row"><span>EXEMPLOS</span>{examples.map((example, index) => <button key={example.label} className={text === example.text ? "example-chip selected" : "example-chip"} onClick={() => { setText(example.text); setNotice("Exemplo didático selecionado; não é uma citação de fonte histórica."); }}>{index === 0 ? "Texto demonstrativo" : "Prevenção"}</button>)}</div>
              <textarea aria-label="Texto para analisar" maxLength={5000} value={text} onChange={(event) => { setText(event.target.value); setNotice(""); }} placeholder="Cole ou escreva um texto em português…" />
              <div className="input-footer"><span>{text.length.toLocaleString("pt-BR")} / 5.000 caracteres</span><span>Processamento local · sem histórico</span></div>
              <div className="privacy-note"><Icon name="shield" size={16} /><span>Use apenas conteúdo público. Evite informações pessoais ou sensíveis.</span></div>
              <label className="sr-only" htmlFor="file-note">Status do arquivo</label><div id="file-note" role="status" className="status-message">{notice}</div>
            </div>
            <div className="lab-output"><div className="panel-heading output-heading"><div><span className="panel-step">ETAPA 2</span><h3>Explore o resultado</h3></div><span className="result-badge"><span /> ATUALIZADO</span></div>
              <div className="tool-tabs" role="tablist" aria-label="Técnica de análise">{([["frequency", "Frequência"], ["tokens", "Tokens"], ["clean", "Sem stopwords"]] as [Tool, string][]).map(([value, label]) => <button key={value} role="tab" aria-selected={tool === value} className={tool === value ? "tool-tab active" : "tool-tab"} onClick={() => setTool(value)}>{label}</button>)}</div>
              {tool === "frequency" && <><div className="result-summary"><span>TERMOS MAIS FREQUENTES</span><b>{filtered.length} <small>termos após a remoção de stopwords</small></b></div><div className="frequency-list">{frequencies.length ? frequencies.map(([word, count], index) => <div className="frequency-row" key={word}><span className="frequency-rank">0{index + 1}</span><span className="frequency-word">{word}</span><span className="frequency-bar"><i style={{ width: `${Math.max(9, (count / Math.max(frequencies[0][1], 1)) * 100)}%` }} /></span><span className="frequency-count">{count}</span></div>) : <div className="empty-result">Digite um texto para ver a frequência dos termos.</div>}</div><button className="export-button" onClick={exportCsv} disabled={!frequencies.length}>Baixar tabela CSV <Icon name="arrow" size={15} /></button></>}
              {tool === "tokens" && <><div className="result-summary"><span>TOKENS IDENTIFICADOS</span><b>{tokens.length} <small>unidades após tokenização</small></b></div><div className="token-cloud">{tokens.length ? tokens.map((token, index) => <span key={`${token}-${index}`} className={stopwords.has(token) ? "token muted" : "token"}>{token}</span>) : <div className="empty-result">Digite um texto para ver os tokens.</div>}</div><p className="method-caption">A tokenização separa o texto em unidades. A pontuação foi descartada nesta demonstração.</p></>}
              {tool === "clean" && <><div className="result-summary"><span>APÓS A FILTRAGEM</span><b>{filtered.length} <small>tokens mantidos de {tokens.length}</small></b></div><div className="token-cloud">{filtered.length ? filtered.map((token, index) => <span key={`${token}-${index}`} className="token kept">{token}</span>) : <div className="empty-result">Digite um texto para ver os tokens filtrados.</div>}</div><p className="method-caption">Lista didática curta de palavras comuns. Stopwords dependem do idioma e da tarefa.</p></>}
              <div className="method-footer"><span>MÉTODO</span><p>Contagem após minúsculas, tokenização Unicode e remoção de uma lista curta de stopwords em português.</p></div>
            </div></div>
            <div className="lab-disclaimer"><span>ⓘ</span><p>Esta é uma demonstração didática executada no navegador. Ela não usa um modelo treinado nem representa uma análise histórica. O texto e as contagens são derivados somente da entrada exibida.</p></div>
          </div></section>

        <section className="project-section section-wrap" id="projeto"><div className="section-kicker">04 / SOBRE O PROJETO</div><div className="project-grid"><div><h2>Aprender a analisar<br />é aprender a <em>perguntar.</em></h2></div><div><p>Este espaço acompanha a disciplina de Mineração de Texto e Linguagem Natural e usa a circulação de informação durante a pandemia de COVID-19 como contexto de estudo.</p><p>O objetivo é explorar métodos computacionais com transparência: de onde vêm os textos, como são processados e quais conclusões não podemos tirar deles.</p><div className="project-meta"><span>PROJETO ACADÊMICO</span><span>CONTEÚDO EM CONSTRUÇÃO</span></div></div></div></section>
      </main>

      <footer className="footer"><div className="section-wrap footer-inner"><a className="brand footer-brand" href="#inicio"><span className="brand-mark"><span /><span /><span /></span><span className="brand-name">texto<span>em</span>dados</span></a><p>Uma plataforma de aprendizagem para explorar linguagem com método e responsabilidade.</p><div className="footer-links"><a href="#disciplina">A disciplina</a><Link href="/modulos">Módulos</Link><Link href="/laboratorio">Laboratório</Link><Link href="/historico">Matérias</Link><Link href="/dados-oficiais">Dados oficiais</Link><Link href="/sobre">Sobre</Link><Link href="/referencias">Referências</Link><Link href="/privacidade">Privacidade</Link></div><div className="footer-bottom"><span>© 2026 · Projeto acadêmico</span><span>Sem vínculo institucional ou endosso de órgãos de saúde.</span><a href="#inicio">Voltar ao início ↑</a></div></div></footer>
    </div>
  );
}
