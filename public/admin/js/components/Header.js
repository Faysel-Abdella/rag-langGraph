class Header {
  static render() {
    return `
      <header class="h-[70px] bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
        <!-- Left: System Status -->
        <div class="flex items-center gap-2.5 text-[14px] font-medium text-gray-600">
          <span class="w-2 h-2 rounded-full bg-[#27ae60] shadow-[0_0_0_2px_rgba(39,174,96,0.1)]"></span>
          System Ok
        </div>

        <!-- Right: User Profile -->
        <div class="flex items-center gap-3 pl-6 border-l border-gray-100">
          <div class="w-9 h-9 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[12px] font-bold text-gray-600 tracking-wide">AT</div>
          <span class="text-[14px] font-medium text-gray-700">Admin</span>
        </div>
      </header>
    `;
  }
}
