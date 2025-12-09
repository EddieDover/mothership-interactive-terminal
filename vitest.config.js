import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/scripts/hacking/**/*.js"],
      exclude: [
        "src/scripts/hacking/HackingGameRegistry.js",
        "src/scripts/hacking/BaseHackingGame.js",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
