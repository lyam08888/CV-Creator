// auto-fix.js - Automatic problem detection and fixing
import { log, error } from './log.js';

export class AutoFix {
  constructor() {
    this.fixes = [];
    this.issues = [];
  }

  async runDiagnostic() {
    log('auto-fix', '🔍 Starting automatic diagnostic');
    
    this.checkDOMStructure();
    this.checkEventListeners();
    this.checkExternalDependencies();
    this.checkLocalStorage();
    this.checkModuleImports();
    
    log('auto-fix', `Diagnostic complete: ${this.issues.length} issues found, ${this.fixes.length} fixes available`);
    
    return {
      issues: this.issues,
      fixes: this.fixes,
      canAutoFix: this.fixes.length > 0
    };
  }

  checkDOMStructure() {
    const criticalElements = [
      'cvPage', 'blockLibrary', 'leftDrawer', 'rightInspector'
    ];
    
    const missing = criticalElements.filter(id => !document.getElementById(id));
    
    if (missing.length > 0) {
      this.issues.push({
        type: 'dom',
        severity: 'critical',
        message: `Critical DOM elements missing: ${missing.join(', ')}`,
        elements: missing
      });
      
      // Auto-fix: Create missing elements
      this.fixes.push({
        type: 'dom',
        action: 'create-elements',
        elements: missing,
        fix: () => this.createMissingElements(missing)
      });
    }
  }

  checkEventListeners() {
    const buttonElements = [
      'btnHamburger', 'btnPreview', 'btnExport', 'btnTemplates',
      'btnDuplicate', 'btnDelete', 'btnLock', 'btnHide'
    ];
    
    const missingButtons = buttonElements.filter(id => !document.getElementById(id));
    
    if (missingButtons.length > 0) {
      this.issues.push({
        type: 'events',
        severity: 'high',
        message: `Button elements missing: ${missingButtons.join(', ')}`,
        elements: missingButtons
      });
    }
  }

  checkExternalDependencies() {
    const dependencies = [
      { name: 'html2canvas', obj: window.html2canvas, url: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js' },
      { name: 'jsPDF', obj: window.jspdf, url: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js' },
      { name: 'QRCode', obj: window.QRCode, url: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js' }
    ];
    
    const missing = dependencies.filter(dep => !dep.obj);
    
    if (missing.length > 0) {
      this.issues.push({
        type: 'dependencies',
        severity: 'medium',
        message: `External dependencies missing: ${missing.map(d => d.name).join(', ')}`,
        dependencies: missing
      });
      
      this.fixes.push({
        type: 'dependencies',
        action: 'load-scripts',
        dependencies: missing,
        fix: () => this.loadMissingDependencies(missing)
      });
    }
  }

  checkLocalStorage() {
    try {
      localStorage.setItem('cvpro_autofix_test', 'ok');
      const test = localStorage.getItem('cvpro_autofix_test');
      localStorage.removeItem('cvpro_autofix_test');
      
      if (test !== 'ok') {
        this.issues.push({
          type: 'storage',
          severity: 'medium',
          message: 'LocalStorage test failed'
        });
      }
    } catch (e) {
      this.issues.push({
        type: 'storage',
        severity: 'high',
        message: `LocalStorage error: ${e.message}`
      });
    }
  }

  checkModuleImports() {
    // This is a basic check - in a real scenario, we'd need more sophisticated module checking
    const requiredGlobals = ['initApp'];
    
    requiredGlobals.forEach(global => {
      if (typeof window[global] === 'undefined') {
        this.issues.push({
          type: 'modules',
          severity: 'high',
          message: `Required global function missing: ${global}`
        });
      }
    });
  }

  createMissingElements(missing) {
    log('auto-fix', 'Creating missing DOM elements');
    
    missing.forEach(id => {
      const element = document.createElement('div');
      element.id = id;
      
      switch (id) {
        case 'cvPage':
          element.className = 'page page-grid';
          element.style.cssText = 'width: 210mm; height: 297mm; background: white; position: relative; margin: 20px auto;';
          document.body.appendChild(element);
          break;
          
        case 'blockLibrary':
          element.className = 'lib-grid';
          const leftDrawer = document.getElementById('leftDrawer') || document.body;
          leftDrawer.appendChild(element);
          break;
          
        case 'leftDrawer':
          element.className = 'drawer';
          element.style.cssText = 'position: fixed; left: -300px; top: 0; width: 300px; height: 100vh; background: white; transition: left 0.3s;';
          document.body.appendChild(element);
          break;
          
        case 'rightInspector':
          element.className = 'inspector';
          element.style.cssText = 'position: fixed; right: -300px; top: 0; width: 300px; height: 100vh; background: white; transition: right 0.3s;';
          document.body.appendChild(element);
          break;
      }
      
      log('auto-fix', `Created missing element: ${id}`);
    });
  }

  async loadMissingDependencies(missing) {
    log('auto-fix', 'Loading missing dependencies');
    
    for (const dep of missing) {
      try {
        await this.loadScript(dep.url);
        log('auto-fix', `Loaded dependency: ${dep.name}`);
      } catch (e) {
        error('auto-fix', `Failed to load dependency: ${dep.name}`, { error: e.message });
      }
    }
  }

  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async applyFixes() {
    log('auto-fix', `Applying ${this.fixes.length} fixes`);
    
    for (const fix of this.fixes) {
      try {
        await fix.fix();
        log('auto-fix', `Applied fix: ${fix.type} - ${fix.action}`);
      } catch (e) {
        error('auto-fix', `Failed to apply fix: ${fix.type}`, { error: e.message });
      }
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      issues: this.issues,
      fixes: this.fixes,
      summary: {
        totalIssues: this.issues.length,
        criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
        highIssues: this.issues.filter(i => i.severity === 'high').length,
        mediumIssues: this.issues.filter(i => i.severity === 'medium').length,
        availableFixes: this.fixes.length
      }
    };
    
    log('auto-fix', 'Generated diagnostic report', report.summary);
    return report;
  }
}

// Global function to run auto-fix
window.runAutoFix = async function() {
  const autoFix = new AutoFix();
  const diagnostic = await autoFix.runDiagnostic();
  
  console.log('🔍 Diagnostic Results:', diagnostic);
  
  if (diagnostic.canAutoFix) {
    const shouldFix = confirm(`Found ${diagnostic.issues.length} issues with ${diagnostic.fixes.length} available fixes. Apply automatic fixes?`);
    
    if (shouldFix) {
      await autoFix.applyFixes();
      alert('Automatic fixes applied. Please refresh the page.');
    }
  } else {
    alert(`Found ${diagnostic.issues.length} issues, but no automatic fixes available.`);
  }
  
  return autoFix.generateReport();
};