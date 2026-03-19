# thirdface

A minimal React + Vite landing page for the `thirdface` brand.

The site is a single immersive scene built around:

- a looping background sky video
- timed quote and wordmark reveals
- a framed scale-down transition
- subtle texture overlays for a more premium visual finish

## Stack

- React 19
- Vite
- Motion

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
src/
  App.jsx
  main.jsx
  index.css
  assets/
    favicon.png
    SeasonMix-Regular-Dm5k_1Bi.woff2
    sky-web.mp4
```

## Notes

- The main experience lives in `src/App.jsx`.
- Global styling and motion presentation details live in `src/index.css`.
- This project is intentionally small and does not include routing or a backend.
