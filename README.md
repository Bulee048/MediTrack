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

The root launcher starts both official services, chooses the isolated `meditrack_demo` database, sets matching API/CORS origins and fails clearly if a port is occupied. Ctrl+C stops its child services. This development launcher defaults `TEST_DNS_SERVERS` to `8.8.8.8,1.1.1.1` for Atlas discovery and an OS lookup fallback; set it explicitly to your preferred resolvers. Production initialization keeps the system resolver and never enables that fallback.

- Patient: http://localhost:5184/login
- Staff: http://localhost:5184/staff/login
- Health: http://localhost:5004/api/health

Open both portals in separate tabs. Patient and staff tokens use separate storage keys on the same origin. Different staff accounts still need separate browser profiles when used simultaneously. Optional `DEMO_CLIENT_PORT` / `DEMO_API_PORT` override ports. Browser auto-opening is unnecessary.

## Development data

The development seed is opt-in, production-refused and restricted to `meditrack_demo`:

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
npm --prefix server run typecheck
npm --prefix server run build
```

For Atlas integration suites, explicitly set `RUN_ATLAS_TESTS=true` and `MONGODB_DB_NAME=meditrack_demo`, then run:

```sh
npm --prefix server run test:appointments
npm --prefix server run test:patient-app
npm --prefix server run test:reminders
npm --prefix server run test:staff-settings
npm --prefix server run test:demo-seed
```

Run these sequentially. API suites create scoped disposable fixtures and clean them in `finally`; seed verification checks existing demo records without deleting them. `TEST_DNS_SERVERS` optionally selects comma-separated resolvers for Atlas SRV resolution when your system resolver fails. No production database should be used for tests.

## Staff workflow and permissions

Dashboard, dated appointments, queue board/detail controls, walk-in registration, patient lookup, doctor roster/schedules, analytics and persisted account settings run in `client/`. Register or locate a patient, book an actual available slot, then check in on the appointment day. Call Next selects a waiting ticket; only CALLING can start consultation and only IN_CONSULTATION can complete. Hold and skip reject terminal states. Waiting positions are recalculated; ticket numbers stay stable.

PATIENT owns its appointments, family records, notifications and queue. STAFF and ADMIN can operate OPD appointments/queues and doctor schedules. ADMIN alone manages team accounts. Receptionist/doctor labels describe responsibilities; they currently share STAFF permissions. Administrator accounts are protected from the team edit endpoint. Deactivation rejects existing tokens on subsequent requests.

Staff profile/preferences are `/api/staff/profile` and `/api/staff/preferences`. Team management is `/api/staff/team` and `/api/staff/team/:id`; server authorization and strict payload validation apply. No password hashes are returned.

In-app notifications and reminders persist in the backend. Queue refresh is polling, not server push. SMS/email delivery, automatic calling, clinical record editing and OTP delivery consoles are not implemented; the UI does not simulate them. Analytics uses recorded daily counts, not inferred growth.

## Troubleshooting

- Connection refused: wait for both launcher readiness messages and check the health URL.
- Port occupied: stop that known service or choose explicit alternate ports; the launcher does not kill unrelated processes.
- Atlas connection fails: check credentials, network allow-list and SRV DNS. Optional DNS override is read by test scripts and server initialization.
- Session expired/inactive: sign in again; signing into one portal does not authenticate the other.
- No available slots: choose another real schedule. Schedule edits cannot remove booked slots or reduce capacity below reservations; overlapping intervals are rejected.
- 409 conflicts: refresh the data and follow the valid queue or booking lifecycle.

Original staff reference preservation: `origin/feature/staff-opd`, commit `f943d3a`, under `docs/staff-reference/`. The original `app/` files are unchanged. Patient module history is preserved through the verified develop ancestry on `integration/full-app`.
