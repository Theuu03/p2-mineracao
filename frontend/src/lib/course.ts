export type Question = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type CourseModule = {
  slug: string;
  title: string;
  summary: string;
  outcomes: string[];
  concept: string;
  howItWorks: string;
  covidContext: string;
  practice: string;
  limitations: string;
  reference: { label: string; url: string };
  questions: Question[];
};

export const modules: CourseModule[] = [
  {
    slug: "introducao-mineracao-texto",
    title: "Introdução à Mineração de Texto",
    summary: "Como transformar coleções de linguagem em perguntas que podem ser investigadas.",
    outcomes: ["Distinguir dados estruturados de texto não estruturado", "Descrever as etapas de um projeto de mineração de texto", "Diferenciar mineração de texto, PLN e aprendizado de máquina"],
    concept: "Mineração de texto é o processo de extrair padrões e informações úteis de documentos. Ela combina preparação de dados, métodos de linguagem, estatística e interpretação humana. O resultado não é uma verdade automática: depende da coleção, da pergunta e das escolhas feitas durante a análise.",
    howItWorks: "Um fluxo comum define uma pergunta, obtém e documenta o corpus, inspeciona os textos, limpa e representa os documentos, aplica uma técnica e interpreta os resultados. PLN reúne métodos para trabalhar com linguagem; aprendizado de máquina aprende padrões a partir de exemplos ou estrutura dos dados; mineração de texto organiza essas e outras técnicas em uma investigação orientada a documentos.",
    covidContext: "Comunicados, artigos e notícias publicados durante a pandemia podem ser organizados por data, fonte e tema para estudar como a informação circulou. Uma coleção de títulos selecionados serve para demonstrar contagens, mas não representa todas as notícias nem a opinião pública.",
    practice: "Use o Laboratório para comparar tokens e frequências em dois títulos. Antes de comparar, registre quem publicou cada texto, em que data e qual critério de seleção foi usado.",
    limitations: "Uma frequência alta não prova importância causal. Duplicatas, diferenças entre fontes, cobertura desigual e mudanças no vocabulário podem alterar o resultado.",
    reference: { label: "Manning, Raghavan e Schütze — Introduction to Information Retrieval", url: "https://nlp.stanford.edu/IR-book/" },
    questions: [
      { prompt: "Qual descrição define melhor mineração de texto?", options: ["Extrair padrões úteis de coleções de documentos com métodos computacionais e interpretação", "Converter cada frase em uma opinião verdadeira", "Armazenar textos em uma tabela sem analisá-los", "Substituir a leitura crítica por uma contagem"], answer: 0, explanation: "A mineração combina preparação, análise e interpretação; seus padrões precisam ser avaliados no contexto da coleção." },
      { prompt: "Qual item é um dado não estruturado?", options: ["Uma notícia em texto corrido", "Uma coluna de datas ISO padronizadas", "Uma tabela com idade numérica validada", "Um código de categoria previamente definido"], answer: 0, explanation: "Texto livre não segue necessariamente campos e tipos fixos como uma tabela estruturada." },
      { prompt: "Como PLN se relaciona com mineração de texto?", options: ["PLN oferece métodos para processar linguagem que podem integrar um fluxo de mineração", "PLN e mineração de texto são termos idênticos em qualquer contexto", "PLN serve apenas para traduzir idiomas", "Mineração de texto não usa linguagem"], answer: 0, explanation: "PLN é um campo de métodos para linguagem; mineração de texto é um processo mais amplo de investigação de coleções." },
      { prompt: "O que deve acontecer antes de interpretar uma frequência de palavras?", options: ["Documentar a origem, os critérios e o pré-processamento do corpus", "Assumir que o corpus representa toda a população", "Remover todos os documentos incomuns", "Tratar a maior contagem como causa do fenômeno"], answer: 0, explanation: "Origem, seleção e preparação determinam o que uma contagem pode significar." },
      { prompt: "Uma palavra aparece muitas vezes em um conjunto de títulos. O que é possível concluir diretamente?", options: ["Ela aparece com frequência nesse conjunto, após as regras de contagem", "Ela é a principal preocupação de toda a população", "Ela causou o evento descrito", "Todos os textos concordam com o mesmo sentimento"], answer: 0, explanation: "A conclusão direta é limitada aos textos e ao método usados; generalizações exigem evidência adicional." },
    ],
  },
  {
    slug: "fundamentos-pln",
    title: "Fundamentos de Linguagem Natural",
    summary: "Representar palavras e frases sem ignorar ambiguidade, contexto e particularidades do português.",
    outcomes: ["Explicar tokenização e normalização", "Comparar stemming e lematização", "Reconhecer limites de listas de stopwords"],
    concept: "Processamento de Linguagem Natural (PLN) reúne técnicas computacionais para analisar, gerar ou transformar linguagem humana. Palavras são ambíguas: o sentido depende da frase, do domínio, da época e de quem escreve.",
    howItWorks: "Tokenização separa o texto em unidades. Normalização pode uniformizar caixa e caracteres. Stopwords são palavras frequentes que algumas tarefas filtram. Stemming reduz sufixos por regras aproximadas; lematização busca a forma de dicionário considerando informação linguística. As etapas dependem do objetivo e não devem ser aplicadas automaticamente a toda tarefa.",
    covidContext: "Em textos brasileiros sobre saúde, flexões, siglas, termos técnicos e variação regional desafiam ferramentas genéricas. A mesma palavra pode ter função distinta em uma orientação clínica, uma notícia ou um comentário informal.",
    practice: "Cole uma frase no Laboratório e compare tokens antes e depois da filtragem. Repare em nomes próprios, negações e termos como “não”: removê-los pode inverter o sentido.",
    limitations: "Tokenização por expressão regular não entende sintaxe. Uma lista de stopwords curta não é um modelo linguístico. Stemming e lematização podem apagar distinções importantes.",
    reference: { label: "spaCy — documentação de processamento", url: "https://spacy.io/usage/spacy-101" },
    questions: [
      { prompt: "O que a tokenização faz?", options: ["Divide uma sequência textual em unidades definidas", "Determina se uma afirmação é verdadeira", "Traduz todas as palavras", "Calcula a licença do documento"], answer: 0, explanation: "Tokenização define unidades como palavras ou sinais, conforme as regras escolhidas." },
      { prompt: "Por que remover a palavra “não” pode ser um erro?", options: ["A negação pode inverter o sentido da frase", "Ela nunca é token", "Toda stopword é sempre essencial", "A palavra impede a tokenização"], answer: 0, explanation: "Em “não recomendado”, retirar a negação altera a polaridade do enunciado." },
      { prompt: "Qual é a diferença geral entre stemming e lematização?", options: ["Stemming corta formas por regras; lematização tenta recuperar o lema linguístico", "Stemming traduz e lematização resume", "São sempre equivalentes", "Lematização remove todos os verbos"], answer: 0, explanation: "A lematização usa conhecimento linguístico para obter a forma canônica; stemming tende a ser mais simples e aproximado." },
      { prompt: "Uma lista de stopwords deve ser escolhida considerando…", options: ["a tarefa e o domínio do corpus", "apenas o idioma do navegador", "a maior palavra do texto", "uma regra universal sem exceções"], answer: 0, explanation: "Palavras comuns podem ser fundamentais em tarefas como análise de negação, autoria ou estilo." },
      { prompt: "Uma expressão regular separa palavras, mas confunde uma abreviação clínica. O que isso mostra?", options: ["Regras simples não capturam todo o contexto linguístico", "O texto está necessariamente corrompido", "A expressão regular virou um modelo treinado", "A abreviação não pertence à linguagem"], answer: 0, explanation: "Regras superficiais são úteis e rápidas, mas têm limites em linguagem real e especializada." },
    ],
  },
  {
    slug: "preparacao-limpeza",
    title: "Preparação e Limpeza de Dados Textuais",
    summary: "Montar um corpus rastreável, consistente e apropriado para a pergunta de pesquisa.",
    outcomes: ["Descrever um pipeline de preparação", "Identificar duplicatas e campos ausentes", "Considerar privacidade e licença antes da análise"],
    concept: "Preparar dados textuais é tornar documentos adequados a uma tarefa sem apagar a proveniência nem distorcer o conteúdo. A limpeza começa pela inspeção e pela definição de regras reproduzíveis, não por remover tudo que pareça ruído.",
    howItWorks: "Registre fonte, data de coleta, licença e identificador. Valide campos, codificação e idioma; detecte duplicatas; trate valores ausentes; aplique transformações versionadas; revise amostras e gere um relatório. Preserve uma cópia autorizada do original e registre os parâmetros usados.",
    covidContext: "Um corpus de comunicados pode conter republicações, alterações de página e documentos de datas diferentes. Deduplicar sem guardar o identificador ou remover data e fonte dificulta interpretar a evolução da informação.",
    practice: "Monte uma lista de cinco documentos com URL, data e tipo de fonte. Marque quais são duplicatas e explique como sua regra trata uma versão corrigida de um comunicado.",
    limitations: "Normalização agressiva pode remover acentos, negações, números de versão ou nomes. Coleta automatizada pode violar termos de uso. Dados públicos ainda podem conter informação pessoal incidental.",
    reference: { label: "W3C — Data on the Web Best Practices", url: "https://www.w3.org/TR/dwbp/" },
    questions: [
      { prompt: "Por que registrar a fonte e a data de coleta?", options: ["Para permitir rastreabilidade e interpretação temporal", "Para aumentar artificialmente a quantidade", "Para dispensar a revisão da licença", "Para trocar o texto original sem registro"], answer: 0, explanation: "Metadados de proveniência permitem saber de onde veio cada documento e reproduzir decisões." },
      { prompt: "Qual é uma prática segura ao deduplicar?", options: ["Usar identificadores ou hashes e documentar o critério", "Excluir documentos parecidos sem guardar log", "Remover textos sem título automaticamente", "Deduplicar por cor da página"], answer: 0, explanation: "Identificadores e hashes tornam a regra explícita; documentos semelhantes podem não ser duplicatas exatas." },
      { prompt: "Como tratar um campo de data ausente?", options: ["Preservar a ausência e registrar a regra aplicada", "Inventar uma data aproximada sem marcar", "Usar a data de hoje em todos os registros", "Apagar o restante do corpus"], answer: 0, explanation: "Não se deve inventar dado. A ausência precisa ser representada e considerada na análise." },
      { prompt: "Conteúdo publicamente acessível pode ser reutilizado sempre?", options: ["Não; licença, termos e privacidade precisam ser verificados", "Sim, sem atribuição", "Sim, inclusive dados identificáveis de pacientes", "Não, nenhuma fonte pública pode ser estudada"], answer: 0, explanation: "A disponibilidade na web não elimina condições de licença, atribuição e proteção de dados." },
      { prompt: "Por que preservar o original autorizado além da versão limpa?", options: ["Para auditar as transformações e revisar erros", "Para publicar dados pessoais livremente", "Para duplicar os resultados", "Para evitar documentar o pipeline"], answer: 0, explanation: "A comparação com a fonte ajuda a verificar se as transformações introduziram distorções." },
    ],
  },
  {
    slug: "frequencia-representacao",
    title: "Frequência e Representação Textual",
    summary: "Contar termos, criar n-gramas e converter documentos em vetores comparáveis.",
    outcomes: ["Calcular frequências absolutas e relativas", "Explicar Bag of Words e TF-IDF", "Interpretar similaridade do cosseno"],
    concept: "Uma representação textual transforma documentos em estruturas que algoritmos podem comparar. A contagem de palavras é simples e transparente; vetores TF-IDF destacam termos frequentes em um documento e menos comuns no conjunto.",
    howItWorks: "Frequência absoluta conta ocorrências; relativa divide por um denominador definido. N-gramas registram sequências de n tokens. Bag of Words representa contagens por vocabulário. TF-IDF combina frequência no documento com raridade na coleção. Similaridade do cosseno compara a orientação dos vetores, não a verdade ou qualidade dos textos.",
    covidContext: "Comparar comunicados de diferentes períodos pode revelar mudanças no vocabulário de uma coleção específica. É necessário controlar tamanho dos documentos, composição das fontes e critérios de seleção.",
    practice: "Compare duas frases com o Laboratório. Observe que a frequência ignora a ordem, enquanto bigramas como “saúde pública” preservam uma pequena parte do contexto.",
    limitations: "TF-IDF não entende significado nem sinonímia; o resultado depende do vocabulário e da coleção. Similaridade alta não comprova que dois textos tenham a mesma intenção.",
    reference: { label: "scikit-learn — Feature extraction", url: "https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction" },
    questions: [
      { prompt: "Frequência absoluta de um termo é…", options: ["o número de ocorrências segundo uma regra de tokenização", "a proporção de documentos verdadeiros", "a quantidade de caracteres do corpus", "um escore de sentimento"], answer: 0, explanation: "É uma contagem de ocorrências; a regra de tokenização determina o que conta como termo." },
      { prompt: "O que um bigrama representa?", options: ["Uma sequência de dois tokens", "Um texto com dois autores", "Uma palavra com duas sílabas", "Uma dupla de documentos duplicados"], answer: 0, explanation: "N-gramas são sequências de n unidades; um bigrama tem n igual a dois." },
      { prompt: "Por que TF-IDF reduz o peso de um termo muito comum em todos os documentos?", options: ["Porque ele diferencia pouco os documentos naquela coleção", "Porque ele é sempre uma stopword", "Porque o termo é necessariamente incorreto", "Porque TF-IDF mede tamanho de frases"], answer: 0, explanation: "A parte IDF dá menos peso aos termos distribuídos amplamente no corpus." },
      { prompt: "Uma similaridade de cosseno alta demonstra que…", options: ["os vetores são próximos segundo aquela representação", "os documentos são factualmente verdadeiros", "os autores têm a mesma intenção", "um texto causou o outro"], answer: 0, explanation: "O escore depende do vetor e não comprova equivalência semântica ou factual." },
      { prompt: "Qual limitação é típica de Bag of Words?", options: ["A ordem das palavras costuma ser ignorada", "Não pode contar termos", "Exige áudio", "Só funciona com dados numéricos originais"], answer: 0, explanation: "A representação por contagens perde ordem e contexto, salvo quando se usam n-gramas." },
    ],
  },
  {
    slug: "analise-sentimentos",
    title: "Análise de Sentimentos",
    summary: "Estimar polaridade textual sem confundir uma previsão com a opinião real de alguém.",
    outcomes: ["Distinguir sentimento textual de emoção humana", "Comparar léxico e modelo supervisionado", "Reconhecer negação, ironia e viés"],
    concept: "Análise de sentimentos tenta classificar a polaridade expressa por um texto segundo um esquema definido. O rótulo descreve uma previsão do método para o texto observado; não é uma medida direta do estado emocional nem da opinião de toda uma população.",
    howItWorks: "Um método léxico soma ou combina palavras de polaridade predefinida. Um classificador supervisionado aprende associações em exemplos rotulados. Para avaliar, separe treino e teste corretamente, meça precisão, recall e F1 e inspecione erros por subgrupo e tipo de texto.",
    covidContext: "Mensagens sobre vacinação podem conter relatos, dúvidas, sarcasmo, citações de terceiros e negações. A classificação depende de quem produziu os rótulos, de qual população e de como os exemplos foram coletados.",
    practice: "Compare “A vacina foi eficaz” e “A vacina não foi eficaz”. Veja se uma abordagem baseada apenas em palavras positivas detectaria a negação.",
    limitations: "Ironia, contexto, linguagem informal, citações e mudança de domínio causam erros. Uma amostra de redes sociais não representa automaticamente a opinião pública.",
    reference: { label: "Liu — Sentiment Analysis: Mining Opinions, Sentiments, and Emotions", url: "https://www.cambridge.org/core/books/sentiment-analysis/" },
    questions: [
      { prompt: "O resultado de um classificador de sentimento descreve…", options: ["uma previsão do método para o texto e esquema de rótulos usados", "a emoção real do autor com certeza", "a opinião de toda a população", "uma confirmação médica"], answer: 0, explanation: "O classificador produz uma estimativa condicionada aos dados, rótulos e modelo." },
      { prompt: "Qual frase evidencia o desafio da negação?", options: ["A medida não funcionou", "A medida funcionou", "O relatório tem duas páginas", "A notícia foi publicada terça-feira"], answer: 0, explanation: "Uma palavra positiva pode aparecer em contexto negado, invertendo o sentido esperado." },
      { prompt: "Para que serve um conjunto de teste separado?", options: ["Estimar desempenho em exemplos não usados para ajustar o modelo", "Aumentar o conjunto de treino depois de ver as respostas", "Criar rótulos sem revisão", "Substituir a validação dos dados"], answer: 0, explanation: "A separação ajuda a medir generalização sem avaliar nos mesmos exemplos usados no ajuste." },
      { prompt: "Uma amostra de comentários públicos online representa necessariamente toda a população?", options: ["Não; participação e seleção podem introduzir vieses", "Sim, pois qualquer texto publicado é aleatório", "Sim, se houver muitas palavras", "Não, porque textos não podem ser estudados"], answer: 0, explanation: "Acesso à plataforma, decisão de comentar e método de coleta alteram quem aparece na amostra." },
      { prompt: "Qual afirmação é adequada ao publicar um resultado?", options: ["A classificação pode conter erros e não equivale à opinião real da população", "O modelo prova o sentimento de cada pessoa", "A pontuação elimina a necessidade de contexto", "O rótulo é um diagnóstico clínico"], answer: 0, explanation: "Resultados automatizados devem ser apresentados como estimativas, com método e limites." },
    ],
  },
  {
    slug: "classificacao-textos",
    title: "Classificação Automática de Textos",
    summary: "Treinar classificadores, avaliar erros e evitar vazamento entre treino e teste.",
    outcomes: ["Explicar classificação supervisionada", "Interpretar matriz de confusão e F1", "Identificar overfitting e vazamento de dados"],
    concept: "Classificação supervisionada aprende uma função que associa documentos a categorias usando exemplos rotulados. A qualidade do sistema depende dos rótulos, da separação dos dados, da representação e da métrica escolhida.",
    howItWorks: "Defina classes e guia de anotação, divida por documento ou grupo para evitar vazamento, ajuste o modelo apenas no treino e avalie no teste. Naive Bayes e regressão logística são linhas de base úteis. Transformers podem capturar contexto, mas exigem recursos, avaliação e análise de viés.",
    covidContext: "Um classificador didático pode separar textos em temas como vacinação, prevenção ou sintomas, desde que a coleção tenha rótulos documentados e representativos do uso pretendido.",
    practice: "Faça uma matriz de confusão hipotética a partir de dez exemplos rotulados manualmente. Calcule quantos falsos positivos existem e discuta o custo do erro para a tarefa.",
    limitations: "Desbalanceamento, desacordo entre anotadores e mudança de domínio afetam resultados. Vazamento de versões duplicadas entre treino e teste pode inflar métricas.",
    reference: { label: "scikit-learn — Model evaluation", url: "https://scikit-learn.org/stable/modules/model_evaluation.html" },
    questions: [
      { prompt: "Em classificação supervisionada, os exemplos de treino contêm…", options: ["documentos e rótulos usados para aprender padrões", "apenas resultados finais sem entrada", "somente dados futuros", "textos sem qualquer categoria"], answer: 0, explanation: "O rótulo supervisiona o ajuste do modelo durante o treinamento." },
      { prompt: "Precisão de uma classe responde principalmente…", options: ["entre os exemplos previstos como positivos, quantos estavam corretos?", "quantos documentos existem no corpus?", "qual é a duração média de uma frase?", "quantos rótulos foram inventados?"], answer: 0, explanation: "Precisão mede a proporção de verdadeiros positivos entre as previsões positivas." },
      { prompt: "O que é vazamento de dados?", options: ["Informação de avaliação influencia indevidamente o treino ou ajuste", "Um arquivo é salvo em CSV", "Um texto contém uma URL", "Uma categoria tem poucos exemplos"], answer: 0, explanation: "Vazamento permite que o modelo use pistas que não estariam disponíveis na avaliação real." },
      { prompt: "Por que dividir versões duplicadas do mesmo documento entre treino e teste é arriscado?", options: ["O teste pode parecer fácil porque o modelo já viu conteúdo quase igual", "A divisão sempre melhora a generalização", "Duplicatas não contêm texto", "O modelo deixa de ter categorias"], answer: 0, explanation: "Documentos repetidos causam contaminação entre as partições e superestimam desempenho." },
      { prompt: "Um F1 alto sozinho garante um bom classificador em produção?", options: ["Não; também é preciso avaliar contexto, dados, erros e custos", "Sim, em qualquer população", "Sim, se o modelo usar Transformers", "Não, porque F1 nunca é uma métrica"], answer: 0, explanation: "Métricas agregadas não substituem análise de adequação, representatividade e consequências dos erros." },
    ],
  },
  {
    slug: "modelagem-topicos",
    title: "Modelagem de Tópicos",
    summary: "Explorar estruturas temáticas em coleções e avaliar se os tópicos fazem sentido.",
    outcomes: ["Descrever a ideia de tópicos latentes", "Entender uma aplicação de LDA", "Avaliar coerência e estabilidade"],
    concept: "Modelagem de tópicos agrupa padrões de coocorrência de palavras para resumir temas potenciais em uma coleção. Um tópico é uma distribuição de termos interpretável pelo pesquisador, não uma categoria verdadeira que o algoritmo descobriu de forma definitiva.",
    howItWorks: "No LDA, cada documento é modelado como mistura de tópicos e cada tópico como distribuição de palavras. O número de tópicos e o pré-processamento influenciam a solução. Avalie listas de termos, documentos representativos, estabilidade entre execuções e utilidade para a pergunta.",
    covidContext: "Em artigos publicados em períodos distintos, temas como vigilância, vacinação e impacto social podem aparecer de maneira diferente. Uma mudança pode refletir composição do corpus ou indexação, não necessariamente a evolução de toda a pesquisa.",
    practice: "Separe um pequeno conjunto de resumos por período e escreva, antes de rodar um modelo, o que faria um tópico ser interpretável e quais documentos você inspecionaria.",
    limitations: "Resultados variam com parâmetros, vocabulário e tamanho do corpus. Rótulos humanos adicionados depois são interpretações, não saídas literais do algoritmo.",
    reference: { label: "Blei, Ng e Jordan — Latent Dirichlet Allocation", url: "https://jmlr.org/papers/v3/blei03a.html" },
    questions: [
      { prompt: "O que representa um tópico em LDA?", options: ["Uma distribuição de probabilidade sobre palavras", "Uma verdade causal comprovada", "Uma categoria oficial escrita pelo autor", "Um documento único"], answer: 0, explanation: "No modelo, tópicos distribuem probabilidade entre termos; sua interpretação depende da análise humana." },
      { prompt: "O número de tópicos escolhido…", options: ["afeta os padrões resultantes e precisa ser avaliado", "é sempre igual ao número de documentos", "não influencia a saída", "é informado diretamente pelos textos como verdade"], answer: 0, explanation: "É um parâmetro de modelagem e diferentes valores podem gerar estruturas distintas." },
      { prompt: "Como nomear um tópico com responsabilidade?", options: ["Inspecionar termos e documentos representativos e registrar a interpretação", "Copiar o termo mais frequente como fato definitivo", "Assumir que o algoritmo entende o evento histórico", "Usar o nome de uma fonte sem ler os documentos"], answer: 0, explanation: "O rótulo é uma síntese humana que deve ser sustentada por exemplos observados." },
      { prompt: "Por que comparar tópicos entre períodos exige cautela?", options: ["A composição do corpus e o pré-processamento podem ter mudado", "Tópicos não podem ser comparados", "O calendário altera o idioma", "Um tópico é uma série epidemiológica"], answer: 0, explanation: "Mudanças nos textos coletados ou regras podem explicar diferenças aparentes." },
      { prompt: "Qual avaliação complementa a coerência automática?", options: ["Leitura de documentos e estabilidade da solução", "Somente o tamanho do arquivo", "A cor do gráfico", "A quantidade de caracteres do rótulo"], answer: 0, explanation: "Inspeção humana e estabilidade ajudam a verificar se os padrões são úteis e interpretáveis." },
    ],
  },
  {
    slug: "entidades-nomeadas",
    title: "Reconhecimento de Entidades Nomeadas",
    summary: "Identificar menções a pessoas, organizações, locais e datas e revisar seus limites.",
    outcomes: ["Definir NER", "Reconhecer tipos de entidade e ambiguidades", "Interpretar precisão e recall de extração"],
    concept: "Reconhecimento de entidades nomeadas (NER) identifica trechos que pertencem a classes como pessoa, organização, local ou data. NER marca menções textuais; não resolve automaticamente quem é a pessoa nem confirma a informação.",
    howItWorks: "Sistemas podem usar regras, modelos estatísticos ou redes neurais contextualizadas. Eles atribuem rótulos a spans. Avalie limites de entidades e classes com exemplos anotados, reportando precisão, recall e casos ambíguos do domínio.",
    covidContext: "Comunicados podem mencionar ministérios, cidades, datas e instituições científicas. Siglas, nomes compostos e referências a organizações variam conforme a fonte e o contexto.",
    practice: "Anote manualmente pessoas, organizações, lugares e datas em três parágrafos públicos. Compare rótulos entre colegas e registre divergências antes de automatizar a tarefa.",
    limitations: "Modelos gerais podem falhar com siglas, nomes compostos, entidades novas e português especializado. Extração não equivale a verificação de fatos.",
    reference: { label: "spaCy — Linguistic features: named entities", url: "https://spacy.io/usage/linguistic-features#named-entities" },
    questions: [
      { prompt: "O que o NER identifica?", options: ["Trechos classificados como entidades, como locais ou organizações", "A veracidade de cada frase", "A opinião política do autor", "Todos os pronomes com certeza"], answer: 0, explanation: "NER marca menções segundo rótulos definidos; outras tarefas são necessárias para relacionar ou verificar fatos." },
      { prompt: "A expressão “Ministério da Saúde” em um texto é tipicamente…", options: ["uma menção a uma organização", "uma medida de sentimento", "uma data", "um algoritmo de classificação"], answer: 0, explanation: "É uma menção institucional; o rótulo concreto depende do esquema adotado." },
      { prompt: "Uma entidade extraída automaticamente pode confirmar um fato?", options: ["Não; extração localiza e classifica menções, não verifica sua veracidade", "Sim, sempre", "Sim, se estiver em maiúsculas", "Não, pois entidades não aparecem em textos"], answer: 0, explanation: "NER é uma tarefa de reconhecimento textual, distinta de checagem factual." },
      { prompt: "Como avaliar NER de forma útil?", options: ["Comparar spans e classes com uma amostra anotada e revisar erros", "Contar apenas documentos", "Avaliar a cor da nuvem de palavras", "Assumir que todos os nomes próprios foram detectados"], answer: 0, explanation: "A comparação com anotações permite medir acertos, omissões e limites de entidades." },
      { prompt: "Qual desafio é comum em português especializado?", options: ["Siglas e nomes compostos variam entre fontes", "O idioma não tem nomes próprios", "Datas não podem ser escritas", "NER não aceita pontuação"], answer: 0, explanation: "Variação de siglas, convenções e entidades novas dificulta modelos treinados em outros domínios." },
    ],
  },
  {
    slug: "desinformacao-analise-critica",
    title: "Desinformação e Análise Crítica",
    summary: "Investigar circulação e linguagem sem tratar classificação automatizada como checagem.",
    outcomes: ["Distinguir classificação de verificação", "Analisar viés de dados e evidências", "Propor uma checagem responsável"],
    concept: "Desinformação é um fenômeno sociotécnico. Padrões linguísticos podem ajudar a priorizar materiais para análise, mas não determinam por si só se uma afirmação é verdadeira ou falsa. Verificação exige fontes, evidências e contexto.",
    howItWorks: "Formule a alegação verificável, localize sua origem e contexto, procure evidências primárias ou fontes confiáveis, compare datas e versões e documente a conclusão. Modelos de classificação podem apoiar triagem, mas precisam de avaliação externa, transparência e supervisão humana.",
    covidContext: "Durante crises sanitárias, afirmações circulam em formatos e plataformas diferentes. Um texto recortado pode perder contexto; a data e a versão importam. A análise deve evitar amplificar conteúdo nocivo sem necessidade.",
    practice: "Escolha uma alegação já analisada por uma agência de checagem confiável. Registre a alegação, a fonte original, as evidências primárias e o que permanece incerto.",
    limitations: "Classificadores herdam vieses de plataforma, idioma e rotulagem. Uma pontuação não é prova, e linguagem sensacionalista não determina falsidade.",
    reference: { label: "OMS — Managing the COVID-19 infodemic", url: "https://www.who.int/health-topics/infodemic" },
    questions: [
      { prompt: "Um classificador marcou uma notícia como suspeita. Isso prova que ela é falsa?", options: ["Não; a previsão pode orientar triagem, mas checagem exige evidências", "Sim, qualquer modelo decide a verdade", "Sim, se o texto for longo", "Não, pois toda classificação é proibida"], answer: 0, explanation: "A classificação não substitui apuração de alegações e evidências." },
      { prompt: "O que é uma boa evidência em uma checagem?", options: ["Fonte primária pertinente e contexto verificável", "Um rótulo de modelo sem explicação", "A quantidade de compartilhamentos", "Uma captura sem origem ou data"], answer: 0, explanation: "Checagem precisa de evidências rastreáveis, contextualizadas e relacionadas à alegação." },
      { prompt: "Por que conjuntos rotulados podem ser enviesados?", options: ["Seleção, cobertura de plataforma e decisões de anotação afetam quem e o que aparece", "Rótulos nunca influenciam modelos", "Todos os textos são coletados aleatoriamente", "Viés só existe em dados numéricos"], answer: 0, explanation: "A origem e o processo de anotação moldam os exemplos e as conclusões do classificador." },
      { prompt: "Uma linguagem dramática é prova de falsidade?", options: ["Não; estilo sozinho não verifica uma alegação", "Sim, em qualquer contexto", "Sim, se contiver exclamações", "Não, porque linguagem não pode ser estudada"], answer: 0, explanation: "Características linguísticas podem motivar revisão, mas não demonstram que uma afirmação é falsa." },
      { prompt: "Como reduzir amplificação desnecessária de conteúdo nocivo em um exercício?", options: ["Reproduzir apenas o necessário, contextualizar e apontar fonte confiável", "Repetir a alegação em destaque sem contexto", "Transformar a saída do modelo em selo de verdade", "Remover links de origem"], answer: 0, explanation: "Contextualização e minimização ajudam a estudar o caso sem apresentar a alegação como fato." },
    ],
  },
  {
    slug: "projeto-integrador",
    title: "Projeto Prático Final",
    summary: "Planejar uma análise completa, reproduzível e crítica de um corpus textual.",
    outcomes: ["Definir pergunta e corpus", "Executar e documentar um pipeline", "Comunicar resultados e limitações"],
    concept: "Um projeto integrador reúne pergunta, dados, preparação, método, avaliação e interpretação. O relatório precisa permitir que outra pessoa entenda decisões e limites, mesmo que não consiga redistribuir documentos protegidos.",
    howItWorks: "Defina uma pergunta estreita; selecione fontes e confirme licenças; registre critérios; inspecione e prepare os dados; aplique uma técnica; compare com uma linha de base; analise erros e vieses; visualize com denominadores claros; descreva limitações e disponibilize scripts/metadados compatíveis com a licença.",
    covidContext: "Uma comparação documental sobre comunicados públicos de períodos definidos pode investigar vocabulário e temas nas fontes selecionadas. A conclusão deve se limitar à coleção e não inferir causalidade ou opinião geral sem desenho adequado.",
    practice: "Escreva uma proposta de uma página com pergunta, corpus, fonte, licença, período, pipeline, método, avaliação, visualização e três riscos de viés.",
    limitations: "Resultados dependem de aquisição, licença, seleção, anotação e escolhas analíticas. Reprodutibilidade requer versões e parâmetros, enquanto privacidade e direitos limitam o que pode ser compartilhado.",
    reference: { label: "CRISP-DM 1.0 — guia de processo de mineração de dados", url: "https://www.the-modeling-agency.com/crisp-dm.pdf" },
    questions: [
      { prompt: "Qual é um bom primeiro passo de um projeto textual?", options: ["Formular uma pergunta e definir a população documental de interesse", "Escolher um gráfico antes de conhecer os dados", "Treinar um modelo sem rótulos nem objetivo", "Publicar resultados antes de validar a licença"], answer: 0, explanation: "A pergunta orienta seleção do corpus, técnica e avaliação." },
      { prompt: "O que deve aparecer na documentação do corpus?", options: ["Fonte, período, critérios, licença, idioma e limitações", "Somente o nome do arquivo", "Apenas o total sem método de contagem", "Dados pessoais de autores"], answer: 0, explanation: "Proveniência, condições e limitações sustentam interpretação e reutilização responsável." },
      { prompt: "Uma visualização responsável deve…", options: ["informar unidades, denominadores, filtros e origem dos dados", "ocultar dados ausentes", "usar contagens sem período", "sugerir causalidade sem evidência"], answer: 0, explanation: "Contexto gráfico e método permitem compreender o alcance da medida." },
      { prompt: "Por que uma linha de base simples é útil?", options: ["Ajuda a saber se um método mais complexo realmente acrescenta valor", "Garante que o modelo avançado será correto", "Elimina necessidade de dados de teste", "Escolhe a pergunta por você"], answer: 0, explanation: "Uma comparação simples contextualiza o ganho real de complexidade." },
      { prompt: "Qual conclusão é adequada para um corpus de documentos selecionados?", options: ["Descrever padrões observados nessa coleção, com limites explícitos", "Afirmar que todo o país pensa da mesma forma", "Atribuir causa com base em frequência", "Ignorar como os documentos foram coletados"], answer: 0, explanation: "A inferência precisa respeitar desenho, amostragem e método." },
    ],
  },
];

export function getModule(slug: string) {
  return modules.find((courseModule) => courseModule.slug === slug);
}

export function getCompletionPercent(completed: string[]) {
  if (modules.length === 0) return 0;
  return Math.round((modules.filter((item) => completed.includes(item.slug)).length / modules.length) * 100);
}
