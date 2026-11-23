package br.edu.textoemdados.nlp;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class NlpDtos {
    private NlpDtos() { }

    public record TextRequest(@NotBlank @Size(max = 5_000) String text) { }
    public record FrequencyRequest(@NotBlank @Size(max = 5_000) String text,
                                   boolean exclude_stopwords,
                                   @NotNull Integer ngram) { }
    public record SimilarityRequest(@NotBlank @Size(max = 5_000) String first,
                                    @NotBlank @Size(max = 5_000) String second) { }
    public record DocumentsRequest(@NotEmpty @Size(min = 2, max = 20) List<@NotBlank @Size(max = 25_000) String> documents) { }
    public record TfidfRequest(@NotEmpty @Size(min = 2, max = 20) List<@NotBlank @Size(max = 25_000) String> documents,
                               @NotNull Integer top_terms) { }
    public record TopicsRequest(@NotEmpty @Size(min = 2, max = 20) List<@NotBlank @Size(max = 25_000) String> documents,
                                @NotNull Integer topic_count,
                                @NotNull Integer top_terms) { }
}
