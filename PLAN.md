# PortfolioSite — Execution Plan

## Phase 1: Backend (Contact Form)

| Step | File | Action |
|------|------|--------|
| 1 | `backend/package.json` | Create — Express + Nodemailer + dotenv |
| 2 | `backend/server.js` | Create — POST `/api/contact`, validate, send email via Nodemailer (Gmail SMTP) |
| 3 | `backend/.env.example` | Create — `EMAIL_USER`, `EMAIL_PASS`, `CONTACT_EMAIL` |
| 4 | `docker-compose.yml` | Create — two services: `nginx` (static) + `api` (Node), Dokploy-compatible |
| 5 | `Dockerfile` | Rename to `Dockerfile.nginx`, add `Dockerfile.api` for the Node server |
| 6 | `nginx.conf` | Add `/api/` proxy_pass to `http://api:3000` |

---

## Phase 2: Content — Services Page

| Step | File | Action |
|------|------|--------|
| 7 | `public/services.html` | Fill `<main>` with service offerings: Web Dev, Custom Tools, Consultancy |

---

## Phase 3: Content — Studio Page

| Step | File | Action |
|------|------|--------|
| 8 | `public/studio.html` | Add **RepoTicket** card under Web Apps (React + PocketBase, "Launch Live App" disabled / alpha) |
| 9 | `public/studio.html` | Add **PassPro** card under Web Apps as WIP/placeholder |

---

## Phase 4: Content — Journal & Articles

| Step | File | Action |
|------|------|--------|
| 10 | `public/journal.html` | Add "Game Bug Fix" link under Personal Projects in sidebar |
| 11 | `public/articles/bug-fix.html` | Write real content for the Game Bug Fix article |
| 12 | `public/articles/projects.html` | Complete WIP — write the "Projects by Tema" article |

---

## Future Phases (Not Yet Started)

- Studio: QR Code Generator tool (in-page expandable)
- Studio: APR Calculator tool (in-page expandable)
- Studio: Sudoku Solver tool (in-page expandable)
- Studio: Local BW Safari Site
- Studio: Smart Home Devices company site concept
- Studio: Digital Security Audit site concept (terminal-style)
- Journal: Comments on posts
- Journal: Sidebar auto-shrink on scroll
- Design: Mouse shiver follow on banner
- Design: Profile image
- Mobile: Menu reformat (side slide with backdrop blur)
- Mobile: Fix thin green bar on bottom
- Mobile: Fix arrow UI clash
- Web Apps: Online customer booking system
