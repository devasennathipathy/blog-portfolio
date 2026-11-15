# GitHub and Vercel deployment

Deploy this repository as **one Vercel project**. The frontend is static and the Express API runs as a Node.js function. MongoDB and Firebase are external services; the local emulator and Docker database do not run on Vercel.

## 1. Create Firebase Authentication

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project. Google Analytics is optional for this application.
2. Open **Project settings → General → Your apps** and register a **Web app** using the `</>` icon. Firebase Hosting is not required because this app uses Vercel.
3. Copy `apiKey`, `authDomain`, `projectId`, and `appId` from the web configuration into `frontend/.env` using the names in `frontend/.env.example`.
4. Open **Authentication → Get started → Sign-in method** and enable **Email/Password**.
5. Open **Project settings → Service accounts** and generate a private Firebase Admin service account key. Store the downloaded JSON file outside the repository.
6. Copy the JSON file's `project_id`, `client_email`, and `private_key` into `backend/.env` as `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. Preserve the key's newline escapes and quote the value as shown in the environment example. Never put these admin values in a frontend variable.

The frontend and backend must refer to the same Firebase project. Do not enable emulator variables for production.

Official guides: [email/password authentication](https://firebase.google.com/docs/auth/web/password-auth), [Firebase Admin setup](https://firebase.google.com/docs/admin/setup).

## 2. Create MongoDB Atlas

1. Open [MongoDB Atlas](https://cloud.mongodb.com/) and create a project and cluster. Select the free tier if it is available and sufficient for your project.
2. Under **Database Access**, create a database user with a strong unique password. Grant the application read/write access to the `fieldnotes` database.
3. Under **Network Access**, allow your current development IP so the application can be tested and seeded locally. Hosted Vercel functions also need network access; configure the relevant allowlist or a supported integration for the deployment. A local IP entry alone will not allow Vercel to connect. Allowing `0.0.0.0/0` permits all network origins and should only be used with an appropriately restricted database user and strong credentials.
4. Choose **Connect → Drivers → Node.js** and copy the connection string into `backend/.env` as `MONGODB_URI`. Replace the username/password placeholders and URL-encode special characters in the password.
5. Set `MONGODB_DB=fieldnotes`.

The application creates its `posts` and `users` collections, validation, and indexes on the first successful database connection. You do not need to create those collections manually.

Official guide: [MongoDB Node.js driver connection setup](https://www.mongodb.com/docs/drivers/node/current/get-started/).

## 3. Verify cloud services locally

Stop `npm run dev:local`, then:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

Run those copy commands only when the destination files do not already contain your configuration. Fill in the values from steps 1 and 2, then:

```powershell
npm run dev
```

Create your own account through signup. Grant it administrator access from a second terminal:

```powershell
npm run admin -- your-email@example.com grant
```

Sign out and sign in again. Create a post from `/admin` and verify that it appears in Atlas and on the public blog.

Optional: `npm run seed` adds example articles. For a public professional portfolio, publish your own articles and remove any example content you do not want to present.

## 4. Import the GitHub repository into Vercel

1. In [Vercel](https://vercel.com/new), import the repository.
2. Keep **Root Directory** at the repository root, not `frontend` or `backend`.
3. The tracked `vercel.json` defines the build command, output directory, and API routing. Use **Other** for the framework preset if prompted.
4. Set **Node.js 24.x** in the project's build settings.
5. Add the variables below for **Production** and **Preview** before the final deployment. Paste secrets directly into Vercel's environment settings or load them securely from local environment files; do not commit them.

| Variable | Source |
| --- | --- |
| `MONGODB_URI` | Atlas connection string, including the database user credentials |
| `MONGODB_DB` | `fieldnotes` |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON `client_email` |
| `FIREBASE_PRIVATE_KEY` | Service account JSON `private_key`, with newlines preserved |
| `VITE_FIREBASE_API_KEY` | Firebase web app `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web app `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase web app `projectId` |
| `VITE_FIREBASE_APP_ID` | Firebase web app `appId` |
| `CLIENT_ORIGIN` | Your exact deployed HTTPS origin |

Leave `VITE_API_URL` empty: the frontend and API share the same origin. Do not set `FIREBASE_AUTH_EMULATOR_HOST` or `VITE_FIREBASE_AUTH_EMULATOR_URL` on Vercel.

The `VITE_` variables are bundled into the browser at build time, so changing them requires a new build. The Firebase web configuration identifies the web app; it is distinct from the private Firebase Admin credentials.

## 5. Add the domain and verify the deployment

1. In Firebase **Authentication → Settings → Authorized domains**, add the production Vercel hostname, without `https://` or a path.
2. Deploy or redeploy after saving all environment variables.
3. Open `/api/health`; the response should include `"database":"connected"` and `"authentication":true`.
4. Check the Blog, Projects, and About pages, including refreshing their URLs directly.
5. Test signup, login/logout, a reader's denied admin access, and an admin's create/edit/publish/delete workflow.

Only share the final link as a fully working application after those checks pass. A successful static build alone does not verify cloud database or authentication setup.

Official references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Node.js functions](https://vercel.com/docs/functions/runtimes/node-js).
