package br.edu.textoemdados.learning;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class LearningDtos {
    private LearningDtos() { }

    public record ModuleSummary(UUID id, String slug, String title, String summary, JsonNode learningObjectives,
                                int position, int completionPercentage, int questionCount) { }
    public record QuizOption(UUID id, String body, int position) { }
    public record QuizQuestion(UUID id, String prompt, int position, List<QuizOption> options) { }
    public record QuizView(String moduleSlug, String title, int passingScore, List<QuizQuestion> questions) { }
    public record AnswerSubmission(@NotNull UUID questionId, @NotNull UUID optionId) { }
    public record QuizSubmission(@NotEmpty @Size(min = 5, max = 10) List<@Valid AnswerSubmission> answers) { }
    public record AnswerFeedback(UUID questionId, boolean correct, String explanation) { }
    public record AttemptResult(UUID attemptId, BigDecimal score, boolean passed, Instant submittedAt,
                                List<AnswerFeedback> answers) { }
    public record ProgressItem(String moduleSlug, String title, boolean completed, BigDecimal bestScore,
                               int questionCount, Instant lastAttemptAt) { }
    public record AttemptHistory(String moduleSlug, String title, BigDecimal score, boolean passed,
                                 Instant submittedAt) { }
    public record ProgressView(int completedModules, int totalModules, int percent, List<ProgressItem> modules,
                               List<AttemptHistory> attempts) { }
}
