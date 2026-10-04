// Unit/integration checks for browser persistence without requiring Chromium.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {stripTypeScriptTypes}=require('node:module');
const {pathToFileURL}=require('node:url');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'carebook-store-'));
 try{
  for(const name of ['data','demo-actions','browser-store']){
   const source=fs.readFileSync(path.join(__dirname,'..','lib',name+'.ts'),'utf8');
   const output=stripTypeScriptTypes(source).replaceAll("'./data'","'./data.mjs'").replaceAll("'./demo-actions'","'./demo-actions.mjs'");
   fs.writeFileSync(path.join(tmp,name+'.mjs'),output);
  }
  Object.defineProperty(globalThis,'navigator',{value:{locks:{request:async(name,fn)=>fn()}},configurable:true});
  const items=new Map();global.window={localStorage:{getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)}};
  const {dateKey}=await import(pathToFileURL(path.join(tmp,'data.mjs')).href);
  const modulePath=pathToFileURL(path.join(tmp,'browser-store.mjs')).href;let store=await import(modulePath);
  assert.equal(store.loadDemo().doctors.length,6);
  const run=store.runDemoAction;
  const p=await run({action:'register',name:'Taylor',email:'taylor@example.com'});
  store.setPatientId(p.id);assert.equal(store.getPatientId(),p.id);
  assert.equal((await run({action:'login',email:'taylor@example.com'})).id,p.id);
  await assert.rejects(run({action:'register',name:'Taylor',email:'taylor@example.com'}));
  const payload={action:'book',patientId:p.id,doctorId:'d2',date:dateKey(1),time:'09:00 AM',payment:'Demo card'};
  const first=await run(payload);await assert.rejects(run(payload));
  const second=await run({...payload,time:'09:30 AM',rescheduleId:first.id});
  assert.equal(store.loadDemo().bookings.find(a=>a.id===first.id).status,'Cancelled');
  await run({action:'status',id:second.id,status:'Cancelled'});await run(payload);
  await run({action:'profile',patientId:p.id,name:'Taylor Updated',blood:'A+'});
  await run({action:'read',patientId:p.id});assert(store.loadDemo().notices.filter(n=>n.patientId===p.id).every(n=>n.read));
  await run({action:'provider',id:'d2',fee:120,active:false});await assert.rejects(run({...payload,time:'02:00 PM'}));
  // Simulate a new page module using the same browser storage.
  store=await import(modulePath+'?reload=1');
  assert.equal(store.loadDemo().patients.find(x=>x.id===p.id).name,'Taylor Updated');
  assert.equal(store.getPatientId(),p.id);
  await store.runDemoAction({action:'reset'});assert.equal(store.loadDemo().patients.length,1);
  window.localStorage={getItem(){throw Error('Blocked')},setItem(){throw Error('Blocked')},removeItem(){throw Error('Blocked')}};
  store=await import(modulePath+'?reload=2');
  assert.equal(store.loadDemo().doctors.length,6);
  const fallback=await store.runDemoAction({action:'register',name:'Memory',email:'memory@example.com'});
  assert(store.loadDemo().patients.some(x=>x.id===fallback.id));store.setPatientId(fallback.id);assert.equal(store.getPatientId(),fallback.id);
  console.log('PASS: browser seed, registration, login, slot conflict, reschedule, cancellation, profile, notifications, provider updates, reload persistence, reset, blocked-storage fallback.');
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exit(1)});
