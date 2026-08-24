# Contributing to Questions-Generator-API

Thanks for your interest in improving this project!

## About

An AI-powered interview question generator built with AWS Lambda, API Gateway, Amazon Bedrock, and AWS CDK. It accepts job descriptions via REST API and generates STAR-style technical interview questions.

## Getting Started

```bash
npm install
npm run build   # compile TypeScript
npm test        # run Jest test suite
npm run cdk     # CDK CLI commands
```

## How to Contribute

1. Open or claim an issue describing the problem or enhancement.
2. Fork the repo and create a feature branch from `main`: `git checkout -b feat/my-change`.
3. Make focused changes; keep PRs scoped to a single concern.
4. Ensure `npm run build` and `npm test` pass locally before pushing.
5. Open a pull request linking the issue (`Fixes #<n>`) with a short description of the change.

## Guidelines

- Follow existing TypeScript style and project structure (`lib`, `src`, `bin`).
- Add or update tests for behavior changes.
- Update the README if endpoints or configuration change.
- Infrastructure changes (CDK stacks) require extra care — describe IAM/resource impacts in the PR.
