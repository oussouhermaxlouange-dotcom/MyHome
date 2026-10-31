# Repository Guidelines

## Project Structure & Module Organization

MyHome’s active web client is in `frontend/src/` (React, TypeScript, Vite); pages, components, contexts, hooks, API helpers, and types are grouped by purpose. The FastAPI application lives in `backend/app/`, with API tests in `backend/tests/` and uploaded files under `backend/uploads/`. UML diagrams are in `docs/uml/`; visual references are in `docs/maquettes/`. `mobile/`, `database/`, and `backend/src/` contain separate or legacy project material; keep changes scoped to the relevant module. Do not commit generated output such as `frontend/dist/`, `node_modules/`, or local database files.

## Backend & Data Model

The API uses FastAPI and SQLAlchemy 2. SQLite is the default database; PostgreSQL can be selected with `DATABASE_URL`. Physical tables retain compatibility names `users`, `apartments`, and `favorites`; normalized tables include `quartiers`, `photos_logement`, `conversations`, and `messages`. Persisted account roles are `tenant`, `landlord`, and `admin`; visitors are anonymous. Protect role-specific endpoints with `RequireRole` and verify conversation or listing ownership before reading or changing records.

## Build, Test, and Development Commands

- `cd frontend && npm install`: install dependencies.
- `cd frontend && npm run dev`: start the Vite development server.
- `cd frontend && npm run lint`: run ESLint; `npm run build` creates the production bundle.
- `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements-dev.txt`: prepare the API and test environment.
- `cd backend && uvicorn app.main:app --reload`: run the API locally; inspect `/docs` and `/health`.
- `cd backend && pytest`: run API tests against the test database configured by `backend/tests/conftest.py`.

## Coding Style & Testing

Follow surrounding patterns: four spaces and snake_case for Python; PascalCase React components and camelCase TypeScript values. Keep Pydantic schemas, API payloads, and frontend types aligned. Name backend tests `test_*.py`; cover successful requests, role denials, and invalid input for changed endpoints. Run the relevant backend tests and frontend lint/build before submitting changes.

## Pull Requests & Configuration

Git history is unavailable in this checkout, so use short imperative commit subjects (for example, `backend: protect conversation endpoints`). PRs should explain behavior changes, link related issues, list validation commands and results, and include screenshots for visible UI changes. Use `backend/.env.example` as the configuration reference; keep secrets out of source control and set a private production `JWT_SECRET`. Keep PlantUML files in `docs/uml/` synchronized with schema or route changes.
