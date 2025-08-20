// error_handler.js - Global error handling
import { error } from './log.js';

// Global error wrapper function
export function wr(scope) {
  return {
    error: (message, data) => {
      error(scope, message, data);
      console.error(`[CVPRO][${new Date().toISOString()}][${scope}] ${message}`, data || '');
    },
    log: (message, data) => {
      console.log(`[CVPRO][${new Date().toISOString()}][${scope}] ${message}`, data || '');
    }
  };
}

// Attach global error handlers
export function attachGlobalErrorHandlers() {
  window.addEventListener('error', (e) => {
    error('window', `Uncaught ${e.error?.name || 'Error'}: ${e.message}`, {
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error?.stack
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    error('promise', 'Unhandled Promise Rejection', {
      reason: String(e.reason),
      stack: e.reason?.stack
    });
  });
}

// Initialize error handling
attachGlobalErrorHandlers();