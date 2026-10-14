# RepoLens

RepoLens is a repository-aware coding assistant for exploring and understanding codebases. Connect a GitHub account, index repositories, and ask questions in natural language. Answers are grounded in retrieved source code and include file citations to help you verify the context.

## Features

- **GitHub sign-in:** Connect with OAuth and browse repositories available to your GitHub account, including private repositories covered by the requested `repo` permission.
- **Repository workspace:** Browse, search, and filter repositories; see language, visibility, branch, and indexing status.
- **Code indexing:** Split repository source files into chunks, generate embeddings, and store searchable vectors in PostgreSQL with pgvector.
- **Repository-aware chat:** Ask questions about an indexed repository and receive streaming answers grounded in its code.
- **Source citations:** Inspect cited file paths and line references to validate an answer against the repository.
- **Indexing visibility:** Track indexing progress, processed files, chunk counts, and failures; retry failed indexing jobs.
- **Workspace overview:** See repository totals, indexing status, recently indexed repositories, and searchable chunk counts.
- **Chat history:** Keep multiple chat sessions associated with a repository and revisit previous conversations.
- **Responsive interface:** Use the dashboard and chat UI across desktop and smaller screens, with light and dark themes.

## Why RepoLens?

- **Understand unfamiliar code faster.** Ask questions in plain language instead of manually locating every relevant file.
- **Keep answers tied to source.** Citations make it easier to inspect the code behind an answer and judge whether it applies.
- **Work repo by repo.** Indexing and conversations are organized around individual repositories, giving questions a codebase-specific context.
- **See what is happening.** Repository and indexing status help show which codebases are ready to chat with and which need attention.
- **Use your existing GitHub workflow.** Sign in with GitHub and choose from repositories accessible to your account rather than uploading code manually.

RepoLens is an aid for navigating code, not a replacement for reviewing source, tests, or security-sensitive changes. Always verify generated answers against the cited files.

## How it works

1. Sign in using GitHub OAuth.
2. Sync and select a repository from the dashboard.
3. Start indexing. RepoLens processes source files, creates code chunks and embeddings, and stores them in PostgreSQL with pgvector.
4. Open the repository chat and ask a question.
5. RepoLens retrieves relevant indexed code and streams a response with citations.

## Technology

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Java 21, Spring Boot, Spring Security
- **Database:** PostgreSQL 16 with pgvector
- **AI and embeddings:** Google Gemini via the Google GenAI API

## Architecture at a glance

```text
Browser
  └── Next.js frontend (port 3000)
        └── Spring Boot API (port 8081)
              ├── GitHub OAuth and repository API
              ├── Google Gemini chat and embedding APIs
              └── PostgreSQL + pgvector
```

The frontend calls the backend API. The backend handles GitHub authentication, repository synchronization, indexing, chat sessions, and retrieval. PostgreSQL stores application data and vector embeddings used to find relevant code.

## Getting started

See [setup.md](./setup.md) for prerequisites, credentials, and local development instructions.

Local development requires Java 21, Node.js and npm, Docker, GitHub OAuth credentials, and a Google AI Studio API key. Start PostgreSQL with pgvector, then run the backend on port `8081` and frontend on port `3000`.

## Configuration

The backend needs GitHub OAuth client credentials, a Google AI Studio API key, a database password, and token-encryption settings. The frontend optionally accepts `NEXT_PUBLIC_API_BASE_URL` to point to a non-default backend URL.

See [setup.md](./setup.md) for the full configuration steps. Keep credentials and encryption keys out of source control; do not commit `.env` or `.env.local` files.

## Project structure

```text
backend/    Spring Boot API and repository indexing/chat services
client/     Next.js web application
docker-compose.yml  Local PostgreSQL database with pgvector
setup.md    Local development setup
```

## Development

Run the frontend linter:

```powershell
cd client
npm run lint
```

Run backend tests:

```powershell
cd backend
.\mvnw.cmd test
```

## License

No license is currently specified. All rights are reserved unless a license is added to this repository.
