# Weqayah CRM (ate-next)

Internal CRM for Weqayah staff (admin, operations, finance, technicians).
**Live URL:** https://ate-crm.vercel.app
**Local:** `C:\Users\alhaj\ate-next`
**Repo:** https://github.com/themurderbot/ATE-NEXT

## Stack

- **Framework:** Next.js 16 (Turbopack)
- **Structure:** uses `src/` directory (different from ate-portal)
- **TypeScript:** strict
- **Backend:** Supabase (same project as portal: `gjjmscyiewrdqtritsea`)
- **Deployment:** Vercel auto-deploy from GitHub main branch

> ⚠️ **Note:** Root `components/` folder is empty. All app code lives under `src/`.

## Current Status

- ✅ Deployed and live
- ⏸️ **Branding NOT yet updated** — still uses ATE branding
- ⏸️ **Responsive design** for tablets/iPads not yet evaluated
- ⏸️ **Performance** review pending

## Pending Work (in priority order)

1. **Explore `src/app/` structure** — map components, routes, current state
2. **Apply Weqayah branding** — logo, names, colors (match ate-portal style)
3. **Make responsive** for tablets (staff sometimes use iPads in field meetings)
4. **Performance audit** — Cache + RLS query optimization
5. **Backup workflow debug** — `.github/` YAML exists but not appearing in Actions tab

## Brand Reference (to apply)

- **Logo:** `https://ate-portal.vercel.app/icon-192.png`
- **Name:** Weqayah (full), `Weqayah | وقاية` (short with Arabic)
- **Colors:** see global CLAUDE.md (bg #060c14, blue #0a80ff, red #ff3040)
- **Fonts:** Tajawal (AR), Rajdhani (EN), IBM Plex Mono (codes)
- **Bilingual:** AR (RTL default) + EN toggle

## Recent Activity

- Sentry monitoring enabled
- `SUPABASE_DB_URL` configured in GitHub secrets
- RLS policies added for technicians (see `ate-platform/CLAUDE.md` for full list)

## Commands

```powershell
cd C:\Users\alhaj\ate-next
npm run dev
npm run build
git push   # auto-deploys
```

## Known Issues

- GitHub Actions backup workflow not visible in Actions tab despite YAML existing in `.github/`
- (Same as portal) stray `.git` at `C:\Users\alhaj\` makes git noisy

## Tables Likely Used (server-side)

All Supabase tables — CRM is the admin interface for everything:
`clients`, `properties`, `requests`, `invoices`, `certificates`, `schedules`, `devices`, `technicians`, `users`, `alerts`, `audit_log`, `payments`, `documents`, etc.

Admin/staff bypass most RLS via `is_admin()` / `is_staff()` policies.

## Conventions (when we start working)

- Match ate-portal conventions: inline styles, bilingual, no Tailwind
- Use `<Link>` not `<a>` for internal nav
- Mobile-friendly even though primary device is desktop
