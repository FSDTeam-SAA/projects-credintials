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
