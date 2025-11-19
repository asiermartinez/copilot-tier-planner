# primer-nextjs-template

Prototyping with Next.js, Primer and other goodies

## Prerequisites

- Node.js v20+ (recommended to use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions)
- Some previous knowledge of [Next.js](https://nextjs.org/docs/getting-started) and [React](https://react.dev/learn)

## Getting started

If you're planning to use this template for a new project, you can create a new repository from it using the `Use this template` button. If you just want to try it out or contribute, feel free to clone or fork the repository.

## Project structure

```
.
├── app/                 # Next.js app router
├── components/          # Reusable components
├── css/                 # Global styles
├── defaults/            # Faux accounts data and navigation
├── types/               # Some typescript types
├── utils/               # Some utility functions, mostly hooks
├── .gitignore           # Git ignore file
├── .nvmrc               # Node version manager file
├── .prettierignore      # Prettier ignore file
├── .prettierrc.json     # Prettier configuration
├── eslint.config.mjs    # ESLint configuration
├── next.config.js       # Next.js configuration
├── package.json         # Project metadata and dependencies
├── package-lock.json    # NPM lock file
├── README.md            # This file
└── tsconfig.json        # TypeScript configuration
```

## Router

Instead of building a prototype that just floats in the air, this template forces you think about your project's structure from the start, specifically, how each part fits into real GitHub URLs. By following [Next.js App Router conventions](https://nextjs.org/docs/app/getting-started/layouts-and-pages), routes are organized using directories and files. It also handles dynamic routes for `/enterprises/` and `/organizations/` account names with the `[slug]` dynamic leaf segment.

Each route is a directory, which can have a `layout.tsx` for shared layout and a `page.tsx` for the actual page content. You can nest folders to create sub-routes.

```
.
├── app/
│   ├── (enterprises)/enterprises/[slug]/           # Enterprise routes
│   │   ├── billing/                                # Billing routes
│   │   │   ├── cost-centers/                       # Cost centers routes
│   │   │   │   ├── layout.tsx (optional)           # Cost centers layout (shared by all cost centers routes)
│   │   │   │   └── page.tsx                        # Cost centers main page
│   │   │   ├── layout.tsx                          # Billing layout (shared by all billing routes)
│   │   │   └── page.tsx                            # Billing main page
│   │   ├── ...                                     # All other enterprise sub-routes hiden for brevity
│   │   ├── layout.tsx                              # Enterprise layout (shared by all enterprise routes)
│   │   └── page.tsx                                # Enterprise main page
│   ├── (organizations)/organizations/[slug]/       # Organization routes (follows the same structure as enterprises)
│   ├── layout.tsx                                  # Root layout (shared by all routes)
│   └── page.tsx                                    # Home page
...
```

## Components

This template includes two helper components to simplify navigation: `AppHeader` and `ParentNavigation`
- `AppHeader` handles the top-level navigation across all views: enterprise, organization, repository, and user.
- `ParentNavigation` extends Primer’s `NavList` component to provide left-side navigation for parent pages at each level.

Both components are already integrated into their respective layouts. Instead of building the navigation manually, you can configure their content through the files in the `defaults/navigation` directory.

## Defaults

The `defaults` directory includes sample or faux account data and navigation configurations to help you prototype quickly. You can modify or replace these files, or add new ones when introducing new parent pages. Just make sure to update the `index.js` file to export any newly added navigation entries.

Including faux account data is especially important during deployment, as Next.js needs to pre-render all possible routes at build time. You can still fetch data or work with user-generated content, but it must be handled on the client side using Next.js’s Link component for proper routing. Since this prototype is deployed to GitHub Pages, server-side rendering and API routes are not supported. All data fetching must happen client-side, and for dynamic routes, you need to predefine all possible paths at build time, otherwise, Next.js will return a 404 error on hard reload.

```
.
├── defaults/
│   ├── accounts/                       # Faux accounts data for pre-rendering routes
│   │   ├── enterprises.ts              # Sample enterprises data
│   │   ├── organizations.ts            # Sample organizations data
│   │   ├── repositories.ts             # Sample repositories data
│   │   ├── users.ts                    # Sample users data
│   │   └── index.ts                    # Exports all accounts data
│   ├── navigation/                     # Navigation configurations for AppHeader and ParentNavigation
│   │   ├── global/                     # Global navigation for AppHeader
│   │   │   ├── enterprise.ts           # Enterprise navigation items
│   │   │   ├── organization.ts         # Organization navigation items
│   │   │   ├── repository.ts           # Repository navigation items
│   │   │   ├── user.ts                 # User navigation items
│   │   │   └── index.ts                # Exports all global navigation
│   │   ├── parent/                     # Parent navigation for ParentNavigation
│   │   │   ├── enterprise/             # Enterprise parent navigation items
│   │   │   │   ├── billing.ts          # Billing navigation items
│   │   │   │   ├── settings.ts         # Settings navigation items
│   │   │   │   ├── ...                 # All other navigation items hiden for brevity
│   │   │   │   └── index.ts            # Exports all navigation items under enterprise
│   │   │   ├── organization/           # Organization parent navigation items
│   │   │   ├── repository/             # Repository parent navigation items
│   │   │   ├── user/                   # User parent navigation items
│   │   │   └── index.ts                # Exports all parent navigation
...
```

## Need help?
If you need help, please open an issue in this repository.

## How to contribute

Open a pull request or an issue in this repository.
