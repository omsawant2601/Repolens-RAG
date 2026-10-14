# Local development setup

This guide starts RepoLens locally on Windows using PowerShell. The same application can also be run on macOS or Linux with equivalent shell commands.

## Prerequisites

- Git
- Java 21
- Node.js 20.9 or later and npm
- Docker Desktop with Docker Compose
- A GitHub OAuth App
- A Google AI Studio API key

## 1. Clone the repository

```powershell
git clone https://github.com/omsawant2601/Repolens-RAG.git
Set-Location .\Repolens-RAG
```

## 2. Configure GitHub OAuth

Create a GitHub OAuth App in your GitHub Developer settings. Set its **Authorization callback URL** to:

```text
http://localhost:8081/login/oauth2/code/github
```

Keep the app's client ID and client secret for the backend configuration below. Do not commit credentials.

## 3. Configure the backend

The backend imports `backend/.env` as a Java properties file. Create it from PowerShell:

```powershell
@'
DATASOURCE_PASSWORD=postgres
GENAI_API_KEY=replace-with-your-google-ai-studio-api-key
GITHUB_CLIENT_ID=replace-with-your-github-oauth-client-id
GITHUB_CLIENT_SECRET=replace-with-your-github-oauth-client-secret
ENCRYPTOR_SALT=replace-with-16-hex-characters
app.token-encryptor-password=replace-with-a-long-random-password
'@ | Set-Content -Path .\backend\.env
```

Replace all placeholder values. Generate a private random encryption password and a unique 16-character hexadecimal salt; keep both stable for the lifetime of the installation because they protect stored OAuth tokens. The default database password shown above matches the local Docker Compose default. If you choose another database password, set the same `DATASOURCE_PASSWORD` in `backend/.env` and in a root-level `.env` file so Spring Boot and Docker Compose use the same value.

Optional backend settings can be added to `backend/.env`:

```properties
DATABASE_URL=jdbc:postgresql://localhost:5433/repolens_db
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

The defaults shown are suitable for local development.

## 4. Start PostgreSQL

From the repository root:

```powershell
docker compose up -d postgres
```

The Compose service exposes PostgreSQL on `localhost:5433` and creates the `repolens_db` database. The backend initializes the pgvector schema when it starts.

## 5. Start the backend

Open a terminal in the repository root and run:

```powershell
Set-Location .\backend
.\mvnw.cmd spring-boot:run
```

The API starts at `http://localhost:8081`.

## 6. Start the frontend

Open another terminal in the repository root:

```powershell
Set-Location .\client
npm ci
npm run dev
```

The frontend starts at `http://localhost:3000`. The API base URL defaults to `http://localhost:8081`; to change it, create `client/.env.local` with:

```properties
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

Open [http://localhost:3000](http://localhost:3000), sign in with GitHub, sync repositories, and start indexing a repository before chatting with its code.

## Useful commands

Run the frontend linter:

```powershell
Set-Location .\client
npm run lint
```

Run backend tests:

```powershell
Set-Location .\backend
.\mvnw.cmd test
```

Stop the local database:

```powershell
Set-Location <path-to-repository>
docker compose down
```

To remove the local database and all its stored data, use `docker compose down -v` instead. This permanently deletes the Compose database volume.

## Troubleshooting

- **GitHub sign-in fails:** Confirm the OAuth callback URL is exactly `http://localhost:8081/login/oauth2/code/github` and the client ID and secret are valid.
- **Backend cannot connect to PostgreSQL:** Check that the `postgres` Compose service is healthy, port `5433` is available, and the backend's `DATASOURCE_PASSWORD` matches the Compose `POSTGRES_PASSWORD` (which defaults to `postgres`).
- **AI indexing or chat fails:** Verify `GENAI_API_KEY` and check that the Google AI Studio API key is active.
- **Frontend cannot reach the API:** Check the backend is running on port `8081` and, if configured, `NEXT_PUBLIC_API_BASE_URL` points to it.
- **OAuth token decryption fails after restarting:** Use the same encryption password and salt that were configured when the token was stored.

Do not commit `.env` or `.env.local` files, API keys, OAuth credentials, or encryption keys.
