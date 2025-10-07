const FileService  = require('../services/file');
const path = require('path');
const fs = require('fs').promises;

class FileController {
    static async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                   error: 'no file uploaded',
                    details: 'please select a file to upload'
                });
            }

            if (!req.user){
                return res.status(401).json({
                    error: 'user is not authorized'
                })
            }

            const fileRecord = await FileService.uploadFile(req.file, req.user.id);

            res.status(201).json({
               message: 'file uploaded successfully',
               file: {
                   id: fileRecord.id,
                   originalName: fileRecord.originalName,
                   filename: fileRecord.filename,
                   extension: fileRecord.extension,
                   mimeType: fileRecord.mimeType,
                   size: fileRecord.size,
                   sizeFormatted: FileService.formatFileSize(fileRecord.size),
                   uploadDate: fileRecord.uploadDate
               }
            });
        } catch (error) {
            console.warn ('file uploading error: ', error);
            res.status(500).json({
               error: 'file uploading error',
               details: error.message
            });
        }
    }

    static async getFilesList(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'user not found'
                });
            }

            const page = parseInt(req.query.page) || 1;
            const listSize = parseInt(req.query.limit) || 10;

            if (page < 1) {
                return res.status(400).json({
                   error: 'invalid page number',
                   details: 'page must be greater than 0'
                });
            }

            if (listSize < 1 || listSize > 100) {
                return res.status(400).json({
                    error: 'invalid list size',
                    details: 'list size must be between 1 and 100'
                });
            }

            const result = await FileService.getFiles(req.user.id, page, listSize);

            res.json({
                files: result.files.map(file => ({
                    ...file,
                    sizeFormatted: FileService.formatFileSize(file.size)
                })),
                pagination: result.pagination
            });
        } catch (error) {
            console.warn('get files list error: ', error);
            res.status(500).json({
                error: 'failed to get files list',
                details: error.message
            });
        }
    }

    static async getFileInfo(req, res) {
        try {

            if (!req.user) {
                return res.status(401).json({
                    error: 'user not authenticated'
                })
            }

            const fileId = req.params.id;
            const file = await FileService.getFileById(fileId, req.user.id);

            if (!file) {
                return res.status(401).json({
                    error: 'file not found',
                    details: `file with ID ${fileId} not found or you don't have access to it`
                });
            }

            res.json({
                file: {
                    ...file,
                    sizeFormatted: FileService.formatFileSize(file.size)
                }
            })

        } catch (error) {
            console.warn('get file info error: ', error);
            res.status(500).json({
                error: 'failed to get file info',
                details: error.message
            });
        }
    }

    static async downloadFile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'user not authenticated'
                })
            }
            const fileId = req.params.id;
            const file = await FileService.getFileById(fileId, req.user.id);

            if (!file) {
                return res.status(404).json({
                    error: 'file not found',
                })
            }

            const filePath = FileService.getFilePath(file.filename);
            try {
                await fs.access(filePath);
            } catch {
                return res.status(404).json({
                    error: 'file not found on server'
                });
            }

            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
            res.setHeader('Content-Length', file.size);

            res.sendFile(path.resolve(filePath));

        } catch (error) {
            console.warn('download file error: ', error);
            res.status(500).json({
                error: 'download file error',
                details: error.message
            });
        }
    }

    static async deleteFile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                   error: 'user not authenticated'
                });
            }

            const fileId = req.params.id;
            const deletedFile = await FileService.deleteFile(fileId, req.user.id);

            res.json({
                message: 'file deleted successfully',
                file: {
                    id: deletedFile.id,
                    originalName: deletedFile.originalName
                }
            });

        } catch (error) {
            console.warn('deleting file error: ', error);
            res.status(500).json({
                error: 'deleting file error',
                details: error.message
            })
        }
    }

    static async updateFile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'user not authenticated'
                })
            }

            if (!req.file) {
                return res.status(400).json({
                    error: 'no file provided for update'
                });
            }
            const fileId = req.params.id;
            const updatedFile = await FileService.updateFile(fileId, req.file, req.user.id);

            res.json({
               message: 'file updated successfully',
               file: {
                   id: updatedFile.id,
                   originalName: updatedFile.originalName,
                   filename: updatedFile.filename,
                   extension: updatedFile.extension,
                   mimeType: updatedFile.mimeType,
                   size: updatedFile.size,
                   sizeFormatted: FileService.formatFileSize(updatedFile.size),
                   uploadDate: updatedFile.uploadDate
               }
            });
        } catch (error) {
            console.warn('update file error: ', error);

            if (error.message === 'file not found') {
                return res.status(404).json({
                    error: 'file not found'
                });
            }

            res.status(500).json({
                error: 'update file error',
                details: error.message
            })
        }
    }
}

module.exports = FileController;