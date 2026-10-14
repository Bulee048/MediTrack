# Official application functional audit

The earlier audit below is retained as historical evidence. The **Completion follow-up** at the end contains the current results and supersedes the earlier readiness classification.

Audit continued on 12 October 2026, Asia/Colombo. Repository: MediTrack; origin: https://github.com/Bulee048/MediTrack.git; branch: `integration/full-app`; starting and ending HEAD: `d751811`. This report distinguishes actual API/Atlas assertions, actual browser journeys, component tests and source inventory. No commit or push was made. Main, develop, app/ and environment files were not edited.

## Module results and evidence

PASS applies to the specifically tested functionality in the evidence column. It does not mean every browser control received an individual end-to-end test.

| Module | Result | Actual evidence |
| --- | --- | --- |
| Registration/authentication/session isolation | PASS | Patient API registration/login, duplicate and role injection rejection, invalid JWT, auth/me; actual patient/staff login, patient account switching/logout without logging staff out. Deleting disposable accounts caused both browsers to return to login. |
| Departments/doctors/schedules | PASS | Actual API create/read/update/deactivation, persisted capacity and availability, ownership relationships; actual patient department/doctor selection, real date/slot capacity. |
| Self/family booking and appointment CRUD | PASS | Atlas appointment suite 43 and patient suite 96: real booking, family identity, reads, rescheduling/cancellation, released capacity and rollback; fresh browser booking confirmation and persisted staff table/detail. |
| Family CRUD/profile | PASS | Actual owned API create/list/edit/delete and profile update/refetch; actual mobile family creation, reload, removal and dialog Escape/focus return. Current profile browser read matched API-updated identity/address. |
| Account notification preferences | PASS | API persistence/security suites; browser queue-alert switch and reminder timing persisted after reload. Device accessibility settings remain separate from account preferences. |
| Patient queue states/calculations | PASS | Controlled real Atlas fixtures, all eight statuses, prior-day and other-doctor isolation, stable tickets; actual patient ALMOST_TURN, CALLING, IN_CONSULTATION, COMPLETED, HELD and SKIPPED journeys. Actual-component SSR tests cover all eight plus empty state. |
| Queue controls/concurrency/atomicity | PASS | Concurrent Call Next regression returns 200/409 with one active patient; duplicate check-in produces one ticket; invalid/terminal transitions 409; injected notification failure rolls back ticket and linked appointment; actual staff controls used. |
| Automatic cross-portal synchronization | PASS | Patient ticket creation, call, consultation, completion, hold-related position/estimate changes and skip appeared without pressing patient Refresh. Appointment detail completion appeared automatically in 8.154 seconds. |
| Strict maximum 15-second visible update latency | FAIL | Configured polling is 15 seconds, but an earlier call sample was still stale at 15.859 seconds and was observed updated at 33.417 seconds. The latter is an observation upper bound, not exact propagation latency. Atlas requests also exhibited multi-second/sporadic >30-second latency. No guaranteed 15-second SLA is established. |
| Notifications/read ownership | PASS | Actual persisted event/category/owner assertions, deduplication, foreign-read rejection; browser newest-first records, read-all and reload showed zero unread. |
| Persistent scheduled reminders | PASS | Actual reminder integration suite 14, due processing, timing/preferences and cancelled/rescheduled suppression. This is in-app persistence, not an external delivery service. |
| Staff dashboard/search/walk-in | PASS | Actual staff/security suite 51 covers patient lookup, registration/booking and ownership/role guards; browser dashboard reads actual data. Earlier baseline browser walk-in evidence is in the integration verification report; a complete new walk-in form journey was not repeated in this follow-up. |
| Staff profile/preferences/admin team | PASS | Actual staff/security suite 51 covers writes, role changes and revoked tokens; current admin browser displayed real team records, protected administrator and creation controls. Shared team accounts were not changed through the browser. |
| Analytics | PASS | Actual browser showed recorded appointments and status counts, including the owned hold/skip/completion changes before cleanup. No historical growth or clinical metrics are fabricated. |
| Connection failure/recovery | PASS | Stopped only the audit-owned root launcher: patient retained its last ticket with “Updates are temporarily unavailable.” Restarting `npm run dev` connected Atlas and restored the page without pressing Refresh. Vite reconnect may reload the development document; this is not proof of every production network-failure scenario. |
| Mobile and basic keyboard accessibility | PASS | Patient queue/notifications/family were measured at 390px with scrollWidth=clientWidth. Staff mobile queue/analytics/navigation were measured around 375px with no document overflow. Keyboard notification entry worked; family removal dialog Escape returned focus to its trigger. Large text/high contrast/reduced motion settings were enabled while these patient journeys remained usable. |
| Every form at every mobile breakpoint; actual assistive technology | NOT TESTED | No exhaustive browser matrix, screen-reader session or formal WCAG conformance audit. Component/a11y unit results do not substitute for those checks. |
| SMS/email/push/OTP/clinical records/payment/language translation | NOT TESTED | Integrations are unavailable and explicitly labelled in the UI. No simulated success is counted. Saved promotional email opt-in does not send email. |

## Verified defects fixed

1. Two concurrent calls could call different patients for one doctor. The reproduced baseline returned two 200 responses. A doctor document write serializes the same doctor's call transactions; busy CALLING/IN_CONSULTATION now rejects with 409. Staff disables Call Next when its selected doctor is busy, while the backend remains authoritative.
2. Waiting estimates ignored the current call/consultation. The explicit six-minute fallback now includes current remaining service, stays finite/non-negative and is explained on the patient card.
3. Patient appointment list/detail loaded once and could remain stale after staff completion. Both now use session-scoped query caches, 15-second background polling and focus refetch; real browser detail completion verified the fix.
4. Queue status, completion of its appointment and notification writes could partially succeed. Transitions and turn alerts now participate in their MongoDB transactions. A failure injection verifies rollback of the real ticket and appointment.
5. Department search treated punctuation as raw regular expressions: `[` produced a 500. Literal escaping now returns 200, verified through the API.
6. Call-next/list input validation now rejects empty call scopes, injected fields, invalid IDs/statuses/calendar dates with 400.

Production changes are in queue.service.ts, queueCalculation.service.ts, notification.service.ts, department.service.ts, queue.controller.ts, queue.validator.ts, PatientLiveQueue.tsx, NotificationsList.tsx, Appointments.tsx, AppointmentDetails.tsx and StaffDashboard.tsx. App.tsx and unrelated routes were left untouched. Permanent regression additions: server/tests/queue-audit.integration.ts, strengthened patient-app.integration.ts, client/tests/queue-components.test.mjs and their package scripts. README documents commands and actual estimate assumptions.

## Queue formula, transitions and timings

Day boundaries use Asia/Colombo. Positions count only WAITING/ALMOST_TURN in the ticket's doctor/department/day and sequence order. Position one means zero patients ahead; it does not mean CALLING. nowServing prefers same-scope CALLING, otherwise IN_CONSULTATION, and returns ticketNumber. Terminal/excluded states never occupy waiting positions. WAITING alone can advance into ALMOST_TURN; repeated polling does not duplicate its notification. Ticket numbers remain stable.

Allowed controls: WAITING/ALMOST_TURN -> CALLING; CALLING -> IN_CONSULTATION; IN_CONSULTATION -> COMPLETED; WAITING/ALMOST_TURN -> HELD; WAITING/ALMOST_TURN/CALLING -> SKIPPED. Invalid transitions return 409. No resume/reinsert endpoint is invented for HELD/SKIPPED.

`estimatedWaitMins = ceil(patientsAhead * 6 + remainingService)` for waiting states; otherwise zero internally and “—” on the patient card. CALLING contributes 6; IN_CONSULTATION contributes max(0, 6 - elapsed minutes), with missing/invalid start time falling back to 6. Doctors have no configured duration source. An overdue consultation can still be active when its estimated remainder reaches zero.

Actual controlled assertions: two waiting ahead/no service = 12; two ahead/current call = 18; three-minute-old consultation adds >0 and <=3; first waiting behind CALLING = 6; after completed service = waitingAhead*6. Browser hold changed position 2 -> 1 and wait 6 -> 0, without a turn announcement.

Patient queue/notifications/list/detail poll every 15 seconds and refetch on focus/background; staff uses its saved 15/30/60-second preference. This is polling, not WebSockets/SSE. Observed action-to-visible samples: initial waiting/now-serving update 14.239s, completion 15.505s, consultation 11.336s, completion 11.443s; current appointment detail completion 8.154s, hold effect 7.939s, skip 7.954s. Check-in and fresh call were observed by 28.945s and 21.644s respectively, but those waits targeted incorrect text; only the resulting DOM proves automatic synchronization, not those values as exact latency. Do not use them as precise benchmark results.

## API and database inventory

All paths below are prefixed `/api`. Inventory derives from official route files; verification derives from the integration assertions above. Supported cancellation/deactivation is tested instead of adding inappropriate hard deletes.

| Entity/module | Endpoint inventory and supported persistence |
| --- | --- |
| Health | GET /health; 200 running response. |
| Authentication/users | POST /auth/register, /auth/login; GET /auth/me, /auth/profile; PATCH /auth/profile. Registration PATIENT-only; current identity/profile read and write, no public staff escalation or password hash response. |
| Preferences | GET/PATCH /preferences. Account-owned notification/reminder preferences. Device accessibility preferences use browser storage. |
| Departments | GET/POST /departments; GET/PATCH/DELETE /departments/:id. DELETE deactivates and public lookup returns 404 while history remains. |
| Doctors | GET/POST /doctors; GET/PATCH /doctors/:id; GET/PATCH /doctors/:id/availability. Schedule replacement respects reservations, version conflicts/capacity; inactive doctor disappears publicly. |
| Appointments | POST/GET /appointments; GET /appointments/my, /appointments/:id; PATCH /appointments/:id/reschedule, /cancel, /status. Owner/security/capacity and transaction assertions use actual Atlas records. |
| Family | GET/POST /family-members; PATCH/DELETE /family-members/:id. Ownership enforced; unused owned member deletion supported, relationships retained appropriately. |
| Queue | GET /queue/me, /queue; POST /queue/check-in, /queue/staff/check-in, /queue/call-next; PATCH /queue/:id/start-consultation, /complete, /hold, /skip. Doctor/day scoping, guards, unique sequence and same-appointment concurrency asserted. |
| Notifications | GET /notifications; PATCH /notifications/:id/read, /notifications/read-all. Persisted owner, categories/timestamps, duplicates and foreign mutations asserted. |
| Staff operations | GET/POST /staff/patients; POST /staff/appointments; GET/PATCH /staff/profile; PATCH /staff/preferences. Real patient search/registration/booking and account persistence/security suite. |
| Team | GET/POST /staff/team; PATCH /staff/team/:id. ADMIN-only, responsibility/activation changes, protected administrator, subsequent token revocation tested. |
| Reminders/counters | Internal persisted models/worker; no public CRUD route. Reminder scheduling and counter uniqueness are exercised through supported appointment/queue workflows. |

Concurrency evidence includes final-slot booking, failed rescheduling rollback, duplicate check-in (201/409), concurrent Call Next (200/409), cancellation duplication and turn-notification deduplication. The queue audit uses controlled owned fixtures to test legacy conflicting service states and injected transaction failures; these setup writes are identified as fixtures, not counted as successful application CRUD requests.

## Visible-control inventory

This is a source/DOM inventory grouped by screen, not an assertion that each repeated calendar/day/card button was independently clicked.

| Screen | Controls |
| --- | --- |
| Auth | Email/phone, password, show/hide password, Continue, Register/patient-sign-in links; registration name/contact/password and submit; logout/account switch. |
| Patient shell/home | Skip link; Home, Visits, Queue, Family, Profile; search; notifications; View Departments, Book OPD, My Queue, Departments, My Profile, View All and department cards. |
| Directory/profile/availability | Back, department search/clear/cards; doctor search/filter/profile card/Book OPD; View Availability, date/slot availability and booking entry. |
| Booking | Back/Continue; month previous/next, dated available/disabled cells; Change Date, available slots; Edit Doctor/Edit Time, optional reason, Confirm Appointment; confirmation Home/My Appointments. |
| Appointments/detail/reschedule/cancel | Upcoming/Past/Cancelled filters, family booking link, appointment cards and retries; detail Back/Open OPD Queue/check-in/reschedule/cancel where valid; reschedule calendar/slots/retry/save; cancel reason/confirmation/back controls. |
| Family | Myself/member selection, Add/Close form; name/relation/DOB/gender/optional phone, Save; Edit/Remove by name, removal Cancel/Yes and Escape; Continue to Book. |
| Profile/accessibility | Settings, Edit Profile, Manage family, logout/retries; supported personal/contact fields, Save/Cancel; notification switches, reminder timing; text size, high contrast, reduced motion, extra announcements, Back; disabled translation and unavailable backend medical/insurance fields. |
| Queue/notifications | Refresh/retry, stable ticket/status/stepper; notification All/Queue/Appointment/System, Mark read/read-all and retry. Turn controls are staff-only. |
| Staff shell/dashboard/analytics | Mobile open/close menu, skip link, module links, portal selection/sign out; dashboard appointments/queue/walk-in links and real activity/availability counts; daily status breakdown. |
| Staff appointments/queue | Doctor/date/status/search; table scroll focus/check-in; queue doctor/filter/card detail, Call Next, Start consultation, Complete, Hold, Skip, retries. Disabled/hidden controls match lifecycle/date constraints. |
| Patients/walk-in | Registration name/phone/email/initial password/submit; name/full contact search, result selection; doctor/date/available slot/Book appointment, retries. |
| Doctor roster/schedule | Availability select, expandable edit fields/Save, reservation disclosure; Add doctor name/title/room/department; schedule doctor/date/start/end/capacity/Save and retries. |
| Staff settings/team | Display name/email, saved refresh interval/completed visibility/Save; ADMIN team responsibility/activation/create fields/submit/retry; protected administrator notice. |

## Tooling, preservation, cleanup and remaining limits

Server typecheck/build passed. Client typecheck/build/lint passed; lint emitted existing React/Fast Refresh/state-in-effect/purity warnings, and the production bundle was about 772kB with the >500kB warning. Frontend tests: 11 appointment + 3 staff + 9 actual queue component = 23 passed. Backend suites during this audit: 43 appointment + 96 patient + 14 reminder + 51 staff/security + 30 queue/CRUD/rollback = 234 assertions; seed 7 verification groups passed. The final patient run rechecked strengthened zero-reminder and both-date counter cleanup.

Browser interruption removed earlier process handles/tabs, leaving an owned fixture manifest. Recovery cleanup validated exact four patient IDs/names/roles, staff phone/name/role, doctor ID/name and department ID/code before deletion. Users, appointments, tickets, notifications, reminders, family, doctors, departments and counters each asserted zero remaining owned records. Additional browser bookings were covered by those owner IDs. Temporary preparation/cleanup scripts and the private browser manifest were removed. Permanent regressions remain. Shared seed snapshot/capacity validation passed; no reset was used.

Current normal browser console checks found no fatal error entries. Deliberately stopped services generated expected connection errors; those are distinguished from application exceptions. Separate PATIENT/STAFF storage keys were tested on one origin, not two independent physical browser profiles. Accessibility is basic functional evidence, not certification. Newly repeated browser coverage does not include every registration/reschedule/walk-in/admin mutation form or every mobile breakpoint; baseline evidence in full-app-integration-verification.md remains separately dated.

Startup from repository root: `npm run dev`. Patient http://localhost:5184/login; staff http://localhost:5184/staff/login; queue http://localhost:5184/queue; notifications http://localhost:5184/notifications; health http://localhost:5004/api/health. The launcher was actually run, stopped for the controlled outage, then restarted with Atlas/client/backend readiness confirmed.

Final Git verification: `git diff --check` passed (only a non-failing LF/CRLF advisory). There are 15 modified tracked files and three new untracked files, with nothing staged. Tracked diff statistics are 126 insertions and 126 deletions; new files are excluded from that Git statistic. Main remains `41982a120898d75b0d24d86c17a57c0b3bbf5da4`, develop remains `53802b339c9b4edf0cd3ecdaa88d8f756ec742fe`. app/web/src/App.tsx, server/.env and private credentials remain ignored. Temporary full-page screenshot captures did not render correctly and were discarded; retained viewport evidence is the earlier real queue CALLING screenshot and current admin team screenshot. Both portals were signed out after fixture cleanup.

```text
 M README.md
 M client/package.json
 M client/src/features/appointments/AppointmentDetails.tsx
 M client/src/features/appointments/Appointments.tsx
 M client/src/features/notifications/NotificationsList.tsx
 M client/src/features/queue/PatientLiveQueue.tsx
 M client/src/features/staff/StaffDashboard.tsx
 M server/package.json
 M server/src/controllers/queue.controller.ts
 M server/src/services/department.service.ts
 M server/src/services/notification.service.ts
 M server/src/services/queue.service.ts
 M server/src/services/queueCalculation.service.ts
 M server/src/validators/queue.validator.ts
 M server/tests/patient-app.integration.ts
?? client/tests/queue-components.test.mjs
?? docs/full-app-functional-audit.md
?? server/tests/queue-audit.integration.ts
```

Final classification: **NOT READY — BLOCKERS REMAIN** for the requested unconditional full-application verification. Supported tested functionality and focused fixes are ready for code review, but the strict visible-update deadline is not proven/met across observed latency, and exhaustive browser/mobile/assistive-technology coverage is not established. Do not treat passing API/build/component checks as proof of every visible control or external delivery integration.

## Completion follow-up — 12 October 2026

Repository and branch remain MediTrack, `integration/full-app`, HEAD `d751811015df005259b8fd0b364e75646847325f`. This follow-up performed the missing actual browser journeys, repeated queue transitions, reproduced additional defects, and completed fresh checks. Historical results above are not presented as newly repeated tests.

### Confirmed defects and focused fixes

- Staff queue calculations made 18 QueueTicket reads for nine returned tickets (1,555.9 ms measured API duration). One fresh shared active snapshot now reduces this to two QueueTicket reads, including the list query. Repeated measurements were 544.3 and 601.1 ms. These counts exclude population queries; timings are individual samples, not a percentile benchmark. A WAITING-filtered response still includes ALMOST_TURN patients in its calculation context.
- Appointment BOOKED filtering leaked into the queue screen while the dropdown displayed All statuses, producing a false empty queue. Independent appointment/queue status selections fix the reproduced navigation journey.
- Initial profile loading during a backend outage stayed stuck after service restoration. Transient network/429/5xx failures now recover with 5/10/20/30-second capped backoff and immediate online/focus recovery. Session guards, cleanup and one-attempt scheduling prevent stale-session writes and duplicate recovery. Authentication/validation failures do not auto-retry. A clean cold-load outage after the final fix recovered without Retry, Reload or a code change.
- A STAFF account with no staffId incorrectly displayed Administrator. It now displays Staff ID not provided; an actual TeamAccess regression verifies this.
- Reassigning a doctor to another department allowed a second active service for the same doctor/day. The reproduced API returned 200 before the fix; its busy check now spans departments and returns 409. Queue position and nowServing remain appropriately department/doctor/day scoped.
- At an actual 390px viewport the staff queue doctor select extended the document from 375px to 389px. A constrained mobile select fixes this: settled document width/scroll width are both 375px. Desktop layout also passed at 1280px (document and scroll width both 1265px).
- ISO HTTP completion logs and development-only `QUEUE_AUDIT_TIMINGS=true` transaction metrics separate transaction completion from HTTP response and patient observation. They contain no credential/body logging. The final root launcher runs with the timing opt-in unset.

New follow-up production changes are ProfileContext.tsx, profileRecovery.ts, TeamAccess.tsx, StaffDashboard.tsx, queueCalculation.service.ts, queue.service.ts and app.ts. Permanent regressions are profile-recovery.test.mjs, staff-components.test.mjs and queue-audit.integration.ts; package scripts/README explain verification. All earlier focused audit fixes were preserved. App.tsx, unrelated routes, app/, main, develop and environment files were not changed.

### Newly performed browser and persisted-data evidence

| Module | Result | Newly performed evidence |
| --- | --- | --- |
| Registration/authentication | PASS | Actual two-step disposable patient registration; invalid password rejected; valid sign-in; logout/account switching; expired sessions returned to login. Patient and STAFF keys remain independent on the same origin. |
| Discovery and booking | PASS | Doctor search, profile, actual availability/slot selection, self booking and family booking, review and backend-confirmed success. |
| Appointment list/detail/reschedule/cancel | PASS | Family appointment rescheduled to another real slot then cancelled through UI; persisted reloads and capacity release. Patient detail/list updated after staff completion without refresh. |
| Family/profile/preferences | PASS | Actual family create/edit; unused member removal; member with history correctly retained with 409. Name/address/gender saved and reloaded. Queue alerts/reminder timing and staff refresh preferences persisted. |
| Patient queue | PASS | Actual WAITING, ALMOST_TURN, CALLING, IN_CONSULTATION, HELD, SKIPPED and COMPLETED presentations. CANCELLED uses an explicitly controlled historical owned ticket linked to an appointment cancelled through the real API; no invented queue-cancel endpoint. Position one did not announce Your Turn. |
| Staff operations | PASS | Patient search, new walk-in registration/booking, doctor/date/status/search filters, check-in, board/detail and valid lifecycle controls. Three service cycles repeated check-in/call; two started/completed consultation and the third was skipped. |
| Doctors/schedules | PASS | Disposable doctor availability/details/room edits, persisted capacity change and reservation disclosure; actual second doctor creation. Shared schedules were not edited. |
| Admin/team/security | PASS | Actual owned team create, responsibility edit, deactivate and reactivate; persisted reload. Existing deactivated token received 401, then 200 after activation. Inactive browser login rejected. Ordinary staff received administrator-required notice. Protected admins were not modified. |
| Dashboard/analytics | PASS | Actual daily browser counts 18 appointments, 2 waiting, 0 consulting, 2 completed matched independent database counts after other suite cleanup. |
| Notifications/reminders | PASS | Real persisted booking/reschedule/cancel/queue creation/almost-turn/your-turn/consultation/reminder categories. Browser filtering, own mark-read/read-all and reload persistence. Six owned turn notices had unique user/ticket/category keys after sustained polling. Reminder suite separately verifies due delivery and cancelled/rescheduled suppression. |
| Basic mobile/accessibility | PASS | Actual representative patient forms/dialogs/queue/notifications/profile/preferences at approximately 390px with large text/high contrast/reduced motion. Staff appointments, queue, walk-in, doctors/schedules, settings and admin team checked at actual 390px; contained table scrolling distinguished from document overflow. Mobile navigation, labels/useful errors, keyboard focus, dialog Escape/focus return and text status cues verified. Desktop staff queue checked at actual 1280px. |
| Connection recovery | PASS | Only task-owned backend was stopped while client remained running; useful cold-load error followed by automatic recovery after restart. Cached query/focus recovery evidence remains separately documented in the earlier audit. |
| Formal WCAG/screen readers/exhaustive devices | NOT TESTED | Basic functional accessibility is not certification or an exhaustive browser/device matrix. |
| SMS/email/browser push/OTP/payments/clinical records | NOT TESTED | Integrations are absent; no simulated success counted. Receptionist/doctor responsibility labels currently share STAFF operational permissions. |

Atlas writes and reloads confirmed owned identity/profile/preferences, family relationships, bookings/rescheduling/cancellation, doctor details/capacity, team activation and ticket/appointment links. Browser-owned final checks asserted two completed, one held and two skipped tickets, valid linked appointments and no duplicate turn notices. Security suites verify foreign patient reads/mutations rejected, public STAFF/ADMIN registration rejected and password hashes absent from responses. Last-slot concurrency cannot overbook; concurrent check-in creates one ticket; concurrent calls admit one active service. Failure injection rolls back completion of ticket/appointment/notification.

### Queue timing: scheduling is not a visible-update guarantee

Patient queue, notifications and appointment list/detail retain a configured 15,000ms polling interval, background polling and focus refetch. Staff retains saved 15/30/60-second preferences. There is no SSE/WebSocket or automatic calling. Each patient GET reads fresh database state; there is no persistent server snapshot cache. Action start includes UI/request/transaction time; transaction completion is before population/HTTP completion; patient observation is an upper bound for when the user could see the change.

Twelve actual action-to-first-observed samples ranged from 0.864s to 16.274s. Sampling/tool gaps mean these are observation upper bounds, not exact propagation latency. Cycle-one transaction logs were not retained, so transaction values for that cycle are unavailable. Retained cycle-two/three measurements:

| Operation | Action UTC | Transaction completed UTC / duration | HTTP completed UTC / request duration | Patient observed UTC / action upper bound |
| --- | --- | --- | --- | --- |
| Check-in 2 | 14:07:07.742 | 14:07:09.862 / 1.437s | 14:07:10.136 / 2.297s | 14:07:21.664 / 13.922s |
| Call 2 | 14:07:36.740 | 14:07:37.644 / 0.713s | 14:07:37.881 / 1.071s | 14:07:52.924 / 16.184s |
| Start 2 | 14:09:36.768 | 14:09:37.482 / 0.413s | 14:09:37.785 / 0.936s | 14:09:41.758 / 4.990s |
| Complete 2 | 14:09:56.395 | 14:09:57.070 / 0.470s | 14:09:57.299 / 0.831s | 14:10:12.669 / 16.274s |
| Check-in 3 | 14:10:46.546 | 14:10:48.149 / 1.293s | 14:10:48.375 / 1.732s | 14:10:59.249 / 12.703s |
| Call 3 | 14:11:13.249 | 14:11:14.447 / 0.826s | 14:11:14.683 / 1.350s | 14:11:14.763 / 1.514s |
| Skip 3 | 14:11:51.141 | 14:11:51.679 / 0.346s | 14:11:51.910 / 0.689s | 14:12:01.477 / 10.336s |

For Call 2, the previous patient GET completed at 14:07:37.306 before the transaction committed at 14:07:37.644, so it correctly contained the previous state. The next GET completed at 14:07:52.883 and displayed CALLING at the next observation. Adjacent completed polls were approximately 15.5–15.7s apart: a 15s scheduling interval plus request/network duration. Observation was 15.280s after transaction commit and 15.043s after HTTP completion. This explains the missed strict deadline; it is not evidence of stale server caching. No unsupported exact 15-second visible SLA is claimed. A strict unconditional <=15s requirement remains **not met reliably**; the requested tested supported workflows are otherwise verified for review.

Positions count WAITING/ALMOST_TURN only; ticketNumber stays stable and nowServing returns a same-Colombo-day/doctor/department ticket number, CALLING preferred over IN_CONSULTATION. Previous-day/other-doctor states do not interfere. ALMOST_TURN starts only from WAITING and does not overwrite terminal states. The six-minute fallback plus current remaining service is an approximation, not a clinical prediction; an overdue consultation may remain active with estimated remainder zero. Hold changed position 2 -> 1 and estimate 6 -> 0 without a turn announcement. WAITING position 3 showed 12 minutes.

### Final checks, cleanup and readiness

Fresh server typecheck/build passed. Sequential explicit demo-Atlas suites passed: appointments 43, patient-app 96, reminders 14, staff/settings/security 51, queue/CRUD/rollback 33 = **237 assertions**, plus **7 demo-seed verification groups**. The newly failing department-reassignment baseline was fixed and rerun successfully. Every suite's scoped cleanup completed; seed rerun preserved existing records and capacities exactly.

Client typecheck/build/lint passed; **28 tests** passed (appointments 11, staff 4, queue 9, profile recovery 4). After the final mobile-only fix, client typecheck/build/lint/staff tests were repeated and passed. Existing React/Fast Refresh/state-effect/purity lint warnings and the approximately 773kB >500kB bundle warning remain non-failing warnings.

Task-owned browser fixture cleanup validated reserved phones, prefix, department code/id and doctor ownership, then asserted **zero remaining** users/team, appointments, tickets, notifications, reminders, family, doctors, departments and counters. Its private ignored manifest and temporary script were removed. Shared/demo records were preserved. Test sessions ended at sign-in; expiry boundaries were also observed. Temporary viewport overrides were reset. No fatal console exceptions or blank screens were found; deliberate outage/invalid-auth failures are not classified as fatal application errors.

The owned split services were stopped and the actual repository-root `npm run dev` restarted successfully. Atlas connected, Vite served port 5184, API health returned 200/status ok on 5004, and frontend login returned 200. Patient `/login`, staff `/staff/login`, queue `/queue`, notifications `/notifications` remain the official routes.

Final Git state: **19 modified tracked files and 5 new untracked permanent files; nothing staged**. Tracked diff: 196 insertions, 150 deletions (new files excluded). `git diff --check` passed with only the LF/CRLF advisory. No app/ or App.tsx diff; no .env/secret files in changed paths. Main remains `41982a120898d75b0d24d86c17a57c0b3bbf5da4`; develop remains `53802b339c9b4edf0cd3ecdaa88d8f756ec742fe`. No branch change, commit, push, PR or tag was performed.

Retained viewport evidence and timing logs are outside Git under the task visualization directory: final-mobile-family-booking.png, final-mobile-live-consultation.png, final-mobile-held-state.png, final-mobile-admin-team.png, final-desktop-queue.png, final-transition-observations.json and final-server-runtime.log. Screenshots show disposable fixtures before cleanup. They do not represent production records.

Current classification: **FULL APPLICATION VERIFIED — READY FOR REVIEW**, restricted to the supported workflows actually tested above. It is ready for a reviewed GitHub checkpoint, not a claim of external-delivery integration, formal accessibility certification, production deployment or a guaranteed <=15-second network-dependent deadline. No publication was performed.

## Staff queue usability follow-up — 13 October 2026

After the reviewed checkpoint was published as `c9764c0`, the user reported difficulty selecting/managing a doctor queue, returning held tickets, and understanding the patient display. Live API inspection found three October 12 tickets (HELD/SKIPPED) and zero October 13 tickets. The patient endpoint correctly limits live tickets to the current hospital day. Earlier browser tests did not include a held-ticket return control: none existed at that checkpoint.

Focused changes add a labelled **Manage doctor queue** shortcut, visibly disabled Call Next with explicit doctor/date/busy/empty guidance, current-date empty-queue/check-in guidance, and a historical-date notice with **Show today's queue**. A Colombo-day clock follows midnight when viewing today's queue while preserving intentional date selections; its midnight boundary is regression-tested rather than claimed as a real overnight browser observation. Staff queue polling also recovers in the background/on focus.

`PATCH /api/queue/:id/resume`, restricted to STAFF/ADMIN, returns HELD -> WAITING only for a current-day ticket with an active same-day appointment. It preserves ticket number and sequence, creates a transactional owned QUEUE_UPDATE notification, rejects competing resumes with 409, rejects previous-day/terminal/cancelled-appointment tickets, and rolls back invalid linked-appointment changes. Resume returns to original sequence order; it does not call the patient automatically. The client exposes **Resume waiting** on held cards.

Actual browser verification used two freshly registered disposable patients, one owned doctor/department and real current-day bookings/check-ins. From the staff UI, Hold -> Resume -> Call Next -> Start consultation -> Complete appeared automatically in the patient's already-open queue, without Refresh/Reload. The number remained QFED-001; position one was almost-turn, not Your Turn, and CALLING displayed QFED-001 as nowServing. The separately open notifications page automatically received the consultation and completion messages, along with hold/resume/call notifications. The second patient's waiting position/estimate recalculated. Native keyboard date selection displayed the October 12 read-only notice. Doctor selection via the actual card shortcut activated Call Next. Screenshots retained outside Git: queue-controls-fix-patient-calling.png and queue-controls-fix-notifications.png.

Client typecheck/build/lint passed, with existing warnings; focused staff 4, patient queue 9 and queue controls/day rollover 7 tests passed. The patient API suite passed all 96 assertions but its first cleanup check failed because the running reminder worker rescheduled test-only jobs while source appointments remained. Cleanup now removes source appointments/users before reminder jobs. The failed run's three orphan jobs were individually verified using that test process's ObjectId fingerprint, timestamp window and missing owner/appointment references, then removed; no general/shared orphan sweep was used. The isolated rerun passed 96 assertions and zero-record cleanup. Browser fixture cleanup verified zero remaining owned records in all nine entity groups; its temporary script and ignored manifest were removed. Final resume/queue regressions and startup checks are reported with this follow-up's final result, not conflated with the prior audit totals. Existing shared users, appointments and historical tickets were not reset or resumed.

Final backend queue regressions passed **45 assertions** (including authentication, concurrent resume, old-day/terminal/cancelled/other-day appointment guards), with verified zero-record cleanup; the patient suite rerun passed **96 assertions**. Server typecheck/build and client typecheck/build/lint passed. Client focused tests passed **20** (4 staff, 9 patient queue, 7 controls/date). Existing warning categories remain warnings. The cleanup retry was isolated from the running reminder worker, so it does not claim proof against every external scheduling race.

The user subsequently identified their real patient account and explicitly chose the official database. A narrowly scoped read-only check (automatic index/collection creation disabled) found that account active in `meditrack`, absent in `meditrack_demo`, and without appointments, tickets or notifications. This is separate from queue-update latency: an account with no booked/checked-in appointment has no ticket to display. The official database has two active STAFF accounts and no ADMIN account; no account was created, copied, promoted or reset. The user's phone/name is deliberately not recorded in this public audit.

The default root `npm run dev` now uses the official database configured by `MONGODB_URI`; explicit `npm run dev:demo` retains isolated demo mode. Matching patient/staff API and CORS origins remain on 5184/5004. Startup prints the actual connected database, and a real restart confirmed **meditrack**, not meditrack_demo. No environment file was edited. Official existing users must use their own credentials; earlier demo credentials do not belong to this database. Database suites continue to require the explicit disposable demo configuration. The official patient account's interactive booking/login is not claimed as verified because no existing password or appointment selection was supplied; the automatic cross-portal journey was verified with the owned demo fixtures described above. Current changes remain local and uncommitted pending publication instructions.
