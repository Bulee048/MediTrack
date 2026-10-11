# MediTrack branch audit — 2026-10-11

The supplied cleanup request described an older state. `codex/full-app-repair` had already been renamed to `feature/full-app-repair`; no provenance/history rewriting is performed. Its original checkpoint is `92a62a3`. The wording cleanup is in `25b844a`, while the five intentional documentation deletions are separately committed in `b1993b4`. Both are preserved by the stable demo tags. The working tree was clean at audit start.

The repair candidate was fast-forwarded from `92a62a3` to `b1993b4` so integration includes both stable cleanup commits. Existing tags are retained unchanged. `release/stable-demo` remains a release pointer rather than being rewritten during maintenance.

## Containment before integration

Already fully included in develop `52f3eb8`: backend-foundation, appointment-backend, patient-booking, queue-management, staff-opd and local main. Appointment-management `4e456b1`, patient integration `3e16488`, full-app repair and the stable release are not yet fully included in develop.

Fully included in the stable release/updated repair candidate: patient integration, appointment-management, staff-opd, backend-foundation, appointment-backend, patient-booking, queue-management and develop. There is no missing staff or appointment-management commit to cherry-pick. The old staff branch is a historical foundation, not the current official staff UI.

Unique outside the candidate: the five reference-UI commits below and safety snapshot `0576ce7`. Local main has no commit missing from origin/main; it is seven commits behind and may be advanced using a non-forced fast-forward fetch without checking it out. The existing stash `nawodya-integration-readiness-frontend-2026-10-09` is preserved.

## Reference UI decisions

| Commit | Review and decision |
| --- | --- |
| `1204827` | Retain as historical design work; do not cherry-pick. Current shell supports integrated patient routes and accessibility; this old staff shell includes hard-coded identity and links to unimplemented screens. |
| `bf9431b` | Skip for integration, retain history. Replaces App routing with an early queue-focused route set, omitting current booking/family/profile/appointment/staff routes and creating a parallel auth flow. |
| `3ac9a93` | Retain for separate review, do not cherry-pick wholesale. Adds queue cancellation/recalculation and hold/skip alerts, but checked-in cancellation includes consultation states and differs from the tested current 409 policy. Current day scoping and transition safeguards already exist. |
| `d970083` | Retain history; current shared shell already supplies route integration. Cherry-picking its old shell/routing changes risks undoing integrated accessibility and navigation. |
| `f8e7261` | Retain as useful future work, not as verified current functionality. Adds arrival acknowledgement, held-ticket resume/history and public ahead-ticket details. Needs selective porting plus ownership/state/concurrency tests against the current architecture; cannot safely cherry-pick its dependent old stack as-is. |

No reference-UI commit is merged or cherry-picked. Keep `feature/reference-ui-integration` intact for follow-up. Comparing its complete tip with the candidate also shows older appointment code lacking current transactional duplicate/family guards, stable references and appointment notifications; this is why a wholesale replacement is unsuitable.

## Safety snapshot and cleanup policy

`0576ce7` contains 92 changed files from temporary integration work, including mock authentication/booking fixtures. It is not merged into the real-backend candidate. Preserve it first with annotated tag `archive/nawodya-integration-snapshot-2026-10-11`, then delete only its local branch. The stash is retained separately.

After successful integration, local/remote branch pointers for backend-foundation, appointment-backend, patient-booking, queue-management, appointment-management, staff-opd, patient-app integration and full-app repair may be deleted only after checking full ancestry in develop and matching remote tips. Main, develop, stable release and reference-UI branch are retained. No force-push, destructive reset or merge into main is used.

## Validation tooling

The existing client lint command referenced undeclared `oxlint`; installing it as a development dependency made the tool available. The command is scoped to source, tests and Vite config instead of third-party node_modules/generated output. One Windows-encoded en dash in `auth.schemas.ts` was converted to UTF-8; validation behavior is unchanged. Lint succeeds with existing React advisory warnings, not a zero-warning claim. Client/server typechecks/builds and the repository's client and isolated Atlas suites are run before develop integration. Vite's bundle-size warning remains nonfatal.
