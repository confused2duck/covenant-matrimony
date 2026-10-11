"""Run bounded PHP demo API checks against an ephemeral localhost test process."""
import json, os, pathlib, socket, subprocess, tempfile, time, urllib.request, urllib.error, http.cookiejar
ROOT=pathlib.Path(__file__).resolve().parents[1]
PHP=os.environ.get('PHP_BIN','php')
class Client:
 def __init__(self,base):
  self.base=base;self.csrf=None
  self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def call(self,action,payload=None,expected=200,token=True):
  headers={'Content-Type':'application/json'}
  if self.csrf and token:headers['X-CSRF-Token']=self.csrf
  req=urllib.request.Request(self.base+'/api.php',data=json.dumps({'action':action,'payload':payload or {}}).encode(),headers=headers)
  try:
   with self.opener.open(req,timeout=5)as r:code=r.status;data=json.load(r)
  except urllib.error.HTTPError as e:code=e.code;data=json.load(e)
  assert code==expected,(action,code,data)
  self.csrf=data.get('csrf',self.csrf);return data
with tempfile.TemporaryDirectory(prefix='covenant-php-test-')as tmp:
 tmp=pathlib.Path(tmp);(tmp/'sessions').mkdir()
 sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
 env={**os.environ,'COVENANT_DATA_DIR':str(tmp/'data')}
 proc=subprocess.Popen([PHP,'-n','-d','session.save_path='+str(tmp/'sessions'),'-S',f'127.0.0.1:{port}','server/router.php'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 base=f'http://127.0.0.1:{port}'
 try:
  for i in range(60):
   try:urllib.request.urlopen(base,timeout=1).close();break
   except OSError:time.sleep(.05)
  else:raise RuntimeError('PHP test process did not start')
  assert "backend:'php'" in urllib.request.urlopen(base+'/runtime-config.js').read().decode()
  try:urllib.request.urlopen(base+'/server/seed.json');raise AssertionError('private seed exposed')
  except urllib.error.HTTPError as e:assert e.code==404
  guest=Client(base);assert guest.call('session')['user'] is None
  guest.call('review',{'id':'CM1005','status':'Approved','reason':'test'},401)
  clients={}
  for role in ['member','branch','church','admin']:
   c=Client(base);r=c.call('login',{'email':role+'@covenant.demo','password':'Covenant@2026'});assert r['user']['role']==role;clients[role]=c
  m,b,c,a=[clients[r]for r in ['member','branch','church','admin']]
  bp=b.call('session')['state']['profiles'];assert all('B01'in p['managedBy']for p in bp)
  cp=c.call('session')['state'];assert 'CM1003'not in[p['id']for p in cp['profiles']]
  b.call('review',{'id':'CM1005','status':'Approved','reason':'test'},403)
  b.call('submitProfile',{'id':'CM1006'},400)
  c.call('confirmation',{'id':'CM1003','basis':'test'},403)
  m.call('privacy',{'discovery':False},403,token=False)
  r=m.call('respondInterest',{'id':'I01','response':'Accepted'});case=next(x for x in r['state']['cases']if 'CM1002'in x['pair'])
  r=m.call('respondInterest',{'id':'I01','response':'Accepted'});assert len([x for x in r['state']['cases']if 'CM1002'in x['pair']])==1
  assert not any(case['contact'].values())
  m.call('contactConsent',{'id':case['id'],'value':True},400)
  a.call('assign',{'id':case['id'],'coordinator':'Pastor Samuel'})
  r=m.call('contactConsent',{'id':case['id'],'value':True});case=next(x for x in r['state']['cases']if x['id']==case['id']);assert case['contact']['CM1002']is False
  a.call('review',{'id':'CM1006','status':'Approved','reason':'test'},400)
  r=a.call('review',{'id':'CM1005','status':'Approved','reason':'Evidence checked'});assert r['state']['membership']['status']=='Pending'
  assert len(c.call('session')['state']['cases'])==2
  a.call('assign',{'id':'IN101','coordinator':'Anna Mathew'})
  assert len(c.call('session')['state']['cases'])==1
  assert any(x['id']=='IN101'for x in b.call('session')['state']['cases'])
  guest.call('publicRegister',{'name':'Online Example','age':28,'state':'Karnataka','city':'Bengaluru','authority':True})
  r=a.call('session');draft=next(x for x in r['state']['profiles']if x['name']=='Online Example');assert draft['status']=='Awaiting consent'and draft['route']=='online'
  r=b.call('addProfile',{'name':'Branch Example','age':29,'state':'Karnataka','authority':True});draft=next(x for x in r['state']['profiles']if x['name']=='Branch Example');assert draft['originalOrg']=='B01'and not draft['consent']
  c.call('confirmation',{'id':'CM1008','basis':'Church membership record checked'})
  m.call('appointment',{'id':'AP01','status':'Confirmed'})
  a.call('membershipGrant',{'reason':'Fictional showcase grant'})
  r=m.call('session');assert r['state']['membership']['status']=='Active'
  a.call('orgStatus',{'id':'B01'});b.call('session',expected=403)
  print('PASS: PHP sessions, scoped records, CSRF, consent gating, central review, idempotent interests, contact permission, reassignment, registration, appointments, grants and partner suspension')
 finally:
  proc.terminate()
  try:proc.wait(timeout=3)
  except subprocess.TimeoutExpired:proc.kill();proc.wait()
