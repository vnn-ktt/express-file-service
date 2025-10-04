const express = require('express');
const FileController = require('../controllers/file');
const AuthMiddleware = require('../middleware/auth');
const UploadMiddleware = require('../middleware/file');

const router = express.Router();

router.use(AuthMiddleware.verifyToken);

router.post('/upload',
    UploadMiddleware.single('file'),
    UploadMiddleware.handleUploadErrors.bind(UploadMiddleware),
    UploadMiddleware.validateFile.bind(UploadMiddleware),
    FileController.uploadFile
);

router.put('/update/:id',
    UploadMiddleware.single('file'),
    UploadMiddleware.handleUploadErrors.bind(UploadMiddleware),
    UploadMiddleware.validateFile.bind(UploadMiddleware),
    FileController.updateFile
);

router.get('/list', FileController.getFilesList);
router.get('/:id', FileController.getFileInfo);
router.get('/download/:id', FileController.downloadFile);
router.delete('/delete/:id', FileController.deleteFile);

module.exports = router;