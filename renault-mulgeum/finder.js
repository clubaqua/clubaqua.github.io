'use strict';
(()=>{
 const C=window.RenaultFinder,$=s=>document.querySelector(s),money=n=>Math.round(Number(n)).toLocaleString('ko-KR')+'원';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const L=window.RenaultFinderLeads,M=window.RenaultMoneyInput;
 const init=()=>({customer:{name:'',phone:'',carrier:'',region:''},consideredModel:'undecided',purchaseEntity:'personal',mainUser:[],mainUserOther:'',features:[],preferred:[],priority:[],needsOnly:true});
 let answers=init(),books,data,index=0,lastResult=null;
 const LEADS_KEY='renault-finder-leads-v1';
 let leadId='',customerRef='',customerSignature='';
 const SAVE_KEY='renault-finder-saved-v1';
 let costs={discount:'0',taxReduction:'0',registration:'',insurance:'',delivery:''},savedTrim='';
 const definitions=[
  {id:'customer',label:'고객 정보',title:'어떻게 불러드리면 될까요?',hint:'상담 메모에 담을 정보를 입력해 주세요. 입력하지 않아도 다음 질문으로 넘어갈 수 있습니다. 별도의 접수 전에는 서버로 전송되지 않습니다.',kind:'customer'},
  {id:'consideredModel',label:'구매 고려 모델',title:'어떤 르노를 생각하고 계신가요?',hint:'모델을 정하셨다면 그 모델의 트림·옵션 안에서 추천합니다.',choices:[['filante','필랑트','하이브리드 E-Tech'],['koleos','그랑 콜레오스','하이브리드·가솔린'],['arkana','아르카나','하이브리드·가솔린'],['undecided','미정','조건에 맞는 세 차종 비교']]},
  {id:'purchaseEntity',label:'차량 구입 주체',title:'누구의 명의로 구입할 예정인가요?',hint:'구입 주체를 상담 메모에 반영합니다. 세금·혜택 자격은 내차만들기에서 확인합니다.',choices:[['personal','개인 / 개인사업자','개인 또는 개인사업자 명의'],['corporation','법인사업자','법인 명의'],['nonprofit','비영리단체','비영리단체 명의']]},
  {id:'mainUser',kind:'multi',label:'주사용자',title:'누가 주로 운전하시나요?',hint:'여러 명 선택할 수 있습니다. 기타를 고르면 직접 입력해 주세요. 선택을 마친 후 ‘다음’을 눌러주세요.',choices:[['self','본인','내가 주로 운전'],['spouse','배우자','배우자가 주로 운전'],['children','자녀','자녀가 주로 운전'],['parents','부모님','부모님이 주로 운전'],['siblings','형제자매','형제자매가 주로 운전'],['employees','임직원','업무용으로 이용'],['other','기타','직접 입력']]},
  {id:'purpose',label:'사용 목적',title:'차를 주로 어디에 사용하시나요?',hint:'가장 자주 사용하는 상황 하나를 골라주세요.',choices:[['commute','출퇴근·도심 이동','매일의 이동과 주차 편의'],['family','가족·자녀와 이동','뒷좌석과 가족의 편안함'],['leisure','여행·레저','주말 나들이와 짐 싣기'],['business','업무·고객 방문','장거리 이동과 실내 경험'],['mixed','다양한 일상','여러 용도를 균형 있게']]},
  {id:'people',label:'탑승 인원',title:'평소 몇 명이 함께 타시나요?',hint:'차종별 공간 활용을 고려합니다. 세 차종 모두 5인승입니다.',choices:[['1-2','주로 1~2명','나 또는 두 사람의 이동'],['3-4','주로 3~4명','가족·동료와 함께'],['5','5명이 자주 함께','뒷좌석을 자주 모두 사용'],['6plus','6명 이상 필요','이 세 차종은 인원 조건 미충족']]},
  {id:'mileage',label:'연 주행거리',title:'1년에 얼마나 운전하시나요?',hint:'정확한 수치가 아니어도 괜찮아요. 예상 구간을 골라주세요.',choices:[['low','1만 km 미만','월평균 약 830km 미만'],['medium','1만~2만 km','월평균 약 830~1,670km'],['high','2만~3만 km','월평균 약 1,670~2,500km'],['veryhigh','3만 km 이상','월평균 약 2,500km 이상']]},
  {id:'road',label:'주행 환경',title:'어떤 길을 가장 많이 달리시나요?',hint:'같은 주행거리라도 정체 구간과 고속도로 비중을 함께 고려합니다.',choices:[['city','도심·정체 구간','신호와 정차가 잦아요'],['highway','고속도로·자동차 전용도로','일정한 속도로 오래 달려요'],['mixed','도심과 고속도로를 골고루','한쪽으로 치우치지 않아요']]},
  {id:'fuel',label:'선호 연료',title:'원하는 연료 타입이 있나요?',hint:'‘하이브리드’와 ‘가솔린’을 선택하면 해당 조건을 지키며 추천합니다.',choices:[['any','추천받고 싶어요','사용 환경과 예산으로 비교'],['hev','하이브리드 E-Tech','세 차종에서 선택 가능'],['ice','가솔린','그랑 콜레오스·아르카나'],['ev','전기차','이 가이드의 세 차종에는 미운영'],['lpg','LPG','이 가이드의 세 차종에는 미운영'],['diesel','디젤','이 가이드의 세 차종에는 미운영']]},
  {id:'budget',label:'차량 예산',title:'차량과 옵션에 얼마까지 생각하시나요?',hint:'차량 기본가격 + 선택 옵션 + 외장·내장 추가금의 상한입니다. 취득·등록·보험·탁송비와 할인은 포함하지 않습니다.',kind:'budget'},
  {id:'method',label:'구매 방법',title:'어떤 방식으로 이용하고 싶으신가요?',hint:'차량 구성과 함께 준비할 상담 내용을 맞춰드립니다.',choices:[['cash','일시불','차량 구성 가격을 중심으로'],['installment','할부','기간·금리 등은 내차만들기에서 비교'],['lease','리스','이용 기간과 월 예산으로 견적 상담'],['rent','장기렌트','주행거리·기간·월 예산으로 견적 상담'],['undecided','아직 고민 중이에요','방식별 조건을 상담 후 결정']]},
  {id:'features',label:'원하는 기능',title:'어떤 기능이 있으면 좋을까요?',hint:'기능마다 ‘있으면 좋아요’ 또는 ‘꼭 필요해요’를 골라주세요. 필수 기능은 반드시 지키고, 선호 기능은 예산 안에서 최대한 반영합니다. 선택을 마친 후 ‘다음’을 눌러주세요.',kind:'features'},
  {id:'priority',kind:'multi',label:'선택 기준',title:'마지막으로, 어떤 기준을 중요하게 보시나요?',hint:'여러 개 선택할 수 있습니다. 선택을 마치면 ‘추천 결과 보기’를 눌러주세요.',choices:[['value','가격·실속','차량 구매비용과 필요한 사양의 균형'],['comfort','편안함·실내 공간','시트 편의 사양과 실내 사용성'],['safety','안전·주행 보조','주행·주차 보조 기능'],['economy','연비를 고려한 선택','연료 효율과 일상 주행 환경'],['style','디자인·스타일','외관·실내 디자인과 전용 스타일'],['rarity','희소성 · 한정 에디션','에디션 전용 구성 · 출고 가능 재고 확인']]}];
 function steps(){return definitions;}
 function selectedLabel(d){if(d.id==='customer')return [answers.customer.name,answers.customer.phone,answers.customer.carrier,answers.customer.region].filter(Boolean).join(' / ')||'미입력';if(d.id==='mainUser')return C.mainUserLabel(answers);if(d.id==='priority')return d.choices.filter(c=>answers.priority.includes(c[0])).map(c=>c[1]).join(' · ')||'지정 없음';if(d.id==='budget')return answers.budget?Number(answers.budget).toLocaleString('ko-KR')+'만원':'';if(d.id==='features')return '필수 '+answers.features.length+' · 선호 '+answers.preferred.length;return d.choices?.find(c=>c[0]===answers[d.id])?.[1]||'';}
 function builderURL(c){const context=window.RenaultCustomerContext;if(context){try{const signature=JSON.stringify(context.clean(answers.customer));if(signature!==customerSignature||!customerRef||!Object.values(context.read(customerRef,localStorage)).some(Boolean)){customerSignature=signature;customerRef=context.create(answers.customer,localStorage);}}catch(_){customerRef='';}}const u=new URL(C.buildURL(c),location.href);if(['cash','installment','lease','rent','undecided'].includes(answers.method))u.searchParams.set('method',answers.method);if(['personal','corporation','nonprofit'].includes(answers.purchaseEntity))u.searchParams.set('entity',answers.purchaseEntity);if(customerRef&&window.RenaultCustomerContext&&Object.values(window.RenaultCustomerContext.clean(answers.customer)).some(Boolean))u.searchParams.set('customerRef',customerRef);return u.href;}
 function setJourneyOpen(open){
  const toggle=$('#routeToggle');if(!toggle)return;
  toggle.setAttribute('aria-expanded',String(open));
  $('.route-panel').classList.toggle('is-open',open);
  $('#routeToggleIcon').textContent=open?'−':'＋';
 }
 function render(focus=true){
  const list=steps();index=Math.max(0,Math.min(index,list.length-1));const d=list[index];
  $('.wizard-layout').hidden=false;$('#results').hidden=true;$('.intro').hidden=false;$('#dataNote').hidden=false;
  $('#journey').innerHTML=list.map((s,i)=>`<li class="${i===index?'current':i<index?'done':''}"><button type="button" data-step="${i}" ${i>index?'disabled':''} ${i===index?'aria-current="step"':''}>${String(i+1).padStart(2,'0')} ${esc(s.label)}${i<index?`<small>${esc(selectedLabel(s))}</small>`:''}</button></li>`).join('');
  $('#stepCounter').textContent=`질문 ${index+1} / ${list.length}`;$('#stepName').textContent=d.label;
  const pct=Math.round((index+1)/list.length*100);$('#progress').setAttribute('aria-valuenow',pct);$('#progress span').style.width=pct+'%';
  let body='';
  if(d.kind==='budget')body=`<label for="budgetInput" class="field">차량 구성 총 예산</label><div class="input-row"><input id="budgetInput" type="text" data-money="integer" min="2500" max="10000" step="1" inputmode="numeric" value="${esc(M.format(answers.budget))}" placeholder="입력" aria-describedby="budgetHelp"><span>만원까지</span></div><div class="budget-presets" aria-label="예산 빠른 선택">${[3000,3500,4000,4500,5000,5500,6000].map(n=>`<button type="button" data-budget="${n}" class="${Number(answers.budget)===n?'active':''}">${n.toLocaleString('ko-KR')}만원</button>`).join('')}</div><p class="price-note" id="budgetHelp">2,500 ~ 10,000만원 범위내 입력.</p>`;
  else if(d.kind==='customer')body=`<div class="form-grid customer-fields"><div><label class="field" for="customerName">고객명</label><input id="customerName" data-customer="name" maxlength="50" autocomplete="name" value="${esc(answers.customer.name)}" placeholder="입력해 주세요"></div><div><label class="field" for="customerPhone">휴대전화번호</label><input id="customerPhone" data-customer="phone" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" value="${esc(answers.customer.phone)}" placeholder="입력해 주세요"></div><div><label class="field" for="customerCarrier">통신사</label><select id="customerCarrier" data-customer="carrier"><option value="">선택해주세요</option>${L.carriers.map(v=>`<option ${answers.customer.carrier===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div><div><label class="field" for="customerRegion">주소지역</label><select id="customerRegion" data-customer="region"><option value="">선택해주세요</option>${L.regions.map(v=>`<option ${answers.customer.region===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div></div><p class="price-note">고객 정보는 상담 메모·출력물에 포함됩니다. 내차만들기 연결을 위해 이 브라우저에 임시 보관하며, 연결 유효시간은 2시간입니다. 별도 상담 기록 저장은 선택입니다.</p>`;
  else if(d.kind==='multi')body=`<div class="choices" role="group" aria-label="${esc(d.label)} · 복수 선택">${d.choices.map(([id,label,detail])=>`<button class="choice" role="checkbox" aria-checked="${answers[d.id].includes(id)}" ${d.id==='priority'?'data-priority':'data-user'}="${id}" type="button"><span><strong>${esc(label)}</strong><small>${esc(detail)}</small></span></button>`).join('')}</div>`;
  else if(d.kind==='features')body=`<div class="feature-priorities">${Object.entries(C.features).map(([id,label])=>`<div class="feature-row"><strong>${esc(label)}</strong><div class="feature-levels" role="group" aria-label="${esc(label)} 중요도"><button type="button" data-none="${id}" aria-pressed="${!answers.features.includes(id)&&!answers.preferred.includes(id)}">상관없어요</button><button type="button" data-preferred="${id}" aria-pressed="${answers.preferred.includes(id)}">있으면 좋아요</button><button type="button" data-feature="${id}" aria-pressed="${answers.features.includes(id)}">꼭 필요해요</button></div></div>`).join('')}</div><button class="button subtle" type="button" data-clear-features style="margin-top:14px">기능 선택 모두 해제</button>`;
  else body=`<div class="choices" role="radiogroup" aria-label="${esc(d.label)}">${d.choices.map(([id,label,detail])=>`<button class="choice" role="radio" aria-checked="${answers[d.id]===id}" data-choice="${id}" type="button"><span><strong>${esc(label)}</strong><small>${esc(detail)}</small></span></button>`).join('')}</div>`;
  if(d.id==='mainUser'&&answers.mainUser.includes('other'))body+=`<label class="field" for="mainUserOther">주사용자 직접 입력</label><input id="mainUserOther" maxlength="80" value="${esc(answers.mainUserOther)}" placeholder="예: 친척, 지인">`;
  if(d.id==='budget')body+='<p class="budget-extra">취등록비용 + 보험료 등 추가비용 별도</p>';
  $('#question').innerHTML=`<h2 tabindex="-1" id="questionTitle">${esc(d.title)}</h2><p class="helper">${esc(d.hint)}${!d.kind?' 답변을 선택하면 자동으로 다음 질문으로 이동합니다.':''}</p>${body}${d.kind==='features'?'<p class="multi-hint">여러 개 선택 가능 · 선택을 마친 후 <strong>‘다음’</strong>을 눌러주세요.</p>':''}`;
  $('#validation').textContent='';$('#previous').disabled=index===0;$('#next').hidden=!d.kind&&!(d.id==='mainUser'&&answers.mainUser.includes('other'));$('#next').textContent=d.id==='priority'?'선택 완료 · 추천 결과 보기 →':d.id==='features'?(answers.features.length||answers.preferred.length?'선택 완료 · 다음 →':'선택 없이 다음 →'):'다음 질문 →';
  if(focus){$('#questionTitle').focus({preventScroll:true});if(matchMedia('(max-width:760px)').matches){setJourneyOpen(false);$('.workspace').scrollIntoView({behavior:'auto',block:'start'});}}
 }
 function validate(){
  const d=steps()[index];
  if(d.id==='customer')answers.customer=L.cleanCustomer(answers.customer);
  if(d.id==='budget'&&(!answers.budget||!Number.isFinite(Number(answers.budget))||Number(answers.budget)<2500||Number(answers.budget)>10000))return '2,500 ~ 10,000만원 범위내 입력.';
  if(d.id==='customer')return L.validateCustomer(answers.customer);
  if(d.id==='mainUser'&&!answers.mainUser.length)return '주사용자를 한 명 이상 선택해 주세요.';
  if(d.id==='mainUser'&&answers.mainUser.includes('other')&&!answers.mainUserOther.trim())return '주사용자를 입력해 주세요.';
  if(!d.kind&&!answers[d.id])return '가장 가까운 답변 하나를 선택해 주세요.';
  return '';
 }
 function unavailable(){
  const capacity=answers.people==='6plus',fuel=['ev','lpg','diesel'].includes(answers.fuel);
  if(!capacity&&!fuel)return false;
  const reason=capacity?'현재 이 안내에서 소개하는 필랑트·그랑 콜레오스·아르카나는 모두 5인승으로, 6명 이상 탑승하실 수 있는 차량을 추천해 드리기 어렵습니다.':`현재 이 안내에서 소개하는 필랑트·그랑 콜레오스·아르카나에는 ${esc({ev:'전기차',lpg:'LPG',diesel:'디젤'}[answers.fuel])} 모델이 없어 고객님의 조건에 맞는 차량을 추천해 드리기 어렵습니다.`;
  lastResult=null;$('.wizard-layout').hidden=true;$('.intro').hidden=true;$('#dataNote').hidden=true;
  const target=$('#results');target.hidden=false;
  target.innerHTML=`<div class="empty-state"><p class="eyebrow">THANK YOU FOR YOUR INTEREST</p><h2>고객님의 소중한 의견에 감사드립니다.</h2><p>${reason}</p><p><strong>앞으로 고객님의 니즈에 맞는 다양한 차량을 선보이겠습니다.</strong></p><p>르노에 관심을 가져주셔서 감사합니다.</p><div class="error-actions"><button class="button primary" type="button" data-edit="${capacity?'people':'fuel'}">이전 질문으로 돌아가기</button><button class="button secondary" type="button" data-exit>종료</button></div><p class="price-note" style="margin-top:16px">종료하면 이 창을 닫습니다. 직접 여신 창에서는 차량 소개 화면으로 이동합니다.</p></div>`;
  target.focus({preventScroll:true});target.scrollIntoView({behavior:'auto',block:'start'});
  return true;
 }
 function selectChoice(id){
  answers[steps()[index].id]=id;
  if(unavailable())return;
  advance();
 }
 function goStep(id){index=steps().findIndex(s=>s.id===id);render();}
 function preferenceHTML(c){
  if(!answers.preferred.length)return '';
  const matched=answers.preferred.filter(id=>C.hasFeature(c,id)),missing=answers.preferred.filter(id=>!C.hasFeature(c,id));
  return `<div class="preference-report"><strong>있으면 좋은 기능 ${matched.length} / ${answers.preferred.length}개 반영</strong><p>${matched.length?'✓ '+matched.map(id=>esc(C.features[id])).join(' · '):'현재 구성에 반영된 선호 기능이 없습니다.'}</p>${missing.length?`<p class="price-note">미반영: ${missing.map(id=>esc(C.features[id])).join(' · ')} — 필수 조건은 모두 충족합니다.</p>`:''}</div>`;
 }
 function upgradeHTML(c){
  const u=C.upgrade(books[c.model],data.guides[c.model],c,answers);
  if(!u)return '<p class="price-note upgrade-none">같은 연료에서 비교할 다음 가격대 트림이 없습니다.</p>';
  const t=u.candidate;
  return `<details class="upgrade-panel"><summary>한 단계 더 비교하기 · ${esc(C.shortTrim(t.trim))}</summary><p class="upgrade-price">${u.difference>=0?money(u.difference)+' 추가':money(-u.difference)+' 절약'}하면?</p><p>${esc(C.shortTrim(c.trim))} 추천 구성 ${money(c.total)} → ${esc(C.shortTrim(t.trim))} 비교 구성 ${money(t.total)}</p><p>${u.overBudget?'<strong class="budget-warning">현재 차량 예산보다 '+money(u.overBudget)+' 높습니다.</strong>':'현재 차량 예산 안에서 비교할 수 있습니다.'}</p><h4>상위 가격대에서 기본으로 바뀌는 기능</h4><ul>${u.newStandard.map(id=>'<li>'+esc(C.features[id])+'</li>').join('')||'<li>이 목록의 주요 기능 중 새로 기본 제공되는 항목은 없습니다. 전용 디자인·전체 사양을 비교해 보세요.</li>'}</ul>${u.lost.length?'<p class="budget-warning">현재 구성 대비 미포함 기능: '+u.lost.map(id=>esc(C.features[id])).join(', ')+'</p>':''}<div class="upgrade-table"><table><thead><tr><th>주요 기능</th><th>현재 구성</th><th>비교 구성</th></tr></thead><tbody>${Object.entries(C.features).filter(([id])=>C.hasFeature(c,id)!==C.hasFeature(t,id)||c.guide.features[id]?.status!==t.guide.features[id]?.status).map(([id,label])=>`<tr><th>${esc(label)}</th><td>${featureStatus(c,id)}</td><td>${featureStatus(t,id)}</td></tr>`).join('')||'<tr><td colspan="3">주요 기능의 적용 상태가 같습니다.</td></tr>'}</tbody></table></div><p class="price-note">동일 연료에서 기본가격이 다음으로 높은 트림을 비교합니다. 외장·내장 및 옵션 구성은 다를 수 있으며, 4WD·에디션도 포함됩니다.</p><ul class="package-list">${t.options.map(o=>'<li>'+esc(o.name)+' · '+money(o.price)+'</li>').join('')||'<li>추가 선택 옵션 없음</li>'}</ul><p class="price-note">${esc(t.color.name)} / ${esc(t.interior.name)}</p><a class="button secondary" href="${esc(C.buildURL(t))}" target="_blank" rel="noopener">비교 구성 자세히 보기 ↗</a></details>`;
 }
 function featureStatus(c,id){return c.guide.features[id]?.status==='standard'?'기본':C.hasFeature(c,id)?'옵션 포함':c.guide.features[id]?.status==='option'?'선택 가능 · 미포함':'미제공';}
 function budgetHTML(){return `<div class="budget-compare"><div><p class="eyebrow">A LITTLE MORE CLARITY</p><h3>예산만 바꿔서 다시 비교하세요.</h3><p>용도·연료·필수 기능은 그대로 유지합니다.</p></div><div><label for="compareBudget">차량·옵션 예산 (만원)</label><div class="input-row"><input id="compareBudget" type="text" data-money="integer" inputmode="numeric" placeholder="입력" min="2500" max="10000" value="${esc(M.format(answers.budget))}"><button type="button" class="button primary" data-budget-apply>다시 비교</button></div><div class="budget-presets">${[3000,4000,4500,5000,5500,6000].map(n=>`<button type="button" data-rebudget="${n}">${n.toLocaleString('ko-KR')}만원</button>`).join('')}</div><p id="compareError" role="alert"></p></div></div>`;}
 function readSaved(){try{const v=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(v?.version!==1||!v.answers||typeof v.savedAt!=='string')return null;const a={...init(),...v.answers,customer:L.cleanCustomer(v.answers.customer),mainUser:C.mainUsers(v.answers.mainUser),priority:L.priorities(v.answers.priority),needsOnly:true};delete a.cashback;delete a.finance;for(const d of definitions.filter(d=>!d.kind))if(!d.choices.some(c=>c[0]===a[d.id]))return null;if(!Number.isFinite(Number(a.budget))||Number(a.budget)<2500||Number(a.budget)>10000)return null;a.features=Array.isArray(a.features)?[...new Set(a.features.filter(id=>C.features[id]))]:[];a.preferred=Array.isArray(a.preferred)?[...new Set(a.preferred.filter(id=>C.features[id]&&!a.features.includes(id)))]:[];return {...v,answers:a};}catch(_){return null;}}
 function showSaved(){const v=readSaved();$('#savedNotice').innerHTML=v?`<strong>저장한 ${esc(v.modelName||'르노')} 구성이 있어요.</strong><span>${esc(v.savedAt.slice(0,10))} 저장 · 이 브라우저에서만 보관됩니다.</span><div class="error-actions"><button class="button primary" type="button" data-restore>저장한 구성 불러오기</button><button class="button subtle" type="button" data-forget>저장 삭제</button></div>`:'마음에 드는 추천 결과는 ‘이 구성 저장’으로 이 브라우저에 보관할 수 있습니다.';}
 function saveResult(i){const c=lastResult?.recommendations?.[i];if(!c)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,savedAt:new Date().toISOString(),answers,costs,trimCode:c.trim.code,modelName:c.name}));savedTrim=c.trim.code;showSaved();$('#resultStatus').textContent=c.name+' 구성 및 입력한 고객 정보를 저장했습니다. 같은 기기·브라우저에서 다시 불러올 수 있습니다. 가장 최근 구성 한 개를 보관합니다.';}catch(_){$('#resultStatus').textContent='이 브라우저에서는 저장할 수 없습니다. 상담 메모를 복사하거나 PDF로 보관해 주세요.';}}
 function restoreResult(){const v=readSaved();if(!v){$('#savedNotice').textContent='불러올 저장 구성이 없습니다.';return;}answers=v.answers;leadId='';savedTrim=typeof v.trimCode==='string'?v.trimCode:'';if(v.costs)for(const key of Object.keys(costs)){const val=v.costs[key];costs[key]=val!==''&&Number.isFinite(Number(val))&&Number(val)>=0&&Number(val)<=15000?String(val):'';}index=steps().length-1;results();$('#resultStatus').textContent='저장한 조건을 불러와 최신 홈페이지 자료로 다시 계산했습니다. 저장 당시와 가격·공급 조건이 달라질 수 있습니다.';}
 function leadRows(){try{const v=JSON.parse(localStorage.getItem(LEADS_KEY)||'[]');return Array.isArray(v)?v:[];}catch(_){return [];}}
 function saveLead(){if(lastResult?.status!=='ok')return;try{const rows=leadRows();if(!leadId)leadId=crypto.randomUUID();const record={id:leadId,savedAt:new Date().toISOString(),answers:JSON.parse(JSON.stringify(answers)),recommendations:lastResult.recommendations.map(c=>({model:c.name,trim:c.trim.name,total:c.total,options:c.options.map(o=>o.name).join(' / ')}))};const i=rows.findIndex(v=>v.id===leadId);if(i<0)rows.push(record);else rows[i]=record;localStorage.setItem(LEADS_KEY,JSON.stringify(rows));$('#resultStatus').textContent='고객 정보와 추천 조건을 이 브라우저에 저장했습니다. 온라인 접수는 되지 않았습니다. CSV로 내보내 보관할 수 있습니다.';}catch(_){$('#resultStatus').textContent='상담 기록을 저장하지 못했습니다. 상담 메모나 PDF로 보관해 주세요.';}}
 function exportLeads(){const records=leadRows();if(!records.length){$('#resultStatus').textContent='저장한 상담 기록이 없습니다. 먼저 상담 기록 저장을 눌러주세요.';return;}const rows=[['저장일시','고객명','휴대전화','통신사','주소지역',...definitions.filter(d=>d.id!=='customer').map(d=>d.label),'추천 차량','추천 트림','차량 구성금액','선택 옵션']];const current=answers;try{for(const record of records){answers={...init(),...record.answers,customer:L.cleanCustomer(record.answers?.customer),mainUser:C.mainUsers(record.answers?.mainUser),priority:L.priorities(record.answers?.priority)};for(const car of record.recommendations||[])rows.push([record.savedAt,answers.customer.name,answers.customer.phone,answers.customer.carrier,answers.customer.region,...definitions.filter(d=>d.id!=='customer').map(d=>d.id==='features'?'필수: '+answers.features.map(id=>C.features[id]).join(' / ')+' | 선호: '+answers.preferred.map(id=>C.features[id]).join(' / '):selectedLabel(d)),car.model,car.trim,car.total,car.options]);}}finally{answers=current;}const url=URL.createObjectURL(new Blob([L.csv(rows)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='르노_상담기록_'+today()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#resultStatus').textContent='상담 기록 CSV를 내보냈습니다. 고객 정보가 포함되어 있으니 안전하게 보관해 주세요.';}
 let driveIndex=0;
 function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
 function openDrive(i){const c=lastResult?.recommendations?.[i];if(!c)return;driveIndex=i;$('#driveCar').textContent=c.name+' · '+C.shortTrim(c.trim);$('#driveDate').min=today();$('#driveStatus').textContent='';$('#driveDialog').showModal();}
 async function copyDrive(){const c=lastResult?.recommendations?.[driveIndex];if(!c)return;const date=$('#driveDate').value;if(!date||date<today()){$('#driveStatus').textContent='오늘 이후의 희망 날짜를 선택해 주세요.';return;}const note=['[시승 상담 요청]',`희망 차량: ${c.name} · ${C.shortTrim(c.trim)}`,`희망 날짜: ${date}`,`희망 시간대: ${$('#driveTime').value}`,'※ 시승 가능 차량·일정 확인 후 확정 부탁드립니다.','',consultMemo(c)].join('\n');$('#driveDialog').close();$('#memoText').value=note;$('#memoDialog').showModal();await writeMemo(note);}

 function card(c,i){
  const features=answers.features.map(id=>{let label=C.features[id];if(id==='roof')label=C.hasFeature(c,'glassroof')?'고정형 파노라믹 글래스 루프':'개폐형 파노라마 선루프';return `<span>✓ ${esc(label)} · ${id==='roof'?(c.guide.features.glassroof?.status==='standard'||c.guide.features.sunroof?.status==='standard'?'기본':'옵션 반영'):(c.guide.features[id]?.status==='standard'?'기본':'옵션 반영')}</span>`;}).join('');
  return `<article class="recommendation ${i===0?'first':''} ${savedTrim===c.trim.code?'saved-choice':''}"><div class="result-top"><div><span class="rank">${esc(c.recommendationRole||(i===0?'가장 먼저 비교할 구성':'함께 비교할 대안 '+i))}</span><h3>${esc(c.name)}</h3><p class="trim-name">${esc(c.mode==='hev'?'하이브리드 E-Tech':c.model==='arkana'?'1.6 GTe':'가솔린 2.0 터보')} · ${esc(C.shortTrim(c.trim))}</p><p class="total">${money(c.total)}</p><p class="price-note">차량·선택 옵션 합계 / 세금·등록·보험·탁송 제외</p></div><img src="${esc(c.color.image)}" alt="${esc(c.trim.name+' · '+c.color.name)}" loading="lazy"></div><div class="result-columns"><div><h4>선택 조건과 적용 사양</h4><ul class="reasons">${c.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')}</ul>${c.trim.name.includes('noir')?'<p class="price-note">누아르 에디션은 고정형 파노라믹 루프 미제공. 한정판 재고는 별도 확인합니다.</p>':''}</div><div><h4>차량 구성과 가격</h4><dl class="price-list"><div><dt>트림 기본가격</dt><dd>${money(c.trim.price)}</dd></div><div><dt>외장·내장 추가금</dt><dd>${money(Number(c.color.price)+Number(c.interior.price))}</dd></div><div><dt>선택옵션 ${c.options.length}개</dt><dd>${money(c.optionTotal)}</dd></div><div><dt>차량 예산과 차이</dt><dd>${money(Number(answers.budget)*10000-c.total)} 여유</dd></div></dl><ul class="package-list">${c.options.map(o=>`<li>${esc(o.name)} · ${money(o.price)}</li>`).join('')||'<li>추가 선택옵션 없이 기본 사양으로 구성했습니다.</li>'}</ul><p class="price-note">${esc(c.color.name)} / ${esc(c.interior.name)} 기준. 묶음 옵션은 한 번만 더했습니다.</p></div></div>${features?`<div class="feature-matches">${features}</div>`:''}${preferenceHTML(c)}${upgradeHTML(c)}<p class="helper">세금 감면·프로모션·캐시백·금융 조건은 선택한 구성을 내차만들기로 이어서 확인해 주세요.</p><div class="result-actions"><a class="button ${i===0?'primary':'secondary'}" href="${esc(builderURL(c))}" target="_blank" rel="noopener">내차만들기에서 혜택·금융 확인</a><a class="button subtle" href="book_${c.model}.html" target="_blank" rel="noopener">트림 비교표</a><button class="button subtle" type="button" data-copy="${i}">추천차량으로 상담받기</button></div></article>`;
 }
 function review(){return `<details class="answer-review"><summary>내 답변 확인</summary><dl>${steps().map(d=>`<div><dt>${esc(d.label)}</dt><dd>${esc(d.id==='features'?('필수: '+(answers.features.map(f=>C.features[f]).join(', ')||'없음')+' / 선호: '+(answers.preferred.map(f=>C.features[f]).join(', ')||'없음')):selectedLabel(d))}</dd></div>`).join('')}</dl><p class="price-note">입력하신 예산·연료·탑승 인원과 꼭 필요한 기능을 기준으로 구성했습니다. 원하신 기능의 포함 여부와 미반영 항목은 각 차량에서 확인해 주세요. 실제 적용 사양과 출고 가능 여부는 계약 전 확인이 필요합니다.</p></details>`;}
 function results(){
  lastResult=C.recommend(books,data,answers);const r=lastResult;
  $('.wizard-layout').hidden=true;$('.intro').hidden=true;const target=$('#results');target.hidden=false;
  let html=`<div class="results-toolbar"><p class="eyebrow">YOUR RENAULT MATCH</p><button class="button subtle" type="button" data-edit="customer">답변 수정</button><button class="button subtle" type="button" data-restart>처음부터 다시</button></div>`;
  if(r.status==='ok'){
   html+=`<h2 class="results-title">당신의 답변으로 고른 르노.</h2><p class="result-summary">차량 예산 ${Number(answers.budget).toLocaleString('ko-KR')}만원 안에서 필수 조건을 충족한 ${r.recommendations.length}개 구성입니다. 선호 기능의 반영 여부도 함께 확인해 보세요. 고려 모델을 선택하셨다면 해당 모델 안에서 추천합니다. 미정인 경우 가능한 다른 차종도 함께 보여드립니다.</p>${r.recommendations.map(card).join('')}<div class="consult-panel"><h3>내 조건 그대로, 오승훈부장과 상담하세요.</h3><p>마음에 드는 구성의 상담 메모를 복사해 두면 실제 재고·할인·금융 조건까지 이어서 확인하기 편합니다.</p><div class="result-actions"><a class="button primary" href="tel:01089431114">상담 010-8943-1114</a><a class="button" href="https://open.kakao.com/o/syD9vJZd" target="_blank" rel="noopener">카카오톡 상담 ↗</a><button class="button" type="button" data-print>요약 인쇄 / PDF 저장</button></div><p class="print-hint">A4 세로 · 추천 구성당 1장으로 정리합니다. 인쇄 배율 100%, 머리글·바닥글 해제를 권장합니다.</p></div>`;
  }else{
   html+=`<div class="empty-state"><p class="eyebrow">조건을 조금 조정해 볼까요?</p><h2>조건에 맞는 구성을 찾지 못했습니다.</h2><p>${esc(r.message)}</p>${r.status==='budget'?`<p>같은 필수 조건의 최저 구성은 <strong>${esc(r.closest.trim.name)} · ${money(r.closest.total)}</strong>입니다. 현재 차량 예산보다 <strong>${money(r.shortfall)}</strong> 높으며, 예산 내 추천이 아닙니다.</p>`:''}${r.unavailable?.length?`<p>현재 연료 조건에서 미제공: ${esc(r.unavailable.map(x=>C.features[x]).join(', '))}</p>`:''}<div class="error-actions"><button class="button primary" type="button" data-edit="${r.status==='criteria'?(r.adjust||'priority'):r.status==='capacity'?'people':r.status==='fuel'?'fuel':r.status==='features'?'features':'budget'}">${r.status==='criteria'?(r.adjust==='fuel'?'연료':'선택 기준'):r.status==='capacity'?'탑승 인원':r.status==='fuel'?'연료':r.status==='features'?'필수 기능':'예산'} 다시 선택</button>${r.status==='fuel'?'<button class="button secondary" type="button" data-relax-fuel>연료 조건을 풀고 다시 비교</button>':''}${r.status==='criteria'&&r.adjust==='fuel'?'<button class="button secondary" type="button" data-edit="priority">선택 기준 다시 선택</button>':''}<button class="button secondary" type="button" data-edit="consideredModel">고려 모델 다시 선택</button><a class="button secondary" href="tel:01089431114">오승훈부장과 상담</a></div></div>`;
  }
  target.innerHTML=budgetHTML()+html+(r.status==='ok'?'<details class="lead-tools"><summary>상담 기록 보관 · CSV 내보내기</summary><p>입력한 고객 정보와 추천 조건을 이 기기에 보관합니다. 온라인 DB로 자동 접수되지 않습니다. 공용 기기에서는 저장하지 마세요.</p><div class="result-actions"><button class="button secondary" type="button" data-lead-save>이 기기에 상담 기록 저장</button><button class="button subtle" type="button" data-lead-export>저장 기록 CSV 내보내기</button><button class="button subtle" type="button" data-lead-clear>상담 기록 전체 삭제</button></div></details>':'')+review()+'<p class="status-message" id="resultStatus" role="status"></p>';
  preparePrint();
  target.focus({preventScroll:true});target.scrollIntoView({behavior:'auto',block:'start'});
 }
 function consultMemo(c){return C.summary(c,answers);}
 function preparePrint(){
  let output=$('#finderPrint');
  if(!output){output=document.createElement('div');output.id='finderPrint';document.body.appendChild(output);}
  if(lastResult?.status!=='ok'||$('#results').hidden){output.innerHTML='';return;}
  const answerRows=steps().filter(d=>d.id!=='features').map(d=>[d.label,selectedLabel(d)]);
  output.innerHTML=RenaultFinderPrint.render({recommendations:lastResult.recommendations,answers,costs,books,data,answerRows,needsOnly:true});
 }
 window.addEventListener('beforeprint',preparePrint);
 async function writeMemo(content){
  let ok=false;
  try{await navigator.clipboard.writeText(content.replace(/\r?\n/g,'\r\n'));ok=true;}catch(e){const t=$('#memoText');t.focus();t.select();try{ok=document.execCommand('copy');}catch(_){} }
  const message=ok?'상담 메모를 복사했습니다. 메모장이나 카카오톡에 붙여넣어 주세요.':'자동 복사를 사용할 수 없습니다. 아래 메모를 전체 선택해 직접 복사해 주세요.';
  $('#memoStatus').textContent=message;$('#resultStatus').textContent=message;
 }
 async function copy(index){
  const c=lastResult?.recommendations?.[index];if(!c)return;
  $('#memoText').value=consultMemo(c);$('#memoStatus').textContent='';$('#memoDialog').showModal();
  await writeMemo($('#memoText').value);
 }
 function advance(){const msg=validate();$('#validation').textContent=msg;if(msg)return;if(index===steps().length-1)results();else{index++;render();}}
 $('#next').addEventListener('click',advance);
 $('#previous').addEventListener('click',()=>{if(index>0){index--;render();}});
 document.addEventListener('click',e=>{
  if(e.target.closest('#routeToggle')){setJourneyOpen($('#routeToggle').getAttribute('aria-expanded')!=='true');return;}
  const multi=e.target.closest('[data-priority],[data-user]');if(multi){const key=multi.hasAttribute('data-user')?'mainUser':'priority',id=multi.dataset.user||multi.dataset.priority;answers[key]=answers[key].includes(id)?answers[key].filter(v=>v!==id):[...answers[key],id];render(false);$('#question ['+(key==='mainUser'?'data-user':'data-priority')+'="'+id+'"]').focus({preventScroll:true});}
  const choice=e.target.closest('[data-choice]');if(choice){selectChoice(choice.dataset.choice);}
  const level=e.target.closest('[data-feature],[data-preferred],[data-none]');if(level){const id=level.dataset.feature||level.dataset.preferred||level.dataset.none;answers.features=answers.features.filter(f=>f!==id);answers.preferred=answers.preferred.filter(f=>f!==id);if(level.dataset.feature)answers.features.push(id);if(level.dataset.preferred)answers.preferred.push(id);render(false);const attr=level.dataset.feature?'data-feature':level.dataset.preferred?'data-preferred':'data-none';$('#question ['+attr+'="'+id+'"]').focus({preventScroll:true});}
  const budget=e.target.closest('[data-budget]');if(budget){answers.budget=budget.dataset.budget;$('#budgetInput').value=M.format(answers.budget);document.querySelectorAll('[data-budget]').forEach(b=>b.classList.toggle('active',b===budget));$('#validation').textContent='';advance();}
  const jump=e.target.closest('[data-step]');if(jump&&!jump.disabled){index=Number(jump.dataset.step);render();}
  const edit=e.target.closest('[data-edit]');if(edit)goStep(edit.dataset.edit);
  if(e.target.closest('[data-clear-features]')){answers.features=[];answers.preferred=[];render(false);}
  if(e.target.closest('[data-relax-fuel]')){answers.fuel='any';results();}
  if(e.target.closest('[data-lead-save]'))saveLead();
  if(e.target.closest('[data-lead-export]'))exportLeads();
  if(e.target.closest('[data-lead-clear]')){try{localStorage.removeItem(LEADS_KEY);leadId='';$('#resultStatus').textContent='이 기기의 상담 기록을 모두 삭제했습니다. 저장한 차량 구성은 별도로 삭제할 수 있습니다.';}catch(_){$('#resultStatus').textContent='상담 기록을 삭제하지 못했습니다.';}}
  if(e.target.closest('[data-restart]')){leadId='';answers=init();index=0;lastResult=null;render();}
  if(e.target.closest('[data-exit]')){answers=init();lastResult=null;try{window.close();}finally{setTimeout(()=>window.location.replace('index.html'),150);}}
  if(e.target.closest('[data-memo-close]'))$('#memoDialog').close();
  if(e.target.closest('[data-memo-copy]'))writeMemo($('#memoText').value);
  const cp=e.target.closest('[data-copy]');if(cp)copy(Number(cp.dataset.copy));
  const save=e.target.closest('[data-save]');if(save)saveResult(Number(save.dataset.save));
  if(e.target.closest('[data-restore]'))restoreResult();
  if(e.target.closest('[data-forget]')){try{localStorage.removeItem(SAVE_KEY);$('#savedNotice').textContent='저장한 구성을 삭제했습니다.';}catch(_){$('#savedNotice').textContent='저장 공간을 사용할 수 없습니다.';}}
  const drive=e.target.closest('[data-drive]');if(drive)openDrive(Number(drive.dataset.drive));
  if(e.target.closest('[data-drive-close]'))$('#driveDialog').close();
  if(e.target.closest('[data-drive-copy]'))copyDrive();
  const quick=e.target.closest('[data-rebudget]');if(quick){answers.budget=quick.dataset.rebudget;results();}
  if(e.target.closest('[data-budget-apply]')){const value=Number(M.raw($('#compareBudget').value));if(value>=2500&&value<=10000){answers.budget=value;results();}else $('#compareError').textContent='2,500 ~ 10,000만원 범위내 입력.';}
  if(e.target.closest('[data-print]')){preparePrint();window.print();}
  if(e.target.closest('[data-retry]'))load();
 });
 function formatPhoneField(el){const before=el.value.slice(0,el.selectionStart??el.value.length).replace(/\D/g,'').length;el.value=L.formatPhone(el.value);let pos=0,count=0;while(pos<el.value.length&&count<before){if(/\d/.test(el.value[pos]))count++;pos++;}el.setSelectionRange(pos,pos);}
 document.addEventListener('input',e=>{if(e.target.id==='customerPhone')formatPhoneField(e.target);if(e.target.id==='budgetInput'){answers.budget=M.raw(e.target.value);document.querySelectorAll('[data-budget]').forEach(b=>b.classList.toggle('active',Number(b.dataset.budget)===Number(answers.budget)));}if(e.target.dataset.customer)answers.customer[e.target.dataset.customer]=e.target.value;if(e.target.id==='mainUserOther')answers.mainUserOther=e.target.value;});
 document.addEventListener('change',e=>{if(e.target.id==='customerPhone')formatPhoneField(e.target);if(e.target.dataset.customer)answers.customer[e.target.dataset.customer]=e.target.value;if(e.target.id==='mainUserOther')answers.mainUserOther=e.target.value;});
 // Arrow keys move focus; Space/Enter confirm and advance, just like a click.
 document.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||!e.target.matches('[data-choice]'))return;e.preventDefault();const choices=[...document.querySelectorAll('[data-choice]')],delta=['ArrowRight','ArrowDown'].includes(e.key)?1:-1,next=choices[(choices.indexOf(e.target)+delta+choices.length)%choices.length];next.focus();});
 async function load(){
  $('#loadState').hidden=false;$('#app').hidden=true;$('#loadState').querySelector('[data-load-message]').textContent='차량과 트림 자료를 불러오고 있습니다…';
  try{
   const paths=['data/guidebook.json',...C.models.map(m=>'data/approach-'+m+'.json')];
   const loaded=await Promise.all(paths.map(async path=>{return RenaultSite.fetchJSON(path);}));
   [data]=loaded;books=Object.fromEntries(C.models.map((m,i)=>[m,loaded[i+1]]));
   if(C.models.some(m=>!data.guides?.[m]?.trims?.length||!books[m]?.trims?.length))throw Error('차량 자료 누락');
   $('#dataNote').textContent=`자료 기준: 홈페이지 차량 데이터 ${data.checked}. 하이브리드 기본가는 친환경차 세제 혜택 후. 추천 금액은 기본 외장·내장과 선택 옵션 기준이며 취득·등록·보험·탁송·할인·금융 비용은 제외합니다. 실제 구매 조건과 공급 가능 여부는 계약 시점에 확인해 주세요. 답변은 서버로 전송하지 않습니다. 고객 정보는 내차만들기 연결용으로 이 브라우저에 임시 보관합니다(연결 유효시간 2시간). ‘이 구성 저장’ 또는 ‘상담 기록 저장’은 별도로 선택할 수 있으며, 시승 문의도 고객님이 직접 보내실 때 전달됩니다.`;
   $('#loadState').hidden=true;$('#app').hidden=false;render(false);showSaved();
  }catch(e){RenaultSite.fail('loadState');}
 }
 load();
})();
