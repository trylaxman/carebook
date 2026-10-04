import { seed } from './data';
import type { State } from './data';
import { mutateDemo } from './demo-actions';
const STORAGE_KEY='carebook-demo-state-v1';
let memory:State|undefined;
let memoryOnly=false;
function valid(value:unknown):value is State {
 if(!value||typeof value!=='object')return false;
 const s=value as State;
 return ['doctors','patients','bookings','notices'].every(k=>Array.isArray(s[k as keyof State]));
}
export function loadDemo():State {
 if(typeof window==='undefined')throw Error('Demo storage is available in the browser only.');
 if(memoryOnly)return structuredClone(memory??(memory=seed()));
 try {
  const raw=window.localStorage.getItem(STORAGE_KEY);
  if(raw){const parsed:unknown=JSON.parse(raw);if(valid(parsed)){memory=parsed;return structuredClone(parsed)}}
 }catch { /* Blocked or invalid browser storage: continue with an in-memory demo. */ }
 memory=memory??seed();
 try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(memory))}catch{memoryOnly=true}
 return structuredClone(memory);
}
function saveDemo(state:State){
 memory=state;
 if(!memoryOnly){try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{memoryOnly=true}}
}
export async function runDemoAction(body:Record<string,unknown>){
 const perform=()=>{const state=loadDemo();const result=mutateDemo(state,body);saveDemo(state);return structuredClone(result)};
 // A Web Lock serializes edits across tabs on the same origin when available.
 if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request(STORAGE_KEY,perform);
 return perform();
}
let fallbackPatient:string|null=null;
export function getPatientId(){try{return window.localStorage.getItem('carebook-patient')}catch{return fallbackPatient}}
export function setPatientId(id:string|null){fallbackPatient=id;try{if(id)window.localStorage.setItem('carebook-patient',id);else window.localStorage.removeItem('carebook-patient')}catch{/* Continue the demo when browser storage is blocked. */}}
