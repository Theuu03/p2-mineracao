CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_status_check CHECK (status IN ('PENDING', 'ACTIVE', 'BLOCKED'))
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role),
  CONSTRAINT user_roles_role_check CHECK (role IN ('STUDENT', 'TEACHER', 'ADMIN'))
);

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent_hash CHAR(64),
  CONSTRAINT auth_sessions_expiry_check CHECK (expires_at > created_at)
);
CREATE INDEX auth_sessions_user_active_idx ON auth_sessions(user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(20) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT auth_tokens_purpose_check CHECK (purpose IN ('VERIFY_EMAIL', 'RESET_PASSWORD'))
);
CREATE INDEX auth_tokens_user_purpose_idx ON auth_tokens(user_id, purpose, expires_at);

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  summary TEXT NOT NULL,
  learning_objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  position SMALLINT NOT NULL UNIQUE,
  completion_percentage SMALLINT NOT NULL DEFAULT 70,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT module_position_check CHECK (position BETWEEN 1 AND 10),
  CONSTRAINT module_completion_check CHECK (completion_percentage BETWEEN 0 AND 100)
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(180) NOT NULL,
  position SMALLINT NOT NULL,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  concept TEXT NOT NULL DEFAULT '',
  technical_detail TEXT NOT NULL DEFAULT '',
  case_study TEXT NOT NULL DEFAULT '',
  practice TEXT NOT NULL DEFAULT '',
  interpretation TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, slug), UNIQUE (module_id, position)
);

CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL UNIQUE REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  passing_score SMALLINT NOT NULL DEFAULT 70,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quiz_passing_score_check CHECK (passing_score BETWEEN 0 AND 100)
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  explanation TEXT NOT NULL,
  position SMALLINT NOT NULL,
  UNIQUE (quiz_id, position)
);

CREATE TABLE answer_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  position SMALLINT NOT NULL,
  UNIQUE (question_id, position)
);
CREATE UNIQUE INDEX answer_options_single_correct_idx ON answer_options(question_id) WHERE is_correct;

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
  score NUMERIC(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quiz_attempts_score_check CHECK (score BETWEEN 0 AND 100)
);
CREATE INDEX quiz_attempts_user_recent_idx ON quiz_attempts(user_id, submitted_at DESC);

CREATE TABLE attempt_answers (
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  selected_option_id UUID NOT NULL REFERENCES answer_options(id) ON DELETE RESTRICT,
  is_correct BOOLEAN NOT NULL,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE lesson_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'NOT_STARTED',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id),
  CONSTRAINT lesson_progress_status_check CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'))
);

CREATE TABLE bibliographic_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citation TEXT NOT NULL,
  url TEXT,
  doi VARCHAR(255),
  publication_year SMALLINT,
  license TEXT,
  notes TEXT
);
CREATE TABLE module_references (
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  reference_id UUID NOT NULL REFERENCES bibliographic_references(id) ON DELETE CASCADE,
  PRIMARY KEY (module_id, reference_id)
);

CREATE TABLE corpus_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  publisher VARCHAR(200) NOT NULL,
  source_url TEXT NOT NULL,
  license_name VARCHAR(200),
  license_url TEXT,
  access_conditions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE corpora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES corpus_sources(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  collection_start DATE,
  collection_end DATE,
  language VARCHAR(24) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  license_snapshot TEXT,
  limitations TEXT NOT NULL,
  artifact_uri TEXT,
  document_count_verified INTEGER,
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
  accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT corpora_status_check CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  CONSTRAINT corpora_count_check CHECK (document_count_verified IS NULL OR document_count_verified >= 0)
);
CREATE TABLE corpus_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id UUID NOT NULL REFERENCES corpora(id) ON DELETE CASCADE,
  external_id VARCHAR(255),
  title TEXT,
  published_at TIMESTAMPTZ,
  language VARCHAR(24),
  category VARCHAR(100),
  source_url TEXT NOT NULL,
  content_hash CHAR(64),
  artifact_uri TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (corpus_id, external_id)
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(80) NOT NULL,
  target_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX audit_events_recent_idx ON audit_events(occurred_at DESC);
