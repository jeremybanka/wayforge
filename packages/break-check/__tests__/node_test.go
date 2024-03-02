package main

import (
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

var testDir string

// copyFile copies the source file to a destination.
func copyFile(srcPath, destPath string) error {
	srcFile, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	destFile, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, srcFile)
	return err
}

// setupTestEnvironment sets up the test environment
func setupTestEnvironment(t *testing.T) {
	// Create a temporary directory
	var err error
	testDir, err = os.MkdirTemp("", "break-check-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %s", err)
	}

	buildCmd := exec.Command("go", "build", "-o", "break-check")
	err = buildCmd.Run()
	if err != nil {
		t.Fatalf("Failed to build break-check: %s", err)
	}

	// Copy the binary to the test environment
	err = copyFile("break-check", filepath.Join(testDir, "break-check"))
	if err != nil {
		t.Fatalf("Failed to copy break-check to test directory: %s", err)
	}
	os.Chmod(filepath.Join(testDir, "break-check"), 0755)

	// Write the source file
	err = copyFile(filepath.Join("fixtures", "node", "src.js"), filepath.Join(testDir, "src.js"))
	if err != nil {
		t.Fatalf("Failed to copy src.js to test directory: %s", err)
	}

	// Write the public API test file
	err = copyFile(filepath.Join("fixtures", "node", "public.test.js"), filepath.Join(testDir, "public.test.js"))
	if err != nil {
		t.Fatalf("Failed to copy public.test.js to test directory: %s", err)
	}

	// Write the private API test file
	err = copyFile(filepath.Join("fixtures", "node", "private.test.js"), filepath.Join(testDir, "private.test.js"))
	if err != nil {
		t.Fatalf("Failed to copy private.test.js to test directory: %s", err)
	}

	// Change directory to the test environment
	os.Chdir(testDir)

	// Initialize a Git repository
	exec.Command("git", "init").Run()

	// Commit and tag the initial state
	exec.Command("git", "add", ".").Run()
	exec.Command("git", "commit", "-m", "Initial commit with public and private tests").Run()
	exec.Command("git", "tag", "v1.0").Run()
}

// tearDownTestEnvironment cleans up the test environment
func tearDownTestEnvironment(t *testing.T) {
	os.RemoveAll(testDir) // remove the temporary directory
}

func TestWithNode(t *testing.T) {
	setupTestEnvironment(t)
	defer tearDownTestEnvironment(t)

	t.Log("Running break-check...")

	// Introduce a breaking change to src.js
	srcFilePath := filepath.Join(testDir, "src.js")
	srcContent, err := os.ReadFile(srcFilePath)
	if err != nil {
		t.Fatalf("Failed to read src.js: %s", err)
	}

	t.Log("Modifying src.js...")

	modifiedSrcContent := strings.Replace(string(srcContent), `"publicMethodOutput"`, `"modifiedPublicMethodOutput"`, 1)
	err = os.WriteFile(srcFilePath, []byte(modifiedSrcContent), 0644)
	if err != nil {
		t.Fatalf("Failed to write modified src.js: %s", err)
	}

	// Run the break-check tool
	cmd := exec.Command("./break-check", "--pattern", "public.test", "--testCmd", "node --test public.test.js")
	output, err := cmd.CombinedOutput()

	// Check the error
	t.Log(err)

	if err == nil {
		t.Fatalf("Expected break-check to report a breaking change, but it didn't.\nOutput: %s", output)
	}

	if !strings.Contains(string(output), "Breaking changes detected!") {
		t.Errorf("Expected 'Breaking changes detected!' in output but got: %s", output)
	}

	// (By definition, you can't fix a breaking change by updating the test.)

	// Update the test to match the new output
	t.Log("Updating public.test.js...")
	publicTestFilePath := filepath.Join(testDir, "public.test.js")
	publicTestContent, err := os.ReadFile(publicTestFilePath)
	if err != nil {
		t.Fatalf("Failed to read public.test.js: %s", err)
	}

	modifiedPublicTestContent := strings.Replace(string(publicTestContent), `"publicMethodOutput"`, `"modifiedPublicMethodOutput"`, 1)
	err = os.WriteFile(publicTestFilePath, []byte(modifiedPublicTestContent), 0644)
	if err != nil {
		t.Fatalf("Failed to write modified public.test.js: %s", err)
	}

	// Run the break-check tool again
	cmd = exec.Command("./break-check", "--pattern", "public.test", "--testCmd", "node --test public.test.js")
	output, err = cmd.CombinedOutput()

	// Check the error
	t.Log(err)

	if err == nil {
		t.Fatalf("Expected break-check to report breaking changes, but it did not!\nOutput: %s", output)
	}

	if !strings.Contains(string(output), "Breaking changes detected!") {
		t.Errorf("Expected 'Breaking changes detected!' in output but got: %s", output)
	}
}
