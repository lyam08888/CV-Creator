// ai.js — API key only + logs
import { getTextFromScope, setTextToScope } from './domutil.js';
import { pushHistory } from './state.js';
import { log, error } from './log.js';

const $=id=>document.getElementById(id);
const ENDPOINT = 'http://localhost:3000/api/ia';

export function initAIStudio(){
  log('ai', 'Initializing AI Studio');
  
  const btnSaveSettings = $('#btnSaveSettings');
  const btnRunIA = $('#btnRunIA');
  
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', saveAPIKey);
    log('ai', 'Bound save settings button');
  } else {
    console.warn('[AI] Missing btnSaveSettings element');
  }
  
  if (btnRunIA) {
    btnRunIA.addEventListener('click', async ()=>{
      try {
        const iaAction = $('#iaAction');
        const iaScope = $('#iaScope');
        
        if (!iaAction || !iaScope) {
          error('ai', 'Missing AI form elements');
          alert('Erreur: éléments de formulaire IA manquants');
          return;
        }
        
        const action = iaAction.value;
        const scope = iaScope.value;
        const prompt = buildPrompt();
        const { text, targets } = getTextFromScope(scope);
        
        log('ai','run', { action, scope, textLen: text.length });
        
        if (!text || text.trim().length === 0) {
          alert('Aucun texte sélectionné pour traitement IA');
          return;
        }
        
        const output = await runAI(action, prompt, text);
        setTextToScope(targets, output);
        pushHistory('IA: '+action);
        
        log('ai', 'AI processing complete');
      } catch (err) {
        error('ai', 'AI processing error', { error: err.message });
        alert('Erreur lors du traitement IA: ' + err.message);
      }
    });
    log('ai', 'Bound run AI button');
  } else {
    console.warn('[AI] Missing btnRunIA element');
  }
  
  log('ai', 'AI Studio initialization complete');
}
function buildPrompt(){
  const tone = $('#iaTone')?.value || '';
  const len = $('#iaLength')?.value || '';
  const lang = $('#iaLang')?.value || '';
  const kin = $('#iaKeywordsIn')?.value || '';
  const kout = $('#iaKeywordsOut')?.value || '';
  const extra = $('#iaPrompt')?.value || '';
  
  return `Ton:${tone||'par défaut'} | Longueur:${len||'par défaut'} | Lang:${lang||'auto'} | Inclure:${kin} | Exclure:${kout} | Consignes:${extra}`;
}
function saveAPIKey(){ 
  const aiKeyElement = $('#aiKey');
  if (aiKeyElement) {
    localStorage.setItem('cvpro_api_key', aiKeyElement.value.trim()); 
    log('ai','api key saved'); 
    alert('API key sauvegardée.');
  } else {
    error('ai', 'Cannot save API key - input element missing');
    alert('Erreur: impossible de sauvegarder la clé API');
  }
}
function getAPIKey(){ return localStorage.getItem('cvpro_api_key')||''; }

async function runAI(action, prompt, text){
  const apiKey=getAPIKey();
  if(apiKey){
    try{
      const res = await fetch(ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ apiKey, action, text, prompt }) });
      log('ai','fetch done', { status: res.status });
      if(res.ok){ const data = await res.json(); if(data && data.output){ log('ai','server output', { len: (data.output||'').length }); return data.output; } }
      error('ai','bad server response', { status: res.status });
    }catch(e){ error('ai','network error', { e:String(e) }); alert('Erreur réseau IA. Impossible de joindre /api/ia.'); }
  } else {
    log('ai','no api key, using local heuristic');
  }
  return localHeuristic(action, prompt, text);
}

function localHeuristic(action, prompt, text){
  if(action==='summarize'){ return text.split(/(?<=[.!?])\s+/).slice(0,3).join(' '); }
  if(action==='expand'){ return text + '\n\nDétails: contexte, actions, résultats (KPI).'; }
  if(action==='bulletify'){ return text.split(/[\n\.]/).map(t=>t.trim()).filter(Boolean).slice(0,8).map(x=>'• '+x[0].toUpperCase()+x.slice(1)).join('\n'); }
  if(action==='achievements'){ return text.split(/[\n\.]/).map(t=>t.trim()).filter(Boolean).slice(0,6).map((x,i)=>`• ${x} — KPI +${10+i*5}%`).join('\n'); }
  if(action==='rewrite'){
    let out=text.replace(/\b(très|vraiment|beaucoup)\b/gi,'');
    if(/impactant|percutant|dynamique/i.test(prompt)) out=out.replace(/\b(responsable|chargé de)\b/gi,'Pilotage');
    if(/court|concise/i.test(prompt)) out=out.slice(0,600);
    return out;
  }
  if(action==='ats'){ const m=prompt.match(/Inclure:(.*?)\|/i); const kws=m? m[1].split(',').map(s=>s.trim()).filter(Boolean):[]; return (text+'\n\nMots-clés intégrés: '+kws.join(', ')).trim(); }
  if(action==='email'){ return `Objet: Candidature — [Poste]\n\nMadame, Monsieur,\nJe vous propose ma candidature au poste de [Poste]. Expériences clés: [3 bullets].\nCordialement,\nPrénom NOM — Tél · Email · LinkedIn`; }
  if(action==='lm'){ return `Madame, Monsieur,\nVotre besoin correspond à mon parcours. Résultats: [KPI].\nDisponible pour un entretien.\nCordialement,\nPrénom NOM`; }
  if(action==='translate'){ if(/\b(en)\b/i.test(prompt)) return '[EN] '+text; return '[FR] '+text; }
  if(action==='tagline'){ return 'Chef de projet — 8+ ans, livraisons TCE, performance et qualité.'; }
  return text;
}
