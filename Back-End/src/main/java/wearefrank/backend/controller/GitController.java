package wearefrank.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import wearefrank.backend.service.GitService;

import java.util.Map;

@RestController
@RequestMapping("/api/git")
@CrossOrigin(origins = "http://localhost:5173")
public class GitController {

    @Autowired
    private GitService gitService;

    @PostMapping("/init")
    public String init() {
        return gitService.CreateRepo();
    }

    // Expects: { "path": "/tmp/my-second-folder" }
    @PostMapping("/switch")
    public String switchWorkspace(@RequestBody Map<String, String> payload) {
        String newPath = payload.get("path");
        return gitService.switchRepositories(newPath);
    }

    // Expects: /api/git/status?path=/tmp/local-workspace
    @GetMapping("/status")
    public Map<String, String> getStatus(@RequestParam String path) {
        return gitService.getRepoStatus(path);
    }
}