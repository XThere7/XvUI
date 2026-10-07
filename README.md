# XvecBot Dashboard · BotBase Landing

Dark-primary B2B SaaS dashboard for the XvecBot platform, plus the public
**BotBase** landing page at `/`. Non-technical business owners turn their
documents into embeddable chat widgets. Three jobs drive the whole UI: **manage
knowledge**, **build agents**, **deploy widgets**.

The complete product specification is in [`frontendbot.md`](./frontendbot.md)
(page-by-page screens, component library, API guide, design system, accessibility
baseline and the verified API reference). That document is authoritative.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript `strict` |
| Styling | Tailwind CSS v4 — design tokens in `@theme` in `src/app/globals.css` |
| UI base | Radix primitives + hand-rolled design-system components (`src/components/ui`) |
| Icons | `lucide-react`, imported per icon |
| Animation | Framer Motion (`motion/react`) — sidebar, tabs, modals, chat, route transitions |
| Premium moments | 6 hand-picked components in `src/components/premium`, all `next/dynamic` |
| Server state | TanStack Query v5 |
| Client state | Zustand (`src/stores/session.ts`) |
| Forms | React Hook Form + Zod (`src/schemas`) |
| Tables | TanStack Table v8 (headless) + a hand-rolled shell |
| Toasts | Sonner |
| HTTP | Native `fetch` through `lib/api-client.ts` — no axios |

Fonts (Inter, JetBrains Mono) are self-hosted `woff2` in `src/app/fonts` with
`font-display: swap`.

## Getting started

```bash
npm install
cp .env.local .env.local.example   # already present; adjust the API URL if needed
npm run dev                        # http://localhost:3000
```

The backend must be running and reachable **from the browser**:

```bash
cd ../backend
../.venv/bin/uvicorn app.main:app --port 8000
```

If dashboard calls fail with `Disallowed CORS origin`, add this dashboard's
origin to the backend's `ALLOWED_ORIGINS` and restart it. Only `/public/*`
accepts any origin.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # production build
```

## End-to-end smoke test

`e2e/` contains a self-contained harness: a mock backend that implements the
verified API shapes, and a Playwright script that drives the real UI through
the whole product journey.

```bash
# 1. install the harness (once)
cd e2e && npm install

# 2. build and start the app, then run the harness
npm run build && npx next start -p 3113 &
node e2e/mock-api.mjs 8000 &        # mock backend
node e2e/smoke.mjs http://localhost:3113
```

The harness asserts 44 checks: registration validation, the onboarding gate,
workspace creation, document upload → auto-train → `ready` with a chunk count,
the agent prerequisite gate, the chat preview (grounded answer, `sources: []`
grounding warning, `model_used` visibility), the one-time token modal and its
dismissal guard, token masking, snippet re-reveal, revoke, the read-only
conversation thread, every mandated confirmation copy, the in-memory session
losing on a hard reload, the `?redirect=` back-link, and the 44px mobile touch
target. Screenshots land in `e2e/shots/`.

It uses the system Chromium (`CHROMIUM_PATH`, default `/usr/bin/chromium`) — no
browser download required.

## Environment

```bash
# .env.local — no trailing slash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000   # required; a config-error screen renders without it
NEXT_PUBLIC_APP_NAME=XvecBot
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never put a backend secret (OpenRouter key, JWT secret) in a `NEXT_PUBLIC_*`
variable — those are compiled into the client bundle.

## Architecture notes

- **Auth is in-memory only.** `lib/auth.ts` reads a module-level store
  (`stores/session.ts`). Nothing is written to `localStorage`,
  `sessionStorage` or a cookie. A hard refresh therefore signs you out; the
  cost is deliberate and documented in the spec (§6.2, §14.6).
- **One 401 handler.** Every request goes through `lib/api-client.ts`, which
  clears the token, shows a single warning toast (deduplicated by a module-level
  flag) and replaces the route to `/login?redirect=<current>`. `/login` honours
  `?redirect=`.
- **Tabs live in the URL** (`?tab=`) so links are shareable and browser Back
  works. `/workspaces/[wsId]/agents` and `?tab=agents` render the same panel.
- **Training poll.** `hooks/use-training-poll.ts` polls
  `GET /workspaces/{ws}/documents/{doc}/status` every 3000 ms for documents in
  `uploaded`/`processing`. It stops only on `ready`, `failed`, `404`, unmount or
  the 10-minute cap — never on a network error or a 5xx. Exactly one
  "Training complete" toast per document.
- **The full embed token is shown once.** It exists only in the `201` from
  `POST .../tokens` and in `GET .../tokens/{id}/snippet`. It is held in component
  state for the modal's lifetime only, never in a store, URL, or log. Closing the
  modal without copying re-opens it once with a stronger warning.
- **No paginators.** No list endpoint accepts pagination, so every list is
  rendered whole with client-side search only. Conversations are ordered
  `updated_at` desc with no sort control.
- **Untrusted text.** LLM answers and filenames are rendered as text with
  `whitespace-pre-wrap`. There is no `dangerouslySetInnerHTML` anywhere.
- **`/api/v1/*` is not used.** Those routes are API-key authenticated and the
  query route is broken in Phase 1. Workspace Q&A uses
  `POST /workspaces/{ws}/chat` (`hooks/use-workspace-chat.ts`).

## Routes

```
/                                        BotBase landing page (Phase 1: sticky header + hero + how-it-works + footer)
/login · /register                        split auth layout, brand panel
/dashboard                                onboarding checklist or populated overview
/workspaces · /workspaces/new             list + create
/workspaces/[wsId]?tab=documents|agents|settings
/workspaces/[wsId]/agents/new
/workspaces/[wsId]/agents/[agentId]?tab=overview|test|conversations|embed
/workspaces/[wsId]/agents/[agentId]/conversations/[convId]
/account · /account/security              session identity, API config, logout
```

## Themes

Dark is the default. A light theme is available from the moon/sun toggle in the
top bar; the choice is stored in `localStorage` and survives a reload. Both
themes are driven entirely by the semantic tokens in `src/app/globals.css`, so
no component carries a hardcoded colour.