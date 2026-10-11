<?php
declare(strict_types=1);
// Fictional-data demonstration API. Do not deploy with real matrimonial records.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
session_name('covenant_demo');
session_set_cookie_params(['httponly'=>true,'samesite'=>'Strict','secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off','path'=>'/']);
session_start();
function fail(string $message,int $status=400): never {http_response_code($status);echo json_encode(['error'=>$message]);exit;}
if(($_SERVER['REQUEST_METHOD']??'GET')!=='POST')fail('Use a JSON POST request.',405);
if(!str_contains($_SERVER['CONTENT_TYPE']??'','application/json'))fail('JSON content type required.',415);
if(isset($_SERVER['HTTP_ORIGIN']) && parse_url($_SERVER['HTTP_ORIGIN'],PHP_URL_HOST)!==explode(':',$_SERVER['HTTP_HOST']??'')[0])fail('Origin not permitted.',403);
if((int)($_SERVER['CONTENT_LENGTH']??0)>32768)fail('Request too large.',413);
try{$input=json_decode(file_get_contents('php://input'),true,32,JSON_THROW_ON_ERROR);}catch(Throwable $e){fail('Invalid JSON.');}
$a=$input['action']??'';$p=$input['payload']??[];
if(!is_array($p))fail('Invalid payload.');
$_SESSION['csrf']??=bin2hex(random_bytes(24));
$accounts=[
'member'=>['email'=>'member@covenant.demo','name'=>'Rachel Thomas','role'=>'member','profileId'=>'CM1001'],
'branch'=>['email'=>'branch@covenant.demo','name'=>'Anna Mathew','role'=>'branch','org'=>'B01','orgName'=>'Bengaluru branch'],
'church'=>['email'=>'church@covenant.demo','name'=>'Pastor Samuel','role'=>'church','org'=>'C01','orgName'=>'Grace Fellowship'],
'admin'=>['email'=>'admin@covenant.demo','name'=>'Covenant team','role'=>'admin','orgName'=>'Central workspace']];
$user=isset($_SESSION['role'])?($accounts[$_SESSION['role']]??null):null;
if(!in_array($a,['session','login','publicRegister','publicEnquiry'],true)){
 if(!$user)fail('Please sign in.',401);
 if(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))fail('Session permission token missing.',403);
}
$storeDir=getenv('COVENANT_DATA_DIR')?:dirname(__DIR__).'/var';
if(!is_dir($storeDir)&&!mkdir($storeDir,0700,true))fail('Could not open demo storage.',500);
$handle=fopen($storeDir.'/demo.json','c+');if(!$handle||!flock($handle,LOCK_EX))fail('Demo storage unavailable.',500);
$raw=stream_get_contents($handle);$s=$raw?json_decode($raw,true):json_decode(file_get_contents(__DIR__.'/seed.json'),true);
if(!is_array($s))fail('Invalid demo store.',500);
function id(string $prefix):string{return $prefix.bin2hex(random_bytes(6));}
function now():string{return gmdate('c');}
function validProfile(array $p):bool{return $p['status']==='Approved'&&!empty($p['consent'])&&!empty($p['visibility']);}
function managed(array $profile,array $user):bool{return $user['role']==='admin'||($user['role']==='member'&&$profile['id']===$user['profileId'])||in_array($user['org']??'', $profile['managedBy']??[],true);}
function indexOf(array $rows,string $id):int {foreach($rows as $k=>$v)if($v['id']===$id)return $k;fail('Record not found.',404);}
function requireRole(array $user,string $role):void {if($user['role']!==$role)fail('Permission denied.',403);}
function audit(array &$s,array $u,string $m):void {array_unshift($s['audit'],['id'=>id('EV'),'actor'=>$u['name'],'message'=>$m,'date'=>now()]);$s['audit']=array_slice($s['audit'],0,500);}
function newCase(array &$s,string $a,string $b):void {foreach($s['cases']as$c)if(in_array($a,$c['pair'],true)&&in_array($b,$c['pair'],true))return;$pair=[$a,$b];sort($pair);$s['cases'][]=['id'=>id('IN'),'pair'=>$pair,'stage'=>'Awaiting assignment','coordinator'=>null,'coordinatorOrg'=>null,'contact'=>[$a=>false,$b=>false],'history'=>['Mutual interest confirmed']];}
function addProfile(array &$s,array $u,array $p):void {
 $age=filter_var($p['age']??null,FILTER_VALIDATE_INT);
 $states=['Karnataka','Kerala','Tamil Nadu','Andhra Pradesh','Telangana'];
 if(!trim($p['name']??'')||$age===false||$age<21||$age>80||!in_array($p['state']??'',$states,true))fail('Add a name, an age between 21 and 80, and a state.');
 if(empty($p['authority']))fail('Record draft creation authority.');
 array_unshift($s['profiles'],['id'=>id('CM'),'name'=>substr(trim($p['name']),0,100),'age'=>$age,'city'=>substr($p['city']??'',0,100),'state'=>$p['state'],'career'=>substr($p['career']??'',0,100),'gender'=>in_array($p['gender']??'',['Male','Female'],true)?$p['gender']:'Female','denomination'=>substr($p['denomination']??'Protestant',0,100),'language'=>'English','status'=>'Awaiting consent','route'=>$u['role']==='member'?'online':$u['role'],'originalOrg'=>$u['org']??null,'managedBy'=>isset($u['org'])?[$u['org']]:[],'consent'=>false,'evidence'=>false,'photo'=>false,'photoVisible'=>false,'visibility'=>false,'affiliation'=>'Pending','portrait'=>3,'bio'=>'','created'=>gmdate('Y-m-d')]);
 audit($s,$u,'Profile draft created; member consent required');
}
function scoped(array $s,array $u):array {
 if($u['role']==='admin')return $s;
 $own=$u['profileId']??null;$org=$u['org']??null;$ownerEligible=false;foreach($s['profiles']as$pr)if($pr['id']===$own)$ownerEligible=validProfile($pr);
 $s['cases']=array_values(array_filter($s['cases'],fn($c)=>$own?in_array($own,$c['pair'],true):($c['coordinatorOrg']===$org&&!empty($c['coordinator']))));
 $s['interests']=$own?array_values(array_filter($s['interests'],fn($i)=>$i['from']===$own||$i['to']===$own)):[];
 $ids=[];foreach($s['cases']as$c)foreach($c['pair']as$id)$ids[]=$id;
 foreach($s['interests']as$i){$ids[]=$i['from'];$ids[]=$i['to'];}
 $s['profiles']=array_values(array_filter($s['profiles'],fn($p)=>managed($p,$u)||in_array($p['id'],$ids,true)||($own&&$ownerEligible&&validProfile($p))));
 // Strip operational evidence metadata and private prose from unrelated discovery profiles.
 foreach($s['profiles']as&$pr)if(!managed($pr,$u)){unset($pr['confirmationBasis'],$pr['confirmedBy'],$pr['confirmationDate'],$pr['reviewReason']);$pr['managedBy']=[];$pr['evidence']=false;}
 unset($pr);
 $s['tasks']=$org?array_values(array_filter($s['tasks'],fn($t)=>$t['org']===$org)):[];
 $s['staff']=$org?array_values(array_filter($s['staff'],fn($t)=>$t['org']===$org)):[];
 $s['appointments']=$own?array_values(array_filter($s['appointments'],fn($t)=>$t['profile']===$own)):[];
 $s['organisations']=$org?array_values(array_filter($s['organisations'],fn($o)=>$o['id']===$org)):[];
 $s['enquiries']=[];$s['audit']=[];return $s;
}
if($user&&isset($user['org']))foreach($s['organisations']as$o)if($o['id']===$user['org']&&$o['status']!=='Active'){unset($_SESSION['role']);fail('Organisation access is suspended.',403);}
$save=false;$extra=[];
switch($a){
case 'session':break;
case 'login':
 $attempts=$_SESSION['login_attempts']??[];$attempts=array_values(array_filter($attempts,fn($t)=>$t>time()-60));
 if(count($attempts)>=10)fail('Try signing in again in one minute.',429);
 $attempts[]=time();$_SESSION['login_attempts']=$attempts;
 $candidate=null;foreach($accounts as$r=>$ac)if(strtolower($p['email']??'')===$ac['email'])$candidate=$ac;
 // The published password is intentional: these are fictional demonstration accounts.
 $hash=password_hash('Covenant@2026',PASSWORD_DEFAULT);
 if(!$candidate||!password_verify($p['password']??'',$hash))fail('Use the demo email and password shown.',401);
 if(isset($candidate['org']))foreach($s['organisations']as$o)if($o['id']===$candidate['org']&&$o['status']!=='Active')fail('Organisation access is suspended.',403);
 session_regenerate_id(true);$_SESSION['role']=$candidate['role'];$_SESSION['csrf']=bin2hex(random_bytes(24));$_SESSION['login_attempts']=[];$user=$candidate;break;
case 'logout':unset($_SESSION['role']);session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(24));$user=null;break;
case 'publicRegister':addProfile($s,['name'=>'Online demo applicant','role'=>'member'],$p);$save=true;$extra=['created'=>true];break;
case 'publicEnquiry':
 if(!trim($p['name']??'')||!filter_var($p['email']??'',FILTER_VALIDATE_EMAIL))fail('Add a name and a valid email.');
 $s['enquiries'][]=['id'=>id('E'),'date'=>now(),'name'=>substr($p['name'],0,100),'email'=>substr($p['email'],0,150),'organisation'=>substr($p['organisation']??'',0,100),'state'=>substr($p['state']??'',0,100),'message'=>substr($p['message']??'',0,800),'type'=>in_array($p['type']??'',['church','branch','support','general'],true)?$p['type']:'general'];$save=true;$extra=['created'=>true];break;
case 'addProfile':if(!in_array($user['role'],['member','branch','church'],true))fail('Registration permission required.',403);addProfile($s,$user,$p);$save=true;break;
case 'sendInterest':
 requireRole($user,'member');$own=$s['profiles'][indexOf($s['profiles'],$user['profileId'])];$other=$s['profiles'][indexOf($s['profiles'],$p['id']??'')];
 if(!validProfile($own)||!validProfile($other)||$own['id']===$other['id']||$own['gender']===$other['gender'])fail('This profile is not eligible for interest.');
 foreach($s['cases']as$c)if(in_array($own['id'],$c['pair'],true)&&in_array($other['id'],$c['pair'],true))fail('An introduction already exists.');
 $existing=false;foreach($s['interests']as&$i)if(in_array($own['id'],[$i['from'],$i['to']],true)&&in_array($other['id'],[$i['from'],$i['to']],true)&&in_array($i['status'],['Pending','Accepted'],true)){$existing=true;if($i['to']===$own['id']&&$i['status']==='Pending'){$i['status']='Accepted';newCase($s,$own['id'],$other['id']);}break;}unset($i);
 if(!$existing){$s['interests'][]=['id'=>id('I'),'from'=>$own['id'],'to'=>$other['id'],'status'=>'Pending'];audit($s,$user,'Interest sent');}$save=true;break;
case 'respondInterest':
 requireRole($user,'member');$k=indexOf($s['interests'],$p['id']??'');$i=&$s['interests'][$k];if($i['status']!=='Pending')break;
 if(($p['response']??'')==='Withdrawn'&&$i['from']===$user['profileId']){$i['status']='Withdrawn';$save=true;break;}
 if($i['to']!==$user['profileId']||!in_array($p['response']??'',['Accepted','Declined'],true))fail('Response not permitted.',403);
 if($p['response']==='Accepted'&&(!validProfile($s['profiles'][indexOf($s['profiles'],$i['from'])])||!validProfile($s['profiles'][indexOf($s['profiles'],$i['to'])])))fail('Both profiles must be eligible.');
 $i['status']=$p['response'];if($i['status']==='Accepted')newCase($s,$i['from'],$i['to']);audit($s,$user,'Interest '.strtolower($i['status']));unset($i);$save=true;break;
case 'privacy':
 requireRole($user,'member');$k=indexOf($s['profiles'],$user['profileId']);foreach(['discovery'=>'visibility','photos'=>'photoVisible']as$input=>$field)if(isset($p[$input])&&is_bool($p[$input])){$s['profiles'][$k][$field]=$p[$input];$s['privacy'][$input]=$p[$input];}audit($s,$user,'Visibility permission updated');$save=true;break;
case 'updateProfile':
 requireRole($user,'member');if(isset($p['state'])&&!in_array($p['state'],['Karnataka','Kerala','Tamil Nadu','Andhra Pradesh','Telangana'],true))fail('Choose a configured state.');$k=indexOf($s['profiles'],$user['profileId']);foreach(['name','city','career','bio','language','state']as$f)if(isset($p[$f])&&is_string($p[$f]))$s['profiles'][$k][$f]=substr(trim($p[$f]),0,$f==='bio'?800:100);
 if($s['profiles'][$k]['status']==='Approved')$s['profiles'][$k]['status']='Changes requested';audit($s,$user,'Profile details saved; changes require review');$save=true;break;
case 'preferences':requireRole($user,'member');foreach(['state','language','relocation']as$f)if(isset($p[$f]))$s['preferences'][$f]=substr($p[$f],0,100);$save=true;break;
case 'recordConsent':
 requireRole($user,'member');if(($p['id']??'')!==$user['profileId'])fail('Only the profile owner can confirm consent.',403);$k=indexOf($s['profiles'],$user['profileId']);$s['profiles'][$k]['consent']=($p['value']??false)===true;audit($s,$user,'Member consent updated');$save=true;break;
case 'submitProfile':
 $k=indexOf($s['profiles'],$p['id']??'');$pr=&$s['profiles'][$k];if(!managed($pr,$user))fail('Profile access denied.',403);if(!$pr['consent']||!$pr['evidence'])fail('Member consent and evidence are required.');if(!in_array($pr['status'],['Approved','Under review'],true)){$pr['status']='Under review';audit($s,$user,'Profile submitted to central review');}$save=true;unset($pr);break;
case 'confirmation':
 requireRole($user,'church');$k=indexOf($s['profiles'],$p['id']??'');if(!managed($s['profiles'][$k],$user))fail('Church confirmation access denied.',403);if(!trim($p['basis']??''))fail('Add the confirmation basis.');$s['profiles'][$k]['affiliation']='Confirmed';$s['profiles'][$k]['confirmedBy']=$user['name'];$s['profiles'][$k]['confirmationBasis']=substr($p['basis'],0,500);$s['profiles'][$k]['confirmationDate']=now();audit($s,$user,'Church affiliation confirmed for '.$p['id']);$save=true;break;
case 'review':
 requireRole($user,'admin');$k=indexOf($s['profiles'],$p['id']??'');$pr=&$s['profiles'][$k];if(!in_array($p['status']??'',['Approved','Changes requested','Suspended'],true))fail('Invalid decision.');if(!trim($p['reason']??''))fail('Record a reason.');if($p['status']==='Approved'&&(!$pr['consent']||!$pr['evidence']))fail('Consent and evidence are required for approval.');$pr['status']=$p['status'];$pr['reviewReason']=substr($p['reason'],0,500);audit($s,$user,$pr['id'].' '.strtolower($pr['status']).': '.$pr['reviewReason']);unset($pr);$save=true;break;
case 'assign':
 requireRole($user,'admin');$k=indexOf($s['cases'],$p['id']??'');$name=($p['coordinator']??'')==='Anna Mathew'?'Anna Mathew':'Pastor Samuel';$s['cases'][$k]['coordinator']=$name;$s['cases'][$k]['coordinatorOrg']=$name==='Anna Mathew'?'B01':'C01';$s['cases'][$k]['stage']='Coordinator assigned';$s['cases'][$k]['history'][]=$name.' assigned';audit($s,$user,'Coordinator assigned to '.$p['id']);$save=true;break;
case 'contactConsent':
 requireRole($user,'member');$k=indexOf($s['cases'],$p['id']??'');$c=&$s['cases'][$k];if(!in_array($user['profileId'],$c['pair'],true))fail('Case access denied.',403);if(!$c['coordinator'])fail('Wait for coordinator assignment.');$c['contact'][$user['profileId']]=($p['value']??false)===true;$c['stage']=count(array_filter($c['contact']))===2?'Family contact authorised':'Coordinator assigned';audit($s,$user,'Family contact permission updated');unset($c);$save=true;break;
case 'appointment':
 requireRole($user,'member');$k=indexOf($s['appointments'],$p['id']??'');if($s['appointments'][$k]['profile']!==$user['profileId'])fail('Appointment access denied.',403);if(!in_array($p['status']??'',['Confirmed','Change requested'],true))fail('Invalid appointment response.');$s['appointments'][$k]['status']=$p['status'];audit($s,$user,'Appointment '.strtolower($p['status']));$save=true;break;
case 'task':
 $k=indexOf($s['tasks'],$p['id']??'');if($s['tasks'][$k]['org']!==($user['org']??null))fail('Task access denied.',403);$s['tasks'][$k]['done']=($p['done']??false)===true;$save=true;break;
case 'membershipGrant':
 requireRole($user,'admin');if(!trim($p['reason']??''))fail('Record a grant reason.');$s['membership']=['status'=>'Active','period'=>'Annual','start'=>gmdate('Y-m-d'),'end'=>gmdate('Y-m-d',time()+365*86400)];audit($s,$user,'Annual demo membership granted: '.substr($p['reason'],0,300));$save=true;break;
case 'orgStatus':
 requireRole($user,'admin');$k=indexOf($s['organisations'],$p['id']??'');$s['organisations'][$k]['status']=$s['organisations'][$k]['status']==='Active'?'Suspended':'Active';audit($s,$user,'Organisation '.$p['id'].' '.strtolower($s['organisations'][$k]['status']));$save=true;break;
default:fail('Unknown action.',404);
}
if($save){$encoded=json_encode($s,JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);rewind($handle);ftruncate($handle,0);fwrite($handle,$encoded);fflush($handle);}
flock($handle,LOCK_UN);fclose($handle);
echo json_encode(array_merge(['user'=>$user,'csrf'=>$_SESSION['csrf'],'state'=>$user?scoped($s,$user):null],$extra),JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
