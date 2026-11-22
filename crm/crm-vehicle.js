'use strict';
(()=>{
const ui=window.RenaultCRMForm,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const trims={"필랑트":["하이브리드 E-Tech techno","하이브리드 E-Tech iconic","하이브리드 E-Tech esprit Alpine","하이브리드 E-Tech noir edition"],"그랑 콜레오스":["하이브리드 E-Tech techno","하이브리드 E-Tech iconic","하이브리드 E-Tech esprit Alpine","하이브리드 E-Tech esprit Alpine étoile","가솔린 2.0 터보 techno","가솔린 2.0 터보 iconic","가솔린 2.0 터보 iconic 4WD","가솔린 2.0 터보 esprit Alpine"],"아르카나":["하이브리드 E-Tech iconic","1.6 GTe iconic"]};
function purchasedTrim(c={}){const block=[...String(c.notes||'').matchAll(/\[CRM 출고관리\]\r?\n([\s\S]*?)\r?\n\[\/CRM 출고관리\]/g)].at(-1)?.[1]||'';return block.match(/^구매트림: *(.*)$/m)?.[1]??c.purchasedTrim??'';}
function editor(model,value=''){const items=trims[model]||[],custom=!!value&&!items.includes(value);return '<label class="purchased-trim-field">구매트림<span class="purchased-trim-editor"><select data-purchased-trim-choice aria-label="구매트림 선택" '+(custom?'hidden':'')+'><option value="">선택해주세요</option>'+items.map(v=>'<option value="'+esc(v)+'" '+(v===value?'selected':'')+'>'+esc(v)+'</option>').join('')+'<option value="__custom__">직접입력</option></select><input name="purchasedTrim" maxlength="100" aria-label="구매트림 직접입력" placeholder="트림 직접입력" value="'+esc(value)+'" '+(!custom?'hidden':'')+'><button type="button" data-trim-list '+(!custom?'hidden':'')+'>목록</button></span></label>';}
const originalCustom=ui.custom;
ui.custom=function(k,v,c={}){return k==='purchasedTrim'?editor(c.purchasedModel,purchasedTrim(c)):originalCustom(k,v,c);};
const originalSave=ui.prepareDeliverySave;
ui.prepareDeliverySave=function(c,form){const value=String(form.elements.purchasedTrim?form.elements.purchasedTrim.value:purchasedTrim(c)).trim();if(/[\r\n\[\]]/.test(value)||value.length>100)throw Error('구매트림을 확인하세요.');originalSave(c,form);c.notes=c.notes.replace('\n[/CRM 출고관리]','\n구매트림: '+value+'\n[/CRM 출고관리]');if(c.notes.length>6000)throw Error('상담 메모가 너무 깁니다.');c.purchasedTrim=value;return c;};
ui.purchasedTrim=purchasedTrim;
ui.insuranceBadge=c=>c.insuranceViaMe==='예'?'<span class="customer-insurance-badge" title="나에게 보험가입">보험</span>':'';
ui.vehicleHTML=c=>'<div class="customer-vehicle"><span>'+esc(c.purchasedModel||c.model||'미정')+'</span><small class="muted">'+esc(purchasedTrim(c)||c.trim||'')+'</small>'+(String(c.vehicleNo||'').trim()?'<span class="customer-license-plate" aria-label="차량번호 '+esc(c.vehicleNo)+'">'+esc(c.vehicleNo)+'</span>':'')+'</div>';
document.addEventListener('change',e=>{
const form=e.target.closest('#customerForm');if(!form)return;
if(e.target.name==='purchasedModel'){const label=form.querySelector('.purchased-trim-field'),value=form.elements.purchasedTrim?.value||'';if(label)label.outerHTML=editor(e.target.value,value);return;}
if(!e.target.matches('[data-purchased-trim-choice]'))return;
const parent=e.target.parentElement,input=parent.querySelector('input'),custom=e.target.value==='__custom__';
e.target.hidden=custom;input.hidden=!custom;parent.querySelector('button').hidden=!custom;
if(custom)input.focus();else input.value=e.target.value;
});
document.addEventListener('click',e=>{const b=e.target.closest('[data-trim-list]');if(!b)return;const parent=b.parentElement;b.hidden=true;parent.querySelector('input').hidden=true;const select=parent.querySelector('select');select.hidden=false;select.focus();});
})();