// inspector.js
import { selectBlock } from './drag.js';
import { saveToStorage, pushHistory } from './state.js';
import { log } from './log.js';
const $=id=>document.getElementById(id);


export function initInspector(){
  const ids=['inpFont','inpFontSize','inpLineHeight','inpColor','inpBg','inpRadius','inpShadow','inpX','inpY','inpW','inpH'];
  ids.forEach(id=>{ const el=document.getElementById(id); if(el){ el.addEventListener('input', inspectorApplyValue); } else { console.warn('[Inspector] missing input', id); } });
  const bind=(id,fn)=>{ const el=document.getElementById(id); if(el){ el.addEventListener('click', fn); } else { console.warn('[Inspector] missing btn', id); } };
  bind('btnDuplicate', ()=>{ const sel=getSel(); if(!sel) return; const c=sel.cloneNode(true); c.style.left=(parseInt(sel.style.left||'0')+16)+'px'; c.style.top=(parseInt(sel.style.top||'0')+16)+'px'; sel.parentElement.appendChild(c); import('./drag.js').then(m=> m.selectBlock(c)); saveToStorage(); pushHistory('Duplication bloc'); });
  bind('btnDelete', ()=>{ const s=getSel(); if(!s) return; s.remove(); import('./drag.js').then(m=> m.selectBlock(null)); saveToStorage(); pushHistory('Suppression bloc'); });
  bind('btnLock', ()=>{ const s=getSel(); if(!s) return; s.dataset.locked=s.dataset.locked==='1'?'0':'1'; s.style.pointerEvents = s.dataset.locked==='1'?'none':'auto'; saveToStorage(); });
  bind('btnHide', ()=>{ const s=getSel(); if(!s) return; s.style.display = s.style.display==='none'?'block':'none'; saveToStorage(); });
}

export function refreshInspector(sel){
  const info=document.getElementById('inspectorSel'); if(!info){ console.warn('[Inspector] missing inspectorSel'); return; } if(!sel){ info.textContent='Aucun bloc'; return; }
  info.textContent = sel.dataset.type+' • '+(sel.dataset.id||'');
  const content=sel.querySelector('.block-content')||sel;
  const get=(el,prop,def)=> window.getComputedStyle(el)[prop] || def;
  $('#inpFont').value = get(sel,'fontFamily',"Inter, system-ui, Arial");
  $('#inpFontSize').value = parseInt(get(content,'fontSize',14));
  $('#inpLineHeight').value = parseFloat(get(sel,'lineHeight',1.2));
  $('#inpColor').value = rgbToHex(get(content,'color','#0b1220'));
  $('#inpBg').value = rgbToHex(get(sel,'backgroundColor','#ffffff'));
  $('#inpRadius').value = parseInt(get(sel,'borderRadius',10));
  $('#inpShadow').value = (get(sel,'boxShadow','none')==='none')?'none':'md';
  $('#inpX').value = parseInt(sel.style.left||0);
  $('#inpY').value = parseInt(sel.style.top||0);
  $('#inpW').value = parseInt(sel.style.width||sel.offsetWidth);
  $('#inpH').value = parseInt(sel.style.height||sel.offsetHeight);
}
export function inspectorApplyValue(){
  const sel=getSel(); if(!sel) return;
  const content=sel.querySelector('.block-content')||sel;
  sel.style.fontFamily=$('#inpFont').value;
  content.style.fontSize=$('#inpFontSize').value+'px';
  sel.style.lineHeight=$('#inpLineHeight').value;
  content.style.color=$('#inpColor').value;
  sel.style.background=$('#inpBg').value;
  sel.style.borderRadius=$('#inpRadius').value+'px';
  const sh=$('#inpShadow').value; sel.style.boxShadow = sh==='none'?'none':'0 6px 16px rgba(0,0,0,.12)';
  sel.style.left=$('#inpX').value+'px'; sel.style.top=$('#inpY').value+'px';
  sel.style.width=$('#inpW').value+'px'; sel.style.height=$('#inpH').value+'px';
  saveToStorage(); pushHistory('Modifs Inspecteur'); log('inspector','apply values', { id:sel.dataset.id });
}
function getSel(){ return document.querySelector('.drag-block.selected'); }
function rgbToHex(rgb){
  if(!rgb) return '#000000';
  const m = rgb.match(/\d+/g); if(!m) return '#000000';
  const [r,g,b] = m.map(n=> parseInt(n,10));
  const toHex = v=> ('0'+v.toString(16)).slice(-2);
  return '#'+toHex(r)+toHex(g)+toHex(b);
}
