# Contributing to Sanwo React Native SDK

Thank you for your interest in contributing to Sanwo! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/react-native.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b my-feature`

## Development

```bash
# Build the package
npm run build

# Clean build artifacts
npm run clean
```

## Making Changes

1. Make your changes in the `src/` directory
2. Ensure the code compiles: `npm run build`
3. Add a changeset: `npx changeset`
4. Commit your changes following conventional commit format
5. Push and open a pull request

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `chore: maintenance task`

## Changesets

We use [changesets](https://github.com/changesets/changesets) for versioning. When you make a change that should be released:

```bash
npx changeset
```

Follow the prompts to describe your change and select the appropriate semver bump.

## Code Style

- Write TypeScript with strict mode
- Use functional React components and hooks
- Follow the patterns established in `@sanwohq/core` and `@sanwohq/react`

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
