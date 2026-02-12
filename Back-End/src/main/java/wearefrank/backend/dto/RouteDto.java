package wearefrank.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RouteDto(
        String id,
        String uri,
        String name,
        List<String> methods,
        String host,
        List<String> hosts,
        @JsonProperty("upstream_id")
        String upstreamId,
        Map<String, Object> upstream,
        Map<String, Object> plugins,
        Integer priority,
        Integer status
) {
    public record DeleteRequest(String id) {}
}

