'use strict';
(()=>{
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regions={gyeongnam:'경상남도',yangsan:'양산시',busan:'부산광역시',ulsan:'울산광역시',gyeonggi:'경기도',seoul:'서울특별시',other:'기타 지역'};
const values={...regions,disabled:'장애인',veteran:'국가유공자',none:'해당없음',regular:'일반 구매',taxable:'과세',exempt:'면세',reduced:'감세',unknown:'미정',mfs:'MFS (모빌라이즈파이낸셜서비스)',personal:'개인 / 개인사업자',corporation:'법인사업자',nonprofit:'비영리단체',cash:'일시불',installment:'할부',lease:'리스',rent:'렌트','lotte-personal':'롯데카드 개인 캐시백','filante-may-cash':'필랑트 구매 혜택','filante-accessories':'필랑트 용품 혜택','loyalty-50':'재구매 혜택','old-car':'노후차 혜택'};
const labels={region:'주소·등록지역',method:'구매 방법',months:'할부 기간',product:'금융상품',relief:'취득세 감면 사유',exemption:'면세 대상',insurance:'보험료(만원)',modelYear:'연식',productionMonth:'생산월',priceMode:'가격 적용',saleType:'판매 구분',customerType:'고객 구분',purchaseEntity:'구입 주체',cashbackOffer:'캐시백 상품',contractDeposit:'계약금',financeDelivery:'탁송료',careSelected:'유지관리 상품 선택',down:'선수금(만원)',promotions:'선택 프로모션'};
const money=v=>Number(v||0).toLocaleString('ko-KR')+'원';
function region(v){return regions[String(v||'').toLowerCase()]||v||'';}
function value(v){return values[String(v)]||v;}
function item(v){if(!v)return '';return esc(v.name||'선택 항목')+(Number.isFinite(v.price)?' · '+money(v.price):'');}
function builder(details){
 const c=details.configuration||{},s=details.selection||{},lines=[];
 if(c.name||c.model)lines.push(['차량',esc(c.name||value(c.model))]);
 for(const [key,label]of [['trim','트림'],['color','외장색'],['interior','내장']])if(c[key]?.name)lines.push([label,item(c[key])]);
 for(const [key,label]of [['options','선택 옵션'],['accessories','선택 용품']])if(c[key]?.length)lines.push([label,c[key].map(item).join('<br>')]);
 if(Number.isFinite(c.total))lines.push(['차량 구성가격',money(c.total)]);
 for(const [key,label]of Object.entries(labels)){const v=s[key];if(v===undefined||v===null||v==='')continue;const display=Array.isArray(v)?v.map(value).join(' · '):typeof v==='boolean'?(v?'예':'아니오'):value(v);lines.push([label,esc(display)]);}
 return '<dl class="crm-history-facts">'+lines.map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+v+'</dd></div>').join('')+'</dl>';
}
function entry(event,fallback){const title=(event.source==='builder'?'내차만들기':event.source==='finder'?'내차찾기':'홈페이지')+' · '+new Date(event.created||event.created_at).toLocaleString('ko-KR');return '<div class="crm-history-entry"><details><summary>'+esc(title)+'</summary>'+(event.source==='builder'?builder(event.payload?.details||{}):'<div class="history-text">'+esc(fallback)+'</div>')+'</details><button type="button" class="crm-history-delete" data-delete-intake="'+esc(event.id)+'" aria-label="'+esc(title)+' 이력 삭제">삭제</button></div>';}
window.RenaultCRMHistory={region,value,entry,builder};
const original=window.RenaultCRMForm.sourceRegion;window.RenaultCRMForm.sourceRegion=(...args)=>region(original(...args));
})();