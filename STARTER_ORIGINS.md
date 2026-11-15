# Mentor starter repositories

The supplied repositories were cloned locally into `.starter-sources/` for reference. Those pristine clones are excluded from the completed project's source files and dependency installation.

| Repository | Inspected commit |
| --- | --- |
| https://github.com/errormakesclever/blog-project-starter-frontend | `bc47dd822b4b78d3c711cd2cef3a0e14bf5a048b` |
| https://github.com/errormakesclever/blog-project-starter-backend | `f7088da18318462d1fd325da85ca3ae976f3488b` |

The working `frontend/` and `backend/` directories contain a substantial refactor that implements the mentor's requirements. The interface, tooling, data model, and API have been updated; this is not an unchanged checkout of the starters.

| Starter | Completed implementation |
| --- | --- |
| Create React App | Vite with React and npm workspaces |
| `components/Home.jsx`, `/home` | Portfolio page, with `/work` as the main navigation route |
| `components/Blogs.jsx`, `/blogs` | Searchable journal, also available at `/` |
| `components/Login.jsx`, `/login` | Real Firebase email/password login |
| `components/Signup.jsx`, `/signup` | Real Firebase signup with name and password confirmation |
| Empty `src/config/firebase.js` | Environment-based Firebase initialization |
| Login/signup logging passwords to console | Firebase SDK operations; passwords are never logged or stored in MongoDB |
| One backend `index.js` | Entry point retained; configuration, database, authorization, API, and scripts separated into modules |
| Hardcoded `mongodb://localhost:27017/blogDB` | Environment-based MongoDB URI and database; separate local demo database |
| Mongoose schema `newTitle`, `newContent`, `date`, `likes` | Official MongoDB driver, validated posts with stable slugs, drafts, categories, timestamps, and author identity |
| Public `POST /api/blogs` | Protected `POST /api/admin/posts`, with corresponding view, update, and delete endpoints |
| Unrestricted public blog creation form | Separate admin panel and editor |
| Public like counter | Omitted from the completed scope; no unauthenticated mutation endpoints retained |

For existing starter database content, `npm run migrate:starter` copies `blogDB.blogs` into the new `posts` collection as drafts. It preserves source documents and imported like counts, and does not duplicate previously imported records. Review imported content before publishing it. `STARTER_MONGODB_DB` can change the source database name.
