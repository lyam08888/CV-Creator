// app.js
import { createLibrary, addBlockToCanvas, THEMES, applyTheme, loadTemplateDialog } from './blocks.js';
import { initDragAndResize, selectBlock, onCanvasClick } from './drag.js';
import { initInspector, refreshInspector } from './inspector.js';
import { initAIStudio } from './ai.js';
import { initExport, openExportDialog } from './exporter.js';
import { initState, pushHistory, newProject } from './state.js';
import { log, error, getLogs, clearLogs, attachGlobalErrorHandler } from './log.js';

export function initApp(){
  attachGlobalErrorHandler();
  const btnHamburger = document.getElementById('btnHamburger');
  const leftDrawer = document.getElementById('leftDrawer');
  const cvPage = document.getElementById('cvPage');
  const blockLibrary = document.getElementById('blockLibrary');
  const themeList = document.getElementById('themeList');
  const btnExport = document.getElementById('btnExport');
  const btnPreview = document.getElementById('btnPreview');
  const btnPublish = document.getElementById('btnPublish');
  const btnTemplates = document.getElementById('btnTemplates');
  const btnImportJSON = document.getElementById('btnImportJSON');
  const fileImportJSON = document.getElementById('fileImportJSON');
  const btnLogs = document.getElementById('btnLogs');
  const logDialog = document.getElementById('logDialog');
  const btnRunDiag = document.getElementById('btnRunDiag');
  const btnClearLogs = document.getElementById('btnClearLogs');
  const btnCopyLogs = document.getElementById('btnCopyLogs');
  const btnCloseLogs = document.getElementById('btnCloseLogs');

  log('app','Init start');

  btnHamburger.addEventListener('click', ()=> { leftDrawer.classList.toggle('open'); log('ui','toggle drawer', { open:leftDrawer.classList.contains('open') }); });
  createLibrary(blockLibrary, (type)=>{ const el = addBlockToCanvas(type, cvPage); selectBlock(el); pushHistory('Ajout bloc: '+type); log('block','added', { type }); });
  for(const th of THEMES){ const b=document.createElement('button'); b.className='btn'; b.textContent=th.name; b.addEventListener('click', ()=>{ applyTheme(th); pushHistory('Thème: '+th.name); log('theme','apply', { name: th.name }); }); themeList.appendChild(b); }
  initDragAndResize(cvPage, sel=> { refreshInspector(sel); log('drag','select', { id: sel?.dataset?.id }); });
  initInspector(); initAIStudio(); initExport(); initState();
  cvPage.addEventListener('click', onCanvasClick);
  btnExport.addEventListener('click', ()=> { openExportDialog(); log('ui','open export'); });
  btnPreview.addEventListener('click', ()=> { document.body.classList.toggle('preview'); const on=document.body.classList.contains('preview'); document.getElementById('statusText').textContent = on ? 'Aperçu (interactions désactivées)' : 'Édition'; log('ui','toggle preview', { preview:on }); });
  btnPublish.addEventListener('click', ()=> { alert('Publiez via vos propres webhooks.'); log('ui','publish click'); });
  btnTemplates.addEventListener('click', ()=> { loadTemplateDialog(); log('ui','open templates'); });

  btnImportJSON.addEventListener('click', ()=> { fileImportJSON.click(); log('ui','import click'); });
  fileImportJSON.addEventListener('change', async (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    const txt = await f.text();
    try{ await newProject(cvPage, JSON.parse(txt)); pushHistory('Import JSON'); log('data','import ok'); }catch(err){ alert('JSON invalide'); error('data','import fail', { err: String(err) }); }
  });

  // Logs dialog
  btnLogs.addEventListener('click', ()=> { logDialog.showModal(); log('ui','open logs'); renderLogs(); });
  btnCloseLogs.addEventListener('click', ()=> logDialog.close());
  btnClearLogs.addEventListener('click', ()=> { clearLogs(); renderLogs(); });
  btnCopyLogs.addEventListener('click', async ()=> {
    try{ await navigator.clipboard.writeText(document.getElementById('logOutput').textContent||''); log('logs','copied'); }catch(e){ error('logs','copy fail', { e:String(e) }); }
  });
  btnRunDiag.addEventListener('click', runDiagnostics);

  log('app','Init done');
}

function renderLogs(){
  const out = document.getElementById('logOutput');
  const items = getLogs();
  out.textContent = items.map(l => `${l.t}  [${l.level}]  ${l.scope} :: ${l.message}${l.data? ' ' + JSON.stringify(l.data): ''}`).join('\n');
}

async function runDiagnostics(){
  const results = [];
  function assert(name, ok, details){ results.push({ name, ok, details }); }
  try{
    // Canvas presence
    const page = document.getElementById('cvPage');
    assert('Canvas présent', !!page);
    // Add block
    const before = page.querySelectorAll('.drag-block').length;
    const btnAdd = document.querySelector('#blockLibrary .btn');
    if(btnAdd){ btnAdd.click(); }
    const after = page.querySelectorAll('.drag-block').length;
    assert('Ajout bloc via UI', after>before, { before, after });
    // Drag simulation
    const first = page.querySelector('.drag-block');
    const x0 = parseInt(first.style.left||'0'); first.style.left = (x0+8)+'px';
    assert('Déplacement programmatique', parseInt(first.style.left||'0')===x0+8, { from:x0, to: first.style.left });
    // Preview toggle
    document.body.classList.add('preview');
    const pe = getComputedStyle(first).pointerEvents;
    assert('Aperçu désactive interactions', pe==='none', { pointerEvents: pe });
    document.body.classList.remove('preview');
    // Export availability
    assert('html2canvas dispo', !!window.html2canvas);
    assert('jsPDF dispo', !!window.jspdf);
    // Local storage test
    localStorage.setItem('cvpro_diag','ok'); assert('LocalStorage', localStorage.getItem('cvpro_diag')==='ok');
  }catch(e){
    console.error(e);
  }
  // Log results
  results.forEach(r => (r.ok? log('diag', r.name, r.details) : error('diag', r.name, r.details)));
  // Show summary
  const out = document.getElementById('logOutput');
  out.textContent += '\n\nRésumé diagnostic:\n' + results.map(r=>`• ${r.ok?'✅':'❌'} ${r.name}`).join('\n');
}
