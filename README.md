# RHOIDAH N LITAPELO — Activity 7 Backend

**Mulungushi University · ICT251 · Student number 202503013**

Project: **IT Support Desk**

Package name: `rhoidah-n-litapelo-activity7-backend`

Assignment deadline: **24 November 2026, 23:59**

This independent backend stores fictional campus IT support requests and provides the seven API routes required by Activity 7. This fresh project lives in `mathew-banda-activity7-backend`. The earlier backend remains a separate backup, and the submitted Activity 6 frontend is not connected or edited.

The assignment's exact requirements and its SQLite/PostgreSQL inconsistency are explained in [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md). See [deployment instructions](docs/DEPLOYMENT.md) and [actual test results](docs/TEST_RESULTS.md) for the remaining evidence and hosting work.

## Start locally

Use Node 24 or 26. `.node-version` selects Node 26 for hosting; use the current Active LTS release for submission.

Open PowerShell and run:

```powershell
Set-Location 'C:\Users\USER\Desktop\mathew-banda-activity7-backend'
npm.cmd install
npm.cmd run db:setup
npm.cmd start
```

The supplied local `.env` uses a separate database, `data/mathew-banda.db`, and contains no database token. On a fresh checkout where `.env` is absent, first create it once with `Copy-Item .env.example .env`. Keep `.env` out of Git.

Open **http://localhost:3000** for the API guide displaying **RHOIDAH N LITAPELO**, student number **202503013**. Use **HTTP** locally. `/health` checks the server and database; `/api/records` lists the records. Stop the server with **Ctrl+C**. On Linux/macOS use `npm` in place of `npm.cmd`.

Database setup creates the tables and eight fictional records once. Startup also performs initialization, so `db:setup` is optional after the first setup. An initialization marker preserves edits and deletions across restarts, including an intentionally empty records table. This database is separate from the earlier project's data.

## API agreement

| Method | Route | Successful response |
| --- | --- | --- |
| GET | `/` | HTML guide, 200 |
| GET | `/health` | Database health check, 200 |
| GET | `/api/records` | Array ordered by ID, or `[]`, 200 |
| GET | `/api/records/:id` | One record including ID, 200 |
| POST | `/api/records` | Saved record with generated ID, 201 |
| PUT | `/api/records/:id` | Updated record with original ID, 200 |
| DELETE | `/api/records/:id` | `{"message":"Record deleted."}`, 200 |

POST and PUT use `Content-Type: application/json` and all four editable fields:

```json
{
  "title": "Cannot connect to campus Wi-Fi",
  "category": "Network",
  "description": "A fictional student cannot connect a laptop to campus Wi-Fi near the library.",
  "status": "Pending"
}
```

Values must be strings and are trimmed before checking lengths: title **3–80**, category **2–40**, description **5–300**. Category is free text. Status is exactly **Pending**, **In progress**, or **Completed**. SQLite generates a positive whole-number `id`; client-supplied IDs are ignored. PUT replaces all four fields and does not create a missing record.

Errors are JSON objects with a `message`: **400** for invalid input or malformed JSON, **404** for missing records/routes, **500** for unexpected failures, and **503** when the database health check fails. SQL placeholders keep record text separate from SQL instructions.

## Files explained

| File | Purpose |
| --- | --- |
| `server.js` | Starts and stops the HTTP server and database connection. |
| `app.js` | Builds Express, enables JSON/CORS, mounts the routes, and handles errors. |
| `routes/records.js` | Implements the five record operations. |
| `validation.js` | Checks IDs and editable values before SQL runs. |
| `db.js` | Uses Node's built-in SQLite for local files and loads the HTTP libSQL client only for a hosted database. |
| `schema.sql` | Defines the five record fields and a separate initialization marker table. |
| `seed.sql` | Supplies eight fictional records with database-generated IDs. |
| `views/guide.js` | Produces the marker's guide, including the configured student name and number. |
| `scripts/setup-db.js` | Initializes the selected database. |
| `scripts/test-live.js` | Sends requests to a running API and removes its own test record. |
| `tests/` | Checks the HTTP API using isolated data and includes a real process restart check. |
| `.env.example` / `.gitignore` | Explain settings and exclude local configuration, databases, dependencies, and logs from Git. |
| `package.json` / `package-lock.json` | Define run commands and record dependency versions. |

The backend uses **Node.js, CommonJS, Express, CORS, dotenv, and SQLite**. Local SQLite is included in Node, so no separate database server, account, or password is needed. Hosted libSQL uses the installed `@libsql/client/http` module; it is not loaded for the local database.

## Settings and tests

The local examples are `STUDENT_NAME=RHOIDAH N LITAPELO`, `STUDENT_NUMBER=202503013`, `PROJECT_NAME=IT Support Desk`, `PORT=3000`, `DATABASE_URL=file:./data/mathew-banda.db`, and `API_BASE_URL=http://localhost:3000`. `DATABASE_AUTH_TOKEN` and `CLIENT_ORIGINS` are blank locally. Set `API_BASE_URL` to the public HTTPS address after deployment. Browser origins can be configured during Activity 8.

The existing folder, database filename, and public hostname remain their current resource names. For the deployed guide, update Render's `STUDENT_NAME` and `STUDENT_NUMBER` environment values and save/deploy: Render's settings take precedence over local defaults. A source-code update alone does not replace an existing Render environment value. See [the manual identity-update steps](docs/DEPLOYMENT.md#update-the-displayed-student-details).

Run the independent tests with:

```powershell
npm.cmd test
```

The tests use temporary databases rather than your normal records. To test a running server from a second terminal:

```powershell
npm.cmd run test:live -- http://localhost:3000
```

Replace that address with the deployed HTTPS URL for hosted checks. Read [the test report](docs/TEST_RESULTS.md) for actual outcomes; preparing a test command does not establish that it passed. Hosting requires account access and persistent storage as explained in [the deployment guide](docs/DEPLOYMENT.md).
