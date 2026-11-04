# Copilot Tier Planner

An interactive playground for exploring how GitHub Copilot plans, usage limits and upgrade paths fit together, and for testing the messages users see as they approach those limits.

> [!NOTE]
> This is not an official GitHub product. It's a snapshot of Copilot plans from late 2025, when usage was metered in premium requests. Plans have changed since then and this project isn't kept up to date, so check the [current Copilot plans](https://docs.github.com/en/copilot/get-started/plans) for accurate information.

## Project status

The project was updated in November 2026 to prepare it for public release. That update fixed a hydration error, patched vulnerable dependencies and removed unused code. It didn't change the plan data, which still reflects late 2025.

## What it does

The app has two views:

- **Threshold builder**: pick a plan, simulate usage and see which alerts appear. You can edit each threshold's percentage, severity, message and call to action.
- **Plan builder**: lay out plans as a visual map, add custom SKUs and draw the upgrade paths between them. The paths you choose feed into the call-to-action text.

The current plan and usage are stored in the URL, so you can share a state by copying the link. To save or share a whole setup, including custom SKUs and thresholds, export it as JSON. See [Configuration export and import](docs/THRESHOLD_EXPORT.md) and [Dynamic edges and CTAs](docs/DYNAMIC_EDGES_AND_CTAS.md) for details.

## Getting started

You'll need Node.js 24 or later.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command                | What it does                  |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Starts the development server |
| `npm run build`        | Creates a production build    |
| `npm run lint`         | Runs ESLint                   |
| `npm run format:check` | Checks formatting             |
| `npm run type-check`   | Runs the TypeScript compiler  |

## Project structure

```
src/
├── app/         # Next.js app router entry point
├── components/  # UI components
├── contexts/    # Planner and scenario state
├── css/         # Global styles
├── data/        # Plan definitions and default scenario
├── hooks/       # React hooks
├── types/       # TypeScript types
└── utils/       # Alert, edge and state helpers
```

Built with [Next.js](https://nextjs.org/docs/app), [Primer React](https://primer.style/react) and [React Flow](https://reactflow.dev/). The site is a static export deployed to GitHub Pages by [this workflow](.github/workflows/nextjs.yml), so it has no server-side rendering or API routes.

## License

[MIT](LICENSE)
