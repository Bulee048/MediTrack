import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const compiled=await build({entryPoints:[resolve('src/features/profile/context/profileRecovery.ts')],bundle:true,platform:'node',format:'cjs',write:false});
const module={exports:{}};
new Function('module','exports','require',compiled.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));
const {scheduleProfileRecovery,isTransientProfileFailure,profileRetryDelay}=module.exports;
function target(){const events=new EventTarget();let callback;let delay;return {addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),setTimeout:(fn,ms)=>{callback=fn;delay=ms;return 1;},clearTimeout:()=>{callback=undefined;},fire:()=>callback?.(),dispatch:name=>events.dispatchEvent(new Event(name)),get delay(){return delay;}};}
test('transient connection/server errors retry; authentication and validation errors do not',()=>{
 for(const status of [undefined,429,500,503])assert.equal(isTransientProfileFailure({isAxiosError:true,...(status?{response:{status}}:{})}),true);
 for(const status of [400,401,403,404,409])assert.equal(isTransientProfileFailure({isAxiosError:true,response:{status}}),false);
 assert.equal(isTransientProfileFailure(new Error('Invalid profile response')),false);
});
test('focus/online recovery and timeout cannot send duplicate retries',()=>{
 const window=target();let attempts=0;const dispose=scheduleProfileRecovery(()=>attempts++,window);
 assert.equal(window.delay,5000);window.dispatch('online');window.dispatch('focus');window.fire();assert.equal(attempts,1);dispose();
});
test('session change/unmount cancels queued recovery and event listeners',()=>{
 const window=target();let attempts=0;const dispose=scheduleProfileRecovery(()=>attempts++,window);
 dispose();window.fire();window.dispatch('online');window.dispatch('focus');assert.equal(attempts,0);
});
test('prolonged outages retain retries with a thirty-second maximum backoff',()=>{
 assert.deepEqual([0,1,2,3,4,100].map(profileRetryDelay),[5000,10000,20000,30000,30000,30000]);
 const window=target();const dispose=scheduleProfileRecovery(()=>{},window,profileRetryDelay(100));assert.equal(window.delay,30000);dispose();
});
