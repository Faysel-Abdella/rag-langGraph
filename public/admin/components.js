/**
 * Admin Dashboard Components - Reusable UI Components
 * Sidebar, Header, Stats Cards, Tables, etc.
 */

/**
 * Sidebar Component
 */
class Sidebar {
  static render() {
    return `
      <aside class="sidebar">
        <!-- Header / Logo -->
        <div class="sidebar-header">
          <div class="logo-container">
            <img src="../image/Group 1437254357.png" alt="ChatBot" class="sidebar-logo">
          </div>
        </div>

        <!-- Menu Section -->
        <div class="nav-section">
          <div class="nav-label">Home</div>
          <nav class="sidebar-nav">
            <a href="#" data-page="dashboard" class="nav-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="4" y="4" width="7" height="7" rx="2" />
                <rect x="4" y="13" width="7" height="7" rx="2" />
                <rect x="13" y="4" width="7" height="7" rx="2" />
                <rect x="13" y="13" width="7" height="7" rx="2" />
              </svg>
              <span>Dashboard</span>
            </a>
            
            <a href="#" data-page="knowledge" class="nav-item active">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2C7.58172 2 4 3.79086 4 6C4 8.20914 7.58172 10 12 10C16.4183 10 20 8.20914 20 6C20 3.79086 16.4183 2 12 2Z" />
                <path d="M20 12C20 14.2091 16.4183 16 12 16C7.58172 16 4 14.2091 4 12" />
                <path d="M20 18C20 20.2091 16.4183 22 12 22C7.58172 22 4 20.2091 4 18M4 6V18M20 6V18" />
              </svg>
              <span>Knowledge Base</span>
            </a>

            <a href="#" data-page="conversations" class="nav-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 20.932C13.3506 20.9765 12.6841 21 12.0002 21C6.47738 21 2.00024 16.5228 2.00024 11C2.00024 5.47715 6.47738 1 12.0002 1C17.5231 1 22.0002 5.47715 22.0002 11C22.0002 12.9863 21.421 14.8315 20.4186 16.3905L21.7073 20.2558C21.8906 20.8058 21.4057 21.3505 20.8711 21.111L17.2002 19.538" />
              </svg>
              <span>Conversation</span>
            </a>

            <a href="#" data-page="escalations" class="nav-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Escalations</span>
            </a>
          </nav>
        </div>

        <!-- Footer / User Profile -->
        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="user-avatar">
              <span>AT</span>
            </div>
            <div class="user-info-text">
              <div class="user-name">Alexander</div>
              <div class="user-email">m@example.com</div>
            </div>
          </div>
          <button class="logout-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>
    `;
  }
}

/**
 * Header Component
 */
class Header {
  static render() {
    return `
      <header class="page-header">
        <h1 id="page-title">Dashboard</h1>
        <div class="header-right">
          <span class="health-status">
            <span class="status-indicator"></span>
            System OK
          </span>
          <span class="user-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Admin
          </span>
        </div>
      </header>
    `;
  }
}

/**
 * Stats Card Component
 */
class StatsCard {
  static render({ icon, label, value, trend, trendDirection = 'up' }) {
    const trendIcon = trendDirection === 'up' ?
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="18 15 12 9 6 15"></polyline></svg>` :
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

    return `
      <div class="stat-card">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${icon}
        </svg>
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
        <div class="stat-trend ${trendDirection === 'down' ? 'down' : ''}">
          ${trendIcon}
          ${trend}
        </div>
      </div>
    `;
  }
}

/**
 * Card Component
 */
class Card {
  static render(title, content, badge = null, options = {}) {
    const headerClass = options.headerClass || '';
    return `
      <div class="card ${options.class || ''}">
        <div class="card-title ${headerClass}">
          <span>${title}</span>
          ${badge ? `<span class="card-badge">${badge}</span>` : ''}
        </div>
        ${content}
      </div>
    `;
  }
}

/**
 * Button Component
 */
class Button {
  static primary(text, icon = null, options = {}) {
    const className = options.className || '';
    return `
      <button class="btn btn-primary ${className}" ${options.disabled ? 'disabled' : ''}>
        ${icon ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">${icon}</svg>` : ''}
        ${text}
      </button>
    `;
  }

  static secondary(text, icon = null, options = {}) {
    const className = options.className || '';
    return `
      <button class="btn btn-secondary ${className}" ${options.disabled ? 'disabled' : ''}>
        ${icon ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">${icon}</svg>` : ''}
        ${text}
      </button>
    `;
  }
}

/**
 * Badge Component
 */
class Badge {
  static success(text) {
    return `<span class="badge badge-success">${text}</span>`;
  }

  static warning(text) {
    return `<span class="badge badge-warning">${text}</span>`;
  }

  static pending(text) {
    return `<span class="badge badge-pending">${text}</span>`;
  }

  static error(text) {
    return `<span class="badge badge-error">${text}</span>`;
  }
}

/**
 * Upload Area Component
 */
class UploadArea {
  static render(options = {}) {
    const hint = options.hint || 'Supported: PDF, DOCX, TXT (Max 10MB)';
    const text = options.text || 'Click or drag files here';
    const className = options.className || '';

    return `
      <div class="upload-area ${className}" id="${options.id || 'upload-area'}">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <div class="upload-text">${text}</div>
        <div class="upload-hint">${hint}</div>
      </div>
    `;
  }
}

/**
 * Placeholder Component
 */
class Placeholder {
  static render(icon, title, description) {
    return `
      <div class="placeholder-content">
        <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${icon}
        </svg>
        <p><strong>${title}:</strong> ${description}</p>
      </div>
    `;
  }
}

/**
 * Loading Spinner Component
 */
class Spinner {
  static render() {
    return `
      <div style="text-align: center; padding: 40px;">
        <div class="loading-spinner"></div>
      </div>
    `;
  }
}

/**
 * Alert Component
 */
class Alert {
  static success(message) {
    return `
      <div class="alert alert-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        ${message}
      </div>
    `;
  }

  static error(message) {
    return `
      <div class="alert alert-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        ${message}
      </div>
    `;
  }

  static info(message) {
    return `
      <div class="alert alert-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        ${message}
      </div>
    `;
  }

  static warning(message) {
    return `
      <div class="alert alert-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        ${message}
      </div>
    `;
  }
}

/**
 * Table Component
 */
class Table {
  static render(headers, rows, options = {}) {
    const tableId = options.id || 'data-table';
    const selectable = options.selectable || false;

    return `
      <div class="overflow-x-auto">
        <table class="table" id="${tableId}">
          <thead>
            <tr>
              ${selectable ? '<th class="w-10"><input type="checkbox" class="select-all"></th>' : ''}
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => this.renderRow(row, selectable)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  static renderRow(row, selectable = false) {
    const checkbox = selectable ?
      '<td><input type="checkbox" class="row-select"></td>' : '';
    return `
      <tr>
        ${checkbox}
        ${row.map(cell => `<td>${cell}</td>`).join('')}
      </tr>
    `;
  }
}

/**
 * Modal Component
 */
class Modal {
  static render(id, title, content, footer, options = {}) {
    const icon = options.icon || '';
    const size = options.size || 'md';
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    };

    return `
      <div id="${id}" class="modal-backdrop hidden">
        <div class="modal ${sizes[size]}">
          <div class="modal-header">
            <div class="modal-title">
              ${icon ? `<div class="modal-title-icon">${icon}</div>` : ''}
              ${title}
            </div>
            <button class="modal-close" data-modal="${id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          <div class="modal-footer">
            ${footer}
          </div>
        </div>
      </div>
    `;
  }
}