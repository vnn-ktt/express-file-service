const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/', authRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'file service API is running',
        endpoints: {
            signup: 'POST /signup',
            signin: 'POST /signin'
        }
    });
})

app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}`);
    console.log(`🔐 Authentication endpoints:`);
    console.log(`   POST http://localhost:${PORT}/signup`);
    console.log(`   POST http://localhost:${PORT}/signin`);
});

/*
* {
    "id": "89993159090",
    "password": "12345"
}
* */