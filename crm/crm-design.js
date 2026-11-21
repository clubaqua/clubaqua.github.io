'use strict';
// Presentation only. Existing IDs, event delegation, data and API modules remain in charge.
(() => {
  const $ = s => document.querySelector(s);
  const all = (s, root = document) => [...root.querySelectorAll(s)];
  const icon = paths => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const icons = {
    dashboard: icon('<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>'),
    customers: icon('<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/>'),
    ledger: icon('<path d="m4 10 2-6h12l2 6M3 10h18v8H3zM5 18v3m14-3v3M6 14h2m8 0h2"/>'),
    commission: icon('<path d="m3 5 4 15 5-15 5 15 4-15M2 10h20M2 14h20"/>'),
    more: icon('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'),
    account: icon('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')
  };
  const nav = $('#mobileNav');
  const pages = [['dashboard','오늘'],['customers','고객'],['ledger','출고'],['commission','수수료']];
  nav.innerHTML = pages.map(([page,label]) => `<button type="button" data-page="${page}">${icons[page]}<span>${label}</span></button>`).join('') + `<button type="button" id="moreToggle" aria-haspopup="dialog">${icons.more}<span>더보기</span></button>`;
  $('#accountToggle').innerHTML = icons.account;
  const extra = [['pipeline','출고고객관리'],['ledger','차계부'],['sms','SMS 발송(간접식)'],['sms2','SMS 발송(직접식)'],['reminders','일정 · 리마인드'],['settings','설정 · 백업']];
  $('#moreMenuItems').innerHTML = extra.map(([page,label]) => `<button type="button" data-page="${page}">${label}</button>`).join('');
  document.addEventListener('click', event => {
    if (event.target.closest('#accountToggle')) {
      const open = $('#accountToggle').getAttribute('aria-expanded') !== 'true';
      $('#accountToggle').setAttribute('aria-expanded', String(open));
      $('#accountMenu').classList.toggle('is-open', open);
    } else if (!event.target.closest('#accountMenu')) {
      $('#accountToggle').setAttribute('aria-expanded','false');
      $('#accountMenu').classList.remove('is-open');
    }
    if (event.target.closest('#moreToggle')) $('#moreMenu').showModal();
    if (event.target.closest('[data-page]')) {
      $('#moreMenu').close();
      window.scrollTo({top:0,behavior:'instant'});
    }
  });
  document.addEventListener('keydown', e => { if(e.key==='Escape') { $('#accountMenu').classList.remove('is-open'); $('#accountToggle').setAttribute('aria-expanded','false'); } });
  function enhance() {
    nav.hidden = $('#app').hidden;
    const current = $('.tabs .active')?.dataset.page;
    all('.tabs [data-page], .bottom-nav [data-page]').forEach(el => {
      const active = el.dataset.page === current;
      if(active && el.getAttribute('aria-current')!=='page') el.setAttribute('aria-current','page');
      if(!active && el.hasAttribute('aria-current')) el.removeAttribute('aria-current');
    });
    const more = $('#moreToggle');
    const extraActive = current && !pages.some(([p]) => p === current);
    more.classList.toggle('active',!!extraActive);
    if(extraActive) more.setAttribute('aria-current','page'); else more.removeAttribute('aria-current');
    all('.panel, .form-section, .sms-section, .login-card').forEach(el => el.classList.add('card'));
    all('.panel h2, .form-section > h3, .sms-section > h3').forEach(el => el.classList.add('card-title'));
    $('#newCustomer')?.closest('.panel-head')?.classList.add('customer-actions-bar');
    all('.filters').forEach(el => el.classList.add('toolbar'));
    all('.muted, .fine').forEach(el => el.classList.add('helper'));
    all('.form-grid > label, .settings-grid label').forEach(el => el.classList.add('field'));
    all('.danger').forEach(el => el.classList.add('btn-danger'));
    all('dialog').forEach(el => el.classList.add('modal'));
    all('.sms-recipient').forEach(el => el.classList.add('check-item'));
    all('.sms-connection-note').forEach(el => el.classList.add('notice'));
    all('button').filter(el => /^(현재 목록 선택|선택 해제|전체보기)$/.test(el.textContent.trim())).forEach(el => el.classList.add('btn-ghost'));
    const stats = $('.stats');
    if(stats) {
      stats.classList.add('kpi-grid');
      all('.stat', stats).forEach((el,index) => {
        el.classList.add('kpi');
        el.classList.toggle('kpi--highlight',index===3);
        el.querySelector('span').classList.add('kpi__label');
        const val = el.querySelector('strong'); val.classList.add('kpi__value');
        if(!val.querySelector('small')) val.insertAdjacentHTML('beforeend',`<small>${['건','명','대','대'][index]}</small>`);
      });
    }
    all('.table-wrap table').forEach(table => {
      const headings = all('thead th',table).map(el=>el.textContent.trim()||'선택');
      all('tbody tr',table).forEach(row => all('td',row).forEach((cell,index) => {
        if(!cell.hasAttribute('data-label')) cell.dataset.label = headings[index]||'';
        cell.classList.toggle('cell-empty',cell.textContent.trim()==='—');
        if(/수입|비용|순이익|금액|입금/.test(headings[index]) && !/기준/.test(headings[index])) cell.classList.add('num','amount');
      }));
    });
    const stageClasses = {'신규':'new','신규 문의':'new','상담중':'consult','시승예정':'consult','견적안내':'quote','계약':'contract','출고완료':'done','보류':'lost','종료':'lost'};
    all('.badge').forEach(el => { const cls = stageClasses[el.textContent.trim()]; if(cls) el.classList.add('badge--'+cls); });
    all('.card-title').forEach(el => {
      if(el.querySelector('.count')) return;
      const match = el.textContent.match(/^(.*?)\s*·\s*(\d+[건명])$/);
      if(match && !el.children.length) { el.textContent=match[1]+' '; const count=document.createElement('span'); count.className='count'; count.textContent=match[2]; el.append(count); }
    });
    all('#content .primary, #content .sms-yellow').forEach((el,index) => { el.classList.toggle('btn-primary',index===0); if(index>0) el.classList.add('btn-dark'); });
    all('.modal .primary, .login-card .primary').forEach(el=>el.classList.add('btn-primary'));
    $('#newLedger')?.classList.add('btn-primary');
    const form = $('#commissionForm');
    if(form) {
      const heading = form.closest('section')?.querySelector('h2');
      if(heading?.textContent==='수수료 계산기') heading.hidden=true;
      all('[data-money]',form).forEach(el=>el.setAttribute('inputmode','numeric'));
      const result=$('#commissionResult');
      result.classList.add('card','commission-result');
      if(result.parentElement===form.parentElement) form.parentElement.after(result);
      all('.finance-results > div strong',result).forEach((el,index,array)=> { el.classList.add('amount'); el.classList.toggle('amount--lg',index===array.length-1); });
      form.querySelector('[name=discount]')?.closest('label')?.classList.add('deduction');
    }
    const ledgerNote = $('#ledgerFilterForm')?.parentElement.querySelector('.fine + .table-wrap')?.previousElementSibling;
    if(ledgerNote && !ledgerNote.dataset.compact) {
      const detail=document.createElement('details'); const summary=document.createElement('summary'); summary.textContent='자세히';
      const text=document.createElement('p'); text.className='helper'; text.textContent=ledgerNote.textContent;
      detail.append(summary,text); ledgerNote.textContent='금액 기준을 통일하여 비교하세요. 확정 전 판매수수료는 예상값입니다.'; ledgerNote.dataset.compact='true';ledgerNote.after(detail);
    }
  }
  // Observe rendered content, not style/class mutations, to avoid repeated enhancement loops.
  let pending=false;
  const schedule=()=> { if(!pending) {pending=true;queueMicrotask(()=> { observer.disconnect();enhance();pending=false;observe(); });} };
  const observer=new MutationObserver(schedule);
  const observe=()=> { observer.observe($('#app'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']}); all('dialog').forEach(el=>observer.observe(el,{childList:true,subtree:true})); observer.observe(document.body,{childList:true}); };
  enhance();observe();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(entries => {
      document.documentElement.style.setProperty('--app-header-height', entries[0].target.getBoundingClientRect().height + 'px');
    }).observe($('.app-header'));
  }
})();
