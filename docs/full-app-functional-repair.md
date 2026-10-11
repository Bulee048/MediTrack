# MediTrack functional demo

## Baseline and boundaries

Repair branch: `codex/full-app-repair`, based on the verified `integration/patient-app` merge `3e16488`. No newer `integration/full-app` exists; the available staff branch is already an ancestor and contains no official staff UI. The reference `app/web/` remains read-only. Existing user document deletions are excluded from this checkpoint.

## Startup

Install existing dependencies with `npm ci --prefix server` and `npm ci --prefix client`. Configure the existing ignored `server/.env` locally with `MONGODB_URI`, `JWT_SECRET`, and optional `JWT_EXPIRES_IN`. Never share or commit that file.

From the repository root, run `npm run dev`.

- Patient: http://localhost:5184/login
- Staff/admin: http://localhost:5184/staff/login
- Health: http://localhost:5004/api/health

The root launcher verifies ports are free, starts the official client/backend, sets `MONGODB_DB_NAME=meditrack_demo`, and injects the matching API URL/CORS origin. Override ports with `DEMO_API_PORT` and `DEMO_CLIENT_PORT`. The original per-project commands remain supported. Patient and staff tokens use separate storage keys, so simultaneous tabs do not overwrite each other's login.

## Explicit isolated demo seeding

The Atlas connection uses the existing local URI but overrides its database name to **meditrack_demo**. No existing URI database is seeded. Production mode is refused. A target containing unrelated data without this seed's ownership manifest is refused.

PowerShell, from the repository root:

```powershell
$env:NODE_ENV='development'
$env:DEMO_ENV='true'
$env:MONGODB_DB_NAME='meditrack_demo'
npm run seed:demo
```

`TEST_DNS_SERVERS` is optional for environments needing explicit SRV resolvers. The seed uses stable fictional ownership IDs and a manifest, and refuses an incomplete seed rather than silently overwriting it. Completed reruns preserve users, doctors, appointments, queues and capacities exactly. A versioned completion step adds historical and waiting fixtures to an earlier same-day seed, preserving existing records and credentials.

The initial dataset contains eight departments, sixteen fictional doctors, ten fictional patients, four fictional staff, one fictional admin, four family members, **22 appointments**, and nine queue tickets. Future schedules cover the next fourteen days. Later browser verification adds separate demonstration bookings; these are not claimed as initial seed records. Reset explicitly when refreshing an expired dated scenario.

Future/current bookings, family bookings, cancellation, rescheduling, check-in and queue transitions use the real services. One historical completed appointment is imported with its matching occupied historical doctor slot; it is not booked retroactively through the patient API. Queue scenarios include WAITING, ALMOST_TURN, CALLING, IN_CONSULTATION, HELD, SKIPPED and COMPLETED. Notifications come from the actual appointment and queue services.

## Credentials

Generated development-only passwords are available locally in `server/.demo/credentials.json`. The entire `.demo/` directory is ignored by Git. The file contains distinct patient/staff/admin accounts and is not imported into client code or bundles. The database stores bcrypt hashes only. Retrieve the file locally; do not paste it into reports, commits or public screenshots. Passwords cannot be recovered from their hashes; an explicitly confirmed reset followed by seeding regenerates credentials. A manual browser walk-in verification account is recorded separately in the ignored `server/.demo/browser-walk-in.json`.

## Reset safety

```powershell
$env:DEMO_RESET_CONFIRM='meditrack_demo:fictional-only'
npm run seed:demo:reset
Remove-Item Env:DEMO_RESET_CONFIRM
npm run seed:demo
```

Reset requires both explicit demo configuration and the exact confirmation value. It removes only manifest-owned accounts, departments/doctors and records owned by those fictional accounts, including their later demo bookings. It preserves unrelated accounts and refuses to orphan unrelated appointments or doctors referencing seeded entities. It never drops the database, collections or indexes. Stop the demo server while resetting. Unconfirmed reset and production/missing-opt-in seed refusal are integration-tested without deleting records.

## Patient and staff workflow

Login as a fictional patient. Browse Department → Doctor → Date → Available Slot → Review → Confirm. Confirmation follows MongoDB persistence. Manage owned appointments through Visits; supported family/profile changes use authenticated APIs. Payment, refunds, insurance/medical history editing and translation remain explicitly unavailable where unsupported by the existing backend.

Open the staff portal in another tab and authenticate with a distinct staff account. Find the patient's appointment. **Check-in is allowed only on the appointment day in Asia/Colombo**; future appointments cannot be checked in early. For same-session queue demonstrations, use a valid same-day appointment. Select its doctor, Call Next, observe the patient's CALLING state and notification, Start consultation, then Complete. Refresh both portals to verify persisted completion.

Staff walk-in registration creates a real patient account using a patient-chosen password, then booking and check-in are separately confirmed operations. Existing patients are found through the staff-only search endpoint. Schedule edits load the doctor's real slots and preserve booked counts. Removing/moving occupied slots or reducing capacity below reservations returns 409. Admin-only department deactivation rejects STAFF.

## Notifications, preferences and reminders

Account-backed preferences: in-app alerts, queue alerts, promotional email opt-in, reminder enablement and offset. Device-local preferences: text size, high contrast, reduced motion and extra page-title announcements. Language translation remains unavailable.

True browser push is unavailable: there is no push delivery provider/service worker/subscription system. In-app alert polling runs every 15 seconds and deduplicates observed IDs. Disabling optional alerts does not stop authoritative queue synchronization or remove notification records. Promotional email opt-in is saved, but no mail provider is configured and no promotional email is sent.

The backend reminder worker runs on startup and every 30 seconds. Jobs persist in MongoDB with due time, appointment time, user, delivery state and a unique key per appointment/time/offset. Offsets are 30 minutes, one hour and one day, using Asia/Colombo appointment times. A transaction serializes delivery with appointment/preference changes and records both the notification and DELIVERED state. Cancellation, rescheduling, disabled reminders and past appointments are revalidated before delivery. New messages use the existing notification model/category `APPOINTMENT_REMINDER`, not a duplicate notification system.

Reminders appear in Notifications even while the portal is closed. The live toast is optional while a signed-in portal is open. Read-one/read-all and category filters use the existing ownership-protected API.

## Accessibility

Text size is applied through rem units and persisted immediately. Contrast uses darker semantic colors, readable form controls and dialog boundaries, without forcing dark text onto dark buttons. Device reduced-motion and OS reduced-motion preferences suppress nonessential motion. Basic headings, labels, errors, native dialog focus/keyboard handling and navigation focus remain active. The optional extra-announcement setting announces each page heading after asynchronous content loads; it does not enable or disable baseline accessibility. No claim of universal screen-reader compatibility is made.

## Functionality checklist

| Area | Supported real behavior |
| --- | --- |
| Authentication | Patient/staff/admin login, role guards, independently stored portal sessions |
| Directory/booking | Real departments, doctors, dated capacity slots, persisted confirmation |
| Appointments | Owned listing/details, cancellation, rescheduling, history and conflict feedback |
| Family/profile | Owned family CRUD/booking and supported profile edits |
| Staff | Search, registration, booking, valid check-in, call/start/hold/skip/complete |
| Schedules | Real slot updates, booked-capacity/removal conflict guards |
| Notifications | Real event generation, ownership, read-one/read-all, filters, polling |
| Settings | Server preferences, local accessibility, explicit unsupported delivery/translation |
| Reminders | Persisted scheduling, transaction delivery, cancellation/reschedule/past guards |
| Seed | Isolated target, fictional ownership, bcrypt, idempotency, guarded reset |

## Verification commands

Client: `npm --prefix client run typecheck`, `npm --prefix client run build`, `npm --prefix client run test:appointments`.

Server: `npm --prefix server run typecheck`, `npm --prefix server run build`, `npx --prefix server tsc --project server/tsconfig.seed.json`.

For Atlas integration suites, set `RUN_ATLAS_TESTS=true`, `MONGODB_DB_NAME=meditrack_demo`, `NODE_ENV=test`; then run from `server/`: `npm run test:appointments`, `npm run test:patient-app`, `npm run test:reminders`, `npm run test:staff-settings`, `npm run test:demo-seed`. Tests create scoped fictional fixtures and clean up only their own records. Controlled reminder clocks are scoped to the fixture user so they cannot advance other demo users' jobs.

### Recorded results

- 43 appointment API/Atlas checks passed, including full-slot conflicts, ownership and concurrent booking/reschedule/cancel behavior.
- 86 patient application API/Atlas checks passed, including date-scoped serving, queue transitions, ownership and notification deduplication.
- 14 reminder checks passed, including due timing, persisted delivery, rescheduling, cancellation, disabled reminders and past appointments.
- 23 staff/settings checks passed, including walk-in login, cross-portal workflow, preference persistence, role denials and schedule safeguards.
- Seed verification passed: account/doctor counts, all seven queue states, exact rerun preservation, refusal safeguards, capacity and ownership relationships.
- 11 client tests passed, including accessibility persistence and independent patient/staff sessions.
- Final client/server typechecks and builds, seed-script typecheck, and whitespace checks passed. Vite reports a non-fatal 750 KB bundle-size warning.

## Browser and startup verification

Real seeded patient/staff logins, future booking, cancellation, rescheduling, family creation/booking, staff registration and doctor schedule edits passed. The staff-created 17:00 slot on October 13 was visible and bookable for the fictional family member; confirmation persisted after refresh. A same-day staff booking progressed through check-in, CALLING, IN_CONSULTATION and COMPLETED, visible in the patient portal after refresh. Future appointments remain ineligible for early check-in. Notification filters, read-one/read-all and refresh persistence passed. Settings retained Large text, contrast, reduced motion, extra announcements, email opt-in and 30-minute reminder offset after refresh and a real relogin. Mobile queue at 390 pixels had no horizontal overflow; staff was checked at 375 pixels. No fatal JavaScript console errors or blank screens were observed.

Cross-portal testing used independently authenticated patient/staff tabs in the available in-app browser. A second physical browser context and assistive-technology hardware were not available, so no claim is made for those checks. Root `npm run dev` was stopped and restarted successfully against Atlas meditrack_demo; local URLs above were verified. System SRV DNS initially refused queries; explicit TEST_DNS_SERVERS resolved the Atlas test connection and all suites passed on rerun.

## Exact checkpoint file manifest

The following implementation/test/documentation files belong to this repair. The five pre-existing deleted documents are deliberately excluded. No app/, .env, credentials, tokens or generated bundles are included.

- `.gitignore`
- `client/src/App.tsx`
- `client/src/components/layout/PatientShell.tsx`
- `client/src/features/accessibility/SettingsAccessibility.tsx`
- `client/src/features/accessibility/api/accessibilityApi.ts`
- `client/src/features/accessibility/context/AccessibilityContext.tsx`
- `client/src/features/auth/AuthShell.tsx`
- `client/src/features/auth/LoginScreen.tsx`
- `client/src/features/auth/auth.service.ts`
- `client/src/features/auth/auth.storage.ts`
- `client/src/features/notifications/NotificationsList.tsx`
- `client/src/index.css`
- `client/src/services/notificationApi.ts`
- `client/tests/appointment.test.mjs`
- `server/package.json`
- `server/src/config/database.ts`
- `server/src/config/env.ts`
- `server/src/controllers/queue.controller.ts`
- `server/src/models/Notification.ts`
- `server/src/models/User.ts`
- `server/src/routes/index.ts`
- `server/src/routes/queue.routes.ts`
- `server/src/server.ts`
- `server/src/services/doctor.service.ts`
- `server/src/validators/doctor.validator.ts`
- `server/tests/appointment.integration.ts`
- `server/tests/patient-app.integration.ts`
- `client/src/features/notifications/InAppAlerts.tsx`
- `client/src/features/staff/StaffDashboard.tsx`
- `client/src/features/staff/StaffTools.tsx`
- `client/src/services/preferencesApi.ts`
- `docs/full-app-functional-repair.md`
- `package.json`
- `scripts/dev.mjs`
- `server/scripts/seed-demo.ts`
- `server/src/controllers/preferences.controller.ts`
- `server/src/controllers/staff.controller.ts`
- `server/src/models/AppointmentReminder.ts`
- `server/src/routes/preferences.routes.ts`
- `server/src/routes/staff.routes.ts`
- `server/src/services/preferences.service.ts`
- `server/src/services/reminder.service.ts`
- `server/tests/demo-seed.integration.ts`
- `server/tests/reminder.integration.ts`
- `server/tests/staff-settings.integration.ts`
- `server/tsconfig.seed.json`
