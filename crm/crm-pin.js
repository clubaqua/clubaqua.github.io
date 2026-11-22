'use strict';
(()=>{
let pending=null;
function dialog(api,mode){
return new Promise((resolve,reject)=>{
document.querySelector('#crmPinDialog')?.remove();
const el=document.createElement('dialog');el.id='crmPinDialog';el.className='pin-dialog';
const setup=mode==='setup',change=mode==='change';
el.innerHTML='<form><h2>'+(setup?'6자리 PIN 등록':change?'PIN 변경':'2차 PIN 확인')+'</h2><p>'+(setup?'앞으로 로그인할 때 사용할 숫자 6자리를 등록하세요.':'숫자 6자리를 입력해 주세요.')+'</p>'+(change?'<label>현재 PIN<input name="current" type="password" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="off" required></label>':'')+'<label>'+(setup||change?'새 PIN':'PIN')+'<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="off" required></label>'+(setup||change?'<label>PIN 확인<input name="confirm" type="password" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="off" required></label>':'')+'<p data-pin-error role="alert" class="error"></p><div class="pin-actions"><button type="button" data-pin-cancel>취소</button><button class="primary" type="submit">'+(setup?'등록하고 접속':change?'PIN 변경':'확인')+'</button></div></form>';
document.body.append(el);
const cancel=()=>{el.close();el.remove();reject(Error('PIN 확인이 취소되었습니다.'));};
el.addEventListener('cancel',e=>{e.preventDefault();cancel();});el.querySelector('[data-pin-cancel]').onclick=cancel;
el.querySelector('form').onsubmit=async e=>{
e.preventDefault();const form=e.target,pin=form.elements.pin.value,confirm=form.elements.confirm?.value;
const error=el.querySelector('[data-pin-error]'),button=form.querySelector('[type="submit"]');
if((setup||change)&&pin!==confirm){error.textContent='PIN 확인 값이 다릅니다.';return;}
button.disabled=true;error.textContent='';
try{await api('/api/pin/'+mode,{method:'POST',body:{pin,current:form.elements.current?.value||''}});form.reset();el.close();el.remove();resolve();}
catch(err){error.textContent=err.message;form.elements.pin.value='';form.elements.pin.focus();}
finally{button.disabled=false;}
};
el.showModal();el.querySelector('input')?.focus();
});
}
async function complete(session,api){if(!session?.token)return;if(pending)return pending;pending=(async()=>{const state=await api('/api/pin/status');if(state.error)throw Error('PIN 상태를 확인할 수 없습니다.');if(!state.verified)await dialog(api,state.configured?'verify':'setup');})();try{await pending;}finally{pending=null;}}
window.RenaultCRMPin={complete,change:api=>dialog(api,'change')};
})();