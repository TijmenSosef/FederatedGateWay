package wearefrank.backend.dto;

public record ConfigDto() {

    public record ApisixConfig(
            String key,
            String url
    ) {}

    public record KeyDto(String key) {}
}
