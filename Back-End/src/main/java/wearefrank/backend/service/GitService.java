package wearefrank.backend.service;

import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.HashMap;
import java.util.Map;


@Service
public class GitService {

    private static final String REMOTE_PATH = "/tmp/fake-github.git";
    private static final String LOCAL_PATH = "/tmp/local-workspace";

    public String CreateRepo() {
        try {
            createBareRepo(REMOTE_PATH);

            File localDir = new File(LOCAL_PATH);

            if (localDir.exists()) {
                deleteDirectory(localDir);
            }

            try (Git localGit = Git.cloneRepository()
                    .setURI(new File(REMOTE_PATH).toURI().toString())
                    .setDirectory(localDir)
                    .call()) {
                System.out.println("✅ Cloned to workspace: " + localDir.getAbsolutePath());
            }

            return "Success: Environment initialized.";

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to init git: " + e.getMessage());
        }
    }

    // Helper to clean up folders
    private void deleteDirectory(File file) {
        if (file.isDirectory()) {
            File[] entries = file.listFiles();
            if (entries != null) {
                for (File entry : entries) deleteDirectory(entry);
            }
        }
        file.delete();
    }

    private void createBareRepo(String path) {
        File dir = new File(path);

        if (dir.exists()) {
            deleteDirectory(dir);
        }

        try (Git git = Git.init()
                .setDirectory(dir)
                .setBare(true)
                .call()) {
            System.out.println("✅ Bare Repo created at: " + dir.getAbsolutePath());
        } catch (GitAPIException e) {
            throw new RuntimeException(e);
        }
    }

    public String switchRepositories(String newPath) {
        File workspace = new File(newPath);

        try {
            System.out.println("🔄 Switching workspace to: " + newPath);

            if (workspace.exists()) {
                deleteDirectory(workspace);
            }

            try (Git git = Git.cloneRepository()
                    // connecting to the SAME fake server
                    .setURI(new File(REMOTE_PATH).toURI().toString())
                    .setDirectory(workspace)
                    .call()) {
                System.out.println("✅ Cloned successfully to: " + workspace.getAbsolutePath());
            } catch (GitAPIException e) {
                throw new RuntimeException(e);
            }

            return "Success: Switched active workspace to " + workspace.getAbsolutePath();
        } catch (Exception e) {
            throw new RuntimeException("Failed to switch: " + e.getMessage());
        }
    }

    public Map<String, String> getRepoStatus(String path) {
        File dir = new File(path);
        Map<String, String> result = new HashMap<>();
        result.put("path", dir.getAbsolutePath());

        if (!dir.exists()) {
            result.put("status", "MISSING");
            return result;
        }

        File gitDir = dir.getName().endsWith(".git") ? dir : new File(dir, ".git");

        try (Repository repo = new FileRepositoryBuilder().setGitDir(gitDir).build()) {
            if (repo.getObjectDatabase().exists()) {
                result.put("status", "OK");
                result.put("isBare", String.valueOf(repo.isBare())); // Added this info
                try {
                    String head = repo.resolve("HEAD") != null ? repo.resolve("HEAD").getName() : "Empty";
                    result.put("head", head);
                } catch(Exception e) {
                    result.put("head", "Unknown");
                }
            } else {
                result.put("status", "INVALID");
            }
        } catch (Exception e) {
            result.put("status", "ERROR");
            result.put("details", e.getMessage());
        }
        return result;
    }
}
