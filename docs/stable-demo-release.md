# MediTrack stable demo — v1.0.0-stable-demo

Release branch: `release/stable-demo`.

This checkpoint includes the verified full-app implementation from `92a62a3`, the demo display-label cleanup, the updated seed fixtures and documentation, and a guarded label-maintenance script. It is a stable demonstration checkpoint for the supported workflows, rather than a production deployment certification.

Supported workflows: patient/staff authentication, doctor/department discovery, real slot booking, owned family booking, cancellation/rescheduling, staff registration/search/booking, same-day check-in, queue controls, notification ownership/read/filter behavior, account notification preferences, device accessibility preferences and persisted in-app reminders.

The prior end-to-end verification passed 43 appointment and 86 patient/queue API/Atlas checks and real browser booking, family, cancellation, rescheduling and cross-portal queue workflows. Release checks rerun client/server typechecks/builds, seed-script typecheck, 11 client tests, 14 reminder checks, 23 staff/settings checks and seed idempotency/safety checks. Tests target only the isolated `meditrack_demo` database. Patient/staff browser checks used independent authenticated tabs; a separate physical browser context and screen-reader hardware were not available.

Browser push, email delivery, payments and translation are explicitly unavailable. Notifications/reminders use the real persisted in-app channel. Vite's bundle-size warning is nonfatal. Dated seed schedules must be refreshed using the explicitly guarded reset when they expire.

Start from the repository root with `npm run dev`. Patient: `http://localhost:5184/login`; staff: `http://localhost:5184/staff/login`; health: `http://localhost:5004/api/health`. Local ignored credentials remain in `server/.demo/credentials.json`; no credentials, `.env`, generated bundles or `app/` changes are part of this release.

Existing user documentation deletions are deliberately excluded from the release commit. No merge into `main` or `develop` is performed, and no previous tag or history is rewritten. Continue development on a feature branch and leave this release tag fixed.
