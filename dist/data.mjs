export const accounts = {
 member: {email:'member@covenant.demo', name:'Rachel Thomas', role:'member', profileId:'CM1001'},
 branch: {email:'branch@covenant.demo', name:'Anna Mathew', role:'branch', org:'B01', orgName:'Bengaluru branch'},
 church: {email:'church@covenant.demo', name:'Pastor Samuel', role:'church', org:'C01', orgName:'Grace Fellowship'},
 admin: {email:'admin@covenant.demo', name:'Covenant team', role:'admin', orgName:'Central workspace'}
};
export const password = 'Covenant@2026';
const makeId = prefix => prefix + (globalThis.crypto?.randomUUID?.().replaceAll('-','').slice(0,12) || Date.now().toString(16)+Math.random().toString(16).slice(2,8));
export const states = ['Karnataka','Kerala','Tamil Nadu','Andhra Pradesh','Telangana'];
export function seed() {
 const base = {visibility:true, consent:true, photo:true, photoVisible:true, evidence:true, affiliation:'Confirmed', denomination:'Protestant', language:'English', managers:[]};
 const rows = [
 ['CM1001','Rachel Thomas',28,'Bengaluru','Karnataka','UX designer','Approved','online',['B01','C01'],3,'Female'],
 ['CM1002','Daniel Mathew',31,'Bengaluru','Karnataka','Architect','Approved','online',[],0,'Male'],
 ['CM1003','Joel Varghese',30,'Chennai','Tamil Nadu','Strategy consultant','Approved','church',['C02'],1,'Male'],
 ['CM1004','Isaac George',32,'Kochi','Kerala','Product manager','Approved','branch',['B02'],2,'Male'],
 ['CM1005','Anna Joseph',27,'Mysuru','Karnataka','Teacher','Under review','branch',['B01'],3,'Female'],
 ['CM1006','Lydia Paul',29,'Bengaluru','Karnataka','Doctor','Awaiting consent','branch',['B01'],3,'Female'],
 ['CM1007','Mark Philip',31,'Bengaluru','Karnataka','Finance analyst','Changes requested','branch',['B01'],0,'Male'],
 ['CM1008','Elena James',26,'Bengaluru','Karnataka','Researcher','Under review','church',['C01'],3,'Female'],
 ['CM1009','Peter John',30,'Bengaluru','Karnataka','Civil engineer','Awaiting consent','church',['C01'],1,'Male'],
 ['CM1010','Leah David',28,'Hyderabad','Telangana','Teacher','Approved','church',['C01'],3,'Female'],
 ['CM1011','Noah Daniel',29,'Vijayawada','Andhra Pradesh','Software engineer','Under review','online',[],2,'Male'],
 ['CM1012','Andrew Paul',31,'Bengaluru','Karnataka','Business analyst','Approved','branch',['B01'],0,'Male']
 ];
 return {version:1,profiles:rows.map(([id,name,age,city,state,career,status,route,managedBy,portrait,gender])=>({...base,id,name,age,city,state,career,status,route,originalOrg:managedBy[0]||null,managedBy,portrait,gender,consent:status!=='Awaiting consent',evidence:status!=='Changes requested',bio:'Faith, family and meaningful work are a big part of my life. I value kindness, honest conversation and growing together.',preferences:{state:'Any state',language:'English',relocation:'Open to discussing'},created:'2026-10-10'})),
 interests:[{id:'I01',from:'CM1002',to:'CM1001',status:'Pending'},{id:'I02',from:'CM1003',to:'CM1001',status:'Pending'},{id:'I03',from:'CM1001',to:'CM1004',status:'Pending'}],
 cases:[{id:'IN101',pair:['CM1001','CM1012'],stage:'Coordinator assigned',coordinator:'Pastor Samuel',coordinatorOrg:'C01',contact:{CM1001:false,CM1012:false},history:['Mutual interest confirmed','Pastor Samuel assigned']}],
 appointments:[{id:'AP01',profile:'CM1001',title:'A conversation with your coordinator',date:'2026-10-18',time:'11:00',status:'Proposed',type:'Video call'}],
 tasks:[{id:'T01',org:'B01',title:'Confirm Lydia’s profile consent',profile:'CM1006',done:false},{id:'T02',org:'B01',title:'Help Mark add age evidence',profile:'CM1007',done:false},{id:'T03',org:'C01',title:'Request Peter’s member consent',profile:'CM1009',done:false},{id:'T04',org:'C01',title:'Confirm Elena’s church affiliation',profile:'CM1008',done:false}],
 organisations:[{id:'B01',name:'Bengaluru branch',type:'branch',status:'Active'},{id:'B02',name:'Kochi branch',type:'branch',status:'Active'},{id:'C01',name:'Grace Fellowship',type:'church',status:'Active'},{id:'C02',name:'Chennai fellowship',type:'church',status:'Active'}],
 enquiries:[],audit:[],membership:{status:'Pending',period:'Annual',start:null,end:null},privacy:{photos:true,discovery:true},preferences:{state:'Any state',language:'English',relocation:'Open to discussing'},staff:[{id:'S01',org:'B01',name:'Anna Mathew',role:'Branch coordinator'},{id:'S02',org:'C01',name:'Pastor Samuel',role:'Church representative'}]};
}
export function visibleProfiles(state,user){if(user.role==='admin')return state.profiles;if(user.role==='member')return state.profiles.filter(p=>p.id===user.profileId);return state.profiles.filter(p=>p.managedBy.includes(user.org));}
export function eligible(p){return p.status==='Approved'&&p.consent&&p.visibility;}
export function discovery(state,user){if(user.role!=='member')return [];const mine=state.profiles.find(p=>p.id===user.profileId);if(!mine||!eligible(mine))return [];return state.profiles.filter(p=>p.id!==mine.id&&eligible(p)&&p.gender!==mine.gender);}
export function scopedCases(state,user){if(user.role==='admin')return state.cases;if(user.role==='member')return state.cases.filter(c=>c.pair.includes(user.profileId));return state.cases.filter(c=>c.coordinatorOrg===user.org&&c.coordinator);}
export function apply(state,user,action,payload={}){
 if(!user)throw Error('Please sign in.');
 const own=()=>state.profiles.find(p=>p.id===user.profileId);
 const managed=(id)=>visibleProfiles(state,user).find(p=>p.id===id);
 const audit=(message)=>state.audit.unshift({id:makeId('EV'),actor:user.name,message,date:new Date().toISOString()});
 switch(action){
 case 'sendInterest': {
  if(user.role!=='member')throw Error('Only members can express interest.');
  if(!discovery(state,user).some(p=>p.id===payload.id))throw Error('This profile is not available for interest.');
  if(state.cases.some(c=>c.pair.includes(user.profileId)&&c.pair.includes(payload.id)))throw Error('An introduction already exists.');
  const existing=state.interests.find(i=>[i.from,i.to].includes(user.profileId)&&[i.from,i.to].includes(payload.id)&&['Pending','Accepted'].includes(i.status));
  if(existing){if(existing.to===user.profileId&&existing.status==='Pending'){existing.status='Accepted';createCase(state,user.profileId,payload.id);}return state;}
  state.interests.push({id:makeId('I'),from:user.profileId,to:payload.id,status:'Pending'});audit('Interest sent');break;
 }
 case 'respondInterest':{
  const i=state.interests.find(i=>i.id===payload.id);if(!i||user.role!=='member')throw Error('Interest not available.');
  if(i.status!=='Pending')return state;
  if(payload.response==='Withdrawn'&&i.from===user.profileId){i.status='Withdrawn';break;}
  if(i.to!==user.profileId||!['Accepted','Declined'].includes(payload.response))throw Error('This response is not permitted.');
  if(payload.response==='Accepted'&&(!eligible(own())||!eligible(state.profiles.find(p=>p.id===i.from))))throw Error('Both profiles must be eligible.');
  i.status=payload.response;if(i.status==='Accepted')createCase(state,i.from,i.to);audit('Interest '+i.status.toLowerCase());break;
 }
 case 'privacy':{
  if(user.role!=='member')throw Error('Member permission required.');
  if(typeof payload.discovery==='boolean'){state.privacy.discovery=payload.discovery;own().visibility=payload.discovery;}
  if(typeof payload.photos==='boolean'){state.privacy.photos=payload.photos;own().photoVisible=payload.photos;}
  audit('Visibility permission updated');break;
 }
 case 'updateProfile':{
  if(user.role!=='member')throw Error('Member permission required.');
  for(const k of ['name','city','career','bio','language'])if(typeof payload[k]==='string')own()[k]=payload[k].trim().slice(0,800);
  if(states.includes(payload.state))own().state=payload.state;
  if(own().status==='Approved'){own().status='Changes requested';own().evidence=true;}
  audit('Profile details saved; changes require review');break;
 }
 case 'preferences':if(user.role!=='member')throw Error('Member permission required.');state.preferences={...state.preferences,...payload};break;
 case 'addProfile':{
  if(!['branch','church','member'].includes(user.role))throw Error('Registration role required.');
  if(!payload.name?.trim()||!Number.isInteger(Number(payload.age))||Number(payload.age)<21||Number(payload.age)>80||!states.includes(payload.state))throw Error('Add a name, an age between 21 and 80, and a state.');
  if(!payload.authority)throw Error('Record authority to create this draft.');
  const id=makeId('CM');state.profiles.unshift({id,name:payload.name.trim().slice(0,100),age:Number(payload.age),city:(payload.city||'').slice(0,100),state:payload.state,career:(payload.career||'').slice(0,100),gender:payload.gender||'Female',denomination:payload.denomination||'Protestant',language:'English',status:'Awaiting consent',route:user.role==='member'?'online':user.role,originalOrg:user.org||null,managedBy:user.org?[user.org]:[],consent:false,evidence:false,photo:false,photoVisible:false,visibility:false,affiliation:'Pending',portrait:3,bio:'',created:new Date().toISOString().slice(0,10)});audit('Profile draft created; member consent required');break;
 }
 case 'submitProfile':{
  const p=managed(payload.id);if(!p)throw Error('Profile access denied.');if(!p.consent||!p.evidence)throw Error('Member consent and required evidence are needed before submission.');
  if(p.status==='Under review'||p.status==='Approved')return state;p.status='Under review';audit('Profile submitted to central review');break;
 }
 case 'recordConsent':{
  if(user.role!=='member'||payload.id!==user.profileId)throw Error('Only the profile owner can confirm their consent.');
  own().consent=!!payload.value;audit('Member consent recorded');break;
 }
 case 'confirmation':{
  const p=managed(payload.id);if(user.role!=='church'||!p)throw Error('Church confirmation access denied.');if(!payload.basis?.trim())throw Error('Add the basis for confirmation.');p.affiliation='Confirmed';p.confirmedBy=user.name;p.confirmationBasis=payload.basis.slice(0,500);p.confirmationDate=new Date().toISOString();audit('Church affiliation confirmed for '+p.id);break;
 }
 case 'review':{
  if(user.role!=='admin')throw Error('Central reviewer permission required.');const p=managed(payload.id);if(!p)throw Error('Profile not found.');
  if(!['Approved','Changes requested','Suspended'].includes(payload.status))throw Error('Invalid review decision.');
  if(payload.status==='Approved'&&(!p.consent||!p.evidence))throw Error('Consent and evidence are required for approval.');
  if(!payload.reason?.trim())throw Error('Record a reason for this decision.');p.status=payload.status;p.reviewReason=payload.reason.slice(0,500);audit(p.id+' '+p.status.toLowerCase()+': '+p.reviewReason);break;
 }
 case 'assign':{
  if(user.role!=='admin')throw Error('Central assignment permission required.');const c=state.cases.find(c=>c.id===payload.id);if(!c)throw Error('Case not found.');
  c.coordinator=payload.coordinator==='Anna Mathew'?'Anna Mathew':'Pastor Samuel';c.coordinatorOrg=c.coordinator==='Anna Mathew'?'B01':'C01';c.stage='Coordinator assigned';c.history.push(c.coordinator+' assigned');audit('Coordinator assigned to '+c.id);break;
 }
 case 'contactConsent':{
  if(user.role!=='member')throw Error('Member permission required.');const c=scopedCases(state,user).find(c=>c.id===payload.id);if(!c||!c.coordinator)throw Error('Wait for coordinator assignment.');c.contact[user.profileId]=!!payload.value;c.stage=c.pair.every(id=>c.contact[id])?'Family contact authorised':'Coordinator assigned';audit('Family contact permission '+(payload.value?'granted':'withdrawn'));break;
 }
 case 'appointment':{
  const a=state.appointments.find(a=>a.id===payload.id&&a.profile===user.profileId);if(!a||user.role!=='member')throw Error('Appointment access denied.');if(!['Confirmed','Change requested'].includes(payload.status))throw Error('Invalid response.');a.status=payload.status;audit('Appointment '+a.status.toLowerCase());break;
 }
 case 'task':{const t=state.tasks.find(t=>t.id===payload.id&&t.org===user.org);if(!t)throw Error('Task access denied.');t.done=!!payload.done;break;}
 case 'enquiry':state.enquiries.push({...payload,id:makeId('E'),date:new Date().toISOString()});break;
 case 'membershipGrant':if(user.role!=='admin'||!payload.reason?.trim())throw Error('An administrator and grant reason are required.');state.membership={status:'Active',period:'Annual',start:new Date().toISOString().slice(0,10),end:new Date(Date.now()+365*86400000).toISOString().slice(0,10)};audit('Annual demo membership granted: '+payload.reason.slice(0,300));break;
 case 'orgStatus':if(user.role!=='admin')throw Error('Admin permission required.');{const o=state.organisations.find(o=>o.id===payload.id);if(!o)throw Error('Organisation not found.');o.status=o.status==='Active'?'Suspended':'Active';audit('Organisation '+o.id+' '+o.status.toLowerCase());}break;
 default:throw Error('Unknown action.');
 }
 return state;
}
function createCase(state,a,b){if(!state.cases.some(c=>c.pair.includes(a)&&c.pair.includes(b))){state.cases.push({id:makeId('IN'),pair:[a,b].sort(),stage:'Awaiting assignment',coordinator:null,coordinatorOrg:null,contact:{[a]:false,[b]:false},history:['Mutual interest confirmed']});}}
