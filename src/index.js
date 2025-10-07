const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const fileRoutes = require('./routes/file');
const AutoRefreshMiddleware = require('./middleware/autoRefresh');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(AutoRefreshMiddleware.autoRefresh);

/* public routes */
app.use('/', authRoutes);

/* basic routes */
app.get('/', (req, res) => {
    res.json({
        message: 'File Service API is running!',
        endpoints: {
            public: {
                signup: 'POST /signup',
                signin: 'POST /signin',
                refresh: 'POST /signin/new_token'
            },
            protected: {
                user: {
                    info: 'GET /info (requires Bearer token)',
                    logout: 'GET /logout (requires Bearer token)'
                },
                files: {
                    upload: 'POST /file/upload (requires Bearer token)',
                    list: 'GET /file/list?page=1&list_size=10 (requires Bearer token)',
                    info: 'GET /file/:id (requires Bearer token)',
                    download: 'GET /file/download/:id (requires Bearer token)',
                    update: 'PUT /file/update/:id (requires Bearer token)',
                    delete: 'DELETE /file/delete/:id (requires Bearer token)'
                }
            }
        }
    });
});

/*protect routes */
app.use('/', userRoutes);
app.use('/file', fileRoutes);

app.use((req, res) => {
    res.status(404).json({
        error: 'route is not found',
        path: req.path,
        method: req.method
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}`);
    console.log(`🔐 PUBLIC ENDPOINTS (no auth required):`);
    console.log(`   GET  http://localhost:${PORT}/ - API info`);
    console.log(`   POST http://localhost:${PORT}/signup - User registration`);
    console.log(`   POST http://localhost:${PORT}/signin - User login`);
    console.log(`   POST http://localhost:${PORT}/signin/new_token - Generate new token`);
    console.log(``);
    console.log(`🔒 PROTECTED ENDPOINTS (require Bearer token):`);
    console.log(`   👤 USER ENDPOINTS:`);
    console.log(`      GET http://localhost:${PORT}/info - User info`);
    console.log(`      GET http://localhost:${PORT}/logout - Logout (current device)`);
    console.log(`      GET http://localhost:${PORT}/logout/all - Logout all devices`);
    console.log(``);
    console.log(`   📁 FILE ENDPOINTS:`);
    console.log(`      POST   http://localhost:${PORT}/file/upload - Upload file`);
    console.log(`      GET    http://localhost:${PORT}/file/list - List files (with pagination)`);
    console.log(`      GET    http://localhost:${PORT}/file/:id - Get file info`);
    console.log(`      GET    http://localhost:${PORT}/file/download/:id - Download file`);
    console.log(`      PUT    http://localhost:${PORT}/file/update/:id - Update file`);
    console.log(`      DELETE http://localhost:${PORT}/file/delete/:id - Delete file`);
    console.log(``);
    console.log(`📖 Pagination: /file/list?page=1&list_size=10`);
    console.log(`🔑 Use: Authorization: Bearer <your_token>`);
});