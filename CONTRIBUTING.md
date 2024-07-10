# Contributing Guide

## Development

### Node.js Version

Developing in this repository requires Node.js 18 or higher.

### Set-up

Clone the repo by running:

```bash
git clone git@github.com:coinbase/coinbase-sdk-nodejs.git
```

To install all dependencies, run:

```bash
npm install
```

### Linting

To autocorrect all lint errors, run:

```bash
npm run lint-fix
```

To detect all lint errors, run:

```bash
npm run lint
```

### Testing

To run all tests, run:

```bash
npm test
```

To run a specific test, run (for example):

```bash
npx jest ./src/coinbase/tests/wallet_test.ts
```
To run e2e tests, run:

```bash
npm run test:dry-run && NAME="placeholder" PRIVATE_KEY="placeholder" WALLET_DATA="placeholder" && npm run test:e2e
```

### Generating Documentation

To generate documentation from the TypeDoc comments, run:

```bash
npm run docs
```
