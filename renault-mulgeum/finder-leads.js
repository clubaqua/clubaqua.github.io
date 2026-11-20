(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RenaultFinderLeads=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const carriers=['SKT','KT','LG U+','SKT망 알뜰폰','KT망 알뜰폰','LG U+망 알뜰폰','알뜰폰 (통신망 미확인)','기타'];
 const regions=['양산시','부산광역시','울산광역시','경상남도지역'];
 const priorities=v=>[...new Set((Array.isArray(v)?v:[v]).filter(x=>['value','comfort','safety','economy','style','rarity'].includes(x)))];
 function formatPhone(value){const original=String(value??'').trim();if(/[^\d\s()-]/.test(original))return original;const n=original.replace(/\D/g,'');if(n.length<=3)return n;if(n.length<=7)return n.slice(0,3)+'-'+n.slice(3);const middle=n.length===10&&!n.startsWith('010')?6:7;return n.slice(0,3)+'-'+n.slice(3,middle)+'-'+n.slice(middle);}
 const cleanCustomer=v=>({name:typeof v?.name==='string'?v.name.trim().slice(0,50):'',phone:typeof v?.phone==='string'?formatPhone(v.phone.slice(0,30)):'',carrier:carriers.includes(v?.carrier)?v.carrier:'',region:regions.includes(v?.region)?v.region:''});
 function validateCustomer(v){const c=cleanCustomer(v);const digits=c.phone.replace(/[\s()-]/g,'');if(c.phone&&(!/^01[016789]\d{7,8}$/.test(digits)||(digits.startsWith('010')&&digits.length!==11)))return '휴대전화번호를 확인해 주세요. 예: 010-1234-5678';return '';}
 function csv(rows){const cell=v=>'"'+String(v??'').replace(/^[\s]*[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"';return '\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n');}
 return {formatPhone,carriers,regions,priorities,cleanCustomer,validateCustomer,csv};
});
