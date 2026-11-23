package br.edu.textoemdados.nlp;

import br.edu.textoemdados.config.AppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NlpService {
    private final RestClient client;

    public NlpService(RestClient.Builder builder, AppProperties properties) {
        this.client = builder.baseUrl(properties.nlpServiceUrl()).build();
    }

    public JsonNode analyze(String path, Object request) {
        try {
            JsonNode response = client.post().uri(path).body(request).retrieve().body(JsonNode.class);
            if (response == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "O serviço de análise não retornou resultado.");
            return response;
        } catch (RestClientResponseException exception) {
            int status = exception.getStatusCode().value();
            if (status == 422) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Entrada inválida para esta técnica.");
            if (status == 429) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Limite de análises atingido.");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "O serviço de análise está indisponível.");
        } catch (org.springframework.web.client.ResourceAccessException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "O serviço de PLN está indisponível.");
        }
    }
}
