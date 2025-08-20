// state.js
import { attachDragHandles } from './drag.js';
import { log } from './log.js';

export let currentState = { meta:{ title:'Mon projet CV', updatedAt:new Date().toISOString(), locale:'fr' }, blocks:[] };
export const historyListEl = document.getElementById('historyList');

export function initState(){
  loadFromStorage(); renderHistory();
  window.addEventListener('beforeunload', saveToStorage);
  log('state','init');
}

export async function newProject(page, data){
  page.innerHTML='';
  for(const b of (data.blocks||[])){
    const el=document.createElement('div'); el.className='drag-block'; el.dataset.type=b.type||'custom'; el.dataset.id=b.id||('b'+Math.random().toString(16).slice(2));
    el.style.left=(b.layout?.x||24)+'px'; el.style.top=(b.layout?.y||24)+'px';
    el.style.width=(b.layout?.w||520)+'px'; if(b.layout?.h) el.style.height=b.layout.h+'px';
    el.style.borderRadius=(b.style?.radius||10)+'px'; el.style.background=b.style?.bg||'#ffffff'; el.style.boxShadow=b.style?.shadow||'none';
    el.style.fontFamily=b.style?.font||'Inter, system-ui, Arial'; el.style.lineHeight=b.style?.lineHeight||1.2;
    el.innerHTML = `<div class="block-content" contenteditable="true">${b.html||''}</div>`;
    ['tl','tr','bl','br'].forEach(pos=>{ const h=document.createElement('div'); h.className='handle '+pos; el.appendChild(h); });
    page.appendChild(el);
    attachDragHandles(el, page);
  }
  saveToStorage(); log('state','new project loaded', { blocks: (data.blocks||[]).length });
}

export function serializeProject(){
  const page=document.getElementById('cvPage');
  const blocks=[...page.querySelectorAll('.drag-block')].map(el=>{
    const content=el.querySelector('.block-content');
    return {
      id: el.dataset.id,
      type: el.dataset.type,
      html: content?content.innerHTML:el.innerHTML,
      layout: { x:parseInt(el.style.left||'0'), y:parseInt(el.style.top||'0'), w:parseInt(el.style.width||el.offsetWidth), h:parseInt(el.style.height||el.offsetHeight), unit:'px' },
      style: { radius: parseInt(el.style.borderRadius||10), bg: el.style.background||'#ffffff', shadow: el.style.boxShadow||'none', font: el.style.fontFamily||'Inter, system-ui, Arial', lineHeight: el.style.lineHeight||'1.2' }
    };
  });
  const data={ meta:{ title: document.getElementById('docTitle')?.innerText || 'Mon projet CV', updatedAt:new Date().toISOString(), locale:'fr' }, blocks };
  currentState=data;
  localStorage.setItem('cvpro_project', JSON.stringify(data));
  return data;
}
export function saveToStorage(){ serializeProject(); }

const history=[];
export function pushHistory(label){ history.push({ label, ts:new Date().toLocaleTimeString() }); renderHistory(); }
function renderHistory(){
  if(!historyListEl) return;
  historyListEl.innerHTML='';
  history.slice(-12).reverse().forEach(h=>{ const div=document.createElement('div'); div.textContent=`${h.ts} · ${h.label}`; historyListEl.appendChild(div); });
}
export function loadFromStorage(){
  const raw=localStorage.getItem('cvpro_project'); if(!raw) return;
  try{ const data=JSON.parse(raw); newProject(document.getElementById('cvPage'), data); log('state','loaded from storage'); }catch(e){ console.error(e); }
}
