import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'meditrack-staff-components-'));
after(()=>rm(dir,{recursive:true,force:true}));
const compiled=await build({alias:{'@':resolve('src')},define:{'import.meta.env.VITE_API_BASE_URL':JSON.stringify('http://localhost:5004/api')},stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {MemoryRouter} from 'react-router-dom';import StaffShell from './src/features/staff/StaffShell';import TeamAccess from './src/features/staff/TeamAccess';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';export function renderTeam(members){const client=new QueryClient();client.setQueryData(['staffTeam',0],members);return renderToStaticMarkup(React.createElement(QueryClientProvider,{client},React.createElement(TeamAccess)));}export function render(role,path){return renderToStaticMarkup(React.createElement(MemoryRouter,{initialEntries:[path]},React.createElement(StaffShell,{name:'Verified staff',role,title:'Appointments',date:'2026-10-11',onLogout:()=>{}},React.createElement('p',null,'Official content'))));}`,resolveDir:resolve('.'),loader:'tsx'},jsx:'automatic',bundle:true,platform:'node',format:'cjs',write:false});
const file=join(dir,'shell.cjs');await writeFile(file,compiled.outputFiles[0].text);const {render,renderTeam}=(await import(pathToFileURL(file).href)).default;
test('ordinary staff navigation exposes OPD screens without admin team controls',()=>{const html=render('STAFF','/staff/appointments');assert.match(html,/Patient queue/);assert.match(html,/Doctors &amp; schedules/);assert.doesNotMatch(html,/Team access/);assert.match(html,/aria-current="page"[^>]*>Appointments/);});
test('administrator receives team navigation and same operational pages',()=>{const html=render('ADMIN','/staff/team');assert.match(html,/href="\/staff\/team"/);assert.match(html,/Team access/);assert.match(html,/Walk-in registration/);});
test('shell has accessible mobile controls, skip target and page heading',()=>{const html=render('STAFF','/staff');assert.match(html,/aria-expanded="false"/);assert.match(html,/aria-controls="staff-navigation"/);assert.match(html,/id="staff-content"/);assert.match(html,/<h1[^>]*>Appointments<\/h1>/);assert.match(html,/Official content/);assert.match(html,/Sign out/);});

test('staff with no staff ID is not labelled an administrator',()=>{
 const html=renderTeam([{_id:'owned-staff',name:'Owned staff',phone:'owned',role:'STAFF',isActive:true}]);
 assert.match(html,/Staff ID not provided/);assert.doesNotMatch(html,/Administrator ·/);assert.match(html,/Deactivate Owned staff/);
});
