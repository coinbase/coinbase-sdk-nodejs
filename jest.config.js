module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  testMatch: ["**/src/**/*.test.ts", "**/src/tests/**/*.ts"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/src/tests/e2e.ts",
    "/src/tests/utils.ts",
    "/src/tests/types.test-d.ts",
  ],
  coveragePathIgnorePatterns: ["node_modules", "client", "__tests__", "/src/tests/"],
  collectCoverage: true,
  collectCoverageFrom: ["./src/**/*.ts"],
  coverageReporters: ["html"],
  verbose: true,
  maxWorkers: 1,
  coverageThreshold: {
    "./src/**/*.ts": {
      branches: 75,
      functions: 85,
      statements: 85,
      lines: 85,
    },
  },
};
