// domutil.js
import { log, error } from './log.js';

export function getTextFromScope(scope){
  const page = document.getElementById('cvPage');
  if (!page) {
    error('domutil', 'Canvas page not found');
    return { text: '', targets: [] };
  }
  
  let targets = [];
  
  if (scope === 'selection') { 
    const sel = document.querySelector('.drag-block.selected'); 
    if (sel) {
      targets = [sel];
      log('domutil', 'Selected block found for AI processing');
    } else {
      log('domutil', 'No block selected - using all blocks');
      targets = [...page.querySelectorAll('.drag-block')];
    }
  } else { 
    targets = [...page.querySelectorAll('.drag-block')]; 
    log('domutil', `Found ${targets.length} blocks for AI processing`);
  }
  
  if (targets.length === 0) {
    log('domutil', 'No blocks found for AI processing');
    return { text: '', targets: [] };
  }
  
  const text = targets.map(t => {
    const content = t.querySelector('.block-content') || t;
    return content.innerText || content.textContent || '';
  }).filter(Boolean).join('\n\n');
  
  log('domutil', 'Text extracted for AI', { 
    scope, 
    targetCount: targets.length, 
    textLength: text.length 
  });
  
  return { text, targets };
}
export function setTextToScope(targets, output){
  if (!targets || targets.length === 0) {
    error('domutil', 'No targets provided for text update');
    return;
  }
  
  if (!output) {
    log('domutil', 'Empty output provided - skipping text update');
    return;
  }
  
  log('domutil', 'Setting AI output to targets', { 
    targetCount: targets.length, 
    outputLength: output.length 
  });
  
  if (targets.length === 1) {
    const area = targets[0].querySelector('.block-content') || targets[0];
    if (area) {
      area.innerText = output;
      log('domutil', 'Updated single target with AI output');
    } else {
      error('domutil', 'Cannot find content area in target');
    }
    return;
  }
  
  const parts = output.split(/\n\n+/);
  targets.forEach((t, i) => { 
    const area = t.querySelector('.block-content') || t; 
    if (area) {
      area.innerText = parts[i % parts.length] || output;
    } else {
      error('domutil', `Cannot find content area in target ${i}`);
    }
  });
  
  log('domutil', 'Updated multiple targets with AI output');
}
