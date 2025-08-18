import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      enabled: true,
      reporter: ["text", "lcov", "html"],
      exclude: [
        "commitlint.config.js",
        "*.config.js",
        "*.config.cjs",
        "*.config.mjs",
        "*.config.ts",
        "dist/**",
      ],
    },
    include: ["src/**/*.test.ts"],
    exclude: [],
  },
});
