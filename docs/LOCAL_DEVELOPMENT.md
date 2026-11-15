# Fieldnotes — Blog Portfolio

A full stack blog portfolio with MongoDB persistence, Firebase email/password authentication, and a separate admin publishing panel. Built for the mentor requirements using the supplied frontend and backend starters as references. See [STARTER_ORIGINS.md](STARTER_ORIGINS.md) for the upstream commits, retained routes, and refactor details.

## Run the complete application locally

Requirements: **Node.js 22.12+**, npm, and internet access on the first run. Docker, Java, MongoDB installation, and cloud credentials are not required for this mode. Chrome is required only for browser tests.

From this project's root:

```powershell
npm install
npm run dev:local
```

Open **http://127.0.0.1:5173**. Keep the terminal running. This command starts a real local MongoDB process, the official Firebase Authentication Emulator, the Express API, and the React frontend. It also creates six example articles and a local admin account:

```text
Email:    admin@fieldnotes.local
Password: Fieldnotes123!
```

These are development-only credentials for the loopback-bound emulator; they do not work with a real Firebase project. Use **Sign in → Admin panel**, or visit `/admin`, to manage content. Visit `/signup` to create a regular reader account and verify that it cannot access the admin panel.

MongoDB files are stored in `.data/mongo/`. On Ctrl+C, the launcher exports local Firebase accounts to `.data/firebase/` before stopping its services. The next run imports those accounts. Avoid force-closing the terminal if you want the account export to complete. Posts persist independently in MongoDB.

| Local service | Address |
| --- | --- |
| Frontend | http://127.0.0.1:5173 |
| Express API | http://127.0.0.1:4000/api/health |
| Firebase Emulator UI | http://127.0.0.1:4001 |
| Firebase Auth emulator | 127.0.0.1:9099 |
| MongoDB | mongodb://127.0.0.1:27018/fieldnotes_local |

The launcher needs ports 4000, 4001, 4400, 4500, 5173, 9099, and 27018 to be free. First startup downloads the MongoDB binary and emulator UI. If an operating system or workspace policy blocks child processes, allow Node.js to start the local database and emulator.

## Connect your own MongoDB and Firebase projects

Use this mode for the mentor's cloud integration demonstration. Stop `dev:local` first. Local emulator accounts and data are separate from cloud accounts and data.

### 1. Create the environment files

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

Both files are ignored by Git. Never put a Firebase Admin private key or a MongoDB password in a `VITE_` variable, frontend source code, or a commit.

### 2. Configure MongoDB

Create a MongoDB Atlas deployment, a database user, and a network access entry for your development machine. Copy the driver's connection string into `backend/.env`, replacing the user/password placeholders. URL-encode special characters in the database password.

```dotenv
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=fieldnotes
```

Alternatively, use your own local MongoDB instance. If Docker is installed:

```powershell
docker compose up -d
```

Then set `MONGODB_URI=mongodb://127.0.0.1:27017`. The Docker service binds only to loopback and persists its data in a named volume. MongoDB startup creates the `posts` and `users` collections with indexes. The `posts` collection also has database-level validation. The database becomes visible when the collections are created.

Optionally add sample articles:

```powershell
npm run seed
```

Seeding preserves existing posts with matching slugs. For posts previously created using the mentor's starter, run `npm run migrate:starter` instead; source documents in `blogDB.blogs` remain untouched and imported posts start as private drafts.

### 3. Configure Firebase Authentication

1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Under **Authentication → Sign-in method**, enable **Email/Password**.
3. Under **Authentication → Settings → Authorized domains**, add `localhost` and `127.0.0.1` as needed for local development, plus your eventual deployed domain.
4. Under **Project settings → General**, register a web app. Copy its public configuration into `frontend/.env`:

```dotenv
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=your-web-app-id
```

5. Under **Project settings → Service accounts**, generate a Firebase Admin service account key. Keep the JSON file private and outside the frontend. Fill `backend/.env` from that file:

```dotenv
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-example@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

Instead of copying the key fields, you may set `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of the private service account JSON file, and set `FIREBASE_PROJECT_ID`. Application Default Credentials are also supported. The frontend and backend must use the **same Firebase project**. Leave the emulator variables unset for cloud mode.

### 4. Run, sign up, and grant admin access

```powershell
npm run dev
```

Open http://127.0.0.1:5173 and create an account. All new accounts are readers. In a second terminal, explicitly grant your account the Firebase admin custom claim:

```powershell
npm run admin -- your-email@example.com grant
```

**Sign out and sign in again** after this command. It invalidates previous sessions so changes to permissions take effect. Your header now includes the admin panel icon. Visit `/admin` to add, edit, view, publish, and delete posts.

To remove admin access:

```powershell
npm run admin -- your-email@example.com revoke
```

Admin status comes from a Firebase custom claim set by this trusted server-side script. Changing the browser's state, a request body, or a MongoDB user profile cannot grant admin access.

## Mentor demonstration walkthrough

1. Open the journal and show posts fetched through `/api/posts`.
2. Sign up with a reader account. Show the success message, then sign out and sign in again.
3. Try a wrong password and demonstrate the error message.
4. Visit `/admin` as a reader and show access denied. The API also returns **403**, even for manually crafted requests.
5. Sign in as an admin and open the publishing panel.
6. Create a draft with a title, excerpt, Markdown body, category, tags, and cover. Preview the Markdown.
7. Show the draft in the admin panel and confirm it is absent from the public journal, including direct article URLs.
8. Edit the draft and publish it. Open the public article.
9. Change its content, save, and refresh the article to demonstrate persistence.
10. Delete the post using the confirmation dialog and show that it is gone.
11. Inspect the `posts` and `users` collections in Atlas, Compass, or `mongosh`. Passwords are managed by Firebase and are never stored in MongoDB.

Local emulator mode demonstrates the same authentication and database code paths. For a cloud-connected submission, follow the cloud setup above and show your own Firebase Console and Atlas collections.

## API

All authenticated endpoints require `Authorization: Bearer <Firebase ID token>`. The server validates tokens with Firebase Admin and checks revocation/disabled users. Every admin endpoint additionally requires `admin === true`.

| Method | Endpoint | Access / behavior |
| --- | --- | --- |
| GET | `/api/health` | Database readiness and auth configuration status |
| GET | `/api/posts` | Published summaries, search, category, and pagination |
| GET | `/api/posts/:slug` | One published article; drafts return 404 |
| GET | `/api/me` | Signed-in user; upserts MongoDB profile |
| GET | `/api/admin/posts` | Admin; paginated published posts and drafts |
| GET | `/api/admin/posts/:id` | Admin; complete post for editing |
| POST | `/api/admin/posts` | Admin; creates a validated post |
| PUT | `/api/admin/posts/:id` | Admin; updates a validated post, retaining its slug and author |
| DELETE | `/api/admin/posts/:id` | Admin; deletes a post |

Feed query parameters: `search`, `category`, `page` (default 1), `limit` (default 9, maximum 24). Categories: `Development`, `Design`, `Learning`, `Life`. Unknown or invalid parameters return 400. Search text is escaped before use in MongoDB queries. Public list responses omit full article bodies.

Post fields: `title` (3–160 characters), `excerpt` (10–350), `content` (50–50,000), `category`, `tags` (up to 6, each up to 30 characters), `coverTheme`, `status` (`draft` or `published`), `featured` (boolean). Author, timestamps, and slug are controlled by the server. Payloads are limited to 100 KB. Rate limits and security headers are enabled.

## Verification

```powershell
# Isolated integration tests with a real temporary MongoDB process.
npm test

# Standalone Firebase + MongoDB integration test. Stop dev:local first.
npm run test:firebase

# Browser tests: starts dev:local if needed, or reuses an existing local session.
npm run test:ui

# Build the frontend.
npm run build
```

`npm test` runs 16 API, migration, and serverless tests; the additional Firebase-specific test is skipped unless `FIREBASE_AUTH_EMULATOR_HOST` is set. `test:firebase` starts the official emulator for that test, including the admin grant/revoke script. Four Chrome browser scenarios cover search, filtering, reading, mobile navigation, signup, password errors, logout, reader restrictions, draft privacy, and admin CRUD. Browser screenshots are written to `artifacts/`.

If Chrome is unavailable, install it or change `channel: 'chrome'` in `playwright.config.js` to an installed Playwright browser. The application itself does not need Chrome to run.

## Production build

Configure the frontend's real Firebase settings before building. Then:

```powershell
npm run build
$env:NODE_ENV = 'production'
npm start
```

Express serves `frontend/dist/` and the API on the same origin. The server currently binds to `127.0.0.1`; use a reverse proxy on a hosting machine. Set `CLIENT_ORIGIN` to the production origin if using separate hosts, and set `VITE_API_URL` before building when the API is on another origin. No secrets are bundled into the frontend. Production startup rejects missing MongoDB configuration and Firebase Auth emulator configuration. HTTPS should terminate at your hosting provider or reverse proxy.

Without `backend/.env`, `npm run dev` intentionally opens a **read-only sample preview**. It never invents authentication or pretends sample content is stored in MongoDB. Use `dev:local` or complete the cloud setup for the full working application.

## Project map

```text
frontend/
  src/components/     Auth dialogs, artwork, admin gate, retained starter page entries
  src/config/         Firebase web configuration
  src/lib/            Auth state, API client, notifications
  src/pages/          Journal, reader, portfolio, admin, editor
backend/
  index.js            Retained server entry point
  src/                Express API, validation, database indexes, Firebase Admin
  scripts/            Seed, admin permissions, starter-data migration
  test/               API and Firebase integration tests
scripts/dev-local.mjs Local database, emulator, and app launcher
shared/posts.js       Categories, artwork themes, and example articles
tests/ui.spec.js      Full browser workflows
```

The portfolio is personalized from Devasennathipathy K's supplied resume. Edit name, role, location, contact links, skills, projects, and education in `frontend/src/config/profile.js`. Portfolio sections are in `frontend/src/pages/Portfolio.jsx`, the journal sidebar is in `frontend/src/pages/Journal.jsx`, and branding is in `frontend/src/App.jsx`. Article covers are original CSS artwork and require no external image hosting. Google Fonts have system font fallbacks.

Implementation references: [Firebase email/password authentication](https://firebase.google.com/docs/auth/web/password-auth), [Firebase token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims), [Authentication Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth), [MongoDB Node.js driver](https://www.mongodb.com/docs/drivers/node/current/get-started/).
