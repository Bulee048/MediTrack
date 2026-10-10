# Appointment, family and accessibility checkpoint

Branch: `feature/appointment-management`. Reference layouts under `app/web` remain read-only. Queue/Notifications files and unrelated routes are unchanged.

## Existing behavior retained

Patient-scoped appointment routes, populated detail responses, real cancellation/rescheduling, checked-in appointment guards, family CRUD with ownership filters, and browser-local accessibility preferences were already implemented. The existing family model includes the Caregiver relationship; no separate account or relationship model was introduced.

## Fixes

- Upcoming lists active bookings nearest first; completed visits appear in Past even on the current day. Cancelled visits retain their separate filter.
- Booking, duplicate detection, slot reservation and family validation run in retryable MongoDB transactions. Account writes serialize competing duplicate bookings; family writes coordinate with deletion. Self and different owned relatives may share a slot when capacity permits.
- Rescheduling validates the existing family relationship and duplicate target slot. Full slots, invalid dates, terminal/checked-in appointments and browser-supplied ownership changes are rejected. Failed transactions preserve the original appointment and capacities.
- Patient screens validate responses, handle deleted historical doctor/department references, expose loading/error/empty/retry states, and reconcile cancellation from the backend response. Rescheduling requires confirmation and refreshes availability after failure.
- Family booking requires an explicit selection. Only an account-scoped draft ID is persisted in session storage; restoration obtains the identity from the authenticated family API. The selection clears after successful booking. Creation/editing/deletion use real APIs with pending guards and accessible validation.
- Appointment booking mutations no longer use the feature mock flag. Unused mock appointment arrays were removed from production types; legitimate development/test mocks elsewhere were retained.
- Fixed pixel typography became equivalent rem typography in appointment/family/settings and booking flow screens. Scoped contrast/control styles, labels, selected-state announcements, keyboard form submission, and modal focus restoration preserve the reference layout while supporting Large Text.

## Repeatable tests

From `client`:

```powershell
npm run test:appointments
npm run typecheck
npm run build
```

Seven Node tests use the existing Vite compiler dependencies and exercise actual response mapping, malformed/missing data, family identities, queue markers, accessibility persistence and DOM application.

From `server`, using an explicitly authorized Atlas/test database configuration:

```powershell
$env:RUN_ATLAS_TESTS='true'
npm run test:appointments
npm run typecheck
npm run build
```

The integration script creates isolated users, doctor, department, family members and appointments, invokes the real Express APIs, and removes its exact fixture IDs in `finally`. It asserts cleanup across all five collections. It must run against a transaction-capable MongoDB replica set, including Atlas. It does not mock authorization or slot capacity.

The verification run passed 43 assertions: authenticated/unauthenticated access, foreign appointment read/cancel/reschedule, family ownership, rejection of supplied ownership fields, calendar validation, completed/upcoming separation and sorting, full/unavailable slots, failed transaction integrity, duplicate cancellation, concurrent duplicate booking, competing last-slot booking/rescheduling, and family booking/deletion races.

An initial local DNS failure was resolved for the test process with `$env:TEST_DNS_SERVERS='1.1.1.1'`; this optional test-only setting does not change application/OS DNS configuration. The sandbox blocked Vite's filesystem lookup, so the successful final client build ran with approved permissions. Vite reports its existing non-fatal large-bundle warning.

## Browser verification

The official client was tested against the real Atlas-backed server with disposable fixtures, not mock endpoints. Manual browser checks passed for list/detail, real reschedule and cancel confirmations, full slots disabled, foreign detail denial and retry, empty Upcoming, completed-today Past, family create/edit/delete, required selection, family booking and refresh-safe confirmation, keyboard Escape/focus restoration, and mobile layout at 360px with Large Text/high contrast/reduced motion.

Large Text changed the page heading from 19px to 22.56px; measured content width stayed within the mobile viewport. A development hot-refresh context error disappeared after a clean reload; subsequent complete flows rendered successfully. Browser settings and viewport were restored. Browser and API test records, including temporary credentials, were removed and cleanup was verified.

Accessibility preferences remain explicitly device-local. Account reminder/push/language settings and payment/refund processing have no backend in this branch and remain honestly unavailable rather than simulated. They are outside this assigned checkpoint.
