package br.edu.textoemdados.learning;

import br.edu.textoemdados.learning.LearningDtos.AttemptResult;
import br.edu.textoemdados.learning.LearningDtos.ModuleSummary;
import br.edu.textoemdados.learning.LearningDtos.ProgressView;
import br.edu.textoemdados.learning.LearningDtos.QuizSubmission;
import br.edu.textoemdados.learning.LearningDtos.QuizView;
import br.edu.textoemdados.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class LearningController {
    private final LearningService learningService;
    public LearningController(LearningService learningService) { this.learningService = learningService; }

    @GetMapping("/modules")
    public List<ModuleSummary> modules() { return learningService.listModules(); }

    @GetMapping("/modules/{slug}/quiz")
    public QuizView quiz(@PathVariable String slug) { return learningService.quiz(slug); }

    @PostMapping("/modules/{slug}/quiz/attempts")
    public AttemptResult submit(@PathVariable String slug, @Valid @RequestBody QuizSubmission submission,
                                Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return learningService.submit(slug, user.id(), submission);
    }

    @GetMapping("/learning/progress")
    public ProgressView progress(Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return learningService.progress(user.id());
    }
}
