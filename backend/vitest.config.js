const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "node",
    globals: true,
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      exclude: ["test/**", "test_profile.js", "vitest.config.js"],
      reporter: ["text", "json-summary", "html"],
    },
  },
});