# MediTrack — OPD appointments and live queues

React/TypeScript patient and staff portals share one Express/Mongoose backend. Hospital dates use Asia/Colombo. The official application is in `client/` and `server/`; ignored `app/web/` is a read-only UI reference.

## Prerequisites and installation

Use Node.js 22 or later, npm, and a MongoDB Atlas replica-set deployment (transactions are required). Allow your development machine in Atlas Network Access and create a database user with access to the selected development database. Keep its URI private.

```sh
npm --prefix client ci
npm --prefix server ci
```

Create an ignored `server/.env` with these names (values must be supplied privately):

- `MONGODB_URI` — Atlas connection string.
- `JWT_SECRET` — a strong private signing secret.
- `JWT_EXPIRES_IN` — optional; defaults to `7d`.
- `PORT`, `CLIENT_URL`, `NODE_ENV` — optional for standalone backend startup.
- `MONGODB_DB_NAME` — optional isolated test database, `meditrack_demo`.

The frontend accepts optional `VITE_API_BASE_URL` when started independently. Do not commit `.env`, local account credentials, tokens or Atlas secrets.

## One-command local startup

From the repository root:

```sh
npm run dev
```

The root launcher starts both official services using the database configured in `MONGODB_URI` (the current official database is `meditrack`), sets matching API/CORS origins and fails clearly if a port is occupied. It does not seed/reset data or copy demo accounts. Ctrl+C stops its child services. This development launcher defaults `TEST_DNS_SERVERS` to `8.8.8.8,1.1.1.1` for Atlas discovery and an OS lookup fallback; set it explicitly to your preferred resolvers. Production initialization keeps the system resolver and never enables that fallback. Startup logs identify the connected database.

- Patient: http://localhost:5184/login
- Staff: http://localhost:5184/staff/login
- Health: http://localhost:5004/api/health

Open both portals in separate tabs. Patient and staff tokens use separate storage keys on the same origin. Different staff accounts still need separate browser profiles when used simultaneously. Optional `DEMO_CLIENT_PORT` / `DEMO_API_PORT` override ports. Browser auto-opening is unnecessary.

## Development data

Demo accounts and disposable test fixtures belong to the separate `meditrack_demo` database. To run against that data explicitly, use `npm run dev:demo`. Official patient/staff accounts must sign in against the official database; a demo login is not an official account. The development seed is opt-in, production-refused and restricted to `meditrack_demo`:

```sh
# Set DEMO_ENV=true and MONGODB_DB_NAME=meditrack_demo in your shell first.
npm run seed:demo
```

Accounts are saved privately under ignored `server/.demo/credentials.json`. Rerunning preserves existing records. Reset requires the seed script's explicit confirmation; do not reset shared data for verification. Production staff bootstrap must be performed by a trusted operator; public registration creates patients only.

## Verification

```sh
npm --prefix client run typecheck
npm --prefix client run build
npm --prefix client run lint
npm --prefix client run test:appointments
npm --prefix client run test:staff
npm --prefix client run test:queue
npm --prefix client run test:profile-recovery
npm --prefix client run test:queue-controls
npm --prefix server run typecheck
npm --prefix server run build
```

For Atlas integration suites, explicitly set `RUN_ATLAS_TESTS=true` and `MONGODB_DB_NAME=meditrack_demo`, then run:

```sh
npm --prefix server run test:appointments
npm --prefix server run test:patient-app
npm --prefix server run test:reminders
npm --prefix server run test:staff-settings
npm --prefix server run test:queue-audit
npm --prefix server run test:demo-seed
```

Run these sequentially. API suites create scoped disposable fixtures and clean them in `finally`; seed verification checks existing demo records without deleting them. `TEST_DNS_SERVERS` optionally selects comma-separated resolvers for Atlas SRV resolution when your system resolver fails. No production database should be used for tests.

## Staff workflow and permissions

Dashboard, dated appointments, queue board/detail controls, walk-in registration, patient lookup, doctor roster/schedules, analytics and persisted account settings run in `client/`. Register or locate a patient, book an actual available slot, then check in on the appointment day. Call Next selects a waiting ticket; only CALLING can start consultation and only IN_CONSULTATION can complete. Hold and skip reject terminal states. Waiting positions are recalculated; ticket numbers stay stable.

PATIENT owns its appointments, family records, notifications and queue. STAFF and ADMIN can operate OPD appointments/queues and doctor schedules. ADMIN alone manages team accounts. Receptionist/doctor labels describe responsibilities; they currently share STAFF permissions. Administrator accounts are protected from the team edit endpoint. Deactivation rejects existing tokens on subsequent requests.

Staff profile/preferences are `/api/staff/profile` and `/api/staff/preferences`. Team management is `/api/staff/team` and `/api/staff/team/:id`; server authorization and strict payload validation apply. No password hashes are returned.

In-app notifications and reminders persist in the backend. Queue refresh is polling, not server push. SMS/email delivery, automatic calling, clinical record editing and OTP delivery consoles are not implemented; the UI does not simulate them. Analytics uses recorded daily counts, not inferred growth.

Patient queue, notifications, appointment lists and appointment details poll every 15 seconds, including background tabs, and refetch on focus. Staff polling uses its saved 15/30/60-second preference. These intervals are scheduling intervals; network/database latency adds to the time before an update is visible.

Waiting estimates are approximate: `ceil(waiting patients ahead * 6 + remaining current service minutes)`. Only WAITING and ALMOST_TURN count as waiting. CALLING contributes six minutes; IN_CONSULTATION contributes `max(0, 6 - elapsed consultation minutes)`. Six minutes is an explicit fallback because doctors have no configured consultation duration. An overrun can reach an estimated zero while consultation remains active; zero never means the ticket is being called. Call Next permits one active called/consulting patient per doctor/day, and queue transitions, linked completion and notifications are transactional.

The follow-up audit, endpoint/control inventory and verification limits are recorded in `docs/full-app-functional-audit.md`.

## Troubleshooting

- Connection refused: wait for both launcher readiness messages and check the health URL.
- Port occupied: stop that known service or choose explicit alternate ports; the launcher does not kill unrelated processes.
- Atlas connection fails: check credentials, network allow-list and SRV DNS. Optional DNS override is read by test scripts and server initialization.
- Session expired/inactive: sign in again; signing into one portal does not authenticate the other.
- No available slots: choose another real schedule. Schedule edits cannot remove booked slots or reduce capacity below reservations; overlapping intervals are rejected.
- 409 conflicts: refresh the data and follow the valid queue or booking lifecycle.

Original staff reference preservation: `origin/feature/staff-opd`, commit `f943d3a`, under `docs/staff-reference/`. The original `app/` files are unchanged. Patient module history is preserved through the verified develop ancestry on `integration/full-app`.

Transient initial account-load failures recover automatically with 5/10/20/30-second capped backoff and immediate focus/online recovery. Authentication failures still require sign-in. Staff queue calculations share one fresh active snapshot per response instead of loading the same queue per ticket. Same-doctor/day service admission remains exclusive even after a department reassignment.

Staff queue controls require a selected doctor and today's hospital date. Use **Manage doctor queue** on a ticket to select its doctor. **Resume waiting** returns only today's HELD ticket with an active same-day appointment to its original queue order; its number stays unchanged and the patient receives a persisted update. SKIPPED/COMPLETED/CANCELLED tickets cannot be resumed. Historical queues are read-only in the staff client, with a **Show today's queue** shortcut. A live date follows Colombo midnight; deliberately selected historical/future dates remain selected. Patient live queue displays today's checked-in tickets, so book/check in today's appointment to create a current ticket.
