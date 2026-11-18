# Express Movie Watchlist API

A REST API for managing a personal movie catalog and watchlist, built with
**Express 5**, **TypeScript**, **Prisma 7**, and **PostgreSQL**. Users register
and log in with JWT-based authentication (stored in an HTTP-only cookie). They
can then add movies and track each one on a watchlist with a status, a rating,
and notes.

This project started from the PedroTech Express tutorial and has since been
extended with dependency injection, request validation, centralized error
handling, and a full test suite.

## Features

- **Authentication**: register, log in, log out, and delete your account.
  Passwords are hashed with bcrypt. JWTs are issued as `httpOnly`,
  `sameSite=strict` cookies, and a `Bearer` token header is also accepted.
- **Movies**: CRUD for movies. Each user can see and change only the movies
  they created.
- **Watchlist**: add movies to a personal watchlist with a status (`PLANNED`,
  `WATCHING`, `COMPLETED`, `DROPPED`), a 1–10 rating, and notes. Ownership is
  checked on every read and write.
- **Validation**: Zod schemas validate request bodies, route params (UUIDs),
  and environment variables at startup.
- **Consistent responses**: every endpoint returns a typed
  `{ status, data }` or `{ status, error }` envelope.
- **Testable design**: the app is built by a factory (`createApp({ prisma })`),
  so tests inject a mocked Prisma client and need no real database.

## Tech Stack

| Area            | Tooling                                         |
| --------------- | ----------------------------------------------- |
| Runtime         | Node.js ≥ 22 (ES modules)                       |
| Framework       | Express 5                                       |
| Language        | TypeScript                                      |
| Database / ORM  | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`)    |
| Auth            | `jsonwebtoken`, `bcryptjs`, `cookie-parser`     |
| Validation      | Zod 4                                           |
| Testing         | Vitest, Supertest, `vitest-mock-extended`       |
| Lint / Format   | oxlint, oxfmt                                   |
| Package manager | pnpm                                            |

## Project Structure

```text
.
├── prisma/
│   ├── schema.prisma        # Data models: User, Movie, WatchListItem
│   ├── migrations/          # SQL migration history
│   └── seed.ts              # Seeds sample movies
├── src/
│   ├── server.ts            # Entry point: connects DB, starts server, handles shutdown
│   ├── app.ts               # createApp() factory: middleware and route wiring
│   ├── config/
│   │   ├── db.ts            # Prisma client and connect/disconnect helpers
│   │   └── env.ts           # Zod-validated environment variables
│   ├── controllers/         # Route handlers (auth, movie, watchlist)
│   ├── middleware/          # Auth, request validation, error handler
│   ├── routes/              # Express routers
│   ├── validators/          # Zod request schemas
│   ├── types/               # Shared API and Express type definitions
│   └── utils/               # AppError, response helpers, cookie helpers
├── tests/                   # Vitest + Supertest integration tests
├── prisma.config.ts         # Prisma CLI config (schema and migration paths, DB URL)
└── vitest.config.ts         # Test config and test environment variables
```

## Getting Started

### Prerequisites

- **Node.js 22 or newer**
- **pnpm**: the repo pins its version through `packageManager`. Run
  `corepack enable` to have the right version used automatically.
- **PostgreSQL**: a local install, a Docker container, or a hosted provider
  such as Prisma Postgres, Neon, or Supabase.

### 1. Clone and install

```bash
git clone https://github.com/PatrickDonohoe/Express-Tutorial.git
cd Express-Tutorial
pnpm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```dotenv
# Direct connection, used by the Prisma CLI for migrations
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME"

# Connection used by the running app. Can be the same as DATABASE_URL
# if you aren't using a connection pooler.
DATABASE_URL_POOLED="postgresql://USER:PASSWORD@HOST:5432/DB_NAME"

NODE_ENV="development"

# At least 32 characters. Generate one with: openssl rand -base64 32
JWT_SECRET="replace-with-a-long-random-secret"

# Optional: token lifetime in seconds (default: 604800, which is 7 days)
JWT_EXPIRES_IN=604800

# Optional: default 5001
PORT=5001
```

The app checks these values at startup and exits with a readable error if any
are missing or invalid.

| Variable              | Required | Default       | Description                                     |
| --------------------- | -------- | ------------- | ----------------------------------------------- |
| `DATABASE_URL`        | Yes      | –             | Direct Postgres URL (Prisma migrations)         |
| `DATABASE_URL_POOLED` | Yes      | –             | Postgres URL the app connects with at runtime   |
| `JWT_SECRET`          | Yes      | –             | JWT signing secret, at least 32 characters      |
| `NODE_ENV`            | No       | `development` | `development`, `production`, or `test`          |
| `JWT_EXPIRES_IN`      | No       | `604800`      | Token and cookie lifetime in seconds            |
| `PORT`                | No       | `5001`        | Port the HTTP server listens on                 |

In `development`, Prisma logs every query. In `production`, the auth cookie is
set with `secure: true`, so it is only sent over HTTPS.

### 3. Set up the database

Apply the existing migrations and generate the Prisma client:

```bash
pnpm prisma migrate dev
pnpm generate
```

### 4. (Optional) Seed sample movies

```bash
pnpm seed:movies
```

This creates a seed user, or reuses it if it already exists, and adds a set of
sample movies owned by that user. Movies are only visible to the user who
created them, so log in as the seed user to see them through the API:

| Email              | Password      |
| ------------------ | ------------- |
| `seed@example.com` | `password123` |

The script is safe to run more than once. If the seed user already has movies,
it skips adding them, so you won't get duplicates. To change the seed user's
details, edit the `SEED_USER` constant at the top of `prisma/seed.ts`.

### 5. Run the server

```bash
pnpm dev
```

The server starts on `http://localhost:5001`, or on `PORT` if you set it, and
restarts when files change.

For a production build:

```bash
pnpm build   # compiles to dist/
pnpm start   # runs dist/server.js
```

## Scripts

| Command                | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `pnpm dev`             | Start the dev server with watch mode                     |
| `pnpm build`           | Compile TypeScript to `dist/`                            |
| `pnpm start`           | Run the compiled server                                  |
| `pnpm test`            | Run the test suite with Vitest (watch mode)              |
| `pnpm typecheck`       | Type-check without emitting files                        |
| `pnpm lint`            | Lint with oxlint (type-aware)                            |
| `pnpm format`          | Format with oxfmt                                        |
| `pnpm format:check`    | Check formatting without writing                         |
| `pnpm migrate <name>`  | Create and apply a new migration (`prisma migrate dev`)  |
| `pnpm generate`        | Regenerate the Prisma client                             |
| `pnpm seed:movies`     | Seed sample movies                                       |

After you change `prisma/schema.prisma`, run `pnpm migrate <name>` and then
`pnpm generate`.

## API Reference

All request and response bodies are JSON. Responses use one of two shapes.

Success:

```json
{ "status": "success", "data": { ... } }
```

Error:

```json
{ "status": "error", "error": { "message": "...", "details": ... } }
```

### Authentication

Routes marked 🔒 need a valid JWT. The server reads it from the `jwt` cookie,
which is set automatically on register and login, or from an
`Authorization: Bearer <token>` header.

| Method   | Endpoint         | Auth | Description                                    |
| -------- | ---------------- | ---- | ---------------------------------------------- |
| `POST`   | `/auth/register` |      | Create an account and set the auth cookie      |
| `POST`   | `/auth/login`    |      | Log in and set the auth cookie                 |
| `POST`   | `/auth/logout`   |      | Clear the auth cookie                          |
| `DELETE` | `/auth/remove`   | 🔒   | Delete your account, movies, and watchlist     |

**Register:** `POST /auth/register`

```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }
```

Returns `201` with `{ "user": { "id", "name", "email", "createdAt" } }`.
Returns `409` if the email is already registered.

**Login:** `POST /auth/login`

```json
{ "email": "jane@example.com", "password": "secret123" }
```

Returns `200` with `{ "user": { "id", "name", "email" } }`. Returns `401` if
the credentials are wrong.

### Movies 🔒

Users see and manage only the movies they created.

| Method   | Endpoint      | Description                  |
| -------- | ------------- | ---------------------------- |
| `GET`    | `/movies`     | List your movies             |
| `GET`    | `/movies/:id` | Get one movie                |
| `POST`   | `/movies`     | Create a movie               |
| `PUT`    | `/movies/:id` | Replace a movie's fields     |
| `DELETE` | `/movies/:id` | Delete a movie               |

**Movie body** (for `POST` and `PUT`):

```json
{
  "title": "The Matrix",
  "overview": "A computer hacker learns about the true nature of reality.",
  "releaseYear": 1999,
  "genres": ["Action", "Sci-Fi"],
  "runtime": 136,
  "posterUrl": "https://example.com/matrix.jpg"
}
```

| Field         | Type       | Rules                          |
| ------------- | ---------- | ------------------------------ |
| `title`       | string     | Required, 1–50 characters      |
| `overview`    | string     | Optional, nullable, max 500    |
| `releaseYear` | integer    | Required                       |
| `genres`      | string[]   | Required (may be empty)        |
| `runtime`     | integer    | Optional (minutes)             |
| `posterUrl`   | string     | Optional, must be a valid URL  |

### Watchlist 🔒

| Method   | Endpoint         | Description                                   |
| -------- | ---------------- | --------------------------------------------- |
| `GET`    | `/watchlist`     | List your watchlist items                     |
| `GET`    | `/watchlist/:id` | Get one watchlist item                        |
| `POST`   | `/watchlist`     | Add a movie to your watchlist                 |
| `PUT`    | `/watchlist/:id` | Update an item's status, rating, or notes     |
| `DELETE` | `/watchlist/:id` | Remove an item from your watchlist            |

**Add to watchlist:** `POST /watchlist`

```json
{ "movieId": "<movie-uuid>", "status": "PLANNED", "rating": 8, "notes": "Rewatch" }
```

| Field     | Type    | Rules                                                                |
| --------- | ------- | -------------------------------------------------------------------- |
| `movieId` | UUID    | Required on `POST`; cannot be changed with `PUT`                     |
| `status`  | enum    | Optional: `PLANNED` (default), `WATCHING`, `COMPLETED`, or `DROPPED` |
| `rating`  | integer | Optional, 1–10                                                       |
| `notes`   | string  | Optional                                                             |

A movie can be on a user's watchlist only once. Adding it a second time
returns `409`, and an unknown `movieId` returns `404`.

### Status Codes

| Code  | Meaning                                                                 |
| ----- | ----------------------------------------------------------------------- |
| `200` | OK                                                                      |
| `201` | Created                                                                 |
| `400` | Validation failed (bad body, or an `:id` that is not a UUID)            |
| `401` | Missing, invalid, or expired token, or wrong credentials                |
| `403` | The resource belongs to another user                                    |
| `404` | Resource not found                                                      |
| `409` | Conflict (email already registered, or movie already on the watchlist)  |
| `500` | Internal server error                                                   |

### Example with curl

```bash
# Register and save the auth cookie
curl -c cookies.txt -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","password":"secret123"}'

# Create a movie using the saved cookie
curl -b cookies.txt -X POST http://localhost:5001/movies \
  -H "Content-Type: application/json" \
  -d '{"title":"Inception","releaseYear":2010,"genres":["Sci-Fi"]}'

# List your watchlist
curl -b cookies.txt http://localhost:5001/watchlist
```

## Data Model

```text
User 1 ──< Movie            (createdBy → User.id, cascade delete)
User 1 ──< WatchListItem    (userId → User.id, cascade delete)
Movie 1 ──< WatchListItem   (movieId → Movie.id, cascade delete)
```

- **User**: `id`, `name`, `email` (unique), `password` (hashed), `createdAt`
- **Movie**: `id`, `title`, `overview?`, `releaseYear`, `genres[]`,
  `runtime?`, `posterUrl?`, `createdBy`, `createdAt`
- **WatchListItem**: `id`, `userId`, `movieId`, `status`, `rating?`, `notes?`,
  `createdAt`, `updatedAt`. The pair (`userId`, `movieId`) is unique.

Deleting a user also deletes their movies and watchlist items. Deleting a movie
removes it from every watchlist.

## Testing

```bash
pnpm test          # watch mode
pnpm test --run    # single run (e.g. for CI)
```

The tests in `tests/` call the real Express app through Supertest. Prisma is
replaced by a deep mock from `vitest-mock-extended`, so **no database is
needed**. `vitest.config.ts` provides the test environment variables. The suite
covers success paths, validation failures, authentication and ownership checks,
and Prisma error mapping for every route.

## License

ISC
