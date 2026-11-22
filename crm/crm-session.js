'use strict';
(()=>{
const key='renault-crm-session';let active=null,pending=null,lastActivity=Date.now();
async function ensure(session){
 if(!session?.token)return session;active=session;
 if(!session.refreshToken||Number(session.expires)>Date.now()+300000)return session;
 if(pending){await pending;return session;}
 const original=session.token;
 pending=(async()=>{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try{
   const endpoint=String(window.RenaultCRMConfig?.apiBase||'').replace(/\/$/,'');
   const response=await fetch(endpoint+'/api/session/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken:session.refreshToken}),signal:controller.signal});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'로그인을 갱신하지 못했습니다. 다시 시도해 주세요.');
   if(!data.token||!data.refreshToken||!Number.isFinite(data.expires))throw Error('로그인 갱신 응답을 확인할 수 없습니다.');
   const saved=JSON.parse(sessionStorage.getItem(key)||'null');
   // Never resurrect a session after logout or a different login.
   if(saved?.token!==original)return;
   Object.assign(session,data);sessionStorage.setItem(key,JSON.stringify(session));
  }finally{clearTimeout(timeout);}
 })();
 try{await pending;return session;}finally{pending=null;}
}
function tick(){if(!active||!sessionStorage.getItem(key)||document.visibilityState==='hidden'||Date.now()-lastActivity>900000)return;ensure(active).catch(()=>{});}
for(const type of ['pointerdown','keydown','input','scroll','touchstart'])document.addEventListener(type,()=>{lastActivity=Date.now();tick();},{passive:true,capture:true});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){lastActivity=Date.now();tick();}});
window.addEventListener('online',tick);setInterval(tick,60000);
window.RenaultCRMSession={ensure};
})();