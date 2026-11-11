(function(){
'use strict';
if(window.lucide)lucide.createIcons();
const $=s=>document.querySelector(s),cards=[...document.querySelectorAll('.sim-card')],groups=[...document.querySelectorAll('[data-group]')];
const normalize=s=>s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
function filter(){
 const q=normalize($('#search').value.trim()),grade=$('#grade').value,topic=$('#topic').value,moduleType=$('#module-type').value,status=$('#curriculum-status').value,newOnly=$('#new-only').checked;
 let n=0;
 for(const c of cards){
  c.hidden=!!(grade&&!c.dataset.grades.split(',').includes(grade)||topic&&topic!==c.dataset.topic||moduleType&&moduleType!==c.dataset.moduleType||status&&status!==c.dataset.curriculumStatus||newOnly&&c.dataset.new!=='true'||q&&!normalize(c.dataset.search).includes(q));
  if(!c.hidden)n++;
 }
 for(const group of groups){
  group.hidden=![...group.querySelectorAll('.sim-card')].some(c=>!c.hidden);
  group.querySelector('h2').textContent=grade?(grade+'. sınıf için '+(group.dataset.group===grade?'temel modüller':'ilişkili modüller')):group.dataset.group+'. Sınıf · '+(Number(group.dataset.group)<9?'Fen Bilimleri':'Fizik');
 }
 $('#result-count').textContent=n+' / '+cards.length+' modül gösteriliyor';$('#no-results').hidden=n!==0;
 try{
  const params=new URLSearchParams();if(q)params.set('q',$('#search').value);if(grade)params.set('sinif',grade);if(topic)params.set('konu',topic);if(moduleType)params.set('tur',moduleType);if(status)params.set('program',status);if(newOnly)params.set('yeni','1');
  history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));
 }catch{}
}
const init=new URLSearchParams(location.search);$('#search').value=init.get('q')||'';$('#grade').value=init.get('sinif')||'';$('#topic').value=init.get('konu')||'';$('#module-type').value=init.get('tur')||'';$('#curriculum-status').value=init.get('program')||'';$('#new-only').checked=init.get('yeni')==='1';
for(const id of ['search','grade','topic','module-type','curriculum-status','new-only'])$('#'+id).addEventListener('input',filter);
$('#clear-filters').addEventListener('click',()=>{for(const id of ['search','grade','topic','module-type','curriculum-status'])$('#'+id).value='';$('#new-only').checked=false;filter();});filter();
})();
