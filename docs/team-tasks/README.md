# MediTrack Team Development Guide

> **IMPORTANT PROJECT STRUCTURE**
> - `client/`: Official frontend codebase
> - `server/`: Official backend codebase
> - `docs/`: Project documentation and team task specs
> - `app/`: **READ-ONLY** reference code. **NEVER modify, edit, or commit anything inside `app/`**.

---

## 🚨 CRITICAL MAIN BRANCH RULE

Every team member must strictly follow this rule:

**NEVER:**
- Develop directly on `main`
- Edit project files while on `main`
- Stage changes on `main`
- Commit to `main`
- Push to `main`
- Merge into `main`
- Rebase `main`
- Reset `main`
- Amend `main` commits
- Force-push `main`
- Delete `main`

Only the repository integrator, **Dulmin**, will decide when reviewed code is promoted toward `main`.

Every developer must work:
```
develop -> assigned feature branch
```

Before editing any source file, **ALWAYS** check your current branch:
```bash
git branch --show-current
```

If your current branch is `main`: **STOP IMMEDIATELY**. Do not edit, stage, commit, or push.

---

## Current Backend Status

The official backend (`server/`) already includes:
- MongoDB Atlas live database connection
- Mongoose domain models (`User`, `Department`, `Doctor`, `Appointment`, `QueueTicket`, `FamilyMember`, `Notification`, `QueueCounter`)
- JWT authentication (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`)
- Patient registration & login validation
- Role authorization middleware (`PATIENT`, `STAFF`, `ADMIN`)
- Department APIs (`GET /api/departments`, `GET /api/departments/:id`, `POST /api/departments`, `PATCH /api/departments/:id`, `DELETE /api/departments/:id`)
- Doctor APIs (`GET /api/doctors`, `GET /api/doctors/:id`, `GET /api/doctors/:id/availability`, `POST /api/doctors`, `PATCH /api/doctors/:id`, `PATCH /api/doctors/:id/availability`)

---

## Technology Stack

### Frontend (`client/`)
- **Core**: React, TypeScript, Vite
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Routing**: React Router v7
- **HTTP Client & Server State**: Axios, TanStack Query (React Query)
- **Forms & Validation**: React Hook Form, Zod
- **Icons & Charts**: Lucide React, Recharts

### Backend (`server/`)
- **Core**: Node.js, Express, TypeScript
- **Database & ODM**: MongoDB Atlas, Mongoose
- **Auth & Security**: JWT, bcryptjs, Helmet, CORS
- **Validation**: Zod
- **Architecture**: `routes` $\rightarrow$ `controllers` $\rightarrow$ `services` $\rightarrow$ `models`

---

## Shared Developer Workflow

1. Switch to `develop`:
   ```bash
   git checkout develop
   ```
2. Pull latest changes:
   ```bash
   git pull origin develop
   ```
3. Create your assigned feature branch:
   ```bash
   git checkout -b <your-feature-branch>
   ```
4. Verify your active branch:
   ```bash
   git branch --show-current
   ```
5. Work **ONLY** inside your assigned module scope.
6. Before requesting review, run typecheck & build:
   - Frontend: `cd client && npm run typecheck && npm run build`
   - Backend: `cd server && npm run typecheck && npm run build`
7. Report your work and build verification results.
8. Do not commit or push automatically unless Dulmin approves.

---

## Core Guidelines

- **Never edit `app/`**: Treat `app/` as read-only reference documentation.
- **Never commit `.env`**: Environment files contain secrets and must remain untracked.
- **Never expose secrets**: Never hardcode API keys, passwords, or JWT secrets.
- **Never work on `main`**: Always use your assigned feature branch off `develop`.
- **Module Isolation**: Do not edit files inside another team member's module.
- **No Unsanctioned Endpoints**: Do not invent fake backend routes. If an endpoint is missing, create typed service interfaces with isolated mock fallbacks.
- **Shared File Caution**: Avoid editing global shared files (e.g. `client/src/App.tsx`, global routes) unless necessary. Report any shared-file changes clearly.
