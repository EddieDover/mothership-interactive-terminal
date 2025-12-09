export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "perf",
        "refactor",
        "style",
        "test",
        "build",
        "ops",
        "docs",
        "chore",
        "merge",
        "revert",
        "template",
      ],
    ],
  },
  ignores: [(commit) => commit.startsWith("WIP ")],
};
