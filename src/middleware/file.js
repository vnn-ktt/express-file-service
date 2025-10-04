const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const ensureUploadDir = async () => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    try {
        await fs.access(uploadPath);
    } catch (error) {
        await fs.mkdir(uploadPath);
    }
};

const storage = multer.diskStorage({
   destination: async function (req, file, cb) {
       await ensureUploadDir();
       cb(null, process.env.UPLOAD_PATH || './uploads');
   },
   filename: function (req, file, cb) {
       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
       cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
   }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('file mime is not allowed'), false);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, //10mb
        files: 1 //only one per try
    }
});

const handleUploadErrors = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'file too large',
                details: 'maximum file size is 10mb'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'too many files',
                details: 'only one file allowed per request'
            });
        }
    }

    if (error) {
        return res.status(400).json({
            error: 'file upload error',
            details: error.message
        });
    }

    next();
};

module.exports = {
    single: upload.single('file'),
    handleUploadErrors
};
