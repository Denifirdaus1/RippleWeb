# RippleWeb - Clean Architecture & Standalone Features

Project ini menggunakan arsitektur yang terpisah antara layer bisnis dan UI, dengan pendekatan per-fitur (Standalone Features).

## Folder Structure

- `src/app`: Next.js App Router (Pages, Layouts).
- `src/core`: Shared utilities, components, types, constants, and global state.
- `src/features`: Business features (e.g., todo, auth, focus).
  - `features/[feature-name]/domain`: Entities, repository interfaces, usecases.
  - `features/[feature-name]/data`: Models, repository implementations, data sources.
  - `features/[feature-name]/presentation`: React components, hooks, feature-specific state.

## Getting Started

1. `npm install`
2. `npm run dev`
