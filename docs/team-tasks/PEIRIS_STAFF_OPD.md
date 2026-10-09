# Member
P.M.T.T. Peiris

# Module
Hospital Staff / OPD Management

# Branch
`feature/staff-opd`

Start only from `develop`.

### Branch Commands
```bash
git checkout develop
git pull
git checkout -b feature/staff-opd
git branch --show-current
```

**Never work on main.**

---

# RESPONSIBILITY

Implement only staff-facing frontend features:
- Staff Login
- Staff Dashboard
- Today's Appointments
- Today's Queue
- Patient Queue Details
- Walk-In Registration
- Doctor Availability
- Doctor Schedule
- Queue Controls
- Call Next Patient UI
- Start Consultation
- Complete Consultation
- Staff Analytics where useful

Reference: `app/web/src/pages/staff/`

Use reference files as visual/workflow reference only. **Never modify `app/`.**

Official implementation mainly under:
- `client/src/features/staff/`

---

# EXISTING BACKEND

Available:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/departments`
- `GET /api/departments/:id`
- `GET /api/doctors`
- `GET /api/doctors/:id`
- `GET /api/doctors/:id/availability`

Protected Doctor/Department management APIs also exist for `STAFF`/`ADMIN`.

Queue and staff operational APIs may still be under development.

Until those APIs exist:
- Build complete UI
- Create typed service interfaces
- Isolate temporary mocks
- Do not invent fake backend endpoints

Use Recharts only where analytics add real value.

---

# DO NOT MODIFY

- `server/`
- `app/`
- patient-booking feature
- appointment-management feature
- patient queue feature

Avoid global shared files unless necessary.

---

# QUALITY CHECK

Run frontend checks:
```bash
cd client
npm run typecheck
npm run build
```

### Report Format:
1. screens completed
2. files created
3. files modified
4. shared files changed
5. APIs connected
6. APIs required
7. mock data remaining
8. typecheck result
9. build result
10. unresolved issues

Do not commit. Do not push. Wait for review.
