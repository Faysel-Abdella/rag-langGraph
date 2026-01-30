class Conversations {
   static allConversations = [];
   static selectedIds = new Set();
   static currentConversationId = null;
   static render() {
      return `
      <div class="flex h-[calc(100vh-70px)] bg-white responsive-conversations-container">
        <!-- Messages Sidebar (Left) -->
        <div class="w-[380px] flex flex-col border-r border-gray-100 flex-shrink-0 responsive-conversations-list">
          <div class="p-8 pb-4">
            <h2 class="text-[20px] font-bold text-gray-900 tracking-tight mb-4">Messages</h2>
            
            <!-- Filter Controls -->
            <div class="flex flex-col gap-3 mb-2">
               <div class="relative">
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <circle cx="11" cy="11" r="8"></circle>
                     <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input type="text" id="conv-search" placeholder="Search sessions..." class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#E5A000] transition-all">
               </div>
               <div class="relative">
                  <input type="date" id="conv-date-filter" class="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#E5A000] transition-all text-gray-600">
               </div>
               <div class="flex items-center gap-2">
                  <button id="conv-delete-selected" class="px-3 py-1 rounded-md text-sm text-red-600 border border-red-200 hover:bg-red-50">Delete Selected</button>
                  <button id="conv-delete-all" class="px-3 py-1 rounded-md text-sm text-red-600 border border-red-200 hover:bg-red-50">Delete All</button>
               </div>
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto pl-4 space-y-2 pr-0" id="conversations-list">
            <!-- Conversations will be loaded here by JavaScript -->
            <div class="p-4 text-center text-gray-400 text-sm">Loading conversations...</div>
          </div>
        </div>

        <!-- Chat Area (Right) -->
            <div class="flex-1 flex flex-col min-w-0 bg-white responsive-conversation-chat">
               <!-- Mobile header (Back button + Title) -->
               <div class="conversation-mobile-header" style="display:none; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #E2E8F0; background: #fff; position: sticky; top: 0; z-index: 20;">
                  <button class="back-to-list-btn" aria-label="Back to list" style="background:transparent;border:none;font-size:18px;cursor:pointer;padding:6px;">&larr;</button>
                  <h3 class="conversation-title" style="margin:0;font-size:16px;font-weight:600;">Select a conversation</h3>
                  <div style="width:32px;"></div>
               </div>
               
               <!-- Messages Feed (Empty State Initially) -->
               <div class="flex-1 overflow-y-auto p-8 space-y-8" id="conversation-messages">
                  <div class="flex items-center justify-center h-full text-center">
                     <div>
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p class="text-gray-400 text-[14px]">Select a conversation to view messages</p>
                     </div>
                  </div>
               </div>

               <!-- Bottom Action -->
               <div id="join-bar-container" class="join-conversation-bar p-8 border-t border-gray-100 hidden">
                   <button class="w-full bg-[#E5A000] hover:bg-[#D49000] text-white font-bold py-4 rounded-xl shadow-sm transition-all text-[15px]" id="join-conversation-btn" style="display: none;">
                      Join Conversation
                   </button>
               </div>
        </div>
        
        <style>
           .conversation-item.active {
               background-color: #f3f4f6 !important;
               border-left: 4px solid #E5A000 !important;
           }
           @media (max-width: 768px) {
              .responsive-conversation-chat {
                 max-height: 100vh !important;
                 height: calc(100vh - 70px) !important;
                 position: fixed !important;
                 top: 70px !important;
                 left: 0 !important;
                 right: 0 !important;
                 bottom: 0 !important;
                 z-index: 50 !important;
              }
              .responsive-conversations-list {
                 max-height: none !important;
              }
           }
        </style>
      </div>
    `;
   }

   static afterRender() {
      this.allConversations = [];
      this.loadConversations();
      this.setupFilterListeners();
   }

   static async loadConversations() {
      try {
         console.log('📊 Fetching conversations from API...');
         const data = await window.apiService.adminGetConversations(1, 50);

         if (data && (data.success || Array.isArray(data.conversations))) {
            this.allConversations = data.conversations || [];
               this.selectedIds.clear();
               this.renderConversationList(this.allConversations);

            // Handle deep linking to a specific session
            if (window.app && window.app.currentParams && window.app.currentParams[0]) {
               const sessionId = window.app.currentParams[0];
               console.log(`🔗 Deep linking to session: ${sessionId}`);

               // Try to find and click the session in the list
               setTimeout(() => {
                  const item = document.querySelector(`.conversation-item[data-conversation-id="${sessionId}"]`);
                  if (item) {
                     item.click();
                  } else {
                     console.warn(`Session ${sessionId} not found in the first 50 items`);
                     // Fallback: manually trigger load for this specific ID if needed
                     this.loadConversationMessages(sessionId);
                  }
               }, 300);
            }
         } else {
            const list = document.getElementById('conversations-list');
            if (list) {
               list.innerHTML = '<div class="p-4 text-center text-gray-400 text-sm">No conversations found</div>';
            }
         }
      } catch (error) {
         console.error('❌ Failed to load conversations:', error);
         const list = document.getElementById('conversations-list');
         if (list) {
            list.innerHTML = '<div class="p-4 text-center text-red-500 text-sm">Failed to load conversations</div>';
         }
         this.showToast('Failed to load conversations', 'error');
      }
   }

   static setupFilterListeners() {
      const searchInput = document.getElementById('conv-search');
      const dateInput = document.getElementById('conv-date-filter');

      if (searchInput) {
         searchInput.addEventListener('input', () => this.filterConversations());
      }
      if (dateInput) {
         dateInput.addEventListener('change', () => this.filterConversations());
      }
   }

   static filterConversations() {
      const searchInput = document.getElementById('conv-search');
      const dateInput = document.getElementById('conv-date-filter');

      const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
      const dateTerm = dateInput ? dateInput.value : '';

      const filtered = this.allConversations.filter(conv => {
         const matchesSearch = conv.id.toLowerCase().includes(searchTerm) ||
            (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchTerm));

         let matchesDate = true;
         if (dateTerm) {
            let startTime;
            if (conv.startedAt && typeof conv.startedAt === 'object' && conv.startedAt._seconds) {
               startTime = new Date(conv.startedAt._seconds * 1000);
            } else if (conv.startedAt && typeof conv.startedAt === 'string') {
               startTime = new Date(conv.startedAt);
            } else {
               startTime = new Date(conv.startedAt || Date.now());
            }
            const convDate = startTime.toISOString().split('T')[0];
            matchesDate = convDate === dateTerm;
         }

         return matchesSearch && matchesDate;
      });

      this.renderConversationList(filtered);
   }

   static renderConversationList(conversations) {
      const container = document.getElementById('conversations-list');
      if (!container) return;

      if (conversations.length === 0) {
         container.innerHTML = '<div class="p-4 text-center text-gray-400 text-sm">No sessions matching filters</div>';
         return;
      }

      const html = conversations.map((conv, idx) => {
         let startTime;
         if (conv.startedAt && typeof conv.startedAt === 'object' && conv.startedAt._seconds) {
            startTime = new Date(conv.startedAt._seconds * 1000);
         } else if (conv.startedAt && typeof conv.startedAt === 'string') {
            startTime = new Date(conv.startedAt);
         } else {
            startTime = new Date();
         }

         const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         const dateShort = startTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
         const statusIndicator = conv.status === 'active' ? 'bg-[#27ae60]' : conv.status === 'escalated' ? 'bg-[#E5A000]' : 'bg-gray-300';

         // Priority: 1. Manual Title, 2. Created at timestamp, 3. ID segment
         let title = conv.title;
         if (!title || title === `Visitor ${conv.id.substring(0, 4)}`) {
            title = `Chat - ${dateShort} at ${timeStr}`;
         }

         const avatarUrl = conv.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.id}`;

         return `
            <div class="group flex items-start gap-4 p-4 rounded-l-2xl rounded-r-none hover:bg-gray-50 cursor-pointer border-transparent transition-all relative overflow-hidden mr-0 conversation-item" data-conversation-id="${conv.id}">
               <input type="checkbox" class="conv-row-checkbox mr-3" data-id="${conv.id}" ${this.selectedIds.has(String(conv.id)) ? 'checked' : ''}>
               <div class="relative">
                 <div class="w-11 h-11 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden shrink-0">
                    <img src="${avatarUrl}" alt="${title}" class="w-full h-full object-cover">
                 </div>
                 <div class="absolute bottom-0 right-0 w-3 h-3 ${statusIndicator} rounded-full border-2 border-white"></div>
               </div>
               <div class="flex-1 min-w-0 pr-4">
                 <div class="flex justify-between items-baseline mb-0.5">
                   <h3 class="text-[14px] font-bold text-gray-900 truncate pr-2">${this.escapeHtml(title)}</h3>
                   <span class="text-[11px] text-gray-500 font-medium shrink-0">${timeStr}</span>
                 </div>
                 <p class="text-[13px] text-gray-500 truncate leading-relaxed">${this.escapeHtml(conv.lastMessage || (conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].content : 'No messages'))}</p>
               </div>
            </div>
         `;
      }).join('');

      container.innerHTML = html;
      this.setupConversationListeners();
   }

   static setupConversationListeners() {
      const conversationItems = document.querySelectorAll('.conversation-item');
      const conversationList = document.querySelector('.responsive-conversations-list');
      const conversationChat = document.querySelector('.responsive-conversation-chat');
      const mobileHeader = document.querySelector('.conversation-mobile-header');
      const sidebar = document.querySelector('.sidebar');
      const backBtn = mobileHeader && mobileHeader.querySelector('.back-to-list-btn');

      // Helper to detect mobile at action time
      const isMobile = () => window.innerWidth <= 768;

      conversationItems.forEach(item => {
         item.addEventListener('click', async () => {
            conversationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Get conversation ID
            const conversationId = item.dataset.conversationId;
            const h3 = item.querySelector('h3');
            const titleText = h3 ? h3.textContent : 'Conversation';

            // Update mobile header title
            const titleEl = document.querySelector('.conversation-title');
            if (titleEl) titleEl.textContent = titleText;

            // Load conversation messages
            this.currentConversationId = conversationId;
            await this.loadConversationMessages(conversationId);

            if (isMobile()) {
               conversationList.classList.add('hidden');
               conversationChat.classList.add('show');
               if (mobileHeader) mobileHeader.style.display = 'flex';
               if (sidebar) sidebar.style.display = 'none';
            }
         });
      });

      if (backBtn) {
         backBtn.addEventListener('click', () => {
            if (isMobile()) {
               conversationList.classList.remove('hidden');
               conversationChat.classList.remove('show');
               if (mobileHeader) mobileHeader.style.display = 'none';
               if (sidebar) sidebar.style.display = 'flex';
            }
         });
      }

      // Handle window resize: reset to desktop layout when leaving mobil
      window.addEventListener('resize', () => {
         if (!isMobile()) {
            conversationList.classList.remove('hidden');
            conversationChat.classList.remove('show');
            if (mobileHeader) mobileHeader.style.display = 'none';
            if (sidebar) sidebar.style.display = 'flex';
         }
      });

         // Selection handlers
         const deleteSelectedBtn = document.getElementById('conv-delete-selected');
         const deleteAllBtn = document.getElementById('conv-delete-all');

         document.querySelectorAll('.conv-row-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
               const id = cb.dataset.id;
               if (cb.checked) this.selectedIds.add(id);
               else this.selectedIds.delete(id);
            });
         });

         if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', async () => {
               if (this.selectedIds.size === 0) return;
               const ok = await this.showConfirm(`Delete ${this.selectedIds.size} selected conversations?`);
               if (!ok) return;
               await this.deleteSelected();
            });
         }

         if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', async () => {
               const ok = await this.showConfirm('Delete ALL conversations? This action cannot be undone.');
               if (!ok) return;
               await this.deleteAll();
            });
         }

         // Right-click context menu for delete
         conversationItems.forEach(item => {
            item.addEventListener('contextmenu', async (e) => {
               e.preventDefault();
               const sessionId = item.dataset.conversationId;
               // Show simple native confirm for now
               const ok = await this.showConfirm('Delete this conversation?');
               if (ok) {
                  await this.deleteConversation(sessionId);
                  await this.loadConversations();
               }
            });
         });
   }

   static async loadConversationMessages(conversationId) {
      const messagesContainer = document.getElementById('conversation-messages');

      try {
         // Show loading state
         messagesContainer.innerHTML = `
            <div class="flex items-center justify-center h-full">
               <div class="text-center">
                  <div class="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-[#E5A000] rounded-full mb-2"></div>
                  <p class="text-gray-400 text-[14px]">Loading messages...</p>
               </div>
            </div>
         `;

         // Fetch conversation messages from APi
         const messages = await window.apiService.getConversationMessages(conversationId);

         if (!messages || messages.length === 0) {
            messagesContainer.innerHTML = `
               <div class="flex items-center justify-center h-full">
                  <p class="text-gray-400 text-[14px]">No messages in this conversation</p>
               </div>
            `;
            return;
         }

         // Render messages
         this.renderMessages(messages);
      } catch (error) {
         console.error('Failed to load messages:', error);
         messagesContainer.innerHTML = `
            <div class="flex items-center justify-center h-full text-center">
               <div>
                  <p class="text-red-500 text-[14px]">Failed to load messages</p>
               </div>
            </div>
         `;
      }
   }

   static async fetchConversationMessages(conversationId) {
      try {
         // Use the standard getConversationMessages method
         const response = await window.apiService.getConversationMessages(conversationId);
         return Array.isArray(response) ? response : [];
      } catch (error) {
         console.error('API Error:', error);
         return [];
      }
   }

   static renderMessages(messages) {
      const messagesContainer = document.getElementById('conversation-messages');
      const currentConv = this.allConversations.find(c => c.id === this.currentConversationId);
      const userAvatar = currentConv ? (currentConv.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.currentConversationId}`) : `https://api.dicebear.com/7.x/avataaars/svg?seed=default`;

      const html = messages.map(msg => {
         const timestamp = new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
         });

         if (msg.sender === 'user') {
            return `
               <div class="flex justify-end gap-4 mb-8">
                  <div class="flex-1 flex flex-col items-end">
                     <div class="bg-gray-100 rounded-2xl rounded-tr-sm px-6 py-4 max-w-[90%]">
                        <p class="text-[15px] text-gray-800 leading-relaxed font-medium">${this.escapeHtml(msg.content)}</p>
                        <p class="text-[11px] text-gray-500 mt-1">${timestamp}</p>
                     </div>
                  </div>
                  <div class="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                     <img src="${userAvatar}" alt="User" class="w-full h-full object-cover">
                  </div>
               </div>
            `;
         } else {
            return `
               <div class="flex gap-4 max-w-[90%] mb-8">
                  <div class="w-10 h-10 rounded-full bg-[#E5A000] flex items-center justify-center flex-shrink-0 text-white shadow-sm overflow-hidden">
                     <img src="../image/vectorized (7) 2.png" alt="AI Agent" class="w-full h-full object-cover">
                  </div>
                  <div class="flex-1">
                     <div class="flex items-center gap-3 mb-2">
                        <span class="text-[14px] font-bold text-gray-900">AI Agent</span>
                        <span class="text-[12px] text-gray-400 font-medium">${timestamp}</span>
                     </div>
                     <div class="border border-gray-100 rounded-2xl rounded-tl-sm p-6 shadow-sm">
                        <p class="text-[15px] text-gray-700 leading-relaxed">${this.escapeHtml(msg.content)}</p>
                     </div>
                  </div>
               </div>
            `;
         }
      }).join('');

      messagesContainer.innerHTML = html;
      // Auto-scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
   }

   static escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
   }

     // Simple confirm modal that returns a promise
     static showConfirm(message) {
        return new Promise((resolve) => {
           const overlay = document.createElement('div');
           overlay.className = 'fixed inset-0 bg-black/40 z-[300] flex items-center justify-center';

           const modal = document.createElement('div');
           modal.className = 'bg-white rounded-lg p-6 w-[420px] shadow-lg text-center';
           modal.innerHTML = `
              <p class="text-gray-800 mb-4">${this.escapeHtml(message)}</p>
              <div class="flex items-center justify-center gap-4">
                 <button class="px-4 py-2 rounded-md bg-gray-100" id="confirm-cancel">Cancel</button>
                 <button class="px-4 py-2 rounded-md bg-red-600 text-white" id="confirm-ok">Delete</button>
              </div>
           `;

           overlay.appendChild(modal);
           document.body.appendChild(overlay);

           const cleanup = (result) => {
              overlay.remove();
              resolve(result);
           };

           modal.querySelector('#confirm-cancel').addEventListener('click', () => cleanup(false));
           modal.querySelector('#confirm-ok').addEventListener('click', () => cleanup(true));
        });
     }

     static async deleteConversation(sessionId) {
        try {
           const res = await fetch(`/api/conversations/${sessionId}`, { method: 'DELETE' });
           const result = await res.json();
           if (result.success) {
              this.showToast('Conversation deleted', 'success');
              await this.loadConversations();
           } else {
              this.showToast(result.error || 'Failed to delete conversation', 'error');
           }
        } catch (err) {
           console.error('Failed to delete conversation:', err);
           this.showToast('Failed to delete conversation', 'error');
        }
     }

     static async deleteSelected() {
        try {
           const ids = Array.from(this.selectedIds);
           const res = await fetch('/api/conversations/batch-delete', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids })
           });
           const result = await res.json();
           if (result.success) {
              this.selectedIds.clear();
              await this.loadConversations();
              this.showToast(result.message || `Deleted ${ids.length} conversations`, 'success');
           } else {
              this.showToast(result.error || 'Failed to delete selected conversations', 'error');
           }
      } catch (err) { console.error('Failed to delete selected conversations:', err); this.showToast('Failed to delete selected conversations', 'error'); }
     }

     static async deleteAll() {
        try {
           const res = await fetch('/api/conversations', { method: 'DELETE' });
           const result = await res.json();
           if (result.success) {
              this.selectedIds.clear();
              await this.loadConversations();
              this.showToast(result.message || 'All conversations deleted', 'success');
           } else {
              this.showToast(result.error || 'Failed to delete all conversations', 'error');
           }
      } catch (err) { console.error('Failed to delete all conversations:', err); this.showToast('Failed to delete all conversations', 'error'); }
     }

     static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-[200] transition-all duration-300 transform translate-y-[-20px] opacity-0 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
           toast.classList.remove('translate-y-[-20px]', 'opacity-0');
        }, 10);

        // Remove after 3s
        setTimeout(() => {
           toast.classList.add('translate-y-[-20px]', 'opacity-0');
           setTimeout(() => toast.remove(), 300);
        }, 3000);
     }
}
