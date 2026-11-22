'use strict';
(()=>{
 const stages=['신규','상담중','시승예정','견적안내','계약','출고완료','보류','종료'];
 const collator=new Intl.Collator('ko',{numeric:true,sensitivity:'base'});
 function date(c){return [c.contractDate,c.deliveryDate].filter(v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')).sort().at(-1)||'';}
 function sort(list,selectedStage=''){
  const rank=c=>{const i=stages.indexOf(c.stage);return i<0?stages.length:i;};
  return [...list].sort((a,b)=>{
   if(!selectedStage){const diff=rank(a)-rank(b);if(diff)return diff;}
   return date(b).localeCompare(date(a))||collator.compare(String(a.name||''),String(b.name||''))||String(a.id||'').localeCompare(String(b.id||''));
  });
 }
 function preserveSelectionScroll(render,target){
  const area=document.querySelector('.customer-list-view > .table-wrap');
  const top=area?.scrollTop||0,left=area?.scrollLeft||0;
  const id=target?.dataset?.bulkCustomer,all=target?.id==='bulkSelectAll';
  render();
  const current=document.querySelector('.customer-list-view > .table-wrap');
  if(current){current.scrollTop=top;current.scrollLeft=left;}
  const input=all?document.querySelector('#bulkSelectAll'):[...document.querySelectorAll('[data-bulk-customer]')].find(el=>el.dataset.bulkCustomer===id);
  input?.focus({preventScroll:true});
 }

 let selectedBadge='';
 function matches(c){return selectedBadge==='insurance'?c.insuranceViaMe==='예':selectedBadge==='eligible'?!window.RenaultCRMForm.maintenanceExcluded(c):selectedBadge==='excluded'?window.RenaultCRMForm.maintenanceExcluded(c):true;}
 function filterHTML(){return '<div class="customer-badge-filters" role="group" aria-label="고객 배지 필터">'+[['insurance','보험','customer-insurance-badge'],['eligible','7년14만큼 대상고객','maintenance-customer-badge maintenance-customer-badge--eligible'],['excluded','7년14만큼 해당없음','maintenance-customer-badge maintenance-customer-badge--excluded']].map(([value,label,cls])=>'<button type="button" class="'+cls+'" data-customer-badge="'+value+'" aria-pressed="'+(selectedBadge===value)+'">'+label+'</button>').join('')+'<small>'+(selectedBadge?'선택한 배지만 표시 · 다시 누르면 전체':'배지를 누르면 해당 고객만 표시')+'</small></div>';}
 function toggleBadge(value){selectedBadge=selectedBadge===value?'':value;}
 let position=null,restoreUntil=0;
 const area=()=>document.querySelector('.customer-list-view > .table-wrap');
 document.addEventListener('click',e=>{const button=e.target.closest('[data-customer]'),list=area();if(button&&list?.contains(button)){position={top:list.scrollTop,left:list.scrollLeft,id:button.dataset.customer};restoreUntil=0;}},true);
 function restore(){if(!position)return;const list=area();if(!list)return;list.scrollTop=position.top;list.scrollLeft=position.left;}
 function afterClose(){if(!position)return;restoreUntil=Date.now()+2500;restore();requestAnimationFrame(()=>{restore();requestAnimationFrame(restore);});}
 document.addEventListener('close',e=>{if(e.target.id==='customerDialog')afterClose();},true);
 const observer=new MutationObserver(()=>{if(restoreUntil>Date.now()&&!document.querySelector('#customerDialog')?.open)requestAnimationFrame(restore);});
 const content=document.querySelector('#content');if(content)observer.observe(content,{childList:true,subtree:true});
 window.RenaultCRMCustomerList={sort,preserveSelectionScroll,matches,filterHTML,toggleBadge};
})();
