package wearefrank.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import wearefrank.backend.dto.ConfigVersionDto;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class VersioningService {

    private static final int MAX_VERSIONS = 50;

    private final File file = new File("apisix_config_versions.json");
    private final ObjectMapper mapper = new ObjectMapper();

    public VersioningService() {
        ensureFileExists();
    }

    private void ensureFileExists() {
        if (!file.exists()) {
            try {
                boolean created = file.createNewFile();
                if (created) {
                    mapper.writeValue(file, new ArrayList<>());
                }
            } catch (IOException e) {
                throw new RuntimeException("Could not create versions file", e);
            }
        }
    }

    private List<ConfigVersionDto> readVersions() {
        try {
            return mapper.readValue(file, new TypeReference<List<ConfigVersionDto>>() {});
        } catch (IOException e) {
            throw new RuntimeException("Failed to read versions file", e);
        }
    }

    private void writeVersions(List<ConfigVersionDto> versions) {
        try {
            mapper.writeValue(file, versions);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write versions file", e);
        }
    }

    public List<ConfigVersionDto.Summary> listVersions() {
        return readVersions().stream()
                .map(v -> new ConfigVersionDto.Summary(v.id(), v.message(), v.createdAt()))
                .toList();
    }

    public ConfigVersionDto getVersion(String id) {
        return readVersions().stream()
                .filter(v -> v.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Version not found: " + id));
    }

    public ConfigVersionDto.Summary saveVersion(String message, String content) {
        List<ConfigVersionDto> versions = new ArrayList<>(readVersions());
        ConfigVersionDto entry = new ConfigVersionDto(
                UUID.randomUUID().toString(),
                message,
                Instant.now().toString(),
                content
        );
        versions.addFirst(entry);
        if (versions.size() > MAX_VERSIONS) {
            versions = versions.subList(0, MAX_VERSIONS);
        }
        writeVersions(versions);
        return new ConfigVersionDto.Summary(entry.id(), entry.message(), entry.createdAt());
    }

    public void deleteVersion(String id) {
        List<ConfigVersionDto> versions = new ArrayList<>(readVersions());
        boolean removed = versions.removeIf(v -> v.id().equals(id));
        if (!removed) {
            throw new RuntimeException("Version not found: " + id);
        }
        writeVersions(versions);
    }
}
