// blocks.js
import { saveToStorage } from './state.js';
import { attachDragHandles } from './drag.js';
import { log } from './log.js';

export const THEMES = [
  { name: 'LTd Bleu', vars: { '--accent':'#2563eb', '--muted':'#e2e8f0' }, bg:'#ffffff', text:'#0b1220' },
  { name: 'Noir & Or', vars: { '--accent':'#f59e0b', '--muted':'#111827' }, bg:'#0b1220', text:'#f1f5f9' },
  { name: 'Slate', vars: { '--accent':'#64748b', '--muted':'#0f172a' }, bg:'#ffffff', text:'#0b1220' }
];
export function applyTheme(theme){
  for(const k in theme.vars){ document.documentElement.style.setProperty(k, theme.vars[k]); }
  const page=document.getElementById('cvPage'); page.style.background=theme.bg; page.style.color=theme.text; saveToStorage(); log('theme','applied', theme);
}

const LIB = [
  { type:'banner', label:'Bannière Recrutement' },
  { type:'header', label:'En-tête' },
  { type:'summary', label:'Accroche' },
  { type:'experience', label:'Expériences' },
  { type:'education', label:'Formation' },
  { type:'skills', label:'Compétences' },
  { type:'languages', label:'Langues' },
  { type:'projects', label:'Projets' },
  { type:'certs', label:'Certifications' },
  { type:'refs', label:'Références' },
  { type:'qr', label:'QR Code' }
];
export function createLibrary(container, onAdd){
  LIB.forEach(item=>{ const btn=document.createElement('button'); btn.className='btn'; btn.textContent='➕ '+item.label; btn.addEventListener('click', ()=> onAdd(item.type)); container.appendChild(btn); });
}
let idCounter=1; const nextId=()=> 'b'+(idCounter++);

function blockTemplate(type){
  if(type==='banner') return `<div class="block-content card" contenteditable="true"><div style="display:flex;justify-content:space-between;gap:16px;align-items:center;"><div><div style="font-size:22px;font-weight:700;">Titre du poste — Entreprise</div><div style="opacity:.8;">Localisation · Salaire · Contrat</div></div><div><span class="tag">Postuler</span></div></div></div>`;
  if(type==='header') return `<div class="block-content" contenteditable="true"><div style="display:flex; gap:16px; align-items:center;"><div style="width:72px; height:72px; border-radius:999px; background:#e2e8f0;"></div><div><div style="font-size:28px;font-weight:800;">Prénom NOM</div><div style="opacity:.75;">Titre / Spécialité</div><div style="opacity:.75;font-size:12px;">📧 email@ex.com · 📞 06 00 00 00 00 · 🌍 Ville</div></div></div></div>`;
  if(type==='summary') return `<div class="block-content" contenteditable="true"><strong>Accroche</strong> — 3–4 phrases synthétiques présentant votre valeur.</div>`;
  if(type==='experience') return `<div class="block-content" contenteditable="true"><strong>Expériences</strong><ul><li><b>Poste · Entreprise</b> — 2022–2025 — missions clés, résultats.</li><li><b>Poste · Entreprise</b> — 2019–2022 — responsabilités, impacts.</li></ul></div>`;
  if(type==='education') return `<div class="block-content" contenteditable="true"><strong>Formations</strong><ul><li><b>Diplôme</b> — Établissement (Année) — mention.</li></ul></div>`;
  if(type==='skills') return `<div class="block-content" contenteditable="true"><strong>Compétences</strong><br><span class="tag">JavaScript</span><span class="tag">Revit</span><span class="tag">AutoCAD</span></div>`;
  if(type==='languages') return `<div class="block-content" contenteditable="true"><strong>Langues</strong> — FR (C2), EN (C1)</div>`;
  if(type==='projects') return `<div class="block-content" contenteditable="true"><strong>Projets</strong><ul><li>Projet A — description + lien</li><li>Projet B — description + lien</li></ul></div>`;
  if(type==='certs') return `<div class="block-content" contenteditable="true"><strong>Certifications</strong><ul><li>Nom — Année</li></ul></div>`;
  if(type==='refs') return `<div class="block-content" contenteditable="true"><strong>Références</strong> — disponibles sur demande.</div>`;
  if(type==='qr') return `<div class="block-content" data-qr="https://linkedin.com" contenteditable="false"><div style="display:flex; gap:12px; align-items:center;"><div class="qr-box" style="width:96px;height:96px;background:#e2e8f0;"></div><div><strong>QR Profil</strong><div>Scannez mon LinkedIn.</div></div></div></div>`;
  return `<div class="block-content" contenteditable="true">Bloc personnalisé</div>`;
}

export function addBlockToCanvas(type, page){
  const el = document.createElement('div');
  el.className='drag-block'; el.dataset.type=type; el.dataset.id=nextId();
  el.innerHTML = blockTemplate(type);
  el.style.left='24px'; el.style.top=(24 + Math.random()*40|0)+'px';
  el.style.width='520px'; el.style.minWidth='200px';
  ['tl','tr','bl','br'].forEach(pos=>{ const h=document.createElement('div'); h.className='handle '+pos; el.appendChild(h); });
  page.appendChild(el);
  attachDragHandles(el, page);
  if(type==='qr' && 'QRCode' in window){ const cont=el.querySelector('.qr-box'); cont.innerHTML=''; new window.QRCode(cont, { text: el.querySelector('[data-qr]').getAttribute('data-qr')||'https://example.com', width:96, height:96 }); }
  saveToStorage(); log('block','added to canvas', { type, id: el.dataset.id });
  return el;
}

export function loadTemplateDialog(){
  fetch('./templates/templates.json').then(r=>r.json()).then(data=>{
    const dlg=document.getElementById('templateDialog');
    dlg.innerHTML = `<h3 class="h3">Templates</h3>
      <div class="space-y">${data.templates.map((t,i)=>`<button class="btn w-full" data-i="${i}">${t.name}</button>`).join('')}</div>
      <button id="closeTmpl" class="btn w-full" style="margin-top:10px">Fermer</button>`;
    dlg.showModal();
    dlg.querySelectorAll('button[data-i]').forEach(b=> b.addEventListener('click', async ()=>{
      const idx=parseInt(b.getAttribute('data-i')); const t=data.templates[idx];
      const page=document.getElementById('cvPage'); page.innerHTML='';
      for(const bl of t.blocks){
        const el=document.createElement('div'); el.className='drag-block'; el.dataset.type=bl.type; el.dataset.id=bl.id||('b'+Math.random().toString(16).slice(2));
        el.style.left=(bl.layout?.x||24)+'px'; el.style.top=(bl.layout?.y||24)+'px'; el.style.width=(bl.layout?.w||520)+'px'; if(bl.layout?.h) el.style.height=bl.layout.h+'px';
        el.style.borderRadius=(bl.style?.radius||10)+'px'; el.style.background=bl.style?.bg||'#ffffff'; el.style.boxShadow=bl.style?.shadow||'none';
        el.style.fontFamily=bl.style?.font||'Inter, system-ui, Arial'; el.style.lineHeight=bl.style?.lineHeight||1.2;
        el.innerHTML = `<div class="block-content" contenteditable="true">${bl.html||''}</div>`;
        ['tl','tr','bl','br'].forEach(pos=>{ const h=document.createElement('div'); h.className='handle '+pos; el.appendChild(h); });
        page.appendChild(el); attachDragHandles(el, page);
        if(bl.type==='qr' && 'QRCode' in window){ const cont=el.querySelector('.qr-box'); cont.innerHTML=''; new window.QRCode(cont, { text: el.querySelector('[data-qr]').getAttribute('data-qr')||'https://example.com', width:96, height:96 }); }
      }
      saveToStorage();
      dlg.close();
    }));
    dlg.querySelector('#closeTmpl').addEventListener('click', ()=> dlg.close());
  });
}
