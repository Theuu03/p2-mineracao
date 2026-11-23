# Arquitetura inicial

## Proposta

```text
Navegador → Next.js (App Router, React, TypeScript, CSS responsivo)
          → API REST Spring Boot (identidade, autorização e domínio educacional)
              → PostgreSQL + Flyway
              → FastAPI (operações PLN sem estado, sem persistir textos)
```

O Spring Boot será a fonte de verdade para usuários, papéis, conteúdo, tentativas e progresso. O navegador não chamará o serviço PLN diretamente. O serviço Java valida identidade, papel, limites e formato e encaminha a solicitação ao serviço Python em rede interna. Nenhum serviço deve salvar texto enviado ao laboratório por padrão ou incluí-lo nos logs. Bibliotecas e modelos de PLN serão disponibilizados apenas com implementação, licença e limitações documentadas. O frontend inicial funciona isolado e não simula autenticação ou persistência.

## Mapa de páginas

| Área | Rotas planejadas |
|---|---|
| Pública | `/` (apresentação e demonstração), `/sobre`, `/modulos`, `/modulos/[slug]` (resumo público), `/referencias`, `/privacidade` |
| Acesso | `/entrar`, `/cadastro`, `/verificar-email`, `/recuperar-senha`, `/redefinir-senha` |
| Estudante | `/painel`, `/curso/modulos/[slug]`, `/curso/modulos/[slug]/questionario`, `/laboratorio`, `/historico`, `/perfil` |
| Docente/admin | `/docente`, `/docente/modulos`, `/docente/avaliacoes`, `/docente/estudantes`, `/docente/corpus`, `/docente/referencias` |

Fluxo de aprendizagem: conta de estudante → verificação → aula publicada → prática/avaliação → tentativa registrada → progresso calculado no servidor. Cadastro público nunca permite escolher papel privilegiado. Fluxo de laboratório: entrada própria ou exemplo com fonte/rotulagem → validação → execução → resultado e explicação → exportação local opcional.

## Modelo de dados inicial

- **Identidade:** `users` (e-mail único, hash de senha e estado), `roles` (`STUDENT`, `TEACHER`, `ADMIN`), `user_roles` (concessão por ator autorizado), `auth_tokens` (hash do token, finalidade, expiração, uso/revogação).
- **Conteúdo:** `modules` (slug, objetivos, ordem, estado, regra de conclusão), `lessons` (objetivos, conceito, técnica, estudo de caso, prática, interpretação), `references` e `module_references`.
- **Avaliação:** `quizzes` (módulo, nota mínima, tentativas), `questions` (enunciado, explicação, ordem), `answer_options` (opção e correção), `quiz_attempts` (estudante, nota, estado, datas), `attempt_answers` (resposta selecionada e correção).
- **Progresso:** `lesson_progress` (estudante, aula, estado, datas), calculado e validado no servidor a partir de regras explícitas.
- **Corpus:** `corpus_sources` (editor, origem, licença e condições), `corpora` (período, idioma, tipo, limitações, artefato, quantidade verificada), `corpus_documents` (identificador externo, título/data, URL, hash e metadados). Conteúdo integral só em artefato autorizado; não em tabela transacional.
- **Auditoria:** `audit_events` registra ações administrativas sem senha, token ou texto enviado ao laboratório.

Usar UUID, datas UTC, chaves estrangeiras e migrações Flyway. Restringir acesso docente/administrador no servidor. Tokens de redefinição/verificação e renovação são aleatórios, de uso controlado e armazenados apenas como hash; senha com Argon2id ou BCrypt. Autenticação baseada em cookie seguro requer proteção CSRF apropriada, política SameSite e rate limiting.

## Estratégia de dados

Priorizar OMS, Ministério da Saúde, Fiocruz, publicações de acesso aberto e repositórios acadêmicos com licença compatível. Para cada coleção registrar URL, editor, licença/condições, período, idioma, tipo de documento, data de acesso, método e limitações. Verificar permissão antes de baixar, redistribuir ou automatizar coleta. Deduplicar por identificador e hash; preservar artefato original somente quando permitido; versionar scripts, parâmetros, hash e relatório de qualidade. Excluir dados sensíveis e identificadores de pacientes. Não inferir representatividade populacional. Texto didático sintético deve ser rotulado como sintético; não preencher gráficos ou métricas com números inventados.

Pipeline: inventário e licença → aquisição autorizada → normalização sem sobrescrever o original → deduplicação → validação de idioma/data/campos → revisão de privacidade → relatório reproduzível → publicação versionada. Sem corpus/licença verificada, deixar o catálogo pronto para importação e não afirmar resultados históricos.

## Estrutura do repositório

```text
frontend/                 Next.js e componentes acessíveis
backend/                  Spring Boot, API REST, OpenAPI e migrations
nlp-service/              FastAPI e algoritmos avaliados/documentados
datasets/manifests/       fontes, licenças, versões e instruções
docs/                     arquitetura, API e política de dados
infra/                    execução local e implantação
docker-compose.yml
README.md
```

## Etapas e critérios de avanço

1. **Planejamento:** requisitos, fluxos, entidades, fronteiras dos serviços e política de dados definidos.
2. **Interface institucional:** identidade, navegação pública, responsividade, acessibilidade e estados completos.
3. **Autenticação:** cadastro, verificação, login, redefinição, sessões e papéis verificáveis.
4. **Ambiente de estudo:** aulas, quizzes, tentativas e dashboard com progresso persistido real.
5. **Serviço PLN:** contratos e algoritmos reais, limitações e erros tratados.
6. **Laboratório:** operações conectadas, passos reproduzíveis, saída e exportação coerentes.
7. **Corpus COVID-19:** ingestão documentada, filtros e gráficos derivados de artefatos licenciados.
8. **Administração:** conteúdo, avaliações, corpus, referências e estudantes com autorização no servidor.
9. **Verificação:** testes unitários, integração, autorização, acessibilidade, responsividade e falhas de serviço.
10. **Entrega:** instalação reproduzível, API, fontes, privacidade e guia de uso.

## Estado de implementação

- Frontend Next.js: páginas públicas, dez aulas e questionários locais, progresso local, autenticação ligada à API, painel de estudante, painel docente agregado e laboratório conectado.
- API Spring Boot: autenticação e papéis, sessões renováveis, módulos, submissão persistente de questionários, progresso, encaminhamento PLN e métricas agregadas de turma.
- Persistência: migrations Flyway para contas, papéis, conteúdo, tentativas, referências, metadados de corpus e auditoria; catálogo inicial com dez módulos e 50 questões.
- Serviço FastAPI: tokenização, frequências/ngramas, TF-IDF, similaridade, LDA e baseline de sentimento por léxico; sem persistência textual.
- Compose: PostgreSQL, Mailpit, APIs e frontend, com segredos fornecidos por `.env`.

Limitações ainda abertas: estudantes autenticados persistem respostas e notas; visitantes mantêm histórico local. O painel histórico aceita CSV enviado pelo usuário, mas nenhum corpus real licenciado vem pré-carregado. A gestão CRUD de conteúdo/corpus, listagem nominal, NER, classificação e stemming/lematização seguem pendentes. O código Java não foi compilado neste ambiente por falta de Java 17/Maven/Docker; o Compose deve ser o próximo ponto de validação num ambiente com Docker. A interface foi verificada por lint e build de produção; os testes do serviço Python cobrem nove casos unitários/contratuais.

Próximos passos recomendados: integrar as telas de quiz à API; executar `docker compose up --build` e validar migrações e autenticação; adicionar testes Java de serviço/API e fluxos end-to-end; importar corpus somente após documentar licença, fonte, período, idioma e limitações; depois completar administração e ferramentas adicionais do laboratório.
