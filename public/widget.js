/**
 * AI Chatbot Widget - Embedded Chat Interface
 * Injected via <script src="https://yourserver.com/widget.js"></script>
 * 
 * Phase 1: Basic UI with dummy responses
 * Phase 2: Add RAG-powered answers
 * Phase 3: Add escalation tracking
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    apiUrl: window.CHATBOT_CONFIG?.apiUrl || 'http://localhost:3000',
    widgetId: 'ai-chatbot-widget',
    sessionId: generateSessionId(),
  };

  // ============================================
  // SESSION ID GENERATOR
  // ============================================
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ============================================
  // CREATE & INJECT WIDGET
  // ============================================
  function initChatbot() {
    // Check if widget already exists
    if (document.getElementById(CONFIG.widgetId)) return;

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = CONFIG.widgetId;
    widgetContainer.innerHTML = getWidgetHTML();
    document.body.appendChild(widgetContainer);

    // Inject styles
    injectStyles();

    // Attach event listeners
    attachEventListeners();
  }

  // ============================================
  // WIDGET HTML TEMPLATE
  // ============================================
  function getWidgetHTML() {
    return `
      <div class="chatbot-bubble" id="chatbot-bubble">
        <button class="chatbot-toggle" id="chatbot-toggle" title="Chat with us">
          <span class="chatbot-icon">💬</span>
          <span class="chatbot-badge" id="chatbot-badge" style="display: none;">1</span>
        </button>
      </div>

      <div class="chatbot-window" id="chatbot-window" style="display: none;">
        <div class="chatbot-header">
          <h3>Chat with us</h3>
          <button class="chatbot-close" id="chatbot-close" title="Close">✕</button>
        </div>

        <div class="chatbot-messages" id="chatbot-messages">
          <div class="chatbot-message bot-message">
            <p>Hi! 👋 How can I help you today?</p>
          </div>
        </div>

        <div class="chatbot-input-area">
          <input 
            type="text" 
            id="chatbot-input" 
            placeholder="Ask a question..."
            class="chatbot-input"
          />
          <button id="chatbot-send" class="chatbot-send-btn" title="Send">
            ➤
          </button>
        </div>

        <div class="chatbot-footer">
          <p>Phase 1: Demo chatbot. Powered by AI.</p>
        </div>
      </div>
    `;
  }

  // ============================================
  // INJECT STYLES
  // ============================================
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Theme Colors */
      :root {
        --primary: #CA9D2B;
        --dark: #151C28;
        --light: #f8f9fa;
        --text: #212529;
        --text-light: #6c757d;
        --border: #e9ecef;
      }

      #ai-chatbot-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
        z-index: 9999;
      }

      .chatbot-bubble {
        position: relative;
      }

      .chatbot-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #CA9D2B 0%, #151C28 100%);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(202, 157, 43, 0.3);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .chatbot-toggle:hover {
        transform: scale(1.15) rotate(5deg);
        box-shadow: 0 8px 28px rgba(202, 157, 43, 0.4);
      }

      .chatbot-toggle:active {
        transform: scale(0.95);
      }

      .chatbot-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #d32f2f;
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        font-size: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(211, 47, 47, 0.3);
      }

      .chatbot-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 400px;
        height: 550px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 48px rgba(21, 28, 40, 0.2);
        display: flex;
        flex-direction: column;
        animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid rgba(202, 157, 43, 0.1);
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .chatbot-header {
        background: linear-gradient(135deg, #151C28 0%, #1a2332 100%);
        color: white;
        padding: 20px;
        border-radius: 16px 16px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 3px solid #CA9D2B;
      }

      .chatbot-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }

      .chatbot-close {
        background: none;
        border: none;
        color: white;
        font-size: 22px;
        cursor: pointer;
        padding: 0;
        transition: all 0.2s;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
      }

      .chatbot-close:hover {
        background: rgba(202, 157, 43, 0.2);
      }

      .chatbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #fafbfc;
      }

      .chatbot-messages::-webkit-scrollbar {
        width: 6px;
      }

      .chatbot-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .chatbot-messages::-webkit-scrollbar-thumb {
        background: #CA9D2B;
        border-radius: 3px;
      }

      .chatbot-messages::-webkit-scrollbar-thumb:hover {
        background: #151C28;
      }

      .chatbot-message {
        display: flex;
        margin-bottom: 4px;
      }

      .chatbot-message p {
        margin: 0;
        padding: 12px 14px;
        border-radius: 10px;
        line-height: 1.5;
        font-size: 13px;
        max-width: 85%;
        word-wrap: break-word;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      }

      .bot-message {
        justify-content: flex-start;
      }

      .bot-message p {
        background: white;
        color: #151C28;
        border: 1px solid #e9ecef;
      }

      .user-message {
        justify-content: flex-end;
      }

      .user-message p {
        background: linear-gradient(135deg, #CA9D2B 0%, #b88621 100%);
        color: white;
        border: none;
      }

      .chatbot-input-area {
        display: flex;
        gap: 10px;
        padding: 14px;
        border-top: 1px solid #e9ecef;
        background: white;
        border-radius: 0 0 16px 16px;
      }

      .chatbot-input {
        flex: 1;
        padding: 12px 14px;
        border: 1.5px solid #e9ecef;
        border-radius: 8px;
        font-size: 13px;
        outline: none;
        transition: all 0.2s;
        background: white;
        color: #151C28;
      }

      .chatbot-input::placeholder {
        color: #adb5bd;
      }

      .chatbot-input:focus {
        border-color: #CA9D2B;
        box-shadow: 0 0 0 3px rgba(202, 157, 43, 0.1);
      }

      .chatbot-send-btn {
        background: linear-gradient(135deg, #CA9D2B 0%, #b88621 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chatbot-send-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(202, 157, 43, 0.3);
      }

      .chatbot-send-btn:active {
        transform: translateY(0);
      }

      .chatbot-footer {
        text-align: center;
        padding: 10px;
        font-size: 11px;
        color: #adb5bd;
        background: #f8f9fa;
        border-top: 1px solid #e9ecef;
      }

      .typing-indicator {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .typing-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #CA9D2B;
        animation: typing 1.4s infinite;
      }

      .typing-dot:nth-child(1) {
        animation-delay: 0s;
      }

      .typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%, 60%, 100% {
          opacity: 0.5;
          transform: translateY(0);
        }
        30% {
          opacity: 1;
          transform: translateY(-10px);
        }
      }

      /* Responsive */
      @media (max-width: 480px) {
        .chatbot-window {
          width: 100vw;
          height: 100vh;
          bottom: 0;
          right: 0;
          border-radius: 0;
        }

        .chatbot-messages {
          padding: 12px;
        }

        .chatbot-message p {
          max-width: 90%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================
  function attachEventListeners() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chatbot-send');
    const input = document.getElementById('chatbot-input');
    const window_ = document.getElementById('chatbot-window');

    // Toggle window
    toggleBtn.addEventListener('click', () => {
      const isVisible = window_.style.display !== 'none';
      window_.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) input.focus();
    });

    // Close window
    closeBtn.addEventListener('click', () => {
      window_.style.display = 'none';
    });

    // Send message
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // ============================================
  // SEND MESSAGE TO BACKEND
  // ============================================
  function sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to UI
    addMessageToUI(message, 'user');
    input.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Send to backend
    fetch(`${CONFIG.apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        sessionId: CONFIG.sessionId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        removeTypingIndicator();
        addMessageToUI(data.answer, 'bot', data);
      })
      .catch((err) => {
        console.error('Chat error:', err);
        removeTypingIndicator();
        addMessageToUI('Sorry, something went wrong. Please try again.', 'bot');
      });
  }

  // ============================================
  // UI HELPERS
  // ============================================
  function addMessageToUI(text, role, data = {}) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${role}-message`;

    const p = document.createElement('p');
    p.textContent = text;
    messageDiv.appendChild(p);

    // TODO: Phase 2 - Show sources
    if (data.sources && data.sources.length > 0) {
      const sourcesDiv = document.createElement('div');
      sourcesDiv.className = 'chatbot-sources';
      sourcesDiv.innerHTML = '<small>Sources: ' + data.sources.join(', ') + '</small>';
      messageDiv.appendChild(sourcesDiv);
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const indicator = document.createElement('div');
    indicator.className = 'chatbot-message bot-message typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = '<p>⏳ Thinking...</p>';
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  // ============================================
  // INITIALIZE ON DOM READY
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }

  // Expose API for external control
  window.ChatbotAPI = {
    open: () => {
      document.getElementById('chatbot-window').style.display = 'flex';
    },
    close: () => {
      document.getElementById('chatbot-window').style.display = 'none';
    },
    sendMessage: (msg) => {
      document.getElementById('chatbot-input').value = msg;
      sendMessage();
    },
  };
})();
