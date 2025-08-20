// dom-checker.js - DOM elements verification
import { log, error } from './log.js';

export function checkDOMElements() {
  log('dom-checker', 'Starting DOM elements verification');
  
  const requiredElements = [
    // Critical elements
    { id: 'cvPage', critical: true, description: 'Main canvas' },
    { id: 'blockLibrary', critical: true, description: 'Block library container' },
    { id: 'leftDrawer', critical: true, description: 'Left drawer panel' },
    { id: 'rightInspector', critical: true, description: 'Right inspector panel' },
    
    // Header buttons
    { id: 'btnHamburger', critical: false, description: 'Hamburger menu button' },
    { id: 'btnTemplates', critical: false, description: 'Templates button' },
    { id: 'btnPreview', critical: false, description: 'Preview button' },
    { id: 'btnExport', critical: false, description: 'Export button' },
    { id: 'btnLogs', critical: false, description: 'Logs button' },
    { id: 'btnPublish', critical: false, description: 'Publish button' },
    
    // Inspector inputs
    { id: 'inpFont', critical: false, description: 'Font input' },
    { id: 'inpFontSize', critical: false, description: 'Font size input' },
    { id: 'inpLineHeight', critical: false, description: 'Line height input' },
    { id: 'inpColor', critical: false, description: 'Color input' },
    { id: 'inpBg', critical: false, description: 'Background input' },
    { id: 'inpRadius', critical: false, description: 'Radius input' },
    { id: 'inpShadow', critical: false, description: 'Shadow input' },
    { id: 'inpX', critical: false, description: 'X position input' },
    { id: 'inpY', critical: false, description: 'Y position input' },
    { id: 'inpW', critical: false, description: 'Width input' },
    { id: 'inpH', critical: false, description: 'Height input' },
    
    // Inspector buttons
    { id: 'btnDuplicate', critical: false, description: 'Duplicate button' },
    { id: 'btnDelete', critical: false, description: 'Delete button' },
    { id: 'btnLock', critical: false, description: 'Lock button' },
    { id: 'btnHide', critical: false, description: 'Hide button' },
    
    // AI Studio elements
    { id: 'iaAction', critical: false, description: 'AI action select' },
    { id: 'iaScope', critical: false, description: 'AI scope select' },
    { id: 'btnRunIA', critical: false, description: 'Run AI button' },
    
    // Dialogs
    { id: 'exportDialog', critical: false, description: 'Export dialog' },
    { id: 'templateDialog', critical: false, description: 'Template dialog' },
    { id: 'logDialog', critical: false, description: 'Log dialog' },
    { id: 'deleteDialog', critical: false, description: 'Delete dialog' },
    
    // Other elements
    { id: 'themeList', critical: false, description: 'Theme list container' },
    { id: 'topToolbar', critical: false, description: 'Top toolbar' },
    { id: 'statusText', critical: false, description: 'Status text' },
    { id: 'logOutput', critical: false, description: 'Log output' }
  ];
  
  const results = {
    found: [],
    missing: [],
    criticalMissing: []
  };
  
  requiredElements.forEach(({ id, critical, description }) => {
    const element = document.getElementById(id);
    if (element) {
      results.found.push({ id, description });
      log('dom-checker', `✅ Found: ${id} (${description})`);
    } else {
      results.missing.push({ id, description, critical });
      if (critical) {
        results.criticalMissing.push({ id, description });
        error('dom-checker', `❌ CRITICAL MISSING: ${id} (${description})`);
      } else {
        console.warn(`[DOM-Checker] ⚠️ Missing: ${id} (${description})`);
      }
    }
  });
  
  // Check for duplicate IDs
  const allIds = requiredElements.map(el => el.id);
  const duplicates = [];
  allIds.forEach(id => {
    const elements = document.querySelectorAll(`#${id}`);
    if (elements.length > 1) {
      duplicates.push({ id, count: elements.length });
      error('dom-checker', `❌ DUPLICATE ID: ${id} (found ${elements.length} times)`);
    }
  });
  
  // Summary
  log('dom-checker', 'DOM verification complete', {
    total: requiredElements.length,
    found: results.found.length,
    missing: results.missing.length,
    criticalMissing: results.criticalMissing.length,
    duplicates: duplicates.length
  });
  
  if (results.criticalMissing.length > 0) {
    error('dom-checker', 'Critical elements missing - app may not function properly', {
      critical: results.criticalMissing.map(el => el.id)
    });
    return false;
  }
  
  if (duplicates.length > 0) {
    error('dom-checker', 'Duplicate IDs found - this may cause unexpected behavior', {
      duplicates: duplicates.map(d => `${d.id} (${d.count}x)`)
    });
  }
  
  return true;
}

export function checkEventListeners() {
  log('dom-checker', 'Checking event listener bindings');
  
  const testElements = [
    'btnHamburger',
    'btnPreview', 
    'btnExport',
    'btnTemplates',
    'btnDuplicate',
    'btnDelete'
  ];
  
  testElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      // Check if element has event listeners (this is a basic check)
      const hasClickHandler = element.onclick !== null;
      log('dom-checker', `Event check for ${id}`, { 
        exists: true, 
        hasClickHandler,
        tagName: element.tagName,
        className: element.className
      });
    } else {
      error('dom-checker', `Cannot check events for missing element: ${id}`);
    }
  });
}

export function runFullDOMDiagnostic() {
  log('dom-checker', '🔍 Starting full DOM diagnostic');
  
  const domOk = checkDOMElements();
  checkEventListeners();
  
  // Check external dependencies
  const dependencies = [
    { name: 'html2canvas', obj: window.html2canvas },
    { name: 'jsPDF', obj: window.jspdf },
    { name: 'QRCode', obj: window.QRCode }
  ];
  
  dependencies.forEach(({ name, obj }) => {
    if (obj) {
      log('dom-checker', `✅ External dependency loaded: ${name}`);
    } else {
      error('dom-checker', `❌ External dependency missing: ${name}`);
    }
  });
  
  // Check localStorage
  try {
    localStorage.setItem('cvpro_test', 'ok');
    const test = localStorage.getItem('cvpro_test');
    localStorage.removeItem('cvpro_test');
    if (test === 'ok') {
      log('dom-checker', '✅ localStorage working');
    } else {
      error('dom-checker', '❌ localStorage test failed');
    }
  } catch (e) {
    error('dom-checker', '❌ localStorage error', { error: e.message });
  }
  
  log('dom-checker', '🏁 DOM diagnostic complete');
  return domOk;
}