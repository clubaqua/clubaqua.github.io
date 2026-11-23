/* 딜러 CRM 비교 화면 (Claude안). 운영 데이터 읽기 전용. 원본: renault-mulgeum demo/crm-claude/index.html */

'use strict';
/* ───────── 데이터 계층 ─────────
   실제 crm-api와 같은 모양(고객 필드: name, phone, stage, model, trim, region, contractDate, deliveryDate,
   insuranceExpiry, nextContact, testDriveDate, vehicleNo, followUps[{id,date,memo,kind}])을 쓴다.
   2단계에서 MockSource를 ApiSource(같은 로그인·PIN·/api/customers)로 바꾸면 화면은 그대로 동작한다. */
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const iso=d=>{const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
const d=n=>{const x=new Date(TODAY);x.setDate(x.getDate()+n);return iso(x);};
const STAGES=['신규','상담중','시승-상담중','계약','공동명의','가족구매','출고완료','보류','해약','접촉종료'];
const GROUPS=[{id:'all',label:'전체',stages:STAGES},{id:'talk',label:'상담',stages:['신규','상담중','시승-상담중']},{id:'contract',label:'계약',stages:['계약','공동명의','가족구매']},{id:'done',label:'출고',stages:['출고완료']},{id:'hold',label:'보류·종료',stages:['보류','해약','접촉종료']}];
const stageClass=s=>s==='신규'?'st-new':['상담중','시승-상담중'].includes(s)?'st-talk':['계약','공동명의','가족구매'].includes(s)?'st-contract':s==='출고완료'?'st-done':s==='보류'?'st-hold':'st-end';
const MODELS=[['그랑 콜레오스','아이코닉'],['그랑 콜레오스','에스프리 알핀'],['아르카나','테크노'],['아르카나','에스프리 알핀'],['QM6','LE'],['세닉 E-Tech','테크노'],['마스터','밴']];
const REG=['양산 물금','양산 중부','부산 북구','김해 장유','부산 금정','양산 덕계','부산 사상'];
function seed(){
 const names=['김민준','이서연','박지훈','최수아','정우진','강하은','조현우','윤지민','장도윤','임채원','한승민','오예린','서준호','신유나','권태양','황보람','안재희','송다인','류건우','전소율','홍성민','고은비','문지환','배서윤'];
 const plan=[ // [stage, nextContact offset, contract offset, delivery offset, insurance offset]
  ['신규',0],['상담중',0],['시승-상담중',-2],['상담중',1],['계약',0,-12,3],['계약',2,-20,5],['공동명의',null,-9,1],['출고완료',null,-60,-45,20],['출고완료',-1,-200,-185,9],['상담중',-4],['신규',null],['보류',6],['가족구매',null,-15,6],['출고완료',null,-400,-380,28],['시승-상담중',3],['상담중',0],['해약',null,-30],['접촉종료',null],['계약',null,-5,12],['출고완료',30,-120,-100,140],['신규',0],['상담중',7],['출고완료',null,-30,-14,350],['보류',-9]];
 const memos=['전화 상담. 가족 4인, 주말 장거리 위주. 하이브리드 관심','견적 문자 발송. 할부 60개월 조건 비교 요청','전시장 방문 예정. 배우자와 함께 시승 원함','기존 차량 처분 문의. 중고 시세 확인 후 연락','보험 갱신 견적 비교 원함','출고 일정 안내. 탁송 희망','색상 변경 가능 여부 문의','계약금 입금 확인'];
 return names.map((name,i)=>{const p=plan[i],[model,trim]=MODELS[i%MODELS.length];const fu=[];const n=1+(i%3);for(let k=0;k<n;k++)fu.push({id:'f'+i+'-'+k,date:d(-(k*6+(i%5)+1)),memo:memos[(i+k)%memos.length],kind:['전화','문자','방문','상담'][(i+k)%4]});
  return {id:'demo-'+String(i+1).padStart(3,'0'),name,phone:'010-5550-'+String(1000+i*37).slice(-4),stage:p[0],model,trim,region:REG[i%REG.length],nextContact:p[1]==null?'':d(p[1]),contractDate:p[2]==null?'':d(p[2]),deliveryDate:p[3]==null?'':d(p[3]),insuranceExpiry:p[4]==null?'':d(p[4]),testDriveDate:p[0]==='시승-상담중'?d(-3):'',vehicleNo:p[0]==='출고완료'?(12+i)+'가 '+(3000+i*41):'',followUps:fu,created:d(-(i*4+2))};});
}
const INTAKES=[{id:'in-1',at:d(0)+' 09:42',source:'차량 찾기',name:'이서연',phone:'010-5550-1037',summary:'4인 가족 · 예산 4천만 원대 · 하이브리드',review:{existingCustomer:true,surge:false}},{id:'in-2',at:d(0)+' 08:15',source:'내차만들기',name:'노지수',phone:'010-5550-9911',summary:'그랑 콜레오스 에스프리 알핀 · 견적 저장',review:{existingCustomer:false,surge:false}},{id:'in-3',at:d(-1)+' 23:58',source:'차량 찾기',name:'테스트',phone:'010-5550-0000',summary:'답변 대부분 비어 있음',review:{existingCustomer:false,surge:true}}];
const LEDGER=[{id:'l1',date:d(-3),customer:'김민준',item:'틴팅·블랙박스 장착',kind:'용품',amount:1150000},{id:'l2',date:d(-8),customer:'홍성민',item:'1차 무상점검 안내',kind:'정비',amount:0},{id:'l3',date:d(-12),customer:'최수아',item:'탁송비',kind:'비용',amount:-180000},{id:'l4',date:d(-15),customer:'문지환',item:'코팅 패키지',kind:'용품',amount:690000},{id:'l5',date:d(-21),customer:'배서윤',item:'번호판 등록 대행',kind:'비용',amount:-55000},{id:'l6',date:d(-27),customer:'고은비',item:'썬팅 업그레이드',kind:'용품',amount:420000}];
const MockSource={
 key:'crm-demo-claude-v1',
 load(){try{const raw=localStorage.getItem(this.key);if(raw){const j=JSON.parse(raw);if(Array.isArray(j.customers))return j;}}catch(_){}return {customers:seed(),intakes:INTAKES.map(x=>({...x})),ledger:LEDGER};},
 save(state){try{localStorage.setItem(this.key,JSON.stringify({customers:state.customers,intakes:state.intakes,ledger:state.ledger}));}catch(_){}},
 reset(){try{localStorage.removeItem(this.key);}catch(_){}}
};
/* ───────── 운영 연결 (읽기 전용) ─────────
   window.RenaultCRMConfig(운영 crm/config.js)가 있을 때만 켜진다. 원칙:
   - 조회(GET)만 보낸다. 로그인·PIN 확인·세션 갱신 외의 POST/PATCH/DELETE는 이 화면에서 막는다.
   - 기존 CRM과 다른 저장 키를 쓴다(sessionStorage 'crm-b-session').
   - /api/logout은 부르지 않는다: 운영 서버의 로그아웃은 모든 기기 로그아웃(scope 기본값 global)이라 기존 CRM까지 끊긴다. */
const LIVE=!!window.RenaultCRMConfig?.apiBase;
const API=LIVE?String(window.RenaultCRMConfig.apiBase).replace(/\/$/,''):'';
const SKEY='crm-b-session',ALLOWED_POST=['/api/login','/api/pin/verify','/api/session/refresh'];
let session=null;try{session=JSON.parse(sessionStorage.getItem(SKEY)||'null');}catch(_){session=null;}
const keepSession=s=>{session=s;try{s?sessionStorage.setItem(SKEY,JSON.stringify(s)):sessionStorage.removeItem(SKEY);}catch(_){}};
async function raw(p,method,body,token){const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),20000);
 try{const r=await fetch(API+p,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:ctrl.signal});const data=await r.json().catch(()=>({}));return {r,data};}
 catch(_){throw Error('서버에 연결하지 못했습니다. 네트워크를 확인하세요.');}finally{clearTimeout(t);}}
async function api(p,{method='GET',body}={}){
 if(method!=='GET'&&!ALLOWED_POST.includes(p))throw Error('읽기 전용 비교 화면입니다. 수정은 기존 CRM에서 하세요.');
 if(session?.refreshToken&&Number(session.expires)<Date.now()+300000&&p!=='/api/session/refresh'){const {r,data}=await raw('/api/session/refresh','POST',{refreshToken:session.refreshToken});if(r.ok&&data.token)keepSession({...session,...data});else{keepSession(null);throw Object.assign(Error('로그인이 만료되었습니다. 다시 로그인하세요.'),{status:401});}}
 const {r,data}=await raw(p,method,body,session?.token);
 if(!r.ok){if(r.status===401)keepSession(null);throw Object.assign(Error(data.error||'요청을 처리하지 못했습니다.'),{status:r.status});}
 return data;}
function liveCustomers(list){return list.map(c=>({...c,followUps:Array.isArray(c.followUps)?c.followUps.slice().sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0):[],model:c.model||c.purchasedModel||'',trim:c.trim||'',region:c.region||'',created:String(c.created||'').slice(0,10)}));}
function liveIntakes(cs){return cs.filter(c=>c.stage==='신규'&&c.created&&days(c.created)>=-3).map(c=>({id:'new-'+c.id,at:c.created+' ',source:'신규 등록',name:c.name,phone:c.phone,summary:[c.model,c.region].filter(Boolean).join(' · ')||'정보 입력 전',review:{}}));}
const extra={};
async function loadDetail(id){if(!LIVE||extra[id])return;extra[id]={loading:true};try{const j=await api('/api/customers/'+id);extra[id]={events:j.events||[],notes:j.notes||[]};}catch(e){extra[id]={error:e.message};}if(state.selected===id&&state.view==='customers')render();}
const writable=()=>{if(!LIVE)return true;toast('읽기 전용 비교 화면입니다. 수정은 기존 CRM에서 하세요');return false;};
const state={...(LIVE?{customers:[],intakes:[],ledger:[]}:MockSource.load()),view:'today',group:'all',q:'',sort:'next',selected:null};
const save=()=>{if(!LIVE)MockSource.save(state);};
const byId=id=>state.customers.find(c=>c.id===id);

/* ───────── 도우미 ───────── */
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const days=s=>s?Math.round((new Date(s+'T00:00:00')-TODAY)/864e5):null;
const WD=['일','월','화','수','목','금','토'];
const md=s=>{if(!s)return '—';const x=new Date(s+'T00:00:00');return (x.getMonth()+1)+'.'+x.getDate()+' ('+WD[x.getDay()]+')';};
const rel=s=>{const n=days(s);if(n==null)return '';if(n===0)return '오늘';if(n===1)return '내일';if(n===-1)return '어제';return n<0?(-n)+'일 지남':n+'일 후';};
const won=n=>(n<0?'−':'')+Math.abs(n).toLocaleString('ko-KR')+'원';
const ic={
 today:'<path d="M3 10h18M8 3v4M16 3v4"/><rect x="3" y="5" width="18" height="16" rx="3"/><path d="m9 15 2 2 4-4"/>',
 customers:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
 ledger:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>',
 tools:'<path d="M4 6h10M4 12h16M4 18h7"/><circle cx="17" cy="6" r="2"/><circle cx="14" cy="18" r="2"/>',
 prefs:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
 phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
 sms:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',
 copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
 close:'<path d="M18 6 6 18M6 6l12 12"/>',
 back:'<path d="m15 18-6-6 6-6"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
};
const svg=(k,w=18)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic[k]}</svg>`;
let toastTimer;function toast(t){let n=$('.toast');if(!n){n=document.createElement('div');n.className='toast';n.setAttribute('role','status');document.body.append(n);}n.textContent=t;n.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.hidden=true,2200);}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('복사했습니다: '+text);}catch(_){toast('복사하지 못했습니다. 번호를 길게 눌러 선택하세요.');}}
const isPhone=()=>matchMedia('(max-width:900px)').matches;

/* ───────── 계산 ───────── */
const active=c=>!['해약','접촉종료'].includes(c.stage);
const callsToday=()=>state.customers.filter(c=>active(c)&&c.nextContact&&days(c.nextContact)<=0).sort((a,b)=>days(a.nextContact)-days(b.nextContact));
const weekDeliveries=()=>state.customers.filter(c=>c.deliveryDate&&days(c.deliveryDate)>=0&&days(c.deliveryDate)<7);
const flagged=()=>state.intakes.filter(x=>!x.done);
function alerts(){const out=[];for(const c of state.customers){const n=days(c.insuranceExpiry);if(n!=null&&n>=0&&n<=30)out.push({c,kind:'보험 만기',when:c.insuranceExpiry,tone:n<=10?'flag-danger':'flag-warn'});if(['계약','공동명의','가족구매'].includes(c.stage)&&!c.deliveryDate)out.push({c,kind:'출고일 미정',when:'',tone:'flag-warn'});const dd=days(c.deliveryDate);if(c.stage==='출고완료'&&dd!=null&&dd<0&&(-dd)%180>=170)out.push({c,kind:'정기점검 안내',when:'',tone:''});}return out.sort((a,b)=>(a.when||'9')<(b.when||'9')?-1:1).slice(0,6);}

/* ───────── 네비 ───────── */
const VIEWS=[['today','오늘'],['customers','고객'],['ledger','차계부'],['tools','도구'],['prefs','설정']];
function renderNav(){const badge=v=>v==='today'&&(callsToday().length+flagged().length)?`<span class="badge">${callsToday().length+flagged().length}</span>`:'';
 $('#sideNav').innerHTML=VIEWS.map(([v,l])=>`<button class="nav-btn" type="button" data-go="${v}" ${state.view===v?'aria-current="page"':''}>${svg(v,19)}${l}${badge(v)}</button>`).join('');
 $('#tabbar').innerHTML=VIEWS.map(([v,l])=>`<button type="button" data-go="${v}" ${state.view===v?'aria-current="page"':''}>${svg(v,22)}${l}${badge(v)}</button>`).join('');}
function go(v,opts={}){if(!VIEWS.some(x=>x[0]===v))v='today';state.view=v;if(opts.select!==undefined)state.selected=opts.select;if(location.hash!=='#'+v)history.replaceState(null,'','#'+v);render();window.scrollTo({top:0});}

/* ───────── 오늘 ───────── */
function viewToday(){
 const calls=callsToday(),week=weekDeliveries(),intakes=flagged(),al=alerts();
 const now=TODAY,title=(now.getMonth()+1)+'월 '+now.getDate()+'일 '+WD[now.getDay()]+'요일';
 const counts=GROUPS.slice(1).map(g=>({g,n:state.customers.filter(c=>g.stages.includes(c.stage)).length}));
 const total=counts.reduce((a,b)=>a+b.n,0)||1,colors=['var(--accent)','var(--ok)','var(--fg)','var(--faint)'];
 const monthContracts=state.customers.filter(c=>c.contractDate&&c.contractDate.slice(0,7)===iso(TODAY).slice(0,7)).length;
 const monthDeliv=state.customers.filter(c=>c.deliveryDate&&c.deliveryDate.slice(0,7)===iso(TODAY).slice(0,7)).length;
 const wk=[...Array(7)].map((_,i)=>{const day=d(i);return {day,items:week.filter(c=>c.deliveryDate===day)};});
 return `<section class="view">
 <div class="demo-band">${LIVE?'운영 데이터 · 읽기 전용 비교 화면 (수정은 기존 CRM에서)':'데모 화면 · 이름과 번호는 모두 가상입니다'}</div>
 <div class="hello"><h1>${title}</h1><div class="stats"><span><b>${calls.length}</b>명 연락</span><span><b>${week.length}</b>대 이번 주 출고</span><span><b>${intakes.length}</b>건 새 접수</span></div></div>
 <div class="bento">
  <article class="card b-calls"><div class="card-head"><h2>오늘 연락할 고객 <span class="count">${calls.length}</span></h2><button class="btn btn-sm btn-ghost" data-go="customers">전체 고객</button></div>
   <div class="rows">${calls.length?calls.map(c=>{const n=days(c.nextContact);const last=c.followUps?.[0];return `<div class="row"><div class="row-main"><div class="row-title"><button class="link" data-open="${c.id}">${esc(c.name)}</button><span class="chip ${stageClass(c.stage)}">${esc(c.stage)}</span><span class="${n<0?'due-over':'due-today'}" style="font-size:13px">${rel(c.nextContact)}</span></div><div class="row-sub">${esc(c.model)} ${esc(c.trim)} · ${last?esc(last.memo):'메모 없음'}</div></div><div class="row-actions"><a class="btn btn-sm" href="tel:${esc(c.phone.replace(/-/g,''))}" aria-label="${esc(c.name)}에게 전화">${svg('phone',15)}</a><button class="btn btn-sm" data-memo="${c.id}" aria-label="${esc(c.name)} 메모">${svg('sms',15)}</button><button class="btn btn-sm" data-done="${c.id}" aria-label="${esc(c.name)} 연락 완료">${svg('check',15)}</button></div></div>`;}).join(''):'<div class="empty">오늘 연락할 고객을 모두 처리했습니다.</div>'}</div></article>
  <article class="card b-intake"><div class="card-head"><h2>새 상담 접수 <span class="count">${intakes.length}</span></h2></div>
   <div class="rows">${intakes.length?intakes.map(x=>`<div class="row"><div class="row-main"><div class="row-title">${esc(x.name)} <span class="chip plain">${esc(x.source)}</span>${x.review.existingCustomer?'<span class="chip flag-warn">기존 고객과 연결</span>':''}${x.review.surge?'<span class="chip flag-danger">접수 급증 시간대</span>':''}</div><div class="row-sub">${esc(x.at.slice(5).replace('-','.'))} · ${esc(x.summary)}</div></div><div class="row-actions"><button class="btn btn-sm" data-intake="${x.id}">확인</button></div></div>`).join(''):'<div class="empty">확인할 접수가 없습니다.</div>'}</div></article>
  <article class="card b-alerts"><div class="card-head"><h2>챙길 일 <span class="count">${al.length}</span></h2></div>
   <div class="rows">${al.length?al.map(a=>`<div class="row"><div class="row-main"><div class="row-title"><button class="link" data-open="${a.c.id}">${esc(a.c.name)}</button><span class="chip ${a.tone||'plain'}">${a.kind}</span></div><div class="row-sub">${a.when?md(a.when)+' · '+rel(a.when):esc(a.c.model)}</div></div></div>`).join(''):'<div class="empty">챙길 일이 없습니다.</div>'}</div></article>
  <article class="card b-week"><div class="card-head"><h2>이번 주 출고 <span class="count">${week.length}</span></h2></div>
   <div class="week">${wk.map((w,i)=>{const x=new Date(w.day+'T00:00:00');return `<div class="day ${i===0?'is-today':''}"><div class="day-label">${WD[x.getDay()]}<b>${x.getDate()}</b></div>${w.items.map(c=>`<button class="day-item" data-open="${c.id}"><b>${esc(c.name)}</b>${esc(c.model)}</button>`).join('')}</div>`;}).join('')}</div></article>
  <article class="card b-funnel"><div class="card-head"><h2>고객 현황</h2><span class="muted num" style="font-size:13px">${state.customers.length}명</span></div>
   <div class="funnel"><div class="bar" role="img" aria-label="단계별 고객 비율">${counts.map((x,i)=>`<span style="width:${x.n/total*100}%;background:${colors[i]}"></span>`).join('')}</div>
   <div class="legend">${counts.map((x,i)=>`<div><i style="background:${colors[i]}"></i>${x.g.label}<b>${x.n}</b></div>`).join('')}</div>
   <div class="kpis"><div class="kpi"><span>이번 달 계약</span><b>${monthContracts}</b></div><div class="kpi"><span>이번 달 출고</span><b>${monthDeliv}</b></div><div class="kpi"><span>연락 밀림</span><b style="color:var(--danger)">${calls.filter(c=>days(c.nextContact)<0).length}</b></div></div></div></article>
 </div></section>`;}

/* ───────── 고객 ───────── */
function filtered(){const g=GROUPS.find(x=>x.id===state.group)||GROUPS[0];const q=state.q.trim().replace(/-/g,'').toLowerCase();
 let list=state.customers.filter(c=>g.stages.includes(c.stage)&&(!q||[c.name,c.phone.replace(/-/g,''),c.model,c.region,c.vehicleNo].join(' ').toLowerCase().includes(q)));
 const far=s=>s?s:'9999';
 const sorters={next:(a,b)=>far(a.nextContact)<far(b.nextContact)?-1:1,delivery:(a,b)=>far(a.deliveryDate)<far(b.deliveryDate)?-1:1,recent:(a,b)=>a.created<b.created?1:-1,name:(a,b)=>a.name.localeCompare(b.name,'ko')};
 return list.sort(sorters[state.sort]||sorters.next);}
function viewCustomers(){const list=filtered(),sel=state.selected&&byId(state.selected);
 return `<section class="view"><div class="view-head"><div><h1>고객</h1><p>${state.customers.length}명 · 표에서 고르면 오른쪽에서 바로 수정합니다</p></div></div>
 <div class="tabs" role="tablist">${GROUPS.map(g=>`<button class="tab" role="tab" type="button" data-group="${g.id}" aria-selected="${state.group===g.id}">${g.label}<span class="n">${state.customers.filter(c=>g.stages.includes(c.stage)).length}</span></button>`).join('')}</div>
 <div class="toolbar"><label class="field-search">${svg('search',16)}<input id="q" type="search" placeholder="이름·번호·차종·지역·차량번호" value="${esc(state.q)}" autocomplete="off" aria-label="고객 검색"></label>
  <select class="select" id="sort" aria-label="정렬"><option value="next">다음 연락순</option><option value="delivery">출고일순</option><option value="recent">최근 등록순</option><option value="name">이름순</option></select></div>
 <div class="split ${sel||!isPhone()?'':'no-detail'}">
  <div style="min-width:0" id="listArea">${listHtml(list)}</div>
  <aside class="detail" id="detail" ${!sel&&isPhone()?'hidden':''} aria-label="고객 상세">${sel?detailHtml(sel):'<div class="d-empty">'+svg('user',40)+'<div>왼쪽 목록에서 고객을 고르세요.</div><div style="font-size:13px;margin-top:6px">단축키: <kbd>Ctrl K</kbd> 로 바로 찾기</div></div>'}</aside>
 </div></section>`;}
function listHtml(list){return `<div class="table-wrap"><table><thead><tr><th>고객</th><th>단계</th><th>차량</th><th>다음 연락</th><th>출고일</th><th>지역</th></tr></thead><tbody>
  ${list.map(c=>`<tr data-open="${c.id}" aria-selected="${state.selected===c.id}" tabindex="0"><td class="cell-name"><b>${esc(c.name)}</b><span class="num">${esc(c.phone)}</span></td><td><span class="chip ${stageClass(c.stage)}">${esc(c.stage)}</span></td><td>${esc(c.model)}<span class="muted"> · ${esc(c.trim)}</span></td><td class="num ${c.nextContact&&days(c.nextContact)<0?'due-over':c.nextContact&&days(c.nextContact)===0?'due-today':''}">${c.nextContact?md(c.nextContact)+' <span class="muted" style="font-weight:400">'+rel(c.nextContact)+'</span>':'—'}</td><td class="num">${md(c.deliveryDate)}</td><td class="muted">${esc(c.region)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">조건에 맞는 고객이 없습니다.</td></tr>'}
  </tbody></table></div>
  <div class="cards">${list.map(c=>`<button class="c-card" type="button" data-open="${c.id}"><span class="l1">${esc(c.name)}<span class="chip ${stageClass(c.stage)}">${esc(c.stage)}</span></span><span class="num muted" style="font-size:13px">${esc(c.phone)}</span><span class="l2"><span>${esc(c.model)} ${esc(c.trim)}</span>${c.nextContact?`<span class="${days(c.nextContact)<0?'due-over':days(c.nextContact)===0?'due-today':''}">연락 ${rel(c.nextContact)}</span>`:''}${c.deliveryDate?`<span>출고 ${md(c.deliveryDate)}</span>`:''}</span></button>`).join('')||'<div class="empty">조건에 맞는 고객이 없습니다.</div>'}</div>`;}
let memoKind='전화';
function detailHtml(c){const ex=LIVE?extra[c.id]:null;const liveTl=ex&&!ex.loading&&!ex.error?[...ex.notes.map(n=>({id:n.id,date:String(n.created||'').slice(0,10),memo:n.body,kind:n.kind||'메모',t:'f'})),...ex.events.map(v=>({id:v.id,date:String(v.created||'').slice(0,10),memo:(v.source==='builder'?'내차만들기':v.source==='finder'?'차량 찾기':v.source||'접수')+' 접수'+(v.payload?.review?.existingCustomer?' · 기존 고객과 연결':''),kind:'홈페이지',t:'i'}))]:[];
 const tl=[...liveTl,...(c.followUps||[]).map(f=>({...f,t:'f'})),...(LIVE?[]:state.intakes).filter(x=>x.name===c.name).map(x=>({id:x.id,date:x.at.slice(0,10),memo:x.source+' 접수 · '+x.summary,kind:'홈페이지',t:'i'}))].sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0);
 return `<div class="d-head"><div class="d-top"><div><button class="btn btn-ghost btn-sm" data-close style="margin:-4px 0 6px -8px" ${isPhone()?'':'hidden'}>${svg('back',16)}목록</button><h2 class="d-name">${esc(c.name)}</h2><div class="d-phone"><span>${esc(c.phone)}</span><button class="btn btn-ghost btn-sm icon-btn" style="width:30px;height:30px" data-copy="${esc(c.phone)}" aria-label="번호 복사">${svg('copy',15)}</button></div></div><span class="chip ${stageClass(c.stage)}">${esc(c.stage)}</span></div>
 <div class="d-quick"><a class="btn" href="tel:${esc(c.phone.replace(/-/g,''))}">${svg('phone',16)}<span>전화</span></a><button class="btn" data-sms="${c.id}">${svg('sms',16)}<span>문자</span></button><button class="btn" data-done="${c.id}">${svg('check',16)}<span>연락 완료</span></button></div></div>
 <div class="d-body">
  <div><p class="sec-title">단계</p><div class="stage-pick">${STAGES.map(s=>`<button type="button" data-stage="${s}" ${LIVE?'disabled':''} aria-pressed="${c.stage===s}">${s}</button>`).join('')}</div></div>
  ${LIVE?`<div class="demo-band" style="margin:0">읽기 전용 · ${ex?.loading?'기록을 불러오는 중':ex?.error?esc(ex.error):'상담 기록과 접수 내역까지 표시'}</div>`:''}<div ${LIVE?'hidden':''}><p class="sec-title">상담 기록 남기기</p><div class="composer"><div class="kinds">${['전화','문자','방문','상담'].map(k=>`<button type="button" data-kind="${k}" aria-pressed="${memoKind===k}">${k}</button>`).join('')}</div><textarea id="memoText" placeholder="통화 내용이나 다음 할 일을 적으세요" aria-label="상담 메모"></textarea><div class="composer-foot"><label class="muted" style="font-size:13px;display:flex;gap:6px;align-items:center">다음 연락 <input type="date" id="memoNext" class="select" style="padding:5px 8px" value="${esc(c.nextContact)}"></label><button class="btn btn-primary btn-sm" style="margin-left:auto" data-savememo="${c.id}">저장</button></div></div></div>
  <div><p class="sec-title">차량·일정</p><div class="facts">
   <div class="fact"><span>차량</span><b>${esc(c.model)} ${esc(c.trim)}</b></div><div class="fact"><span>지역</span><b>${esc(c.region)}</b></div>
   <div class="fact"><span>계약일</span><input type="date" ${LIVE?'disabled':''} data-field="contractDate" value="${esc(c.contractDate)}" aria-label="계약일"></div><div class="fact"><span>출고일</span><input type="date" ${LIVE?'disabled':''} data-field="deliveryDate" value="${esc(c.deliveryDate)}" aria-label="출고일"></div>
   <div class="fact"><span>보험 만기</span><input type="date" ${LIVE?'disabled':''} data-field="insuranceExpiry" value="${esc(c.insuranceExpiry)}" aria-label="보험 만기"></div><div class="fact"><span>차량번호</span><b class="num">${esc(c.vehicleNo)||'—'}</b></div></div></div>
  <div><p class="sec-title">기록 ${tl.length}</p><ul class="timeline">${tl.map(t=>`<li class="${t.t==='i'?'intake':''}"><div class="t-meta"><span class="num">${md(t.date)}</span><span class="chip plain">${esc(t.kind)}</span></div><div class="t-body">${esc(t.memo)}</div></li>`).join('')||'<li>기록이 없습니다.</li>'}</ul></div>
 </div>`;}

/* ───────── 차계부 ───────── */
function viewLedger(){if(LIVE)return `<section class="view"><div class="view-head"><div><h1>차계부</h1><p>운영 차계부 연결은 다음 단계에서 합니다</p></div></div><div class="card"><div class="empty">비교 1단계는 오늘·고객 화면만 운영 데이터로 보여 줍니다. 차계부는 기존 CRM에서 확인하세요.</div></div></section>`;const inc=state.ledger.filter(x=>x.amount>0).reduce((a,b)=>a+b.amount,0),cost=state.ledger.filter(x=>x.amount<0).reduce((a,b)=>a+b.amount,0);
 return `<section class="view"><div class="view-head"><div><h1>차계부</h1><p>출고 고객의 용품·정비·비용 기록 (데모 항목)</p></div><button class="btn" data-addledger>기록 추가</button></div>
 <div class="sum-row"><div class="kpi"><span>용품 매출</span><b class="num">${won(inc)}</b></div><div class="kpi"><span>비용</span><b class="num" style="color:var(--danger)">${won(cost)}</b></div><div class="kpi"><span>합계</span><b class="num">${won(inc+cost)}</b></div></div>
 <div class="table-wrap" style="display:block;max-height:none"><table><thead><tr><th>날짜</th><th>고객</th><th>내용</th><th>구분</th><th style="text-align:right">금액</th></tr></thead><tbody>${state.ledger.map(x=>`<tr><td class="num">${md(x.date)}</td><td>${esc(x.customer)}</td><td>${esc(x.item)}</td><td><span class="chip plain">${esc(x.kind)}</span></td><td class="money" style="${x.amount<0?'color:var(--danger)':''}">${won(x.amount)}</td></tr>`).join('')}</tbody></table></div></section>`;}

/* ───────── 도구 ───────── */
const TPL={'출고 안내':'{이름} 고객님, {차종} 출고일이 {출고일}로 확정되었습니다. 탁송·인수 방법은 편하신 방식으로 말씀해 주세요.','견적 안내':'{이름} 고객님, 문의하신 {차종} 견적을 보내드립니다. 궁금한 점은 이 번호로 편하게 연락 주세요.','보험 만기':'{이름} 고객님, 자동차 보험 만기가 {보험만기}입니다. 갱신 견적 비교가 필요하시면 알려 주세요.','감사 인사':'{이름} 고객님, {차종}과 함께 안전하고 즐거운 운행 되세요. 점검 시기가 되면 먼저 연락드리겠습니다.'};
let tplKey='출고 안내',tplTarget=null;
function fill(t,c){return t.replace(/\{이름\}/g,c?.name||'고객').replace(/\{차종\}/g,c?.model||'차량').replace(/\{출고일\}/g,c?.deliveryDate?md(c.deliveryDate):'(출고일)').replace(/\{보험만기\}/g,c?.insuranceExpiry?md(c.insuranceExpiry):'(만기일)');}
function viewTools(){const c=tplTarget&&byId(tplTarget);
 return `<section class="view"><div class="view-head"><div><h1>도구</h1><p>문자 작성과 계산 도구를 한곳에 모았습니다</p></div></div>
 <div class="tools"><article class="card"><div class="card-head"><h2>문자 작성</h2></div>
  <label class="lbl" style="margin-bottom:12px">받는 고객<select class="input" id="tplTarget"><option value="">고객 선택</option>${state.customers.filter(active).map(x=>`<option value="${x.id}" ${tplTarget===x.id?'selected':''}>${esc(x.name)} · ${esc(x.model)}</option>`).join('')}</select></label>
  <div class="tpl">${Object.keys(TPL).map(k=>`<button type="button" class="tab" data-tpl="${k}" aria-selected="${tplKey===k}" style="background:${tplKey===k?'var(--accent-soft)':'var(--surface-2)'};color:${tplKey===k?'var(--accent)':'var(--muted)'}">${k}</button>`).join('')}</div>
  <textarea class="input" id="tplText" rows="5" aria-label="문자 내용">${esc(TPL[tplKey])}</textarea>
  <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><span class="muted" style="font-size:13px">변수: {이름} {차종} {출고일} {보험만기}</span><button class="btn btn-primary btn-sm" style="margin-left:auto" data-copytpl>내용 복사</button></div></article>
  <article class="card"><div class="card-head"><h2>미리보기</h2><span class="muted num" style="font-size:13px" id="tplLen"></span></div><div class="preview"><div class="bubble" id="tplPreview">${esc(fill(TPL[tplKey],c))}</div></div>
  <p class="muted" style="font-size:13px;margin:12px 0 0">실제 발송은 기존 SMS 연동(간접식·직접식)을 그대로 연결합니다. 데모에서는 보내지 않습니다.</p></article>
  <article class="card" style="grid-column:1/-1"><div class="card-head"><h2>수수료 계산기</h2><span class="chip plain">기존 계산식 연결 예정</span></div><p class="muted" style="margin:0">계산식은 지금 CRM의 것을 그대로 가져와 같은 결과가 나오도록 연결합니다. 화면 틀만 바꾸고 숫자를 만드는 규칙은 손대지 않습니다.</p></article></div></section>`;}

/* ───────── 설정 ───────── */
function viewPrefs(){const t=document.documentElement.dataset.theme||'system';
 return `<section class="view"><div class="view-head"><div><h1>설정</h1><p>화면과 데이터 연결</p></div></div>
 <div class="prefs">
  <article class="card"><div class="card-head"><h2>화면 테마</h2></div><div class="seg" role="group" aria-label="테마">${[['system','시스템'],['light','밝게'],['dark','어둡게']].map(([v,l])=>`<button type="button" data-theme-set="${v}" aria-pressed="${t===v}">${l}</button>`).join('')}</div></article>
  <article class="card"><div class="card-head"><h2>데이터 연결</h2></div>${LIVE?`<dl class="kv"><dt>현재</dt><dd><span class="status-dot" style="background:var(--ok)"></span>운영 데이터 · 읽기 전용</dd><dt>계정</dt><dd>${esc(session?.username||'')}</dd><dt>고객 수</dt><dd class="num">${state.customers.length}명</dd><dt>로그아웃</dt><dd>이 화면의 로그인만 지웁니다. 기존 CRM 로그인은 그대로 유지됩니다.</dd></dl><button class="btn btn-sm" style="margin-top:14px" data-logout>이 화면에서 로그아웃</button>`:`<dl class="kv"><dt>현재</dt><dd><span class="status-dot"></span>가상 데이터 (이 기기에만 저장)</dd><dt>운영 연결</dt><dd>기존 로그인·PIN·crm-api를 그대로 사용 (읽기 전용)</dd></dl><button class="btn btn-sm" style="margin-top:14px" data-reset>가상 데이터 처음으로</button>`}</article>
  <article class="card"><div class="card-head"><h2>내 정보 (유료화 대비)</h2></div><div class="form-grid"><label class="lbl">표시 이름<input class="input" id="pName" value="영업 담당자"></label><label class="lbl">전시장<input class="input" id="pShop" value="○○ 전시장"></label></div><p class="muted" style="font-size:13px;margin:10px 0 0">이름·전시장·대표 색을 사용자별로 바꿀 수 있게 설계했습니다.</p></article>
  <article class="card"><div class="card-head"><h2>단축키</h2></div><dl class="kv"><dt><kbd>Ctrl K</kbd></dt><dd>고객·메뉴 찾기</dd><dt><kbd>N</kbd></dt><dd>새 고객</dd><dt><kbd>1</kbd>–<kbd>5</kbd></dt><dd>메뉴 이동</dd><dt><kbd>Esc</kbd></dt><dd>창 닫기</dd></dl></article>
 </div></section>`;}

/* ───────── 렌더 ───────── */
function render(){renderNav();const c=$('#content');c.innerHTML={today:viewToday,customers:viewCustomers,ledger:viewLedger,tools:viewTools,prefs:viewPrefs}[state.view]();
 if(state.view==='customers'){$('#sort').value=state.sort;}
 if(state.view==='tools')updatePreview();
 $('#fab').hidden=false;document.body.style.overflow=(isPhone()&&state.view==='customers'&&state.selected)?'hidden':'';}
function updatePreview(){const ta=$('#tplText');if(!ta)return;const c=tplTarget&&byId(tplTarget);const text=fill(ta.value,c);$('#tplPreview').textContent=text;const bytes=[...text].reduce((a,ch)=>a+(ch.charCodeAt(0)>127?2:1),0);$('#tplLen').textContent=bytes+' byte · '+(bytes>90?'장문(LMS)':'단문(SMS)');}
function open(id){state.selected=id;loadDetail(id);if(state.view!=='customers'){go('customers',{select:id});}else render();
 if(!isPhone()){const row=document.querySelector(`tr[data-open="${id}"]`);row?.scrollIntoView({block:'nearest'});}}
function markDone(id){if(!writable())return;const c=byId(id);if(!c)return;c.followUps=[{id:'f'+Date.now(),date:iso(TODAY),memo:'연락 완료',kind:'전화'},...(c.followUps||[])];c.nextContact='';save();toast(c.name+' 연락 완료로 기록했습니다');render();}

/* ───────── 팔레트·모달 ───────── */
function closeLayer(){$('#layer').innerHTML='';}
function palette(mode='open'){const L=$('#layer');L.innerHTML=`<div class="overlay" data-backdrop><div class="palette" role="dialog" aria-modal="true" aria-label="${mode==='memo'?'메모할 고객 찾기':'검색'}"><div class="palette-in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="pq" placeholder="${mode==='memo'?'메모를 남길 고객 이름·번호':'고객 이름, 번호, 차종 또는 메뉴'}" autocomplete="off" aria-label="검색어"><kbd>Esc</kbd></div><div class="palette-list" id="plist" role="listbox"></div><div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 이동</span><span><kbd>Enter</kbd> 열기</span></div></div></div>`;
 let idx=0,items=[];const inp=$('#pq');
 const draw=()=>{const q=inp.value.trim().replace(/-/g,'').toLowerCase();
  const cs=state.customers.filter(c=>!q||[c.name,c.phone.replace(/-/g,''),c.model,c.region].join(' ').toLowerCase().includes(q)).slice(0,8).map(c=>({type:'c',c,label:c.name,sub:c.model+' · '+c.phone}));
  const acts=mode==='memo'?[]:[...VIEWS.map(([v,l])=>({type:'v',v,label:l+' 화면으로',sub:''})),{type:'new',label:'새 고객 등록',sub:'N'}].filter(a=>!q||a.label.includes(q));
  items=[...cs,...acts];idx=Math.min(idx,Math.max(items.length-1,0));
  $('#plist').innerHTML=(cs.length?'<div class="p-group">고객</div>':'')+cs.map((it,i)=>`<button class="p-item" role="option" data-i="${i}" aria-selected="${i===idx}"><span class="chip ${stageClass(it.c.stage)}">${esc(it.c.stage)}</span><b>${esc(it.label)}</b><span class="sub">${esc(it.sub)}</span></button>`).join('')+(acts.length?'<div class="p-group">이동</div>':'')+acts.map((it,j)=>{const i=cs.length+j;return `<button class="p-item" role="option" data-i="${i}" aria-selected="${i===idx}">${esc(it.label)}<span class="sub">${esc(it.sub)}</span></button>`;}).join('')+(items.length?'':'<div class="empty">찾는 결과가 없습니다.</div>');};
 const pick=i=>{const it=items[i];if(!it)return;closeLayer();if(it.type==='c'){open(it.c.id);if(mode==='memo')setTimeout(()=>$('#memoText')?.focus(),60);}else if(it.type==='v')go(it.v);else newCustomer();};
 inp.addEventListener('input',()=>{idx=0;draw();});
 inp.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){idx=Math.min(idx+1,items.length-1);draw();e.preventDefault();}else if(e.key==='ArrowUp'){idx=Math.max(idx-1,0);draw();e.preventDefault();}else if(e.key==='Enter'){pick(idx);e.preventDefault();}});
 $('#plist').addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(b)pick(Number(b.dataset.i));});
 draw();inp.focus();}
function newCustomer(){if(!writable())return;$('#layer').innerHTML=`<div class="overlay" data-backdrop><form class="modal" id="newForm" role="dialog" aria-modal="true" aria-labelledby="nfTitle"><h2 id="nfTitle">새 고객</h2><div class="form-grid"><label class="lbl">이름<input class="input" id="nfName" required maxlength="50" autocomplete="off"></label><label class="lbl">휴대전화<input class="input" id="nfPhone" required inputmode="tel" placeholder="010-0000-0000" autocomplete="off"></label><label class="lbl">관심 차종<select class="input" id="nfModel">${[...new Set(MODELS.map(m=>m[0]))].map(m=>`<option>${m}</option>`).join('')}</select></label><label class="lbl">다음 연락<input class="input" type="date" id="nfNext" value="${d(1)}"></label></div><p class="muted" id="nfErr" style="margin:0;font-size:13px" role="alert"></p><div class="modal-foot"><button type="button" class="btn" data-cancel>취소</button><button class="btn btn-primary">등록</button></div></form></div>`;
 $('#nfName').focus();
 $('#newForm').addEventListener('submit',e=>{e.preventDefault();const name=$('#nfName').value.trim(),digits=$('#nfPhone').value.replace(/[^0-9]/g,'');if(!name||!/^0\d{8,10}$/.test(digits)){$('#nfErr').textContent='이름과 휴대전화 번호(숫자 10~11자리)를 확인하세요.';return;}
  const phone=digits.replace(/^(\d{3})(\d{3,4})(\d{4})$/,'$1-$2-$3');if(state.customers.some(c=>c.phone===phone&&c.name===name)){$('#nfErr').textContent='같은 이름과 번호의 고객이 이미 있습니다.';return;}
  const c={id:'demo-'+Date.now(),name,phone,stage:'신규',model:$('#nfModel').value,trim:'',region:'',nextContact:$('#nfNext').value,contractDate:'',deliveryDate:'',insuranceExpiry:'',testDriveDate:'',vehicleNo:'',followUps:[],created:iso(TODAY)};
  state.customers.unshift(c);save();closeLayer();toast(name+' 고객을 등록했습니다');state.group='all';open(c.id);});}

/* ───────── 이벤트 ───────── */
document.addEventListener('click',e=>{const t=e.target.closest('[data-go],[data-open],[data-done],[data-memo],[data-intake],[data-group],[data-stage],[data-kind],[data-savememo],[data-copy],[data-close],[data-sms],[data-tpl],[data-copytpl],[data-theme-set],[data-reset],[data-logout],[data-addledger],[data-backdrop],[data-cancel]');if(!t)return;const ds=t.dataset;
 if('backdrop' in ds){if(e.target===t)closeLayer();return;}
 if('cancel' in ds){closeLayer();return;}
 if(ds.go){go(ds.go);return;}
 if(ds.open){open(ds.open);return;}
 if(ds.done){markDone(ds.done);return;}
 if(ds.memo){open(ds.memo);setTimeout(()=>$('#memoText')?.focus(),60);return;}
 if(ds.intake){const x=state.intakes.find(i=>i.id===ds.intake);if(!x)return;if(LIVE){const c=state.customers.find(c=>c.name===x.name&&c.phone===x.phone);if(c)open(c.id);return;}x.done=true;save();const c=state.customers.find(c=>c.name===x.name&&c.phone===x.phone);toast(x.review.surge?'급증 시간대 접수를 확인 처리했습니다':'접수를 확인했습니다');if(c)open(c.id);else render();return;}
 if(ds.group){state.group=ds.group;render();return;}
 if(ds.stage){if(!writable())return;const c=byId(state.selected);if(c&&c.stage!==ds.stage){c.followUps=[{id:'f'+Date.now(),date:iso(TODAY),memo:'단계 변경: '+c.stage+' → '+ds.stage,kind:'상담'},...(c.followUps||[])];c.stage=ds.stage;save();toast('단계를 '+ds.stage+'(으)로 바꿨습니다');render();}return;}
 if(ds.kind){memoKind=ds.kind;document.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.kind===memoKind));return;}
 if(ds.savememo){if(!writable())return;const c=byId(ds.savememo),text=$('#memoText').value.trim(),next=$('#memoNext').value;if(!text&&next===c.nextContact){toast('메모를 적거나 다음 연락일을 바꾸세요');return;}if(text)c.followUps=[{id:'f'+Date.now(),date:iso(TODAY),memo:text,kind:memoKind},...(c.followUps||[])];c.nextContact=next;save();toast('기록을 저장했습니다');render();return;}
 if(ds.copy){copy(ds.copy);return;}
 if('close' in ds){state.selected=null;render();return;}
 if(ds.sms){tplTarget=ds.sms;go('tools');return;}
 if(ds.tpl){tplKey=ds.tpl;render();return;}
 if('copytpl' in ds){copy($('#tplPreview').textContent);return;}
 if(ds.themeSet){setTheme(ds.themeSet);render();return;}
 if('logout' in ds){keepSession(null);location.reload();return;}
 if('reset' in ds){if(LIVE)return;MockSource.reset();Object.assign(state,MockSource.load(),{selected:null});toast('가상 데이터를 처음 상태로 되돌렸습니다');render();return;}
 if('addledger' in ds){if(!writable())return;toast('데모에서는 기록 추가 화면을 생략했습니다');return;}
});
const refreshList=()=>{const a=$('#listArea');if(a)a.innerHTML=listHtml(filtered());};
document.addEventListener('compositionend',e=>{if(e.target.id==='q'){state.q=e.target.value;refreshList();}});
document.addEventListener('input',e=>{if(e.target.id==='q'){state.q=e.target.value;if(!e.isComposing)refreshList();}
 if(e.target.id==='tplText')updatePreview();});
document.addEventListener('change',e=>{if(e.target.id==='sort'){state.sort=e.target.value;render();}
 if(e.target.id==='tplTarget'){tplTarget=e.target.value||null;updatePreview();}
 if(e.target.dataset.field){const c=byId(state.selected);if(c&&!writable()){e.target.value=c[e.target.dataset.field]||'';return;}if(c){c[e.target.dataset.field]=e.target.value;save();toast('저장했습니다');}}});
document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();palette();return;}
 if(e.key==='Escape'){if($('#layer').innerHTML){closeLayer();return;}if(state.selected&&state.view==='customers'){state.selected=null;render();}return;}
 if(typing||$('#layer').innerHTML)return;
 if(e.key==='/'){e.preventDefault();palette();}
 else if(e.key.toLowerCase()==='n'){e.preventDefault();newCustomer();}
 else if(/^[1-5]$/.test(e.key))go(VIEWS[Number(e.key)-1][0]);
 else if(e.key==='Enter'&&document.activeElement?.dataset?.open)open(document.activeElement.dataset.open);});
$('#openPalette').onclick=()=>palette();
$('#newBtn').onclick=newCustomer;
$('#fab').onclick=()=>palette('memo');
function setTheme(v){if(v==='system')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=v;try{localStorage.setItem('crm-demo-theme',v);}catch(_){}}
$('#themeBtn').onclick=()=>{const dark=document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;setTheme(dark?'light':'dark');if(state.view==='prefs')render();};
try{const t=localStorage.getItem('crm-demo-theme');if(t&&t!=='system')document.documentElement.dataset.theme=t;}catch(_){}
let wasPhone=isPhone();addEventListener('resize',()=>{if(isPhone()!==wasPhone){wasPhone=isPhone();render();}});
addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(v&&v!==state.view)go(v);});
function loginScreen(msg=''){$('#layer').innerHTML=`<div class="overlay" style="background:var(--bg);align-items:center;padding-top:0"><form class="modal" id="loginForm" aria-labelledby="lgTitle" style="box-shadow:var(--shadow)"><div class="brand" style="padding:0"><span class="brand-mark">D</span><div>딜러 CRM<small>Claude안 · 운영 데이터 읽기 전용</small></div></div><h2 id="lgTitle">로그인</h2><p class="muted" style="margin:0;font-size:13.5px">기존 CRM과 같은 계정·PIN을 씁니다. 이 화면은 조회만 하며 고객정보를 바꾸지 않습니다.</p><label class="lbl">아이디(이메일)<input class="input" id="lgUser" type="email" autocomplete="username" required></label><label class="lbl">비밀번호<input class="input" id="lgPass" type="password" autocomplete="current-password" required></label><label class="lbl" id="lgPinWrap" hidden>2차 PIN (숫자 6자리)<input class="input" id="lgPin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off"></label><p class="muted" style="margin:0;font-size:12.5px">PIN을 5번 틀리면 기존 CRM도 15분간 잠깁니다.</p><p id="lgErr" role="alert" style="margin:0;color:var(--danger);font-size:13.5px">${esc(msg)}</p><div class="modal-foot"><button class="btn btn-primary" id="lgBtn">로그인</button></div></form></div>`;
 const f=$('#loginForm'),needPin=()=>!$('#lgPinWrap').hidden;if(session?.token){$('#lgUser').value=session.username||'';$('#lgUser').disabled=true;$('#lgPass').closest('label').hidden=true;$('#lgPass').required=false;$('#lgPinWrap').hidden=false;$('#lgPin').required=true;setTimeout(()=>$('#lgPin').focus(),30);}else $('#lgUser').focus();
 f.addEventListener('submit',async e=>{e.preventDefault();const btn=$('#lgBtn');btn.disabled=true;$('#lgErr').textContent='';
  try{if(!session?.token){keepSession(await api('/api/login',{method:'POST',body:{username:$('#lgUser').value,password:$('#lgPass').value}}));$('#lgPass').value='';}
   if(needPin()){const pin=$('#lgPin').value;if(!/^\d{6}$/.test(pin))throw Error('PIN은 숫자 6자리입니다.');await api('/api/pin/verify',{method:'POST',body:{pin}});$('#lgPin').value='';}
   await afterLogin();}
  catch(err){$('#lgErr').textContent=err.message;if(err.status===401){keepSession(null);loginScreen(err.message);}}finally{btn.disabled=false;}});}
async function afterLogin(){const st=await api('/api/pin/status');if(!st.configured){keepSession(null);loginScreen('PIN이 아직 없습니다. 기존 CRM에서 PIN을 먼저 등록하세요.');return;}if(!st.verified){loginScreen();return;}
 const j=await api('/api/customers');state.customers=liveCustomers(j.customers||[]);state.intakes=liveIntakes(state.customers);state.ledger=[];closeLayer();
 $('#sideFoot').innerHTML='<b>운영 데이터</b>를 읽기 전용으로 보여 줍니다. 수정은 기존 CRM에서 하세요.';go(location.hash.slice(1)||'today');}
if(LIVE){document.body.classList.add('live');$('#newBtn').hidden=true;$('#fab').style.display='none';$('#sideFoot').innerHTML='<b>운영 데이터</b> 읽기 전용 화면입니다.';if(session?.token)afterLogin().catch(e=>loginScreen(e.message));else loginScreen();}
else go(location.hash.slice(1)||'today');
