// app.js
import { createLibrary, addBlockToCanvas, THEMES, applyTheme, loadTemplateDialog } from './blocks.js';
import { initDragAndResize, selectBlock, onCanvasClick } from './drag.js';
import { initInspector, refreshInspector } from './inspector.js';
import { initAIStudio } from './ai.js';
import { initExport, openExportDialog } from './exporter.js';
import { initState, pushHistory, newProject } from './state.js';
import { log, error, getLogs, clearLogs, attachGlobalErrorHandler } from './log.js';
import { runFullDOMDiagnostic } from './dom-checker.js';
import './auto-fix.js';

export function initApp(){
  try {
    attachGlobalErrorHandler();
    
    log('app','Init start');
    
    // Check if DOM is ready
    if (document.readyState === 'loading') {
      log('app','DOM not ready, waiting...');
      document.addEventListener('DOMContentLoaded', initApp);
      return;
    }
    
    log('app', 'DOM ready, proceeding with initialization');
    
    // Run DOM diagnostic first
    const domOk = runFullDOMDiagnostic();
    if (!domOk) {
      error('app', 'Critical DOM elements missing - initialization may fail');
    }
  
  // Get all DOM elements with null checks
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

  // Check critical elements
  const criticalElements = { cvPage, blockLibrary, leftDrawer };
  const missingCritical = Object.entries(criticalElements)
    .filter(([name, element]) => !element)
    .map(([name]) => name);
  
  if (missingCritical.length > 0) {
    console.error('[App] Critical elements missing:', missingCritical);
    log('app', 'Critical elements missing', { missing: missingCritical });
    return;
  }

  // Helper function to safely bind events
  const bindEvent = (element, event, handler, elementName) => {
    if(element) {
      element.addEventListener(event, handler);
    } else {
      console.warn(`[App] missing element: ${elementName}`);
    }
  };

  bindEvent(btnHamburger, 'click', ()=> { 
    if(leftDrawer) {
      leftDrawer.classList.toggle('open'); 
      log('ui','toggle drawer', { open:leftDrawer.classList.contains('open') }); 
    }
  }, 'btnHamburger');

  if(blockLibrary && cvPage) {
    createLibrary(blockLibrary, (type)=>{ 
      const el = addBlockToCanvas(type, cvPage); 
      selectBlock(el); 
      pushHistory('Ajout bloc: '+type); 
      log('block','added', { type }); 
    });
  } else {
    console.warn('[App] missing blockLibrary or cvPage');
  }

  if(themeList) {
    for(const th of THEMES){ 
      const b=document.createElement('button'); 
      b.className='btn'; 
      b.textContent=th.name; 
      b.addEventListener('click', ()=>{ 
        applyTheme(th); 
        pushHistory('Thème: '+th.name); 
        log('theme','apply', { name: th.name }); 
      }); 
      themeList.appendChild(b); 
    }
  } else {
    console.warn('[App] missing themeList');
  }

  if(cvPage) {
    initDragAndResize(cvPage, sel=> { refreshInspector(sel); log('drag','select', { id: sel?.dataset?.id }); });
    cvPage.addEventListener('click', onCanvasClick);
  } else {
    console.warn('[App] missing cvPage');
  }

  initInspector(); initAIStudio(); initExport(); initState();

  bindEvent(btnExport, 'click', ()=> { openExportDialog(); log('ui','open export'); }, 'btnExport');
  bindEvent(btnPreview, 'click', ()=> { 
    document.body.classList.toggle('preview'); 
    const on=document.body.classList.contains('preview'); 
    const statusText = document.getElementById('statusText');
    if(statusText) statusText.textContent = on ? 'Aperçu (interactions désactivées)' : 'Édition'; 
    log('ui','toggle preview', { preview:on }); 
  }, 'btnPreview');
  bindEvent(btnPublish, 'click', ()=> { alert('Publiez via vos propres webhooks.'); log('ui','publish click'); }, 'btnPublish');
  bindEvent(btnTemplates, 'click', ()=> { loadTemplateDialog(); log('ui','open templates'); }, 'btnTemplates');

  bindEvent(btnImportJSON, 'click', ()=> { 
    if(fileImportJSON) {
      fileImportJSON.click(); 
      log('ui','import click'); 
    }
  }, 'btnImportJSON');

  bindEvent(fileImportJSON, 'change', async (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    const txt = await f.text();
    try{ 
      if(cvPage) {
        await newProject(cvPage, JSON.parse(txt)); 
        pushHistory('Import JSON'); 
        log('data','import ok'); 
      }
    }catch(err){ 
      alert('JSON invalide'); 
      error('data','import fail', { err: String(err) }); 
    }
  }, 'fileImportJSON');

  // Logs dialog
  bindEvent(btnLogs, 'click', ()=> { 
    if(logDialog) {
      logDialog.showModal(); 
      log('ui','open logs'); 
      renderLogs(); 
    }
  }, 'btnLogs');
  bindEvent(btnCloseLogs, 'click', ()=> {
    if(logDialog) logDialog.close();
  }, 'btnCloseLogs');
  bindEvent(btnClearLogs, 'click', ()=> { clearLogs(); renderLogs(); }, 'btnClearLogs');
  bindEvent(btnCopyLogs, 'click', async ()=> {
    try{ 
      const logOutput = document.getElementById('logOutput');
      if(logOutput) {
        await navigator.clipboard.writeText(logOutput.textContent||''); 
        log('logs','copied'); 
      }
    }catch(e){ 
      error('logs','copy fail', { e:String(e) }); 
    }
  }, 'btnCopyLogs');
  bindEvent(btnRunDiag, 'click', runDiagnostics, 'btnRunDiag');

  log('app','Init done');
  
  } catch (err) {
    console.error('[App] Critical initialization error:', err);
    error('app', 'Critical initialization error', { 
      message: err.message, 
      stack: err.stack 
    });
    
    // Try to show a user-friendly error message
    const statusText = document.getElementById('statusText');
    if (statusText) {
      statusText.textContent = 'Erreur critique - Consultez les logs';
      statusText.style.color = 'red';
    }
  }
}

function renderLogs(){
  const out = document.getElementById('logOutput');
  if(!out) {
    console.warn('[App] missing logOutput element');
    return;
  }
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
    
    if(page) {
      // Add block
      const before = page.querySelectorAll('.drag-block').length;
      const btnAdd = document.querySelector('#blockLibrary .btn');
      if(btnAdd){ btnAdd.click(); }
      const after = page.querySelectorAll('.drag-block').length;
      assert('Ajout bloc via UI', after>before, { before, after });
      
      // Drag simulation
      const first = page.querySelector('.drag-block');
      if(first) {
        const x0 = parseInt(first.style.left||'0'); 
        first.style.left = (x0+8)+'px';
        assert('Déplacement programmatique', parseInt(first.style.left||'0')===x0+8, { from:x0, to: first.style.left });
        
        // Preview toggle
        document.body.classList.add('preview');
        const pe = getComputedStyle(first).pointerEvents;
        assert('Aperçu désactive interactions', pe==='none', { pointerEvents: pe });
        document.body.classList.remove('preview');
      }
    }
    
    // Export availability
    assert('html2canvas dispo', !!window.html2canvas);
    assert('jsPDF dispo', !!window.jspdf);
    // Local storage test
    localStorage.setItem('cvpro_diag','ok'); 
    assert('LocalStorage', localStorage.getItem('cvpro_diag')==='ok');
  }catch(e){
    console.error(e);
  }
  // Log results
  results.forEach(r => (r.ok? log('diag', r.name, r.details) : error('diag', r.name, r.details)));
  // Show summary
  const out = document.getElementById('logOutput');
  if(out) {
    out.textContent += '\n\nRésumé diagnostic:\n' + results.map(r=>`• ${r.ok?'✅':'❌'} ${r.name}`).join('\n');
  }
}
