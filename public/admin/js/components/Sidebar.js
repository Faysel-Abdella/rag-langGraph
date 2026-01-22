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
            
            <a href="#" data-page="knowledge" class="nav-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2C7.58172 2 4 3.79086 4 6C4 8.20914 7.58172 10 12 10C16.4183 10 20 8.20914 20 6C20 3.79086 16.4183 2 12 2Z" />
                <path d="M20 12C20 14.2091 16.4183 16 12 16C7.58172 16 4 14.2091 4 12" />
                <path d="M20 18C20 20.2091 16.4183 22 12 22C7.58172 22 4 20.2091 4 18M4 6V18M20 6V18" />
              </svg>
              <span>Knowledge Base</span>
            </a>

            <a href="#" data-page="conversations" class="nav-item active">
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
