# SCALEUP — frontend

Next.js 16 (App Router, Cache Components) + shadcn/ui + TanStack Query. Talks to the Express API in
`../project-management-backend`.

```bash
npm install
cp .env.example .env.local   # API_URL, defaults to http://localhost:5000
npm run dev                  # http://localhost:3000 (use -p 3001 if 3000 is busy)
```

Start the API first (`npm run dev` in the backend). Requests to `/api/*` are rewritten to `API_URL`
(`next.config.ts`), so the httpOnly session cookie is first-party; `proxy.ts` only does optimistic
login redirects, the API enforces auth on every call.

## Structure

- `app/(auth)` — login, register, forgot password → OTP → reset
- `app/(app)` — authenticated shell (sidebar, top bar, splash) + dashboard, projects, users,
  categories, profile names, settings
- `components/projects` — the project/credential editor: resource templates, `.env` import,
  secret detection, password generator, expiry dates, outline + checklist
- `components/ui` — shadcn primitives restyled to the SCALEUP Figma tokens (`app/globals.css`)
- `lib` — API client, React Query hooks, `.env` parse/export helpers, formatting

## Clients and project links

Use **Clients** in the sidebar to create a client and view all their projects across profiles.
**Add Project** accepts an existing client or creates one inline without clearing the draft.
Each project has a required name plus independent **Live sites** and **Repositories** lists.
Add a label and an HTTP(S) URL for each link; empty lists are supported. Saved project details
provide labeled Open and Copy actions and a link back to the client. The dashboard can filter
by client and search project names, client names, and links.

Admin and operation users can manage clients and projects. Sales users have read access.
Client renames appear across all projects; a client with projects must have them reassigned
before deletion. Credentials remain independent between projects.

Existing installations should preview and apply the backend's `migrate:clients` script before
using this version with old projects; see the backend README for backup and migration details.
`npm run build` verifies the production frontend; `npm run lint` checks source conventions.

## Environment import

The project editor accepts pasted environment text or dropped/uploaded files such as `.env.production`.
The importer suggests an environment from the filename, reports malformed lines and repeated keys,
and supports quoted and multiline values. Duplicate keys use their last definition; variable references
are kept literally and never executed. Key matching is case-sensitive.

Preview and select fields before importing. Existing populated values are kept by default, empty
matching fields are filled, and replacing populated values requires choosing **Replace existing values**.
The preview labels new, filled, replaced, unchanged, and kept values. Detected secrets are masked in
the preview. Imports only update the project draft; save the project to persist the changes.

Parser and merge tests can be run from this directory after installing both projects' dependencies:

```bash
node --import ../project-management-backend/node_modules/tsx/dist/loader.mjs --test lib/credentials.test.ts
```
