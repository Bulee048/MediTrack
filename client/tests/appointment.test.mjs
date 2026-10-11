import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Use Vite's existing compiler; no new test framework or backend dependency.
const directory = await mkdtemp(join(tmpdir(), 'meditrack-client-tests-'));
after(() => rm(directory, { recursive: true, force: true }));
async function moduleFrom(path, name) {
  const result = await build({ entryPoints: [path], bundle: true, platform: 'node', format: 'esm', write: false });
  const file = join(directory, name + '.mjs');
  await writeFile(file, result.outputFiles[0].text);
  return import(pathToFileURL(file).href);
}
const { mapAppointment } = await moduleFrom('src/features/appointments/api/appointmentResponse.ts', 'response');
const { localAccessibilityPreferences } = await moduleFrom('src/features/accessibility/api/accessibilityApi.ts', 'preferences');
const { applyAccessibilityToDOM } = await moduleFrom('src/features/accessibility/context/AccessibilityContext.tsx', 'dom');
const { getAuthToken, setAuthToken, clearAuthToken, getAuthSessionVersion } = await moduleFrom('src/features/auth/auth.storage.ts', 'auth-storage');
const { hospitalDate } = await moduleFrom('src/lib/hospitalDate.ts', 'hospital-date');
const appointment = { _id: 'appointment', patient: 'patient', familyMember: null,
  doctor: { _id: 'doctor', name: 'Doctor', department: { _id: 'dept', name: 'OPD' } },
  appointmentDate: '2026-10-19T00:00:00Z', timeSlot: '09:00', status: 'BOOKED', createdAt: '', updatedAt: '' };
test('real statuses mapped, payment is not fabricated', () => {
  for (const [status, expected] of Object.entries({ BOOKED: 'confirmed', RESCHEDULED: 'rescheduled', CANCELLED: 'cancelled', COMPLETED: 'completed' }))
    assert.equal(mapAppointment({ ...appointment, status }).status, expected);
  assert.equal(mapAppointment(appointment).paymentStatus, 'unknown');
});
test('family identity and stable backend reference preserved', () => {
  const result = mapAppointment({ ...appointment, ref: 'OPD-REAL', familyMember: { _id: 'family', name: 'Relative' } });
  assert.equal(result.bookedForSelf, false); assert.equal(result.familyMemberId, 'family');
  assert.equal(result.familyMemberName, 'Relative'); assert.equal(result.ref, 'OPD-REAL');
});
test('missing historical doctor/department handled safely', () => {
  assert.equal(mapAppointment({ ...appointment, doctor: null }).doctorId, '');
  assert.equal(mapAppointment({ ...appointment, doctor: { ...appointment.doctor, department: null } }).department, 'Department not provided');
});
test('malformed date, time, patient, status and absent data produce understandable error', () => {
  for (const value of [null, {}, { ...appointment, patient: null }, { ...appointment, appointmentDate: 'bad' },
    { ...appointment, appointmentDate: '2027-02-30T00:00:00Z' }, { ...appointment, timeSlot: '33:00' }, { ...appointment, status: 'MADE_UP' }])
    assert.throws(() => mapAppointment(value), /Invalid appointment response/);
});
test('checked-in marker prevents treating appointment as freely editable', () => {
  assert.equal(mapAppointment({ ...appointment, queueTicket: 'real-ticket' }).checkedIn, true);
});
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
test('device accessibility preferences persist and unsupported account features reject', async () => {
  const updated = await localAccessibilityPreferences.updateSettings({ textSize: 'large', highContrast: true, reducedMotion: true, screenReader: true });
  assert.equal((await localAccessibilityPreferences.getSettings()).screenReader, true);
  assert.equal(updated.textSize, 'large'); assert.equal((await localAccessibilityPreferences.getSettings()).highContrast, true);
  await assert.rejects(localAccessibilityPreferences.updateSettings({ push: true }), /not supported/);
  storage.set('meditrack.localAccessibilityPreferences', '{bad');
  assert.equal((await localAccessibilityPreferences.getSettings()).textSize, 'medium');
});
test('large text, high contrast and reduced motion actually update DOM, and can be reset', () => {
  const properties = new Map(), attributes = new Map(), classes = new Set();
  globalThis.document = { documentElement: { style: { setProperty: (key, value) => properties.set(key, value) },
    toggleAttribute: (key, value) => attributes.set(key, value), classList: { add: key => classes.add(key), remove: key => classes.delete(key) } },
    body: { setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key) } };
  applyAccessibilityToDOM({ textSize: 'large', highContrast: true, reducedMotion: true });
  assert.equal(properties.get('--app-text-size'), '19px'); assert.equal(attributes.get('data-high-contrast'), true);
  applyAccessibilityToDOM({ textSize: 'medium', highContrast: false, reducedMotion: false });
  assert.equal(properties.get('--app-text-size'), '16px'); assert.equal(attributes.get('data-high-contrast'), false);
});

test('one token store advances session/cache boundary on login, switch and logout', () => {
  const values = new Map(); const events = [];
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  globalThis.window = { dispatchEvent: event => events.push(event.type) };
  const before = getAuthSessionVersion();
  setAuthToken('A'); setAuthToken('A'); assert.equal(getAuthSessionVersion(), before + 1);
  setAuthToken('B'); assert.equal(getAuthToken(), 'B');
  clearAuthToken(); assert.equal(getAuthToken(), null); assert.equal(getAuthSessionVersion(), before + 3);
  assert.equal(events.length, 3);
  delete globalThis.window;
});
test('patient and staff sessions remain isolated', () => {
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key,value)=>values.set(key,value), removeItem:key=>values.delete(key) };
  globalThis.window = { location: { pathname:'/login' }, dispatchEvent:()=>{} };
  setAuthToken('patient-token');
  globalThis.window.location.pathname='/staff/login'; setAuthToken('staff-token');
  assert.equal(getAuthToken(),'staff-token'); clearAuthToken(); assert.equal(getAuthToken(),null);
  globalThis.window.location.pathname='/queue'; assert.equal(getAuthToken(),'patient-token'); clearAuthToken();
  delete globalThis.window;
});

test('legacy slot labels normalize to the same management time contract', () => {
  assert.equal(mapAppointment({ ...appointment, timeSlot: '09:00 - 09:30' }).time, '09:00');
});

test('Colombo day switches at hospital midnight even on a UTC host', () => {
  assert.equal(hospitalDate(new Date('2026-10-10T18:29:59Z')), '2026-10-10');
  assert.equal(hospitalDate(new Date('2026-10-10T18:30:00Z')), '2026-10-11');
});
