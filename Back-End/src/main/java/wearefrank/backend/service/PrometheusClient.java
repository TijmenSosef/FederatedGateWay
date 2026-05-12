package wearefrank.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class PrometheusClient {

    private static final String BASE_URL = "http://localhost:9090";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public PrometheusClient(HttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    public String query(String promql) {
        String url = BASE_URL + "/api/v1/query?query=" + URLEncoder.encode(promql, StandardCharsets.UTF_8);
        return get(url);
    }

    public String rangeQuery(String promql, long startEpoch, long endEpoch, String step) {
        String url = BASE_URL + "/api/v1/query_range"
                + "?query=" + URLEncoder.encode(promql, StandardCharsets.UTF_8)
                + "&start=" + startEpoch
                + "&end=" + endEpoch
                + "&step=" + step;
        return get(url);
    }

    public long getTsdbMinTime() {
        try {
            String body = get(BASE_URL + "/api/v1/status/tsdb");
            JsonNode root = objectMapper.readTree(body);
            // minTime is in milliseconds — convert to seconds
            return root.path("data").path("headStats").path("minTime").asLong() / 1000;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch Prometheus TSDB status: " + e.getMessage(), e);
        }
    }

    private String get(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new RuntimeException("Prometheus returned " + response.statusCode());
            }
            return response.body();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to reach Prometheus: " + e.getMessage(), e);
        }
    }
}
