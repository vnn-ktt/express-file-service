const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

class UploadMiddleware {
    constructor() {
        this.uploadPath = process.env.UPLOAD_PATH || './uploads';
        this.allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'application/pdf',
            'text/plain',
            'text/csv',
            'application/msword',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        this.storage = this.configureStorage();
        this.upload = this.configureMulter();
    }

    configureStorage() {
        return multer.diskStorage({
            destination: async (req, file, cb) => {
                await this.ensureUploadDir();
                cb(null, this.uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
                cb(null, `temp-${uniqueSuffix}-${safeFilename}`);
            }
        });
    }

    configureMulter() {
        return multer({
            storage: this.storage,
            fileFilter: this.fileFilter.bind(this),
            limits: {
                fileSize: 10 * 1024 * 1024, // 10mb
                files: 1
            }
        });
    }

    async ensureUploadDir() {
        try {
            await fs.access(this.uploadPath);
        } catch (error) {
            await fs.mkdir(this.uploadPath, { recursive: true });
        }
    }

    fileFilter(req, file, cb) {
        const isValidMime = this.allowedMimes.includes(file.mimetype);
        const isValidExtension = this.isValidExtension(file.originalname);

        if (isValidMime && isValidExtension) {
            cb(null, true);
        } else {
            const error = new Error(
                `file type not allowed. MIME: ${file.mimetype}, extension: ${path.extname(file.originalname)}`
            );
            cb(error, false);
        }
    }

    isValidExtension(filename) {
        const allowedExtensions = [
            '.jpg', '.jpeg', '.png',
            '.gif', '.pdf', '.txt',
            '.csv', '.doc', '.docx',
            '.xls', '.xlsx'];
        const ext = path.extname(filename).toLowerCase();
        return allowedExtensions.includes(ext);
    }

    single(fieldName = 'file') {
        return this.upload.single(fieldName);
    }

    handleUploadErrors(error, req, res, next) {
        if (error instanceof multer.MulterError) {
            switch (error.code) {
                case 'LIMIT_FILE_SIZE':
                    return res.status(400).json({
                        error: 'file too large',
                        details: 'maximum file size is 10MB',
                        code: 'FILE_SIZE_LIMIT'
                    });

                case 'LIMIT_FILE_COUNT':
                    return res.status(400).json({
                        error: 'too many files',
                        details: 'only one file allowed per request',
                        code: 'FILE_COUNT_LIMIT'
                    });

                case 'LIMIT_UNEXPECTED_FILE':
                    return res.status(400).json({
                        error: 'unexpected file field',
                        details: `check the field name: ${error.field}`,
                        code: 'UNEXPECTED_FILE_FIELD'
                    });

                default:
                    return res.status(400).json({
                        error: 'file upload error',
                        details: error.message,
                        code: 'MULTER_ERROR'
                    });
            }
        }

        if (error.name === 'FileFilterError') {
            return res.status(400).json({
                error: 'File type not allowed',
                details: error.message,
                code: 'FILE_TYPE_NOT_ALLOWED'
            });
        }

        if (error) {
            return res.status(400).json({
                error: 'Upload failed',
                details: error.message,
                code: 'UPLOAD_ERROR'
            });
        }

        next();
    }

    validateFile(req, res, next) {
        if (!req.file) {
            return res.status(400).json({
                error: 'no file provided',
                details: 'select a file to upload',
                code: 'NO_FILE'
            });
        }

        if (req.file.size === 0) {
            return res.status(400).json({
                error: 'empty file',
                details: 'the uploaded file is empty',
                code: 'EMPTY_FILE'
            });
        }

        next();
    }
}

const uploadMiddleware = new UploadMiddleware();
module.exports = uploadMiddleware;