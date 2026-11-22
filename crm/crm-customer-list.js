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
 window.RenaultCRMCustomerList={sort,preserveSelectionScroll};
})();
