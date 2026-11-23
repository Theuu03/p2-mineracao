package br.edu.textoemdados.learning;

import br.edu.textoemdados.learning.LearningDtos.AnswerFeedback;
import br.edu.textoemdados.learning.LearningDtos.AttemptHistory;
import br.edu.textoemdados.learning.LearningDtos.AttemptResult;
import br.edu.textoemdados.learning.LearningDtos.ModuleSummary;
import br.edu.textoemdados.learning.LearningDtos.ProgressItem;
import br.edu.textoemdados.learning.LearningDtos.ProgressView;
import br.edu.textoemdados.learning.LearningDtos.QuizOption;
import br.edu.textoemdados.learning.LearningDtos.QuizQuestion;
import br.edu.textoemdados.learning.LearningDtos.QuizView;
import br.edu.textoemdados.learning.LearningDtos.QuizSubmission;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LearningService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public LearningService(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public List<ModuleSummary> listModules() {
        return jdbc.query("""
                SELECT m.id,m.slug,m.title,m.summary,m.learning_objectives::text AS objectives,m.position,m.completion_percentage,
                       COALESCE((SELECT count(*) FROM questions q WHERE q.quiz_id=quiz.id),0) AS question_count
                FROM modules m LEFT JOIN quizzes quiz ON quiz.module_id=m.id
                WHERE m.published=TRUE ORDER BY m.position
                """, (rs, row) -> new ModuleSummary(rs.getObject("id", UUID.class), rs.getString("slug"),
                rs.getString("title"), rs.getString("summary"), parseJson(rs.getString("objectives")),
                rs.getInt("position"), rs.getInt("completion_percentage"), rs.getInt("question_count")));
    }

    public QuizView quiz(String moduleSlug) {
        QuizMeta quiz = findQuiz(moduleSlug);
        List<QuizQuestion> questions = jdbc.query("""
                SELECT q.id AS question_id,q.prompt,q.position AS question_position,
                       a.id AS option_id,a.body,a.position AS option_position
                FROM questions q JOIN quizzes z ON z.id=q.quiz_id
                JOIN modules m ON m.id=z.module_id
                JOIN answer_options a ON a.question_id=q.id
                WHERE m.slug=? AND m.published=TRUE AND z.published=TRUE
                ORDER BY q.position,a.position
                """, rs -> {
            Map<UUID, QuestionAccumulator> grouped = new java.util.LinkedHashMap<>();
            while (rs.next()) {
                UUID questionId = rs.getObject("question_id", UUID.class);
                QuestionAccumulator question = grouped.computeIfAbsent(questionId, ignored -> new QuestionAccumulator(
                        questionId, readString(rs, "prompt"), readInt(rs, "question_position")));
                question.options().add(new QuizOption(rs.getObject("option_id", UUID.class), rs.getString("body"), rs.getInt("option_position")));
            }
            return grouped.values().stream().map(QuestionAccumulator::toDto).toList();
        }, moduleSlug);
        if (questions.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Questionário não encontrado.");
        return new QuizView(moduleSlug, quiz.title(), quiz.passingScore(), questions);
    }

    @Transactional
    public AttemptResult submit(String moduleSlug, UUID userId, QuizSubmission submission) {
        QuizMeta quiz = findQuiz(moduleSlug);
        List<QuestionCorrect> questions = jdbc.query("""
                SELECT q.id AS question_id,q.prompt,q.explanation,a.id AS correct_option_id
                FROM questions q JOIN answer_options a ON a.question_id=q.id AND a.is_correct=TRUE
                WHERE q.quiz_id=? ORDER BY q.position FOR UPDATE OF q
                """, (rs, row) -> new QuestionCorrect(rs.getObject("question_id", UUID.class),
                rs.getString("prompt"), rs.getString("explanation"), rs.getObject("correct_option_id", UUID.class)), quiz.id());
        if (questions.isEmpty() || questions.size() < 5 || questions.size() > 10) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Questionário indisponível: quantidade de questões inválida.");
        }
        Map<UUID, UUID> selected = new HashMap<>();
        for (var answer : submission.answers()) {
            if (selected.put(answer.questionId(), answer.optionId()) != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Há respostas duplicadas.");
            }
        }
        Set<UUID> expected = new HashSet<>(questions.stream().map(QuestionCorrect::id).toList());
        if (!selected.keySet().equals(expected)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Envie exatamente uma opção para cada questão.");

        int correctCount = 0;
        List<AnswerFeedback> feedback = new ArrayList<>();
        for (QuestionCorrect question : questions) {
            UUID optionId = selected.get(question.id());
            Integer optionBelongsToQuestion = jdbc.queryForObject(
                    "SELECT count(*) FROM answer_options WHERE id=? AND question_id=?", Integer.class, optionId, question.id());
            if (optionBelongsToQuestion == null || optionBelongsToQuestion != 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uma opção não pertence à questão informada.");
            }
            boolean correct = question.correctOptionId().equals(optionId);
            if (correct) correctCount++;
            feedback.add(new AnswerFeedback(question.id(), correct, question.explanation()));
        }
        BigDecimal score = BigDecimal.valueOf(correctCount * 100.0 / questions.size()).setScale(2, RoundingMode.HALF_UP);
        boolean passed = score.compareTo(BigDecimal.valueOf(quiz.passingScore())) >= 0;
        Instant submittedAt = Instant.now();
        UUID attemptId = jdbc.queryForObject(
                "INSERT INTO quiz_attempts(user_id,quiz_id,score,passed,submitted_at) VALUES (?,?,?,?,?) RETURNING id",
                UUID.class, userId, quiz.id(), score, passed, Timestamp.from(submittedAt));
        for (QuestionCorrect question : questions) {
            UUID selectedOption = selected.get(question.id());
            boolean correct = question.correctOptionId().equals(selectedOption);
            jdbc.update("INSERT INTO attempt_answers(attempt_id,question_id,selected_option_id,is_correct) VALUES (?,?,?,?)",
                    attemptId, question.id(), selectedOption, correct);
        }
        return new AttemptResult(attemptId, score, passed, submittedAt, feedback);
    }

    public ProgressView progress(UUID userId) {
        List<ProgressItem> modules = jdbc.query("""
                SELECT m.slug,m.title,COALESCE(bool_or(a.passed),FALSE) AS completed,
                       max(a.score) AS best_score,COALESCE((SELECT count(*) FROM questions q WHERE q.quiz_id=z.id),0) AS question_count,
                       max(a.submitted_at) AS last_attempt_at
                FROM modules m LEFT JOIN quizzes z ON z.module_id=m.id
                LEFT JOIN quiz_attempts a ON a.quiz_id=z.id AND a.user_id=?
                WHERE m.published=TRUE GROUP BY m.id,z.id ORDER BY m.position
                """, (rs, row) -> new ProgressItem(rs.getString("slug"), rs.getString("title"), rs.getBoolean("completed"),
                rs.getBigDecimal("best_score"), rs.getInt("question_count"), timestampToInstant(rs.getTimestamp("last_attempt_at"))), userId);
        List<AttemptHistory> attempts = jdbc.query("""
                SELECT m.slug,m.title,a.score,a.passed,a.submitted_at
                FROM quiz_attempts a JOIN quizzes q ON q.id=a.quiz_id JOIN modules m ON m.id=q.module_id
                WHERE a.user_id=? ORDER BY a.submitted_at DESC LIMIT 100
                """, (rs, row) -> new AttemptHistory(rs.getString("slug"), rs.getString("title"),
                rs.getBigDecimal("score"), rs.getBoolean("passed"), rs.getTimestamp("submitted_at").toInstant()), userId);
        int completed = (int) modules.stream().filter(ProgressItem::completed).count();
        int percent = modules.isEmpty() ? 0 : (int) Math.round(completed * 100.0 / modules.size());
        return new ProgressView(completed, modules.size(), percent, modules, attempts);
    }

    private QuizMeta findQuiz(String slug) {
        List<QuizMeta> quizzes = jdbc.query("""
                SELECT q.id,q.title,q.passing_score FROM quizzes q JOIN modules m ON m.id=q.module_id
                WHERE m.slug=? AND m.published=TRUE AND q.published=TRUE
                """, (rs, row) -> new QuizMeta(rs.getObject("id", UUID.class), rs.getString("title"), rs.getInt("passing_score")), slug);
        if (quizzes.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Questionário não encontrado.");
        return quizzes.get(0);
    }

    private JsonNode parseJson(String raw) {
        try { return objectMapper.readTree(raw); }
        catch (Exception exception) { throw new IllegalStateException("learning_objectives possui JSON inválido", exception); }
    }

    private String readString(java.sql.ResultSet rs, String column) {
        try { return rs.getString(column); } catch (java.sql.SQLException exception) { throw new IllegalStateException(exception); }
    }

    private int readInt(java.sql.ResultSet rs, String column) {
        try { return rs.getInt(column); } catch (java.sql.SQLException exception) { throw new IllegalStateException(exception); }
    }

    private Instant timestampToInstant(Timestamp value) { return value == null ? null : value.toInstant(); }
    private record QuizMeta(UUID id, String title, int passingScore) { }
    private record QuestionCorrect(UUID id, String prompt, String explanation, UUID correctOptionId) { }
    private record QuestionAccumulator(UUID id, String prompt, int position, List<QuizOption> options) {
        QuestionAccumulator(UUID id, String prompt, int position) { this(id, prompt, position, new ArrayList<>()); }
        QuizQuestion toDto() { return new QuizQuestion(id, prompt, position, List.copyOf(options)); }
    }
}
