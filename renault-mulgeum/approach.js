'use strict';
(()=>{
const $=s=>document.querySelector(s), model=document.body.dataset.model;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const won=n=>Number(n).toLocaleString('ko-KR')+'원', addPrice=n=>Number(n)?'+'+won(n):'추가금 없음';
let book,trim,color,interior,angle=1,view='exterior',focusReturn=null;
const modal=$('#itemModal');
let selectedOptions=new Set(),selectedAccessories=new Set();
function group(t){return t.name.includes('하이브리드')?'하이브리드 E-Tech':'가솔린'}
function shortName(t){return t.name.replace(book.name+' ','').replace('하이브리드 E-Tech ','').replace('가솔린 2.0 터보 ','').replace('1.6 GTe ','')}
function notes(){const list=[];
 if(trim.code==='MUPALVDL60IDA'&&['DQS','QPE'].includes(color.code))list.push('선택한 새틴 색상은 시그니처 패키지(2,150,000원)가 필수입니다. AR-HUD + 스마트 룸미러는 해당 패키지에 포함됩니다.');
 const required=interior.requires.split(',').filter(Boolean).map(code=>trim.options.find(o=>o.code===code)).filter(Boolean);
 required.forEach(o=>list.push('선택한 내장에 '+o.name+'('+won(o.price)+')가 필요합니다.'));
 return list;
}
function exteriorURL(){return color.vr+String(angle).padStart(3,'0')+'.'+color.ext}
function currentImage(){return view==='interior'?interior.image:exteriorURL()}
function renderPreview(){
 $('#previewLabel').textContent=view==='interior'?'내장 미리보기':'외관 미리보기';
 $('#buildImage').hidden=false;$('#imageMessage').hidden=true;$('#buildImage').src=currentImage();$('#buildImage').alt=trim.name+' · '+(view==='interior'?interior.name:color.name);
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===view?'true':'false'));
 $('#angles').hidden=view==='interior';document.querySelectorAll('[data-angle]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.angle)===angle?'true':'false'));
 $('#exteriorCaption').textContent=color.name;$('#interiorCaption').textContent=interior.name;
 $('#trimCaption').textContent=trim.name;$('#frameMeta').textContent=view==='interior'?'공식 내장 이미지':'공식 외장 이미지 · 각도 '+([1,19,37,55].indexOf(angle)+1)+' / 4';
 const params=new URLSearchParams(location.search);params.set('trim',trim.code);params.set('color',color.code);params.set('interior',interior.code);params.set('view',view);history.replaceState(null,'','?'+params+location.hash);
}
function renderSpecs(){
 $('#specTrim').textContent=trim.name+' 기본 사양';$('#standardSource').href=trim.source;
 $('#specGrid').innerHTML=trim.specs.map(cat=>`<article class="spec-card"><h3>${esc(cat.name)}</h3><ul>${cat.items.slice(0,5).map(x=>'<li>'+esc(x)+'</li>').join('')}</ul>${cat.items.length>5?`<details><summary>${cat.items.length-5}개 항목 더 보기</summary><ul>${cat.items.slice(5).map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></details>`:''}</article>`).join('');
}

function optionDisplayRank(item){
 const name=String(item.name||'');
 if(/HUD|헤드\s*업|헤드업/i.test(name))return 1;
 if(/BOSE|보스/i.test(name))return 2;
 if(/휠|타이어/i.test(name))return 3;
 if(/선루프|썬루프|sunroof/i.test(name))return 4;
 return 0;
}
function accessoryDisplayRank(item){
 const name=String(item.name||'');
 if(/에디션|edition|누아르|noir/i.test(name))return 0;
 if(/패키지|package/i.test(name))return 1;
 if(/선[쉐셰]이드|썬[쉐셰]이드|sun\s*shade/i.test(name))return 2;
 if(/트렁크|러기지|테일\s*게이트|적재함|luggage|trunk/i.test(name))return 6;
 if(/조명|램프|라이트|일루미네이팅|lighting|lamp|light/i.test(name))return 3;
 if(/익스테리어|스포일러|사이드\s*스[텝탭]|그릴|머플러|루프\s*(랙|박스)|도어\s*바이저|바디\s*키트|exterior/i.test(name))return 5;
 return 4;
}
function sortDisplayItems(items,rank){
 return items.map((item,index)=>({item,index})).sort((a,b)=>rank(a.item)-rank(b.item)||a.index-b.index).map(entry=>entry.item);
}
function orderBookItems(data){
 for(const t of data.trims){
  t.options=sortDisplayItems(t.options||[],optionDisplayRank);
  t.accessories=sortDisplayItems(t.accessories||[],accessoryDisplayRank);
 }
 return data;
}

function visibleOptions(){
 return trim.options.filter(o=>{if(trim.code!=='MUPALVDL60IDA')return true;const satin=['DQS','QPE'].includes(color.code);if(o.code==='-P---')return satin;if(o.code==='-A---')return !satin;return true});
}
function requiredCodes(){const codes=new Set(interior.requires.split(',').filter(Boolean));if(trim.code==='MUPALVDL60IDA'&&['DQS','QPE'].includes(color.code))codes.add('-P---');return codes}
function reconcileSelection(){
 const allowed=new Set(visibleOptions().map(o=>o.code));selectedOptions=new Set([...selectedOptions].filter(c=>allowed.has(c)));
 requiredCodes().forEach(c=>{if(allowed.has(c))selectedOptions.add(c)});
 selectedAccessories=new Set([...selectedAccessories].filter(c=>trim.accessories.some(a=>a.code===c)));
}
function renderPrice(){
 const opts=visibleOptions().filter(o=>selectedOptions.has(o.code)),acc=trim.accessories.filter(a=>selectedAccessories.has(a.code));
 const sum=items=>items.reduce((n,o)=>n+Number(o.price),0);
 const rows=[['차량 기본가격',Number(trim.price)],['외장 색상 · '+color.name,Number(color.price)],['내장 색상 · '+interior.name,Number(interior.price)],['선택 옵션 · '+opts.length+'개',sum(opts)],['선택 용품 · '+acc.length+'개',sum(acc)]];
 const total=rows.reduce((n,r)=>n+r[1],0);
 $('#priceBreakdown').innerHTML=rows.map((r,i)=>{const items=i===3?opts:i===4?acc:null;return '<div><dt>'+(items?'<details class="quote-selection"><summary>'+esc(r[0])+'</summary><ul>'+ (items.map(o=>'<li><span>'+esc(o.name)+'</span><strong>'+won(o.price)+'</strong></li>').join('')||'<li>선택한 품목이 없습니다.</li>')+'</ul></details>':esc(r[0]))+'</dt><dd>'+won(r[1])+'</dd></div>';}).join('');
 window.dispatchEvent(new CustomEvent('renault:configuration',{detail:{model,name:book.name,checked:book.checked,trim,color,interior,options:opts,accessories:acc,total}}));
 $('#totalPrice').textContent=won(total);$('#bottomTotal').textContent=won(total);
 const params=new URLSearchParams(location.search);for(const [key,set] of [['options',selectedOptions],['accessories',selectedAccessories]]){if(set.size)params.set(key,[...set].join(','));else params.delete(key)}history.replaceState(null,'','?'+params+location.hash);
}
function syncChecks(){document.querySelectorAll('[data-select-code]').forEach(e=>{const option=e.dataset.selectKind==='option';e.checked=(option?selectedOptions:selectedAccessories).has(e.dataset.selectCode);e.disabled=option&&requiredCodes().has(e.dataset.selectCode);e.closest('.item-card').classList.toggle('selected',e.checked);e.nextElementSibling.textContent=e.disabled?'필수 선택 · 자동 반영':'차량가격에 추가'})}
function cards(items,kind){return items.map((o,index)=>{const option=kind==='option',required=option&&requiredCodes().has(o.code);return `<article class="item-card"><label class="item-select"><input type="checkbox" data-select-kind="${option?'option':'accessory'}" data-select-code="${esc(o.code)}" aria-label="${esc(o.name)} 선택"><span>${required?'필수 선택 · 자동 반영':'차량가격에 추가'}</span></label><button class="item-button" data-item-kind="${kind}" data-item-index="${index}" aria-label="${esc(o.name)} 사진과 구성 보기"><img src="${esc(o.image)}" alt="${esc(o.name)}" loading="lazy" decoding="async"><div class="item-text"><strong>${esc(o.name)}</strong><p>${won(o.price)}</p><span class="open">사진·구성 보기 <span>↗</span></span></div></button></article>`}).join('')}
function renderOptions(){
 reconcileSelection();const moreOpen=$('#moreAccessories').open;
 const options=visibleOptions();$('#optionsTrim').textContent=trim.name+'에서 확인할 수 있는 선택 품목입니다.';$('#optionGrid').innerHTML=options.length?cards(options,'option'):'<p class="empty">공식 구성기에 별도 선택 품목이 없습니다. 기본 사양을 확인해 주세요.</p>';
 const accessories=trim.accessories;$('#accessoryCount').textContent=accessories.length+'개 용품 · 선택 트림 기준';$('#accessoryGrid').innerHTML=cards(accessories.slice(0,6),'accessory');
 $('#moreAccessories').hidden=accessories.length<=6;$('#moreAccessories').open=moreOpen;$('#moreCount').textContent='나머지 '+Math.max(0,accessories.length-6)+'개 용품 더 보기';$('#moreAccessoryGrid').innerHTML=cards(accessories.slice(6),'accessory-more');syncChecks();renderPrice();
}
function renderSelectors(){
 const groups=[...new Set(book.trims.map(group))];$('#powerTabs').innerHTML=groups.map(g=>`<button data-power="${esc(g)}" aria-pressed="${group(trim)===g}">${esc(g)}</button>`).join('');
 $('#trimList').innerHTML=book.trims.filter(t=>group(t)===group(trim)).map(t=>`<button class="trim-choice" data-trim="${esc(t.code)}" aria-pressed="${t.code===trim.code}"><strong>${esc(shortName(t))}</strong><small>${won(t.price)}</small></button>`).join('');
 $('#colorChoices').innerHTML=trim.colors.map(c=>`<button class="color-choice" data-color="${esc(c.code)}" aria-pressed="${c.code===color.code}" aria-label="${esc(c.name)} · ${addPrice(c.price)}" title="${esc(c.name)} · ${addPrice(c.price)}"><img src="${esc(c.thumb)}" alt=""></button>`).join('');$('#colorDesc').innerHTML=esc(color.name)+'<span>'+addPrice(color.price)+'</span>';
 $('#interiorChoices').innerHTML=trim.interiors.map(i=>`<button class="interior-choice" data-interior="${esc(i.code)}" aria-pressed="${i.code===interior.code}"><img src="${esc(i.thumb)}" alt=""><div><strong>${esc(i.name)}</strong><small>${addPrice(i.price)}</small></div></button>`).join('');
 $('#basePrice').textContent=won(trim.price);$('#selectedTrim').textContent=trim.name;$('#powerFacts').textContent='배기량 '+trim.displacement+' · 공식 구성기 출력 표기 '+trim.output;
 const deps=notes();$('#dependency').hidden=!deps.length;$('#dependency').innerHTML=deps.map(x=>'<div>'+esc(x)+'</div>').join('');
 $('#bottomName').textContent=book.name+' · '+shortName(trim);
}
function renderAll(){renderSelectors();renderPreview();renderSpecs();renderOptions()}
function revealPreview(){if(matchMedia("(max-width:820px)").matches)$("#configure").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"})}
function setTrim(code){const t=book.trims.find(x=>x.code===code);if(!t)return;selectedOptions.clear();selectedAccessories.clear();$('#selectionFeedback').textContent='트림을 변경해 옵션·용품 선택을 초기화했습니다.';trim=t;color=t.colors.find(c=>c.code===color?.code)||t.colors[0];interior=t.interiors.find(i=>i.code===interior?.code)||t.interiors[0];angle=1;view='exterior';renderAll();revealPreview()}
function openImage(title,src,price,description){focusReturn=document.activeElement;$('#modalTitle').textContent=title;$('#modalImage').hidden=false;$('#modalImage').src=src;$('#modalImage').alt=title;$('#modalPrice').textContent=price==null?'':won(price);$('#modalDescription').textContent=description||'';$('#modalOriginal').href=src;modal.showModal()}
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-trim]');if(t)setTrim(t.dataset.trim);
 const p=e.target.closest('[data-power]');if(p){const t=book.trims.find(x=>group(x)===p.dataset.power);if(t)setTrim(t.code)}
 const c=e.target.closest('[data-color]');if(c){color=trim.colors.find(x=>x.code===c.dataset.color);view='exterior';renderSelectors();renderPreview();renderOptions();revealPreview()}
 const i=e.target.closest('[data-interior]');if(i){interior=trim.interiors.find(x=>x.code===i.dataset.interior);if(model==='arkana'&&interior.code==='S')selectedOptions.delete('----P');view='interior';renderSelectors();renderPreview();renderOptions();revealPreview()}
 const v=e.target.closest('[data-view]');if(v){view=v.dataset.view;renderPreview()}
 const a=e.target.closest('[data-angle]');if(a){angle=Number(a.dataset.angle);renderPreview()}
 const item=e.target.closest('[data-item-kind]');if(item){const kind=item.dataset.itemKind;const index=Number(item.dataset.itemIndex)+(kind==='accessory-more'?6:0);const o=kind==='option'?visibleOptions()[index]:trim.accessories[index];if(o)openImage(o.name,o.image,o.price,o.description||'선택 조건과 적용 내용은 공식 구성기 및 가격표를 확인해 주세요.')}
});
document.addEventListener('change',e=>{
 const input=e.target.closest('[data-select-code]');if(!input)return;
 const isOption=input.dataset.selectKind==='option',code=input.dataset.selectCode,set=isOption?selectedOptions:selectedAccessories,items=isOption?visibleOptions():trim.accessories,item=items.find(o=>o.code===code);if(!item)return;
 const removed=[];
 if(input.checked){
  for(const other of items){if(other.code===code||!set.has(other.code))continue;if(item.excludes.split(',').includes(other.code)||other.excludes.split(',').includes(code)){set.delete(other.code);removed.push(other.name)}}
  set.add(code);if(model==='arkana'&&isOption&&code==='----P'){interior=trim.interiors.find(i=>i.code==='V')||interior;view='interior';renderSelectors();renderPreview()}
 }else set.delete(code);
 reconcileSelection();syncChecks();renderPrice();$('#selectionFeedback').textContent=removed.length?'동시 선택할 수 없는 '+removed.join(', ')+' 선택을 해제했습니다.':(input.checked?item.name+' 가격을 반영했습니다.':item.name+' 선택을 해제했습니다.');
});
$('#resetExtras').addEventListener('click',()=>{selectedOptions.clear();selectedAccessories.clear();reconcileSelection();syncChecks();renderPrice();$('#selectionFeedback').textContent='옵션·용품 선택을 초기화했습니다. 현재 색상·내장에 필요한 필수 옵션은 유지합니다.'});
$('#previewButton').addEventListener('click',()=>openImage(trim.name+' · '+(view==='interior'?interior.name:color.name),currentImage(),null,'공식 '+(view==='interior'?'내장':'외장')+' 이미지입니다.'));
$('#closeModal').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});modal.addEventListener('close',()=>{if(focusReturn?.isConnected)focusReturn.focus()});
$('#buildImage').addEventListener('error',()=>{$('#buildImage').hidden=true;$('#imageMessage').hidden=false;$('#imageOriginal').href=currentImage()});
$('#modalImage').addEventListener('error',()=>{$('#modalImage').hidden=true});
async function init(){try{
 book=orderBookItems(await RenaultSite.fetchJSON('data/approach-'+model+'.json?v=book-20261114'));
 $('#bookHeading').textContent=book.name+' 내차만들기';document.title=book.name+' 트림·컬러 내차만들기 | 물금전시장 오승훈부장';$('#officialBuilder').href=book.official;$('#officialFooter').href=book.official;$('#galleryLink').href='index.html?model='+model+'#media';$('#pricePDF').href='https://cdn.renault.co.kr/upload/asset/price/price_'+(model==='arkana'?'Arkana':model)+'_202611.pdf';
 document.querySelectorAll('.models a').forEach(a=>{a.classList.toggle('active',a.dataset.model===model);if(a.dataset.model===model)a.setAttribute('aria-current','page')});
 const q=new URLSearchParams(location.search);trim=book.trims.find(t=>t.code===q.get('trim'))||book.trims[0];color=trim.colors.find(c=>c.code===q.get('color'))||trim.colors[0];interior=trim.interiors.find(i=>i.code===q.get('interior'))||trim.interiors[0];view=q.get('view')==='interior'?'interior':'exterior';selectedOptions=new Set((q.get('options')||'').split(',').filter(Boolean));selectedAccessories=new Set((q.get('accessories')||'').split(',').filter(Boolean));if(model==='arkana'&&selectedOptions.has('----P'))interior=trim.interiors.find(i=>i.code==='V')||interior;renderAll();$('#loadState').hidden=true;$('#bookContent').hidden=false;
 }catch(e){RenaultSite.fail('loadState');$('#bookContent').hidden=true}}
init();
})();
