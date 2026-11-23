package br.edu.textoemdados.learning;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teacher")
public class TeacherController {
    private final JdbcTemplate jdbc;
    public TeacherController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/overview")
    public Overview overview() {
        Summary summary = jdbc.queryForObject("""
                SELECT (SELECT count(*) FROM users u JOIN user_roles r ON r.user_id=u.id WHERE u.status='ACTIVE' AND r.role='STUDENT') AS students,
                       (SELECT count(*) FROM quiz_attempts) AS attempts,
                       (SELECT count(*) FROM quiz_attempts WHERE passed=TRUE) AS passed,
                       (SELECT COALESCE(round(avg(score),2),0) FROM quiz_attempts) AS average_score
                """, (rs, row) -> new Summary(rs.getLong("students"), rs.getLong("attempts"),
                rs.getLong("passed"), rs.getBigDecimal("average_score")));
        List<ModulePerformance> modules = jdbc.query("""
                SELECT m.slug,m.title,count(a.id) AS attempts,
                       COALESCE(round(avg(a.score),2),0) AS average_score,
                       count(*) FILTER (WHERE a.passed=TRUE) AS passed_attempts
                FROM modules m LEFT JOIN quizzes q ON q.module_id=m.id
                LEFT JOIN quiz_attempts a ON a.quiz_id=q.id
                WHERE m.published=TRUE GROUP BY m.id ORDER BY m.position
                """, (rs, row) -> new ModulePerformance(rs.getString("slug"), rs.getString("title"),
                rs.getLong("attempts"), rs.getBigDecimal("average_score"), rs.getLong("passed_attempts")));
        return new Overview(summary, modules);
    }

    public record Overview(Summary summary, List<ModulePerformance> modules) { }
    public record Summary(long activeStudents, long attempts, long passedAttempts, BigDecimal averageScore) { }
    public record ModulePerformance(String slug, String title, long attempts, BigDecimal averageScore, long passedAttempts) { }
}
