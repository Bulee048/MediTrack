import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const compiled = await build({ alias: { '@': resolve('src') }, stdin: {
  contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {QueueCallControl} from './src/features/staff/QueueCallControl';export {rolloverQueueDate} from './src/features/staff/useHospitalQueueDate';export {hospitalDate} from './src/lib/hospitalDate';export const render=(props)=>renderToStaticMarkup(React.createElement(QueueCallControl,props));`,
  resolveDir: resolve('.'), loader: 'tsx',
}, jsx: 'automatic', bundle: true, platform: 'node', format: 'cjs', write: false });
const module = { exports: {} };
new Function('module', 'exports', 'require', compiled.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
const { render, rolloverQueueDate, hospitalDate } = module.exports;
const ready = { doctorSelected: true, isToday: true, busy: false, loading: false, pending: false, waiting: 1, onCall() {} };
test('ready selected doctor can call next', () => { const html = render(ready); assert.doesNotMatch(html, /disabled=""/); assert.match(html, /patient queue updates automatically/); });
for (const [label, patch, guidance] of [
  ['doctor selection', { doctorSelected: false }, /Select a doctor/],
  ['historical date', { isToday: false }, /read-only/],
  ['busy service', { busy: true }, /Complete an active consultation/],
  ['empty waiting queue', { waiting: 0 }, /Check in an appointment/],
  ['in-flight mutation', { pending: true }, /Saving queue change/],
]) test(`disabled call has clear ${label} guidance`, () => { const html = render({ ...ready, ...patch }); assert.match(html, /disabled=""/); assert.match(html, guidance); assert.match(html, /aria-describedby="queue-call-guidance"/); });
test('Colombo midnight advances a live queue but preserves intentionally selected dates', () => {
  const previous = hospitalDate(new Date('2026-10-12T18:29:59Z'));
  const today = hospitalDate(new Date('2026-10-12T18:30:00Z'));
  assert.equal(previous, '2026-10-12'); assert.equal(today, '2026-10-13');
  assert.equal(rolloverQueueDate(previous, previous, today), today);
  assert.equal(rolloverQueueDate('2026-10-10', previous, today), '2026-10-10');
  assert.equal(rolloverQueueDate('2026-10-14', previous, today), '2026-10-14');
});
