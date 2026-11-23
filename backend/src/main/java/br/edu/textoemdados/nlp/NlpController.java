package br.edu.textoemdados.nlp;

import br.edu.textoemdados.nlp.NlpDtos.FrequencyRequest;
import br.edu.textoemdados.nlp.NlpDtos.SimilarityRequest;
import br.edu.textoemdados.nlp.NlpDtos.TextRequest;
import br.edu.textoemdados.nlp.NlpDtos.TfidfRequest;
import br.edu.textoemdados.nlp.NlpDtos.TopicsRequest;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/nlp")
public class NlpController {
    private final NlpService service;
    public NlpController(NlpService service) { this.service = service; }

    @PostMapping("/tokenize")
    public JsonNode tokenize(@Valid @RequestBody TextRequest request) { return service.analyze("/v1/tokenize", request); }

    @PostMapping("/frequency")
    public JsonNode frequency(@Valid @RequestBody FrequencyRequest request) {
        if (request.ngram() < 1 || request.ngram() > 5) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "ngram precisa estar entre 1 e 5.");
        return service.analyze("/v1/frequency", request);
    }

    @PostMapping("/similarity")
    public JsonNode similarity(@Valid @RequestBody SimilarityRequest request) { return service.analyze("/v1/similarity", request); }

    @PostMapping("/tfidf")
    public JsonNode tfidf(@Valid @RequestBody TfidfRequest request) {
        if (request.top_terms() < 1 || request.top_terms() > 20 || overTotalLimit(request.documents())) throw invalidPayload();
        return service.analyze("/v1/tfidf", request);
    }

    @PostMapping("/topics")
    public JsonNode topics(@Valid @RequestBody TopicsRequest request) {
        if (request.topic_count() < 2 || request.topic_count() > 8 || request.topic_count() > request.documents().size()
                || request.top_terms() < 1 || request.top_terms() > 20 || overTotalLimit(request.documents())) throw invalidPayload();
        return service.analyze("/v1/topics", request);
    }

    @PostMapping("/sentiment-baseline")
    public JsonNode sentiment(@Valid @RequestBody TextRequest request) { return service.analyze("/v1/sentiment-baseline", request); }

    private boolean overTotalLimit(java.util.List<String> documents) { return documents.stream().mapToInt(String::length).sum() > 50_000; }
    private org.springframework.web.server.ResponseStatusException invalidPayload() {
        return new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Parâmetros da análise fora dos limites permitidos.");
    }
}
