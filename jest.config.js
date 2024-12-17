module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  coveragePathIgnorePatterns: ["node_modules", "client", "__tests__"],
  collectCoverage: true,
  collectCoverageFrom: ["./src/coinbase/**"],
  coverageReporters: ["html"],
  verbose: true,
  maxWorkers: 1,
  coverageThreshold: {
    "./src/coinbase/**": {
      branches: 74,
      functions: 85,
      statements: 85,
      lines: 85,
    },
  },
};
