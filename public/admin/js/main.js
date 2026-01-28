/**
 * Main Application Logic
 * Orchestrates components and sections with Authentication Guard
 */

class AdminApp {
    constructor() {
        // API Service should already be initialized globally
        if (!window.apiService) {
            console.warn('⚠️ API Service not initialized, creating now...');
            window.apiService = new APIService();
        }

        // Run auth check before anything else
        if (this.checkAuth()) {
            this.init();
        }
    }

    /**
     * Authentication Guard
     * Verifies if the user has a valid session token
     */
    checkAuth() {
        const token = sessionStorage.getItem('authToken');

        // If no token exists, redirect to login page
        if (!token) {
            console.warn('Unauthorized access attempt. Redirecting to login...');
            window.location.href = 'login.html';
            return false;
        }

        // Optional: You could add logic here to decode the JWT and check expiry
        return true;
    }

    init() {
        // Render Layout Components
        this.renderLayout();

        // Setup Navigation Listeners (Sidebar clicks)
        this.setupNavigation();

        // Setup Hash Routing
        window.addEventListener('hashchange', () => this.handleRouting());

        // Initial Routing
        if (window.location.hash && window.location.hash !== '#') {
            this.handleRouting();
        } else {
            // Default view
            window.location.hash = 'conversations';
        }

        // Setup Mobile Menu
        this.setupMobileMenu();
    }

    handleRouting() {
        const hash = window.location.hash.substring(1); // Remove #
        const [section, ...params] = hash.split('/');

        // Update Sidebar highlighting
        document.querySelectorAll('.nav-item').forEach(el => {
            if (el.dataset.page === section) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        this.loadSection(section, params);
    }

    renderLayout() {
        // Render Sidebar
        const sidebarPlaceholder = document.getElementById('sidebar-container');
        if (sidebarPlaceholder) {
            sidebarPlaceholder.innerHTML = Sidebar.render();
        }

        // Render Header
        const headerPlaceholder = document.getElementById('header-container');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = Header.render();
        }

        // Add Logout Listener - Support multiple logout buttons
        const logoutBtns = document.querySelectorAll('[id="logout-btn"], .logout-icon-btn, [data-logout]');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.logout();
            });
        });
    }

    logout() {
        console.log('🔓 Logging out...');
        sessionStorage.clear();
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminRememberMe');
        window.location.href = 'login.html';
    }

    setupNavigation() {
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const page = navItem.dataset.page;
                window.location.hash = page;
                this.closeMobileMenu();
            }
        });
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const overlay = document.getElementById('sidebar-overlay');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open');
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }

    loadSection(sectionName, params = []) {
        const contentContainer = document.getElementById('content-container');
        if (!contentContainer) return;

        // Store current params globally so sections can access them if needed during afterRender
        this.currentParams = params;

        let ComponentClass = null;

        switch (sectionName) {
            case 'knowledge':
                ComponentClass = KnowledgeBase;
                break;
            case 'conversations':
                ComponentClass = Conversations;
                break;
            case 'dashboard':
                contentContainer.innerHTML = '<div class="p-8"><h2 class="text-2xl font-bold">Dashboard</h2><p class="mt-4 text-gray-600">Analytics overview coming soon.</p></div>';
                return;
            case 'escalations':
                ComponentClass = Escalations;
                break;
            default:
                console.warn(`Section ${sectionName} not found`);
                return;
        }

        if (ComponentClass) {
            contentContainer.innerHTML = ComponentClass.render();
            if (typeof ComponentClass.afterRender === 'function') {
                ComponentClass.afterRender();
            }
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AdminApp();
});