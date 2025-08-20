// log.js — central logging
const logs = [];
function ts(){ return new Date().toISOString(); }
export function log(scope, message, data){
  const entry = { t: ts(), level:'INFO', scope, message, data };
  logs.push(entry);
  console.info(`[CVPRO][${entry.t}][${scope}] ${message}`, data||'');
  render();
  return entry;
}
export function error(scope, message, data){
  const entry = { t: ts(), level:'ERROR', scope, message, data };
  logs.push(entry);
  console.error(`[CVPRO][${entry.t}][${scope}] ${message}`, data||'');
  render();
  return entry;
}
export function getLogs(){ return logs.slice(); }
export function clearLogs(){ logs.length = 0; render(); }
function render(){
  const el = document.getElementById('logOutput');
  if(!el) return;
  el.textContent = logs.map(l => `${l.t}  [${l.level}]  ${l.scope} :: ${l.message}${l.data? ' ' + JSON.stringify(l.data): ''}`).join('\n');
}
export function attachGlobalErrorHandler(){
  window.addEventListener('error', (e)=> error('window', e.message, { filename:e.filename, lineno:e.lineno }));
  window.addEventListener('unhandledrejection', (e)=> error('promise', 'Unhandled rejection', { reason: String(e.reason) }));
}
