import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { seed, State } from './data';
// One local SQLite database for a single-process client demonstration.
// Separate collections keep providers, patients, bookings and notices persistent.
const directory=path.join(process.cwd(),'data');
let database:DatabaseSync|undefined;
function getDatabase(){
 if(database)return database;
 mkdirSync(directory,{recursive:true});
 database=new DatabaseSync(path.join(directory,'carebook.sqlite'));
 database.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 for(const table of ['doctors','patients','bookings','notices'])database.exec(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, payload TEXT NOT NULL)`);
 if(!(database.prepare('SELECT id FROM patients LIMIT 1').get()))save(seed(),database);
 return database;
}
function save(state:State,db:DatabaseSync){
 for(const table of ['doctors','patients','bookings','notices'] as const){
  db.exec(`DELETE FROM ${table}`);
  const insert=db.prepare(`INSERT INTO ${table} (id,payload) VALUES (?,?)`);
  for(const row of state[table])insert.run(row.id,JSON.stringify(row));
 }
}
let queue:Promise<unknown>=Promise.resolve();
export function transaction<T>(fn:(state:State)=>T|Promise<T>):Promise<T>{
 const run=queue.then(async()=>{
  const db=getDatabase();db.exec('BEGIN IMMEDIATE');
  try{
   const read=(table:string)=>db.prepare(`SELECT payload FROM ${table} ORDER BY rowid`).all().map(row=>JSON.parse(String(row.payload)));
   const state:State={doctors:read('doctors'),patients:read('patients'),bookings:read('bookings'),notices:read('notices')};
   const result=await fn(state);save(state,db);db.exec('COMMIT');return result;
  }catch(e){db.exec('ROLLBACK');throw e}
 });
 queue=run.catch(()=>{});return run;
}
