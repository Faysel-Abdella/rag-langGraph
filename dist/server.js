"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000');
// ============================================
// MIDDLEWARE
// ============================================
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});
// ============================================
// WIDGET ENDPOINT
// ============================================
app.get('/widget.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path_1.default.join(__dirname, '../public/widget.js'));
});
// ============================================
// ADMIN LOGIN
// ============================================
app.get('/admin/login', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/admin/login.html'));
});
// ============================================
// ADMIN DASHBOARD
// ============================================
app.get('/admin', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/admin/index.html'));
});
// ============================================
// ROUTE MOUNTING
// ============================================
app.use(chatRoutes_1.default);
app.use(adminRoutes_1.default);
// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
    });
});
// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/admin`);
    console.log(`🧪 Test widget: http://localhost:${PORT}`);
    console.log(`\nPhase 1 Complete - Ready for Phase 2 RAG Integration\n`);
});
