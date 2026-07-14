const { spawn } = require("child_process");
const path = require("path");

const SERVER_URL = "http://127.0.0.1:3000";
const READY_MESSAGE = "Server is running on http://localhost:3000";

function startBackendServer() {
  const backendDir = path.resolve(__dirname, "..", "..");
  const child = spawn(process.execPath, ["server.js"], {
    cwd: backendDir,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const readyPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Backend server did not become ready in time"));
    }, 15000);

    const handleOutput = (chunk) => {
      const output = chunk.toString();
      if (output.includes(READY_MESSAGE)) {
        clearTimeout(timeout);
        child.stdout.off("data", handleOutput);
        child.stderr.off("data", handleOutput);
        resolve();
      }
    };

    const handleExit = (code, signal) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `Backend server exited before becoming ready (code: ${code}, signal: ${signal})`,
        ),
      );
    };

    child.stdout.on("data", handleOutput);
    child.stderr.on("data", handleOutput);
    child.once("exit", handleExit);
  });

  return readyPromise.then(() => ({ child, baseUrl: SERVER_URL }));
}

function stopBackendServer(child) {
  if (!child || child.killed) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
      resolve();
    }, 3000);

    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });

    child.kill("SIGINT");
  });
}

module.exports = {
  startBackendServer,
  stopBackendServer,
  SERVER_URL,
};