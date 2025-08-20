// inspector.js
import { selectBlock } from './drag.js';
import { saveToStorage, pushHistory } from './state.js';
import { log } from './log.js';
const $=id=>document.getElementById(id);


export function initInspector(){
  log('inspector', 'Initializing inspector');
  
  // Check if inspector panel exists
  const inspectorPanel = document.getElementById('rightInspector');
  if (!inspectorPanel) {
    console.error('[Inspector] Inspector panel not found');
    log('inspector', 'Inspector panel missing');
    return;
  }
  
  const ids=['inpFont','inpFontSize','inpLineHeight','inpColor','inpBg','inpRadius','inpShadow','inpX','inpY','inpW','inpH'];
  const missingInputs = [];
  
  ids.forEach(id => { 
    const el = document.getElementById(id); 
    if(el) { 
      el.addEventListener('input', inspectorApplyValue); 
      log('inspector', `Bound input event for ${id}`);
    } else { 
      console.warn('[Inspector] missing input', id); 
      missingInputs.push(id);
    } 
  });
  
  if (missingInputs.length > 0) {
    log('inspector', 'Missing input elements', { missing: missingInputs });
  }
  
  const bind = (id, fn) => { 
    const el = document.getElementById(id); 
    if(el) { 
      el.addEventListener('click', fn); 
      log('inspector', `Bound click event for ${id}`);
    } else { 
      console.warn('[Inspector] missing btn', id); 
    } 
  };
  
  bind('btnDuplicate', () => { 
    const sel = getSel(); 
    if(!sel) {
      log('inspector', 'No block selected for duplication');
      return;
    }
    const c = sel.cloneNode(true); 
    c.style.left = (parseInt(sel.style.left||'0')+16)+'px'; 
    c.style.top = (parseInt(sel.style.top||'0')+16)+'px'; 
    sel.parentElement.appendChild(c); 
    import('./drag.js').then(m => m.selectBlock(c)); 
    saveToStorage(); 
    pushHistory('Duplication bloc'); 
    log('inspector', 'Block duplicated');
  });
  
  bind('btnDelete', () => { 
    const s = getSel(); 
    if(!s) {
      log('inspector', 'No block selected for deletion');
      return;
    }
    s.remove(); 
    import('./drag.js').then(m => m.selectBlock(null)); 
    saveToStorage(); 
    pushHistory('Suppression bloc'); 
    log('inspector', 'Block deleted');
  });
  
  bind('btnLock', () => { 
    const s = getSel(); 
    if(!s) {
      log('inspector', 'No block selected for locking');
      return;
    }
    s.dataset.locked = s.dataset.locked==='1'?'0':'1'; 
    s.style.pointerEvents = s.dataset.locked==='1'?'none':'auto'; 
    saveToStorage(); 
    log('inspector', 'Block lock toggled', { locked: s.dataset.locked });
  });
  
  bind('btnHide', () => { 
    const s = getSel(); 
    if(!s) {
      log('inspector', 'No block selected for hiding');
      return;
    }
    s.style.display = s.style.display==='none'?'block':'none'; 
    saveToStorage(); 
    log('inspector', 'Block visibility toggled', { hidden: s.style.display === 'none' });
  });
  
  log('inspector', 'Inspector initialization complete');
}

export function refreshInspector(sel){
  const info=document.getElementById('inspectorSel'); 
  if(!info){ 
    console.warn('[Inspector] missing inspectorSel'); 
    return; 
  } 
  if(!sel){ 
    info.textContent='Aucun bloc'; 
    return; 
  }
  info.textContent = sel.dataset.type+' • '+(sel.dataset.id||'');
  const content=sel.querySelector('.block-content')||sel;
  const get=(el,prop,def)=> window.getComputedStyle(el)[prop] || def;
  
  // Add null checks for all input elements
  const inpFont = $('#inpFont');
  if(inpFont) inpFont.value = get(sel,'fontFamily',"Inter, system-ui, Arial");
  
  const inpFontSize = $('#inpFontSize');
  if(inpFontSize) inpFontSize.value = parseInt(get(content,'fontSize',14));
  
  const inpLineHeight = $('#inpLineHeight');
  if(inpLineHeight) inpLineHeight.value = parseFloat(get(sel,'lineHeight',1.2));
  
  const inpColor = $('#inpColor');
  if(inpColor) inpColor.value = rgbToHex(get(content,'color','#0b1220'));
  
  const inpBg = $('#inpBg');
  if(inpBg) inpBg.value = rgbToHex(get(sel,'backgroundColor','#ffffff'));
  
  const inpRadius = $('#inpRadius');
  if(inpRadius) inpRadius.value = parseInt(get(sel,'borderRadius',10));
  
  const inpShadow = $('#inpShadow');
  if(inpShadow) inpShadow.value = (get(sel,'boxShadow','none')==='none')?'none':'md';
  
  const inpX = $('#inpX');
  if(inpX) inpX.value = parseInt(sel.style.left||0);
  
  const inpY = $('#inpY');
  if(inpY) inpY.value = parseInt(sel.style.top||0);
  
  const inpW = $('#inpW');
  if(inpW) inpW.value = parseInt(sel.style.width||sel.offsetWidth);
  
  const inpH = $('#inpH');
  if(inpH) inpH.value = parseInt(sel.style.height||sel.offsetHeight);
}
export function inspectorApplyValue(){
  const sel=getSel(); if(!sel) return;
  const content=sel.querySelector('.block-content')||sel;
  
  // Add null checks for all input elements
  const inpFont = $('#inpFont');
  if(inpFont) sel.style.fontFamily = inpFont.value;
  
  const inpFontSize = $('#inpFontSize');
  if(inpFontSize) content.style.fontSize = inpFontSize.value+'px';
  
  const inpLineHeight = $('#inpLineHeight');
  if(inpLineHeight) sel.style.lineHeight = inpLineHeight.value;
  
  const inpColor = $('#inpColor');
  if(inpColor) content.style.color = inpColor.value;
  
  const inpBg = $('#inpBg');
  if(inpBg) sel.style.background = inpBg.value;
  
  const inpRadius = $('#inpRadius');
  if(inpRadius) sel.style.borderRadius = inpRadius.value+'px';
  
  const inpShadow = $('#inpShadow');
  if(inpShadow) {
    const sh = inpShadow.value; 
    sel.style.boxShadow = sh==='none'?'none':'0 6px 16px rgba(0,0,0,.12)';
  }
  
  const inpX = $('#inpX');
  if(inpX) sel.style.left = inpX.value+'px';
  
  const inpY = $('#inpY');
  if(inpY) sel.style.top = inpY.value+'px';
  
  const inpW = $('#inpW');
  if(inpW) sel.style.width = inpW.value+'px';
  
  const inpH = $('#inpH');
  if(inpH) sel.style.height = inpH.value+'px';
  
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
