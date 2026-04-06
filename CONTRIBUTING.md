# Contributing to Vowena Dashboard

Thanks for contributing to the Vowena dashboard. This repository is where the product experience for merchants and subscribers comes together, so contributor experience matters here just as much as code quality.

## What kinds of contributions we want

- Bug fixes
- UX and accessibility improvements
- Performance work
- Documentation updates
- New dashboard capabilities that fit the roadmap
- Test coverage and CI improvements

If you are new to the project, start with issues labeled `good first issue` or `help wanted`.

## Before you start

1. Search existing issues and pull requests first.
2. For larger changes, open or comment on an issue before investing a lot of time.
3. Read [README.md](README.md), [SUPPORT.md](SUPPORT.md), [SECURITY.md](SECURITY.md), and this guide.

## Local setup

### Prerequisites

- Node.js 22 or later
- npm 10 or later
- PostgreSQL

### Install

```bash
git clone https://github.com/vowena/dashboard.git
cd dashboard
npm install
cp .env.example .env.local
npm run dev
```

### Required environment values

- `DATABASE_URL`
- `NEXT_PUBLIC_CONTRACT_ID`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_NETWORK_PASSPHRASE`
- `NEXT_PUBLIC_USDC_ADDRESS`
- `KEEPER_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`

## Development workflow

1. Fork the repository.
2. Create a branch from `main`.
3. Keep the branch focused on a single problem.
4. Run the checks listed below.
5. Open a pull request using the PR template.

### Branch naming

Use a descriptive prefix:

- `feat/merchant-analytics`
- `fix/wallet-reconnect-loop`
- `docs/update-dashboard-setup`
- `refactor/subscription-query-state`
- `test/add-billing-hooks-coverage`
- `chore/upgrade-next`

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add subscription retry indicator
fix: prevent duplicate wallet reconnect prompts
docs: clarify keeper environment variables
refactor: extract charge summary card
test: add coverage for subscription filters
chore: upgrade drizzle-kit
```

## Quality bar

Run all of these before you push:

```bash
npm run lint
npm run typecheck
npm run build
```

### Frontend expectations

- Keep components focused and composable.
- Prefer server components unless you truly need client-side interactivity.
- Match the existing design language unless the task is explicitly a redesign.
- Test any UI change in both desktop and mobile layouts.
- Include screenshots in the PR when visuals change.

## Pull requests

- Link the related issue when there is one.
- Explain what changed and why it matters.
- Call out schema, environment, or contract assumptions.
- Include screenshots or short videos for UI work.
- Keep PRs reviewable. Smaller changes get better feedback faster.

Maintainers will review for product behavior, correctness, accessibility, and operability.

## Security

Never disclose vulnerabilities in a public issue or PR. Follow [SECURITY.md](SECURITY.md).

## Conduct

Participation in this repository is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
