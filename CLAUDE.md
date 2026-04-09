# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm start` (runs `nodemon index.js`, auto-restarts on changes)
- **Production:** `npm run deploy` (runs `pm2 start index.js --name "API"`)
- **Lint:** `npm run lint` (ESLint with standard + prettier; enforces camelCase)
- **Lint fix:** `npm run lint:fix`
- **No test suite** — `npm test` is a placeholder that exits with error

A husky pre-commit hook runs `npm run lint .` on every commit.

## Architecture

### Multi-Tenant MySQL Database

The system uses a **core database** plus **per-city databases**. The `cityId` parameter controls which database a query targets:

- `services/mysql.js` — connection pool manager. `getConnection(cityId)` returns a connection to the city's database (looked up via `cities.connectionString` in the core DB) or the core database when cityId is null/0.
- `services/database.js` — legacy query helper (raw SQL builders for `get`, `create`, `update`, `deleteData`, `callQuery`, `callStoredProcedure`). Used by v1 and root-level code.
- `v2/utils/database.js` — v2's database layer, adds transaction support.

### API Versioning

Three route layers coexist, mounted in `index.js`:

1. **Root routes** (`routes/`) — legacy unversioned endpoints, active when `BRIDGE_ENABLED !== 'True'`
2. **v1** (`v1/routes/`) — mounted at `/v1`, same structure as root but self-contained
3. **v2** (`v2/routes/`) — mounted at `/v2`, adds admin, permissions, moderators, chat, and services endpoints

Version registration is in `constants/apiVersions.js`. Each version directory mirrors the same internal layout: `routes/ → controllers/ → services/ → repository/`.

### v2 Repository Pattern

v2 introduces `BaseRepo` (`v2/repository/baseRepo.js`) — a class that wraps database operations for a table name. All v2 repos extend it (e.g., `listingsRepo.js`, `userRepo.js`). Supports transactions via `createTransaction`/`commitTransaction`/`rollbackTransaction`.

### Bridge Routes

When `BRIDGE_ENABLED=True`, `bridgeRoutes/index.js` replaces all root-level routes. Bridge routes reference v2 utilities (`v2/utils/appError`). This is the active mode on the rottenburg-stage branch.

### Authentication

JWT-based with RSA key pairs (env vars `ACCESS_PRIVATE`/`ACCESS_PUBLIC`, `REFRESH_PRIVATE`/`REFRESH_PUBLIC`):
- `middlewares/authentication.js` — required auth, sets `req.userId` and `req.roleId`
- `middlewares/optionalAuthentication.js` — same but doesn't fail if no token
- Roles defined in `constants/roles.js`: Admin (1), Department Head (2), Content Creator (3)

### Translation / i18n

- `v2/middlewares/translate.js` — global middleware that sets `req.lang` and `req.t()` from `?lang=`, `x-lang` header, or `accept-language`
- Supported languages: de (default), en, ar, ru, tr (`locales/*.json`)
- DeepL integration via `DEEPL_AUTH_KEY` env var for dynamic translation

### External Services

- **Firebase** — push notifications (`services/sendPushNotification.js`), configured via `FIREBASE_PRIVATE` env var
- **Open Telekom Cloud OBS** — image/PDF storage (`utils/imageUpload.js`, `utils/imageDelete.js`), configured via `BUCKET_*` env vars
- **Sentry** — error monitoring and profiling (`instrument.js`), configured via `SENTRY_DSN`
- **Nodemailer** — email sending (`services/sendMail.js`), configured via `EMAIL_*` env vars

### Feature Flags (env vars)

- `BRIDGE_ENABLED=True` — use bridge routes instead of root routes
- `WASTE_CALENDER_ENABLED=True` — enable waste calendar endpoints
- `ENABLE_DEFECT_REPORT=True` — enable defect reporting

### Swagger Documentation

Auto-generated from `docs/` directory, served at `/api-docs` (all), `/api-docs/v1`, `/api-docs/v2`. Doc definitions are JS objects assembled in `docs/docRoot.js`.

## Code Conventions

- ESLint config: `.eslintrc.json` — standard + prettier, `camelCase` enforced on all properties
- Variable naming: camelCase everywhere (eslint `camelcase` rule with `"properties": "always"`)
- Table names: defined as constants in `constants/tableNames.js` — always reference these, never hardcode table name strings
- Error handling: throw `AppError(message, statusCode)` — caught by `utils/errorHandler.js`
- Environment config: `.env` file, see `.env.example` for all required variables
