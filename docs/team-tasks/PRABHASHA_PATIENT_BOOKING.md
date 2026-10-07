# Member
J.M.D.K. Prabhasha

# Module
Patient Appointment Booking

# Branch
`feature/patient-booking`

Start only from `develop`.

### Branch Commands
```bash
git checkout develop
git pull
git checkout -b feature/patient-booking
git branch --show-current
```

If feature branch already exists:
```bash
git checkout feature/patient-booking
git pull
```

**Never work on main.**

---

# RESPONSIBILITY

Implement only the Patient Appointment Booking frontend.

### Required Screens:
- Login
- Register
- Patient Home
- Departments
- Doctor List
- Doctor Profile
- Doctor Availability
- Select Date
- Select Time
- Review Appointment
- Booking Confirmation

Use reference screens from `app/web/src/pages/patient/` as visual and interaction reference only.

**Never modify `app/`.**

Official implementation should mainly be inside:
- `client/src/features/auth/`
- `client/src/features/doctors/`
- `client/src/features/booking/`

Use existing shared components in `client/src/components/` where possible.

---

# EXISTING REAL BACKEND APIs

### Authentication:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Departments:
- `GET /api/departments`
- `GET /api/departments/:id`

### Doctors:
- `GET /api/doctors`
- `GET /api/doctors/:id`
- `GET /api/doctors/:id/availability`

Use Axios + TanStack Query for server state.
Use React Hook Form + Zod for forms.
Do not hardcode real backend data if endpoint exists.

Appointment booking backend (`POST /api/appointments`) may still be in development.

If `POST /api/appointments` is not yet available:
- Build the complete UI flow
- Create a typed appointment service interface
- Isolate temporary mock booking response
- Clearly label mock data
- Do not invent a backend route

---

# DO NOT MODIFY

- `server/`
- `app/`
- staff feature
- appointment-management feature
- queue feature

Avoid editing:
- `client/src/App.tsx`
- global route files
- global layouts

unless necessary. If a shared file must be edited, report it explicitly.

---

# QUALITY CHECK

At completion run frontend checks:
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
6. mocks remaining
7. typecheck result
8. build result
9. unresolved issues

Do not commit. Do not push. Wait for review.
