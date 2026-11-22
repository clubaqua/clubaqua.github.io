'use strict';
(()=>{
let ctx,busy=false;
const choices=[['transfer','이관고객 체크'],['maintenance','7년14만큼 해당없음 체크'],['both','둘 다 체크'],['clear','둘 다 해제']];
function updateCustomer(customer,action){
 if(!choices.some(([key])=>key===action))throw Error('일괄수정 항목을 선택하세요.');
 const ui=window.RenaultCRMForm;
 const transferred=action==='clear'?false:action==='transfer'||action==='both'?true:ui.isTransferred(customer);
 const maintenance=action==='clear'?false:action==='maintenance'||action==='both'?true:ui.maintenanceExcluded(customer);
 return ui.prepareDeliverySave({...customer},{elements:{sourceSalesman:{value:ui.originalSalesperson(customer)},isTransferred:{checked:transferred},maintenanceExcluded:{checked:maintenance}}});
}
function dialog(){
 let d=document.querySelector('#bulkEditDialog');if(d)return d;
 d=document.createElement('dialog');d.id='bulkEditDialog';d.className='modal bulk-edit-dialog';
 d.innerHTML='<div class="dialog-head"><h2>선택 고객 일괄수정</h2><button type="button" data-bulk-edit-close>닫기 ×</button></div><form id="bulkEditForm"><p id="bulkEditCount"></p><fieldset><legend>수정할 항목</legend>'+choices.map(([key,label],i)=>'<label class="bulk-edit-choice"><input type="radio" name="bulkEditAction" value="'+key+'" '+(i===0?'checked':'')+'> '+label+'</label>').join('')+'</fieldset><p class="fine">한 항목만 체크하면 다른 체크 상태는 유지합니다. 고객명·원본담당자·상담 내용은 그대로 보존합니다.</p><p id="bulkEditStatus" role="status" aria-live="polite"></p><div class="bulk-edit-actions"><button type="button" data-bulk-edit-close>취소</button><button class="primary" type="submit">선택 고객에 적용</button></div></form>';
 d.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 d.addEventListener('click',e=>{if(e.target.closest('[data-bulk-edit-close]')&&!busy)d.close();});
 d.querySelector('form').addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 const ids=[...ctx.getSelected()],action=new FormData(e.target).get('bulkEditAction');if(!ids.length)return;
 busy=true;ctx.setBusy(true);d.querySelectorAll('input,button').forEach(el=>el.disabled=true);
 let done=0,error='';
 try{
  for(const id of ids){
   d.querySelector('#bulkEditStatus').textContent=done+' / '+ids.length+'명 수정 중…';
   // Read each latest record and preserve its version for optimistic concurrency checks.
   const current=await ctx.read(id);await ctx.update(id,updateCustomer(current,action));
   ctx.deselect(id);done++;
  }
 }catch(e){error=e.message||'처리 결과를 확인할 수 없습니다.';}
 try{await ctx.refresh();}catch(e){error+=(error?' · ':'')+'목록을 새로고침해 저장 결과를 확인하세요.';}
 finally{busy=false;ctx.setBusy(false);d.querySelectorAll('input,button').forEach(el=>el.disabled=false);}
 const message=done+'명 일괄수정 완료'+(error?' · 중단: '+error+' 이미 처리한 고객은 제외했으며 나머지는 자동 재시도하지 않았습니다.':'');
 d.querySelector('#bulkEditStatus').textContent=message;ctx.info(message,!!error);
 if(!error)d.close();
 });
 document.body.append(d);return d;
}
document.addEventListener('click',e=>{if(!e.target.closest('#editSelectedCustomers')||!ctx||busy)return;const count=ctx.getSelected().length;if(!count)return;const d=dialog();d.querySelector('#bulkEditCount').textContent='선택한 고객 '+count+'명에 적용합니다.';d.querySelector('#bulkEditStatus').textContent='';d.showModal();});
window.RenaultCRMBulkEdit={init(value){ctx=value;},updateCustomer};
})();
