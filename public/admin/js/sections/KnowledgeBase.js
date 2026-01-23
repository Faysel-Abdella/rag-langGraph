class KnowledgeBase {
   static render() {
      return `
      <div class="px-8 py-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
           <div class="flex items-center gap-3">
             <h1 class="text-[24px] font-bold text-[#1E293B]">Knowledge Base</h1>
             <span class="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md text-[13px] font-medium" id="kb-count">0</span>
           </div>
           <button id="add-knowledge-btn" class="flex items-center gap-2 bg-[#E5A000] hover:bg-[#D49000] text-white px-5 py-2.5 rounded-lg font-semibold transition-all text-[14px]">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M12 5v14M5 12h14"/>
             </svg>
             Add Knowledge
           </button>
        </div>

        <!-- Controls -->
        <div class="flex justify-between items-center gap-4 mb-6">
           <!-- Search Input -->
           <div class="relative flex-1">
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search by Name, or Key words" class="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[14px] placeholder-gray-400" id="kb-search">
           </div>
           
           <!-- Sort Button -->
           <button class="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-[14px] font-medium transition-colors whitespace-nowrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <line x1="21" y1="10" x2="3" y2="10"></line>
                 <line x1="21" y1="6" x2="3" y2="6"></line>
                 <line x1="21" y1="14" x2="3" y2="14"></line>
                 <line x1="21" y1="18" x2="3" y2="18"></line>
              </svg>
              Sort by
           </button>
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
           <table class="w-full">
              <thead class="bg-gray-50/50 border-b border-gray-100">
                 <tr>
                    <th class="w-16 p-5 text-center">
                       <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer">
                    </th>
                    <th class="text-left py-5 px-2 text-[13px] font-semibold text-gray-500">Name</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Type</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Size</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Last Updated</th>
                    <th class="w-16 p-5"></th>
                 </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="kb-table-body">
                 <tr><td colspan="6" class="p-4 text-center text-gray-400 text-sm">Loading...</td></tr>
              </tbody>
           </table>
        </div>

        <!-- Pagination -->
        <div class="flex justify-between items-center text-[13px] font-medium text-gray-600 px-2 mt-4">
           <div class="flex items-center gap-3">
              <span id="kb-page-info">Page 1 of 1</span>
              <div class="relative">
                 <select class="appearance-none bg-white border border-gray-200 rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-gray-300 cursor-pointer text-gray-700 text-[13px]">
                    <option>8</option>
                    <option>16</option>
                    <option>24</option>
                 </select>
                 <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                 </svg>
              </div>
           </div>
           
           <div class="flex items-center gap-4">
              <span id="kb-page-info2">Page 1 of 1</span>
              <div class="flex items-center gap-1">
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                 </button>
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><polyline points="15 18 9 12 15 6"></polyline></svg>
                 </button>
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                 </button>
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                 </button>
              </div>
           </div>
        </div>

        ${this.renderModalPlaceholder()}
      </div>
    `;
   }

   static renderRows(data = []) {
      if (data.length === 0) {
         return '<tr><td colspan="6" class="p-4 text-center text-gray-400 text-sm">No documents found</td></tr>';
      }

      return data.map(row => `
      <tr class="group hover:bg-gray-50/50 transition-colors">
        <td class="p-5 text-center">
           <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity">
        </td>
        <td class="py-5 px-2">
           <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
             </div>
             <span class="text-[15px] font-semibold text-gray-700">${this.escapeHtml(row.name)}</span>
           </div>
        </td>
        <td class="py-5 px-4 text-[14px] text-gray-600 font-medium">${this.escapeHtml(row.type || '-')}</td>
        <td class="py-5 px-4 text-[14px] text-gray-600 font-medium">${this.escapeHtml(row.size || '-')}</td>
        <td class="py-5 px-4 text-[14px] text-gray-500">${this.formatDate(row.date)}</td>
        <td class="p-5 text-center">
           <button class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <circle cx="12" cy="12" r="1"></circle>
                 <circle cx="12" cy="5" r="1"></circle>
                 <circle cx="12" cy="19" r="1"></circle>
              </svg>
           </button>
        </td>
      </tr>
    `).join('');
   }

   static escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
   }

   static formatDate(dateStr) {
      if (!dateStr) return '-';
      try {
         const date = new Date(dateStr);
         return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
         });
      } catch {
         return dateStr;
      }
   }

   static renderModalPlaceholder() {
      return `<!-- Modal Portal Placeholder -->`;
   }

   static async loadDocuments() {
      try {
         // For now, we'll use dummy data structure
         // This will be replaced with real API call when backend is ready
         const documents = [];
         
         // Update UI
         document.getElementById('kb-count').textContent = documents.length;
         document.getElementById('kb-table-body').innerHTML = this.renderRows(documents);
         document.getElementById('kb-page-info').textContent = `Page 1 of ${Math.ceil(documents.length / 8) || 1}`;
         document.getElementById('kb-page-info2').textContent = `Page 1 of ${Math.ceil(documents.length / 8) || 1}`;
      } catch (error) {
         console.error('Failed to load documents:', error);
         document.getElementById('kb-table-body').innerHTML = 
            '<tr><td colspan="6" class="p-4 text-center text-red-500 text-sm">Failed to load documents</td></tr>';
      }
   }

   static afterRender() {
      // Load documents
      this.loadDocuments();
      
      // Inject Modal into Body to ensure it covers everything including sidebar
      const modalHtml = `
      <div id="add-modal" class="fixed inset-0 z-[100] hidden transition-opacity duration-300 opacity-0" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div id="modal-backdrop" class="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"></div>

        <div class="absolute inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            
            <div id="modal-panel" class="relative transform overflow-hidden rounded-[24px] bg-white text-left shadow-2xl transition-all w-full max-w-[600px] scale-95 opacity-0 duration-300 p-8">
              
              <!-- Close Button (Absolute) -->
              <button id="modal-close-btn" class="absolute right-8 top-8 text-gray-400 hover:text-gray-600 transition-colors z-20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <!-- View 1: Selection -->
              <div id="modal-view-selection">
                 <!-- Header -->
                 <div class="mb-6">
                    <h3 class="text-[20px] font-bold text-gray-900 mb-1">Add knowledge</h3>
                    <p class="text-[14px] text-gray-500">Choose how you want to provide the AI with knowledge.</p>
                 </div>

                 <!-- Large Upload Area -->
                 <div class="border border-dashed border-gray-300 rounded-2xl py-10 px-8 mb-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-gray-400">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                         <path d="M12 16.5V7.5m0 0l-4 4m4-4l4 4"/>
                         <path d="M20.4 14.5c.8.6 1.6 1.7 1.6 3 0 1.7-1.3 3-3 3H5c-1.7 0-3-1.3-3-3 0-1.2.6-2.3 1.5-2.8"/>
                       </svg>
                    </div>
                    <p class="text-[14px] font-medium text-gray-900 mb-1"><span class="font-bold">Click to upload</span> or drag and drop</p>
                    <p class="text-[12px] text-gray-500">CSV, PDF, DOCx Formats</p>
                 </div>

                 <!-- Option List -->
                 <div class="space-y-3">
                    <!-- Manual Option (Active Style) -->
                    <button id="btn-add-manual" class="w-full flex items-center gap-4 p-4 rounded-xl border border-black hover:bg-gray-50 transition-all text-left group bg-white shadow-sm">
                       <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-gray-700 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                          </svg>
                       </div>
                       <div>
                          <p class="text-[14px] font-bold text-gray-900">Add manually</p>
                          <p class="text-[12px] text-gray-500">Manually write your own specific Q&A</p>
                       </div>
                    </button>

                    <!-- CSV Option -->
                     <button class="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group">
                       <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-gray-700 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                             <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                             <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                             <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                          </svg>
                       </div>
                       <div>
                          <p class="text-[14px] font-bold text-gray-900">Import from .CSV file</p>
                          <p class="text-[12px] text-gray-500">Add multiple Q&As from .CSV file at once.</p>
                       </div>
                    </button>

                    <!-- PDF/DOCX Option -->
                     <button class="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group">
                       <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-gray-700 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                       </div>
                       <div>
                          <p class="text-[14px] font-bold text-gray-900">Import .PDF, .DOCX files</p>
                          <p class="text-[12px] text-gray-500">Add pdf and .docx file to Provide Q&A's</p>
                       </div>
                    </button>
                 </div>
              </div>

              <!-- View 2: Manual Entry -->
              <div id="modal-view-manual" class="hidden">
                 <!-- Header with Icon -->
                 <div class="mb-6">
                    <div class="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center mb-4 text-gray-600">
                                    <img src="../image/flag-05.svg" alt="flag" width="24" height="24">
                       </svg>
                    </div>
                    <h3 class="text-[20px] font-bold text-gray-900 mb-1">Add Knowledge Manually</h3>
                    <p class="text-[14px] text-gray-500">Add the question and answer in the provided text fields.</p>
                 </div>

                 <div class="space-y-5">
                    <div>
                       <label class="block text-[13px] font-semibold text-gray-700 mb-2">Question*</label>
                       <input type="text" placeholder="What is your Question?" class="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[15px] placeholder-gray-400">
                    </div>

                    <div>
                       <label class="block text-[13px] font-semibold text-gray-700 mb-2">Description*</label>
                       <textarea rows="5" placeholder="write your answer for the question here...." class="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[15px] placeholder-gray-400 resize-none"></textarea>
                    </div>
                 </div>

                 <div class="flex items-center gap-4 mt-8">
                    <button id="btn-manual-cancel" class="flex-1 py-3.5 rounded-full border border-gray-200 text-[15px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                       Cancel
                    </button>
                    <button class="flex-1 py-3.5 rounded-full text-[15px] font-bold text-white bg-[#E5A000] hover:bg-[#D49000] shadow-sm transition-all shadow-[#E5A000]/20">
                       Confirm
                    </button>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;

      // Remove existing modal if any
      const existingModal = document.getElementById('add-modal');
      if (existingModal) existingModal.remove();

      // Append to body
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      const modal = document.getElementById('add-modal');
      const modalPanel = document.getElementById('modal-panel');
      const openBtn = document.getElementById('add-knowledge-btn');
      const closeBtn = document.getElementById('modal-close-btn');
      const backdrop = document.getElementById('modal-backdrop');

      // Views
      const viewSelection = document.getElementById('modal-view-selection');
      const viewManual = document.getElementById('modal-view-manual');
      const btnAddManual = document.getElementById('btn-add-manual');
      const btnManualCancel = document.getElementById('btn-manual-cancel');

      const openModal = () => {
         modal.classList.remove('hidden');
         // Small timeout to allow display:block to apply before opacity transition
         setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalPanel.classList.remove('scale-95', 'opacity-0');
            modalPanel.classList.add('scale-100', 'opacity-100');
         }, 10);
      };

      const closeModal = () => {
         modal.classList.add('opacity-0');
         modalPanel.classList.remove('scale-100', 'opacity-100');
         modalPanel.classList.add('scale-95', 'opacity-0');

         setTimeout(() => {
            modal.classList.add('hidden');
            // Reset view
            viewSelection.classList.remove('hidden');
            viewManual.classList.add('hidden');
         }, 300);
      };

      const showManualView = () => {
         viewSelection.classList.add('hidden');
         viewManual.classList.remove('hidden');
      };

      if (openBtn) openBtn.addEventListener('click', openModal);
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (backdrop) backdrop.addEventListener('click', closeModal);

      // Switch Views
      if (btnAddManual) btnAddManual.addEventListener('click', showManualView);
      if (btnManualCancel) btnManualCancel.addEventListener('click', closeModal);
   }
}