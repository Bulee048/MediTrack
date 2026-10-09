# Member
W.S.I. Nawodya

# Module
Appointment Management, Family Booking, Profile and Accessibility

# Branch
`feature/appointment-management`

Start only from `develop`.

### Branch Commands
```bash
git checkout develop
git pull
git checkout -b feature/appointment-management
git branch --show-current
```

**Never work on main.**

---

# RESPONSIBILITY

Implement only:
- My Appointments
- Appointment Details
- Reschedule Appointment
- Cancel Appointment
- Book for Family Member
- Family Member Management
- Profile
- Edit Profile
- Accessibility Settings

Use matching reference screens in `app/web/src/pages/patient/` for visual and UX reference only.

**Never edit `app/`.**

Official code should mainly live under:
- `client/src/features/appointments/`
- `client/src/features/family/`
- `client/src/features/profile/`
- `client/src/features/accessibility/`

---

# UX REQUIREMENTS

- **Book for Family Member** must be easy to find. Do not hide family booking inside an unclear menu.
- **Cancellation** must use a confirmation dialog (`AlertDialog`).
- **Rescheduling** must clearly show:
  - current appointment
  - new date
  - new time
- **Accessibility** must support at minimum:
  - Large Text Mode
  - High Contrast Mode
  Ensure accessibility settings visibly affect relevant UI components.

---

# BACKEND STATUS

Authentication, Department, and Doctor APIs already exist.
Appointment and Family Member APIs may still be under development.

If appointment endpoints are unavailable:
- Create typed frontend services
- Isolate mock data
- Do not invent backend endpoints
- Make replacement with real Axios calls easy later

---

# DO NOT MODIFY

- `server/`
- `app/`
- patient-booking feature
- staff feature
- queue feature

Avoid global shared-file changes unless necessary.

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
5. APIs used
6. APIs still required
7. mock data remaining
8. typecheck result
9. build result
10. unresolved issues

Do not commit. Do not push. Wait for review.
