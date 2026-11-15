# Blog Portfolio

A full stack developer portfolio and blog by **Devasennathipathy K**, built with React, Node.js, Express, MongoDB, and Firebase Authentication.

The portfolio presents my skills, education, achievements, and projects, including **Low-Key Escape** and **Greenden**. A separate admin panel provides a publishing workflow for blog content.

## Features

- Responsive portfolio, project showcase, and contact links
- Blog search, category filters, pagination, and article pages
- Firebase email/password signup, login, password reset, and logout
- Server-side verification of Firebase ID tokens and admin custom claims
- Admin dashboard for creating, editing, viewing, publishing, and deleting posts
- Private drafts and a Markdown editor with formatted preview
- MongoDB persistence, input validation, indexes, and user profiles
- Single-project Vercel deployment for the React frontend and Express API

## Technology

| Layer | Tools |
| --- | --- |
| Frontend | React, Vite, React Router, CSS |
| API | Node.js, Express, Zod |
| Database | MongoDB |
| Authentication | Firebase Authentication, Firebase Admin SDK |
| Testing | Node.js test runner, Supertest, Playwright |
| Hosting | Vercel |

## Run locally

Use Node.js 22.12 or later:

```bash
npm install
npm run dev:local
```

Open http://127.0.0.1:5173. This development command starts MongoDB, the official Firebase Authentication Emulator, the API, and the frontend. Data stays on your machine. The first run needs internet access to download local tools.

The local demo administrator is `admin@fieldnotes.local` with password `Fieldnotes123!`. This account exists only in the local emulator and cannot sign in to a real Firebase project.

For your own cloud services, copy the environment examples to `frontend/.env` and `backend/.env`, enter your configuration, and run `npm run dev`.

## Deploy

Follow [the GitHub and Vercel deployment guide](docs/DEPLOYMENT.md). Import the **repository root** into Vercel; `vercel.json` builds `frontend/dist` and routes `/api` requests to the Express function. A MongoDB Atlas database and a Firebase project are required for hosted blog storage and authentication.

Private database credentials and Firebase Admin keys belong in backend environment variables. Keep `.env` files, service account keys, local databases, and emulator exports out of Git.

## Check the application

```bash
npm run build
npm test
npm run test:firebase
npm run test:ui
```

The tests cover database persistence, validation, draft privacy, admin authorization, starter-data migration, serverless initialization, Firebase authentication, and complete browser publishing workflows. Stop the local emulator before running the standalone `test:firebase` command. Browser tests require Chrome.

## Project structure

```text
api/                  Vercel function entry point
frontend/src/         Portfolio, blog, account, and admin interfaces
backend/src/          API, validation, MongoDB, and Firebase Admin
backend/scripts/      Seed data, admin permissions, and migration
backend/test/         API and integration tests
shared/               Categories and sample articles
scripts/              Local development launcher
tests/                Browser workflows
docs/                 Setup and deployment documentation
```

Update portfolio details in `frontend/src/config/profile.js`. Admin privileges are granted through `npm run admin -- your-email@example.com grant` after configuring Firebase Admin credentials. Sign out and sign in again after changing permissions.

## References

The original learning starters are [errormakesclever/blog-project-starter-frontend](https://github.com/errormakesclever/blog-project-starter-frontend) and [errormakesclever/blog-project-starter-backend](https://github.com/errormakesclever/blog-project-starter-backend). See [STARTER_ORIGINS.md](STARTER_ORIGINS.md) for the source commits and implementation changes, and [the detailed local guide](docs/LOCAL_DEVELOPMENT.md) for configuration and a feature walkthrough.
