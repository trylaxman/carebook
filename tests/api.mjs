import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
async function call(body){const r=await fetch(base+'/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
const read=async()=>(await fetch(base+'/api/demo')).json();
const offset=(n)=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=(type)=>Number(parts.find(p=>p.type===type).value);return new Date(Date.UTC(get('year'),get('month')-1,get('day')+n)).toISOString().slice(0,10)};
// Destructive reset is opt-in: this test runs against a disposable demo server.
if(process.env.DEMO_TEST_RESET!=='yes')throw Error('Run against a disposable demo with DEMO_TEST_RESET=yes.');
await call({action:'reset'});
assert.equal((await read()).doctors.length,6);
assert.equal((await call({action:'login',email:'alex@example.com'})).data.id,'patient-demo');
assert.equal((await call({action:'login',email:'missing@example.com'})).status,400);
const registered=await call({action:'register',name:'Taylor Demo',email:'taylor@example.com'});assert.equal(registered.status,200);
const id=registered.data.id;
assert.equal((await call({action:'register',name:'Other',email:'taylor@example.com'})).status,400);
assert.equal((await call({action:'profile',patientId:id,name:'Taylor Demo',phone:'1234',blood:'A+'})).data.blood,'A+');
const payload={action:'book',doctorId:'d2',patientId:id,date:offset(1),time:'09:00 AM',payment:'Demo card',notes:'Demo visit'};
assert.equal((await call({...payload,date:offset(-1)})).status,400);
assert.equal((await call({...payload,time:'invalid'})).status,400);
const concurrent=await Promise.all([call(payload),call(payload)]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,400]);
const a=concurrent.find(r=>r.status===200).data;
const b=await call({...payload,time:'09:30 AM',rescheduleId:a.id});assert.equal(b.status,200);
assert.equal((await read()).bookings.find(x=>x.id===a.id).status,'Cancelled');
assert.equal((await call({...payload})).status,200); // old slot released
assert.equal((await call({action:'status',id:b.data.id,status:'Completed'})).status,200);
assert.equal((await call({action:'status',id:b.data.id,status:'bad'})).status,400);
assert.equal((await call({action:'provider',id:'d2',fee:120,active:false})).status,200);
assert.equal((await call({...payload,time:'03:00 PM'})).status,400);
await call({action:'read',patientId:id});
assert((await read()).notices.filter(n=>n.patientId===id).every(n=>n.read));
await call({action:'reset'});
console.log('PASS: seed, email login, registration, duplicate registration, profile, date/time validation, simultaneous slot conflict, rescheduling, released slot, status validation, provider visibility, notifications, reset.');
