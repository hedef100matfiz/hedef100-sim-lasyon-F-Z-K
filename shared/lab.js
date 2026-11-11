// Accessible form labels and canvas descriptions.
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('label:not([for])').forEach(label=>{const next=label.parentElement.querySelector('input[id],select[id]');if(next)label.htmlFor=next.id;});
 document.querySelectorAll('canvas').forEach(c=>{if(!c.getAttribute('aria-label'))c.setAttribute('aria-label','Deney görselleştirmesi; sayısal sonuçlar analiz panelinde bulunur.');});
});
