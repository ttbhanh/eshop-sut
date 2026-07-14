const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const backendDir = path.resolve(__dirname, "..");
const coverageTempDir = path.join(backendDir, ".v8-coverage");
const coverageReportDir = path.join(backendDir, "coverage");

fs.rmSync(coverageTempDir, { recursive: true, force: true });
fs.rmSync(coverageReportDir, { recursive: true, force: true });
fs.mkdirSync(coverageTempDir, { recursive: true });

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const reportCommand = process.platform === "win32" ? "npx.cmd" : "npx";

const testResult = spawnSync(npmCommand, ["run", "test"], {
  cwd: backendDir,
  env: {
    ...process.env,
    NODE_V8_COVERAGE: coverageTempDir,
  },
  stdio: "inherit",
});

if (testResult.status !== 0) {
  process.exit(testResult.status || 1);
}

const reportResult = spawnSync(
  reportCommand,
  [
    "c8",
    "report",
    "--temp-directory",
    coverageTempDir,
    "--report-dir",
    coverageReportDir,
    "--reporter=text",
    "--reporter=json-summary",
    "--reporter=html",
  ],
  {
    cwd: backendDir,
    stdio: "inherit",
  },
);

if (reportResult.status !== 0) {
  process.exit(reportResult.status || 1);
}