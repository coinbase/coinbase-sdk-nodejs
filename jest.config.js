module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  testMatch: ["**/src/**/*.test.ts", "**/src/tests/**/*.ts"],
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
