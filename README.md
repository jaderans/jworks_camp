# JoshWorks Campaigns

Plan, make and track JoshWorks' own marketing, and run social media for SMM clients. It uses the same look, dashboard and team model as JoshWorks POS.

It is a web app that installs like a phone app (PWA). It works offline, keeps data on each device and can sync the team through your own free Firebase project.

**Live app:** https://jaderans.github.io/jworks_camp/ (once GitHub Pages is on; see [Deploy](#deploy)).

## What's inside

**Content**
- **Calendar**: month, week and list views with drag and drop. It knows the weekly themes (Mon educational, Tue portfolio, Wed flex, Thu designer, Fri behind the scenes), the break week (the week of each month's last Monday), Philippine holidays and seasons (Dinagyang, Paskua, intramurals, double-day sales).
- **Board**: idea → to do → in progress → for review → ready → scheduled → posted.
- **Post editor**: platform captions with hashtag and length checks (Instagram allows 5 hashtags), a styled first line, the 16-point premium design check, approvals, comments and results.
- **Ideas**: the idea bank, WHAT IF concepts, carousel scripts slide by slide, and a caption bank.

**Grow**
- **Campaigns**: 15 templates (rebrand, merch drop, sticker pack, Dinagyang, Paskua, graduation, SMM launch and more). Each one builds a funnel, dates the posts on themed days around breaks and holidays, and can move posts off days that already have one.
- **Trends**: the weekly report, a trend board, outliers (posts that did 2× the usual), daily hook practice with a streak, and a playbook with sources.
- **Results**: log numbers 48–72 hours after posting, then compare by designer, theme, format and weekday.
- **Assistant**: Claude with web search, set up with JoshWorks' voice, themes and calendar. Ready-made recipes cover captions, hooks, carousel scripts, reels, campaigns, proposals and client reports.

**SMM clients**
- **Clients**: a pipeline from lead to active, onboarding checklists, the monthly cycle, an approval PDF and a monthly report PDF.
- **Packages**: Starter ₱4,500, Growth ₱7,500 and Plus ₱12,000 a month, plus add-ons and design services. Every price shows its margin against the team's hourly rates.
- **Proposals and contracts**: the founding-client offer (10% off the first 3 months), optional VAT and 2% withholding, a contract generator with the clauses SMM contracts should never skip, and PDFs for both.

**People**: owner, manager and designer roles, invite links, an activity log, backups and an owner PIN for shared computers.

**Import**: bring in the old content planner (.xlsx). Posts already published are skipped, the rest get new dates from the restart day, and seasonal posts stay in season. Unsafe links, like a wallet address pasted in place of a Drive link, are dropped.

## Posting to Facebook, Instagram and TikTok

The app writes and checks the caption, then copies it and opens the right composer (Meta Business Suite, TikTok Studio, Threads or X). After posting, paste the post link back and log results later. Direct posting needs a Meta developer app with App Review and a small server for tokens. See [docs/SOCIAL_MEDIA.md](docs/SOCIAL_MEDIA.md).

## Data and privacy

- **Local first.** Everything lives in the browser on each device (IndexedDB) and works offline. Export a backup from Settings any time.
- **Team sync is optional.** It runs on your own Firebase project: [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md). Designers never see packages, proposals, contracts or rates.
- **The Claude API key never leaves the device** where it was entered. It is not synced and not in this repository. Assistant chats stay on the device too.
- **Never store client passwords.** Ask clients for partner access in Meta Business Suite and TikTok Business Center instead.
- **This repository is public.** The old planner, its Drive links and numbers, and the reference screenshots (`Jworks Previous Campaigns/`, `*.xlsx`) are git-ignored. Keep client data out of commits.

## Weekly trend report

`public/trends/latest.json` is the report everyone sees on the dashboard and the Trends page. Nobody needs an API key to read it. A scheduled Claude routine can rewrite it every Monday, or the owner can run "Research trends now" in the app. See [docs/TREND_REPORT.md](docs/TREND_REPORT.md).

## Development

Requires Node 22.

```sh
npm ci
npm run dev        # http://localhost:5173
npm run check      # type check + unit tests (Vitest)
npm run e2e        # production build + the full owner journey in Chrome (Playwright)
npm run build      # dist/
```

Tests that need the private planner file skip themselves when it isn't there, so CI runs without it. The e2e run saves a screenshot of every screen in `test-results/shots` (or the folder in `SHOTS`).

| Folder | What's there |
| --- | --- |
| `src/domain` | Pure logic with tests: calendar and rescheduling, seasons and holidays, captions, pricing, contracts, funnels, the planner reader |
| `src/services` | Saving and loading records, imports, backups |
| `src/features` | One folder per screen |
| `src/db` | The IndexedDB schema (Dexie) and settings |
| `src/sync` | Firebase sign-in and sync |
| `src/ai` | The Claude client and prompts |
| `src/reports` | PDF proposals, contracts, approvals and client reports |
| `firebase/firestore.rules` | Who can read and write what in the cloud |

## Deploy

Every push to `main` runs the checks and publishes to GitHub Pages. One-time setup: in the repository, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
