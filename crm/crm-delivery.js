'use strict';
(()=>{
const formUI=window.RenaultCRMForm;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const block=/\[CRM 출고관리\]\r?\n([\s\S]*?)\r?\n\[\/CRM 출고관리\]/g;
function metadata(c={}){return [...String(c.notes||'').matchAll(block)].at(-1)?.[1]||'';}
function originalSalesperson(c={}){
 const data=metadata(c),saved=data.match(/^원담당자: *(.*)$/m);
 if(saved)return saved[1].trim();
 return String(c.sourceSalesman||String(c.notes||'').match(/^원본영업담당: *(.+)$/m)?.[1]||'').trim();
}
function excluded(c={}){const data=metadata(c);if(/^유지관리 제외: /m.test(data))return /^유지관리 제외: 예$/m.test(data);return c.maintenanceExcluded===true;}
function transferredBadge(c){const name=originalSalesperson(c).replace(/\s/g,'');return name&&name!=='오승훈'&&!['미확인','없음','-'].includes(name)?'<span class="transferred-customer-badge">이관고객</span>':'';}
const originalSchedule=formUI.schedule;
function schedule(date,c={}){
 const template=document.createElement('template');template.innerHTML=originalSchedule(date);
 const box=template.content.querySelector('.maintenance-box');
 const heading=box.querySelector('h4');heading.classList.add('maintenance-heading');
 heading.insertAdjacentHTML('beforeend','<label class="maintenance-exclude"><input type="checkbox" name="maintenanceExcluded" '+(excluded(c)?'checked':'')+'> 해당없음</label>');
 if(excluded(c)){box.querySelector('#crmMaintenance').innerHTML='<p class="maintenance-not-applicable">7년14만큼 대상차종 아님</p>';box.querySelector('.fine')?.setAttribute('hidden','');}
 return '<label class="original-salesperson">원담당자<input name="sourceSalesman" maxlength="100" value="'+esc(originalSalesperson(c))+'" placeholder="원본 영업담당자 이름"><small class="fine">엑셀 원본 영업담당자를 표시합니다.</small></label>'+template.innerHTML;
}
function refreshMaintenance(){
 const form=document.querySelector('#customerForm'),target=form?.querySelector('#crmMaintenance');if(!target)return;
 const no=form.elements.maintenanceExcluded?.checked;
 const template=document.createElement('template');template.innerHTML=originalSchedule(form.elements.deliveryDate?.value||'');
 target.innerHTML=no?'<p class="maintenance-not-applicable">7년14만큼 대상차종 아님</p>':template.content.querySelector('#crmMaintenance').innerHTML;
 const fine=target.closest('.maintenance-box').querySelector('.fine');if(fine)fine.hidden=!!no;
}
function prepareDeliverySave(c,form){
 const name=String(form.elements.sourceSalesman?.value||'').trim();
 if(/[\r\n\[\]]/.test(name)||name.length>100)throw Error('원담당자 이름을 확인하세요.');
 const checked=!!form.elements.maintenanceExcluded?.checked;
 let notes=String(c.notes||'').replace(block,'').trimEnd();
 // Persist in the existing customer notes field so older API versions and backups retain these settings.
 if(checked||name||metadata(c)||/^원본영업담당:/m.test(String(c.notes||'')))notes+=(notes?'\n\n':'')+'[CRM 출고관리]\n유지관리 제외: '+(checked?'예':'아니오')+'\n원담당자: '+name+'\n[/CRM 출고관리]';
 if(notes.length>6000)throw Error('상담 메모가 너무 깁니다. 메모를 조금 줄인 뒤 저장하세요.');
 c.notes=notes;c.maintenanceExcluded=checked;c.sourceSalesman=name;return c;
}
for(const type of ['input','change'])document.addEventListener(type,e=>{if(e.target.matches('#customerForm [name="deliveryDate"],#customerForm [name="maintenanceExcluded"]'))refreshMaintenance();});
Object.assign(formUI,{schedule,originalSalesperson,maintenanceExcluded:excluded,transferredBadge,prepareDeliverySave});
})();
