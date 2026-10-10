# Patient application integration verification

## Integration sources

- Branch: `integration/patient-app`, created from remote develop `52f3eb8`.
- Dulmin: `feature/queue-management` at `184562690bcba3a7747af5995748c9b9b6d54c0a`, already an ancestor of develop.
- Prabhasha: `feature/patient-booking` at `c5418b369309b25b8fd30a0547034e4977c1e5dc`, already an ancestor of develop.
- Nawodya: `feature/appointment-management` at `4e456b16927a0673a5f0548120345c7185e25464`, merged normally, preserving feature history.
- Relative to Nawodya, develop had four newer commits and Nawodya had twelve unique commits. No redundant queue/booking merge was needed.
- Peiris Staff/OPD was not merged or ported. Existing role checks and staff queue APIs remain available. `app/` was inspected only as reference and was not modified.

## Conflict resolution and integration contracts

Thirteen conflicts involved client/package.json, App.tsx, config/api.ts, booking confirmation/home/review/date/service/API, index.css, and server appointment/auth services and auth validator. Resolutions preserve newer develop authentication/booking and verified appointment/family/accessibility behavior together.

The actual mounted appointment API returns a populated document envelope. Booking now validates/maps that same response instead of expecting an unused flat DTO. Both server slot-ID requests and legacy HH:MM requests resolve real availability inside a transaction; stored time remains HH:MM, slot metadata is authoritative, and references remain stable. Historic slot labels are supported when reading, cancelling, and rescheduling.

There is one existing localStorage JWT store, one Axios client, session-scoped query keys, a patient guard, and account-scoped family selection. Delayed old-session 401/profile responses cannot overwrite the next session. All patient routes and existing booking aliases remain; reference /app/queue and /app/notifications aliases redirect to canonical routes.

Booking, rescheduling, cancellation, capacity updates, and appointment notifications commit together. Queue check-in also commits ticket, sequential counter, appointment association, and queue-created notification together. Account/family write locks preserve duplicate/race protections. Ownership is resolved on the server, and supplied ownership fields are rejected.

Hospital calendar days use Asia/Colombo consistently for booking cutoffs, appointment ordering, same-day check-in and queue lookup. Queue calculation retains CALLING/IN_CONSULTATION day/doctor/department scope, stable ticket numbers, waiting-only positions, lifecycle guards and ticket-scoped almost-turn/your-turn deduplication.

Actual appointment and queue events feed existing notification filters/read APIs. Booking/check-in/cancel/reschedule invalidate affected query keys; management/family/profile views reload authoritative API results. Accessibility remains honest browser-local text size, contrast and reduced-motion preferences; unsupported account settings/medical/payment capabilities are disabled or identified as unavailable.

Unused demo doctor fallback data, banners, hard-coded default patient profile and unused sample family records were removed. No production API path simulates successful booking, cancellation, rescheduling, queue or notifications.

## Commands

Initial review used git fetch origin, git log/diff, git merge-base --is-ancestor, and git rev-list --left-right --count against all three source branches. Integration used git switch -c integration/patient-app origin/develop and git merge --no-commit --no-ff origin/feature/appointment-management.

From client:

```powershell
npm run typecheck
npm run build
npm run test:appointments
```

From server:

```powershell
npm run typecheck
npm run build
$env:RUN_ATLAS_TESTS='true'
$env:TEST_DNS_SERVERS='1.1.1.1'
$env:NODE_ENV='test'
npm run test:appointments
npm run test:patient-app
```

Browser testing used a held disposable API fixture server on 5004 and real Vite client on 5184 with VITE_API_BASE_URL=http://localhost:5004/api. Test harness BROWSER_FIXTURE_PATH was outside Git and removed on cleanup; no credentials are documented here.

## Verification

Client and server typecheck/build pass. Client regression suite passes 10 tests. The original appointment suite passes all 43 real API/Atlas assertions, including foreign reads/mutations, full-slot races, failed-reschedule rollback, family/delete race, ordering and checked-in edit rejection.

The new patient-app suite verifies registration/login/current identity, unauthorized/foreign access, real slot-ID booking, real family CRUD, notification transaction/deduplication, concurrent duplicate check-in, stable sequential tickets, day-scoped now serving, positions/wait, lifecycle conflicts, staff authorization, and notification ownership/read-all isolation. Final execution passed 86 assertions, including real unused-family deletion and invalid family IDs; all isolated fixtures were removed and verified. Together the backend suites pass 129 API/Atlas assertions.

Manual browser E2E verified portal/login, real department/doctor/date/slot/review/confirmation, refresh-persisted booking and caregiver identity, My Appointments, real reschedule, real check-in/live queue and called state, appointment/queue alerts and read persistence, profile persistence, large text/contrast/motion persistence, mobile 360x800 layout without horizontal overflow, keyboard dialog focus/Escape, direct URLs/history, logout/relogin, second-patient isolation and visible invalid-ID/403 errors. Filling a selected slot through real API reservations produced a visible fully-booked error rather than a fake confirmation. Caregiver cancellation used the real confirmation/API flow.

Screenshots were saved outside Git. Atlas fixtures are owned by isolated generated IDs, and cleanup asserts no test users, family members, appointments, notifications, queue tickets, doctor/department or counter records remain. Existing unrelated Atlas records are preserved. No .env/credentials/app changes are included.

Known nonblocking build output: Vite reports a bundle-size warning; typecheck/build succeed. There is no payment gateway, unsupported medical/insurance editing, or account-synced accessibility service in this repository; the UI does not invent these capabilities.
