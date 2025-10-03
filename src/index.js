const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

/* public routes */
app.use('/', authRoutes);

/* basic routes */
app.get('/', (req, res) => {
    res.json({
        message: 'File Service API is running!',
        endpoints: {
            public: {
                signup: 'POST /signup',
                signin: 'POST /signin'
            },
            protected: {
                info: 'GET /info (requires Bearer token)',
                logout: 'GET /logout (requires Bearer token)',
                logoutAll: 'GET /logout/all (requires Bearer token)'
            }
        }
    });
});

/*protect routes */
app.use('/', userRoutes);

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
    console.log(`🔐 Public endpoints:`);
    console.log(`   POST http://localhost:${PORT}/signup`);
    console.log(`   POST http://localhost:${PORT}/signin`);
    console.log(`🔒 Protected endpoints (require Bearer token):`);
    console.log(`   GET  http://localhost:${PORT}/info`);
    console.log(`   GET  http://localhost:${PORT}/logout`);
    console.log(`   GET  http://localhost:${PORT}/logout/all`);
});