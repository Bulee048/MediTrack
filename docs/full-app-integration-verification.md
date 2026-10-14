# Full application integration verification

Branch: `integration/full-app`. Reviewed and tested on 11 October 2026.

## Preservation and architecture

The verified develop baseline (`53802b3`) remains in the integration ancestry. Patient authentication, booking, appointments, family, profile, accessibility, queue and notification modules are retained. Only staff routing was expanded in App.tsx. Main and develop were not checked out or modified.

The original ignored reference staff source was found under app/web and preserved unchanged as 21 archive files on feature/staff-opd, commit f943d3a. The reference code was not present in the original tracked staff checkpoint 9ca07dd. The user identifies this as Peiris's work; Git does not independently establish authorship of the previously ignored files. app/ remains read-only and ignored.

Staff views now use official services for dashboard, dated appointment table, queue board/detail/controls, walk-in registration and booking, patient lookup, doctor roster/schedule editing, daily analytics, persisted profile/preferences and administrator team management. Shared permissions are PATIENT/STAFF/ADMIN; receptionist/doctor responsibility labels do not create separate clinical privileges.

## Automated evidence

- Client typecheck and production build passed.
- Client appointment unit suite: 11 passed.
- Client staff component suite: 3 passed using the actual rendered shell.
- Client lint: no errors; Fast Refresh warnings remain.
- Server typecheck and production build passed.
- Real Atlas appointment integration: 43 assertions passed.
- Real Atlas patient application integration: 90 assertions passed.
- Real Atlas persistent reminder integration: 14 assertions passed.
- Real Atlas staff/settings/security integration: 51 assertions passed.
- Isolated seed verification: 7 groups passed.

Tests exercise ownership rejection, role injection, revoked access, team authorization, response redaction, valid queue transitions, date scoping, live waiting positions, stable tickets, notification deduplication, family identity, cancellation capacity release, duplicate check-in, final-slot concurrency and concurrent public/walk-in registration. Scoped API fixtures are removed in finally blocks.

## Real browser journeys

Both official portals were open simultaneously against the same backend and Atlas database, with separate patient/staff token keys. Patient login, department/doctor/date/slot selection, booking confirmation, appointments and queue were exercised. Staff check-in, call-next, start consultation and completion propagated to the patient queue and persisted across reloads. Waiting position one did not display Your Turn; CALLING did.

Caregiver creation and booking, rescheduling to another real slot and cancellation were confirmed. The staff table showed the caregiver separately from the account owner, with the rescheduled time and final CANCELLED status. Real notifications were listed and mark-all-read remained read after reload. Own patient profile editing and local high-contrast persistence were checked.

Staff patient search, walk-in registration and actual booking, schedule capacity editing, saved refresh preferences and admin-only team presentation were exercised. Ordinary staff access to team management was rejected. Staff mobile navigation and analytics were checked at 390x844 with no horizontal document overflow. Current recovered browser tabs returned no error console entries. Earlier tool-host/DNS failures were diagnosed and resolved rather than counted as successful checks.

## Boundaries

Reference hierarchy, sidebar, cards and route structure are adapted to the real API rather than copying reference mock behavior. In-app notifications/reminders are real; SMS/email delivery, automatic calling, clinical notes, OTP delivery consoles and language translation are explicitly unavailable. Browser testing used simultaneous tabs, not separate physical browser profiles. Accessibility verification covers semantic labels, skip links, controls and preferences; it is not a formal WCAG certification. Production bundle size and Fast Refresh warnings remain non-fatal.

The root development launcher uses only meditrack_demo, matching CORS/API origins and configurable development DNS resolvers, retaining TLS verification. Production keeps system resolution. Secrets and credentials stay in ignored local files.

## Final operational checks

The documented root `npm run dev` command was restarted without a manually supplied DNS override. Both official services became ready and Atlas connected successfully. Browser fixtures were removed and verified at zero remaining users, appointments, queue tickets, notifications, reminders, family records, doctors, departments and queue counters. The temporary browser fixture script and its ignored manifest were removed. Automated test HTTP servers closed after their suites. The intended root development services remain available for review.

A staff-booked disposable patient was checked in and put on HELD through the browser; its stable ticket remained visible with no active waiting position or further invalid transition buttons. Patient accessibility preferences were restored to their original high-contrast setting after verification.
