// notifications.js - User notification system
import { log } from './log.js';

class NotificationSystem {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create notification container
    this.container = document.createElement('div');
    this.container.id = 'notificationContainer';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
    log('notifications', 'Notification system initialized');
  }

  show(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      background: ${this.getBackgroundColor(type)};
      color: ${this.getTextColor(type)};
      padding: 12px 16px;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-left: 4px solid ${this.getBorderColor(type)};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      pointer-events: auto;
      cursor: pointer;
      max-width: 100%;
      word-wrap: break-word;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 8px;">
        <span style="font-size: 16px; flex-shrink: 0;">${this.getIcon(type)}</span>
        <div style="flex: 1;">
          <div style="font-weight: 500; margin-bottom: 2px;">${this.getTitle(type)}</div>
          <div>${message}</div>
        </div>
        <span style="opacity: 0.7; font-size: 18px; cursor: pointer; flex-shrink: 0;">×</span>
      </div>
    `;

    // Add click to dismiss
    notification.addEventListener('click', () => {
      this.dismiss(notification);
    });

    this.container.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    });

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(notification);
      }, duration);
    }

    log('notifications', 'Notification shown', { type, message });
    return notification;
  }

  dismiss(notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  success(message, duration = 4000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 8000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 6000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 5000) {
    return this.show(message, 'info', duration);
  }

  getBackgroundColor(type) {
    const colors = {
      success: '#d4edda',
      error: '#f8d7da',
      warning: '#fff3cd',
      info: '#d1ecf1'
    };
    return colors[type] || colors.info;
  }

  getTextColor(type) {
    const colors = {
      success: '#155724',
      error: '#721c24',
      warning: '#856404',
      info: '#0c5460'
    };
    return colors[type] || colors.info;
  }

  getBorderColor(type) {
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    return colors[type] || colors.info;
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  getTitle(type) {
    const titles = {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Attention',
      info: 'Information'
    };
    return titles[type] || titles.info;
  }

  clear() {
    const notifications = this.container.querySelectorAll('div');
    notifications.forEach(notification => {
      this.dismiss(notification);
    });
  }
}

// Create global instance
const notifications = new NotificationSystem();

// Export functions
export const notify = {
  success: (message, duration) => notifications.success(message, duration),
  error: (message, duration) => notifications.error(message, duration),
  warning: (message, duration) => notifications.warning(message, duration),
  info: (message, duration) => notifications.info(message, duration),
  show: (message, type, duration) => notifications.show(message, type, duration),
  clear: () => notifications.clear()
};

// Make it globally available
window.notify = notify;