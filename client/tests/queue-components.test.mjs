import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'meditrack-queue-components-'));
after(()=>rm(dir,{recursive:true,force:true}));
const compiled=await build({alias:{'@':resolve('src')},define:{'import.meta.env.VITE_API_BASE_URL':JSON.stringify('http://localhost:5004/api')},stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {PatientLiveQueue} from './src/features/queue/PatientLiveQueue';export function render(ticket){const client=new QueryClient();client.setQueryData(['myActiveQueueTicket',0],ticket);return renderToStaticMarkup(React.createElement(QueryClientProvider,{client},React.createElement(PatientLiveQueue)));}`,resolveDir:resolve('.'),loader:'tsx'},jsx:'automatic',bundle:true,platform:'node',format:'cjs',write:false});
const file=join(dir,'queue.cjs');await writeFile(file,compiled.outputFiles[0].text);const {render}=(await import(pathToFileURL(file).href)).default;
const fixture={ticketId:'owned-test',ticketNumber:'Q-123',sequenceNumber:123,currentPosition:1,patientsAhead:0,nowServing:null,nowServingStatus:null,estimatedWaitMins:0,status:'WAITING',doctor:{name:'Test Doctor',roomNumber:'Q1'},department:{name:'Test OPD'},lastUpdated:'2026-10-12T00:00:00Z'};
const labels={WAITING:'Waiting',ALMOST_TURN:'Almost your turn',CALLING:"It&#x27;s Your Turn!",IN_CONSULTATION:'Consultation in progress',HELD:'Queue ticket on hold',SKIPPED:'Queue ticket skipped',COMPLETED:'Consultation completed',CANCELLED:'Queue ticket cancelled'};
for(const [status,label] of Object.entries(labels))test(`actual patient queue renders ${status} without an incorrect turn announcement`,()=>{
  const html=render({...fixture,status});
  assert.ok(html.includes(label));assert.match(html,/Q-123/);
  if(status==='CALLING'){assert.match(html,/Please proceed now/);assert.match(html,/aria-live="assertive"/);}
  else assert.doesNotMatch(html,/Your Turn!/);
  if(['WAITING','ALMOST_TURN'].includes(status)){assert.match(html,/~0 mins/);assert.match(html,/Approximate time/);}
  else {assert.match(html,/Not waiting/);assert.doesNotMatch(html,/~0 mins/);}
  if(status==='WAITING')assert.match(html,/wait until your ticket is called/);
});
test('actual patient queue has a useful empty state without a fabricated ticket',()=>{
  const html=render(null);assert.match(html,/You are not in a queue yet/);assert.doesNotMatch(html,/Q-123/);
});
