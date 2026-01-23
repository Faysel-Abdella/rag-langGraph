/**
 * Admin Dashboard App - Main Application Logic
 * Handles authentication, navigation, and UI interactions
 */

class AdminDashboard {
  constructor() {
    this.currentPage = 'dashboard';
    this.init();
  }

  /**
   * Initialize the dashboard
   */
  init() {
    // Check authentication first
    if (!this.checkAuth()) {
      return;
    }

    // Render Components
    this.renderComponents();

    // Update UI with user data
    const adminEmail = sessionStorage.getItem('adminEmail');
    if (adminEmail) {
      this.updateUserEmail(adminEmail);
    }

    // Setup event listeners
    this.setupNavigation();
    this.setupLogout();
    this.setupUploadArea();

    // Load initial data
    this.loadDashboardData();
  }

  /**
   * Check if user is authenticated
   * Redirect to login if not
   */
  checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    const adminEmail = sessionStorage.getItem('adminEmail');

    if (!isLoggedIn || !adminEmail) {
      window.location.href = '/admin/login';
      return false;
    }

    // Update user email display
    this.updateUserEmail(adminEmail);
    return true;
  }

  /**
   * Update user email in sidebar and header
   */
  updateUserEmail(email) {
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach((element) => {
      element.textContent = email;
    });
  }

  /**
   * Render dynamic components
   */
  renderComponents() {
    // Render Sidebar
    const container = document.getElementById('admin-container');
    if (container) {
      container.insertAdjacentHTML('afterbegin', Sidebar.render());
    }

    // Render Header
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.insertAdjacentHTML('afterbegin', Header.render());
    }
  }

  /**
   * Setup navigation between pages
   */
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();

        const page = item.dataset.page;
        if (!page) return;

        // Update active nav item
        navItems.forEach((nav) => nav.classList.remove('active'));
        item.classList.add('active');

        // Show active section
        const sections = document.querySelectorAll('.page-section');
        sections.forEach((sec) => sec.classList.remove('active'));
        const targetSection = document.getElementById(page);
        if (targetSection) {
          targetSection.classList.add('active');
        }

        // Update page title
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
          pageTitle.textContent = item.textContent.trim().split('\n')[0] || item.textContent.trim();
        }

        this.currentPage = page;
      });
    });
  }

  /**
   * Setup logout functionality
   */
  setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', () => {
      const confirmed = confirm('Are you sure you want to logout?');
      if (confirmed) {
        // Clear session storage
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminLoginTime');

        // Redirect to login
        window.location.href = '/admin/login';
      }
    });
  }

  /**
   * Setup upload area functionality
   */
  setupUploadArea() {
    const uploadArea = document.querySelector('.upload-area');
    if (!uploadArea) return;

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--dark)';
      uploadArea.style.background = 'rgba(202, 157, 43, 0.1)';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = 'var(--primary)';
      uploadArea.style.background = 'rgba(202, 157, 43, 0.02)';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--primary)';
      uploadArea.style.background = 'rgba(202, 157, 43, 0.02)';

      const files = e.dataTransfer.files;
      this.handleFileUpload(files);
    });

    // Click to upload
    uploadArea.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.docx,.txt';
      input.addEventListener('change', (e) => {
        this.handleFileUpload(e.target.files);
      });
      input.click();
    });
  }

  /**
   * Handle file upload
   * Send files to backend API
   */
  async handleFileUpload(files) {
    if (!files || files.length === 0) return;

    try {
      for (let file of files) {
        const formData = new FormData();
        formData.append('file', file);

        console.log(`Uploading file: ${file.name}`);
        const result = await window.apiService.adminUploadDocument(formData);
        console.log(`File uploaded:`, result);
      }
      alert(`${files.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload files. Please try again.');
    }
  }

  /**
   * Load dashboard data
   * Phase 2: Fetch from API
   */
  loadDashboardData() {
    if (this.currentPage !== 'dashboard') return;

    // TODO: Phase 2 - Fetch real data from /api/admin/dashboard
    console.log('Loading dashboard data...');

    // Load data using API service
    this.loadData();
  }

  /**
   * Load dashboard data from API
   */
  async loadData() {
    try {
      const stats = await window.apiService.adminGetDashboardStats();
      if (stats) {
        this.updateDashboardUI(stats);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  /**
    * Update dashboard UI with real data
   */
  updateDashboardUI(stats) {
    // Update message count
    const msgCountEl = document.querySelector('[data-stat="total-messages"]');
    if (msgCountEl) msgCountEl.textContent = stats.totalMessages || 0;

    // Update resolved percentage
    const resolvedEl = document.querySelector('[data-stat="resolved-percentage"]');
    if (resolvedEl) resolvedEl.textContent = stats.resolvedPercentage + '%' || '0%';

    // Update response time
    const responseTimeEl = document.querySelector('[data-stat="avg-response-time"]');
    if (responseTimeEl) responseTimeEl.textContent = stats.avgResponseTime + 'h' || '0h';

    // Update documents indexed
    const docsEl = document.querySelector('[data-stat="documents-indexed"]');
    if (docsEl) docsEl.textContent = stats.documentsIndexed || 0;
  }
}

/**
 * NOTE: API calls are now centralized in apiService.js
 * Use window.apiService for all API communication
 */

/**
 * Initialize dashboard on DOM ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
  });
} else {
  window.adminDashboard = new AdminDashboard();
}
