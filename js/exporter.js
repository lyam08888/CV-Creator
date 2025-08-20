// exporter.js
import { serializeProject } from './state.js';
import { log, error } from './log.js';
const $=id=>document.getElementById(id);

export function initExport(){
  log('export', 'Initializing export module');
  
  const bindExportButton = (id, handler, description) => {
    const element = $(id);
    if (element) {
      element.addEventListener('click', handler);
      log('export', `Bound ${description} button`);
    } else {
      console.warn(`[Export] Missing element: ${id}`);
    }
  };
  
  bindExportButton('btnExport', openExportDialog, 'main export');
  bindExportButton('btnCloseExport', () => {
    const dialog = $('#exportDialog');
    if (dialog) dialog.close();
  }, 'close export');
  bindExportButton('btnExportPNG', exportPNG, 'PNG export');
  bindExportButton('btnExportPDF', exportPDF, 'PDF export');
  bindExportButton('btnExportSVG', exportSVG, 'SVG export');
  bindExportButton('btnExportDOCX', exportDOCX, 'DOCX export');
  bindExportButton('btnExportJSON', exportJSON, 'JSON export');
  bindExportButton('btnPrint', () => window.print(), 'print');
  
  log('export', 'Export module initialization complete');
}
export function openExportDialog(){ 
  const dialog = $('#exportDialog');
  if (dialog) {
    dialog.showModal(); 
    log('export','open'); 
  } else {
    error('export', 'Export dialog not found');
    alert('Erreur: dialogue d\'export introuvable');
  }
}
async function exportPNG(){
  try{
    if (!window.html2canvas) {
      error('export', 'html2canvas not loaded');
      alert('Erreur: html2canvas non disponible');
      return;
    }
    
    const page = document.getElementById('cvPage');
    if (!page) {
      error('export', 'Canvas page not found');
      alert('Erreur: page canvas introuvable');
      return;
    }
    
    log('export', 'Starting PNG export');
    const canvas = await html2canvas(page, {scale:2});
    const link = document.createElement('a'); 
    link.download = 'cv.png'; 
    link.href = canvas.toDataURL('image/png'); 
    link.click();
    log('export','png ok');
    alert('Export PNG terminé');
  }catch(e){ 
    error('export','png fail', { e:String(e) }); 
    alert('Erreur lors de l\'export PNG: ' + e.message);
  }
}
async function exportPDF(){
  try{
    if (!window.jspdf || !window.html2canvas) {
      error('export', 'PDF dependencies not loaded');
      alert('Erreur: dépendances PDF non disponibles');
      return;
    }
    
    const page = document.getElementById('cvPage');
    if (!page) {
      error('export', 'Canvas page not found');
      alert('Erreur: page canvas introuvable');
      return;
    }
    
    log('export', 'Starting PDF export');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','mm','a4');
    const canvas = await html2canvas(page, {scale:2});
    pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,210,297);
    pdf.save('cv.pdf');
    log('export','pdf ok');
    alert('Export PDF terminé');
  }catch(e){ 
    error('export','pdf fail', { e:String(e) }); 
    alert('Erreur lors de l\'export PDF: ' + e.message);
  }
}
function exportJSON(){
  try{
    const data=serializeProject();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const link=document.createElement('a'); link.download='cv_project.json'; link.href=URL.createObjectURL(blob); link.click();
    log('export','json ok', { size: (JSON.stringify(data)||'').length });
  }catch(e){ error('export','json fail', { e:String(e) }); }
}
function exportSVG(){
  try{
    const page=document.getElementById('cvPage');
    const clone = page.cloneNode(true);
    clone.querySelectorAll('.handle').forEach(h=>h.remove());
    const serializer = new XMLSerializer();
    const html = serializer.serializeToString(clone);
    const mmToPx = mm => Math.round(mm * 96 / 25.4);
    const w = mmToPx(210), h = mmToPx(297);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`;
    const blob = new Blob([svg], {type:'image/svg+xml'});
    const link = document.createElement('a'); link.download='cv.svg'; link.href=URL.createObjectURL(blob); link.click();
    log('export','svg ok');
  }catch(e){ error('export','svg fail', { e:String(e) }); }
}
async function exportDOCX(){
  try{
    const data = serializeProject();
    const blocks = data.blocks.slice().sort((a,b)=> (a.layout?.y||0) - (b.layout?.y||0));
    const docx = await import('https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js');
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
    const paragraphs = [];
    blocks.forEach(b=>{
      paragraphs.push(new Paragraph({ text: (b.type||'Bloc').toUpperCase(), heading: HeadingLevel.HEADING_2 }));
      const text = stripHtml(b.html||'').split(/\n+/).map(t=>t.trim()).filter(Boolean);
      text.forEach(line=> paragraphs.push(new Paragraph({ children: [ new TextRun(line) ] })));
      paragraphs.push(new Paragraph(' '));
    });
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a'); link.download='cv.docx'; link.href=URL.createObjectURL(blob); link.click();
    log('export','docx ok');
  }catch(e){ error('export','docx fail', { e:String(e) }); alert('DOCX export indisponible (module).'); }
}
function stripHtml(html){ const tmp=document.createElement('div'); tmp.innerHTML=html; return tmp.textContent || tmp.innerText || ''; }
