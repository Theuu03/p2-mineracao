# Texto em Dados

Plataforma acadêmica para aprender mineração de texto e processamento de linguagem natural com leitura crítica de informação sobre a pandemia de COVID-19. Não há associação institucional declarada.

## Executar a plataforma completa

Opção recomendada: Docker Desktop com Compose. Na raiz do projeto, crie `.env` a partir do exemplo e configure segredos locais:

```powershell
Copy-Item .env.example .env
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Copie o valor gerado para `JWT_SECRET` no `.env`; defina também uma senha local para `DATABASE_PASSWORD`. Em seguida:

```powershell
docker compose up --build
```

Acesse:

- Frontend: <http://localhost:3000>
- API Spring Boot: <http://localhost:8080>
- Swagger: <http://localhost:8080/docs>
- Mailpit (confirmação de cadastro e redefinição): <http://localhost:8025>

Para conceder acesso docente a uma conta local já confirmada, substitua o e-mail no comando abaixo. O script só atribui o papel a uma conta ativa confirmada:

```powershell
Get-Content scripts/grant-teacher-role.sql | docker compose exec -T db psql -U textoemdados -d textoemdados -v target_email=professor@example.edu -f -
```

O Compose inicia PostgreSQL, Mailpit, serviço Python, backend e frontend. Flyway cria o esquema e semeia os dez módulos e seus 50 itens de questionário. Para encerrar: `docker compose down`. Para apagar também os dados locais do banco: `docker compose down -v`.

## Executar somente o frontend

Requer Node.js 20.9+ e npm:

```powershell
cd frontend
npm install
npm run dev
```

Abra <http://localhost:3000>. Esta opção mostra as aulas, quizzes locais e demonstração inicial; login, progresso de servidor e o laboratório completo precisam dos serviços do Compose.

## Executar o serviço PLN sem Docker

Requer Python 3.12+:

```powershell
cd nlp-service
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Testes do serviço PLN: `python -m unittest discover -s tests -v`.

## Funcionalidades implementadas

- Dez módulos didáticos com aulas, referências e cinco questões explicadas por módulo.
- Cadastro exclusivo de estudantes, confirmação de e-mail, login, refresh de sessão em cookie HttpOnly, logout e recuperação de senha.
- Progresso, tentativas e pontuação persistidos no PostgreSQL quando a atividade é enviada à API autenticada.
- Painel docente protegido por função, com agregados de participação e resultados por módulo; o cadastro público não concede acesso docente.
- Laboratório via backend central: tokenização, frequência de termos/ngramas e linha de base didática de sentimento. A API PLN também oferece TF-IDF, similaridade e LDA.
- Upload TXT/CSV limitado a 1 MB no navegador; conteúdo cortado a 5.000 caracteres antes do envio. Exportação JSON dos resultados no laboratório.
- Painel histórico permite importar CSV/TXT próprio documentado (2–50 documentos; até 25.000 caracteres por matéria e 250.000 no total) e visualizar distribuição temporal do arquivo e termos TF-IDF, sem persistir o corpus. Não inclui dados históricos pré-carregados.
- Modelos vazios para colar até 50 matérias em TXT e até 50 observações numéricas oficiais em CSV estão em `datasets/modelos/`; `/historico` e `/dados-oficiais` aceitam os respectivos formatos.
- Rate limiting, limites de payload, Flyway, documentação OpenAPI e ambientes locais via Compose.

## Limites conhecidos

- Usuários autenticados têm as tentativas dos quizzes enviadas ao backend; visitantes usam correção e histórico locais. O painel `/painel` reflete tentativas persistidas no servidor.
- A demonstração pública inicial usa um algoritmo simplificado no navegador. A página `/laboratorio` usa o serviço Python real para as três técnicas citadas.
- Classificação supervisionada, stemming/lematização, NER e nuvem de palavras ainda não foram implementados. Os painéis históricos analisam apenas arquivos enviados pelo usuário; não há corpus histórico pré-carregado ou linha do tempo curada.
- A gestão de conteúdo/corpus, listagem nominal de estudantes e operações CRUD docentes ainda não estão disponíveis. O painel docente atual mostra apenas métricas agregadas. A API protege os prefixos de professor e administrador por papel.
- O corpus não foi baixado nem empacotado: fontes, licença e versão precisam ser verificadas e registradas antes de incluir documentos.
- Por enquanto, não há suíte de integração Java nem testes de fluxo ponta a ponta. O backend precisa de Java 17 e Docker para validação neste ambiente; a máquina de desenvolvimento atual só dispõe de Java 8 e não tem Docker.

Veja [docs/architecture.md](docs/architecture.md) para decisões, estrutura e próximos passos. Não inclua dados pessoais/sensíveis nem corpus sem confirmar licença, atribuição e condições de uso.

## Documentos fornecidos para este projeto

Os originais estão em `datasets/importados/` no checkout local. A pasta é ignorada pelo Git enquanto as permissões de redistribuição são verificadas. O DOCX foi convertido em `50_materias_para_importar.txt`, pronto para selecionar em `/historico`. O PDF continha 54 afirmações numeradas, não uma tabela de 50 medições; elas estão em `afirmacoes_do_pdf_para_revisao.csv`, todas marcadas como não verificadas. Não importe essas afirmações como números oficiais antes de localizar e conferir cada fonte primária. O script `scripts/import_user_documents.py` documenta e reproduz a conversão.
