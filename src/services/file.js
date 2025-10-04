const fs = require('fs').promises;
const path = require('path');
const prisma = require("../services/prisma");

class FileService {
    static async uploadFile(file, userId) {
        try {
            const { fileExtension, uniqueFilename, filePath} = this.generateFileParams(file);
            await fs.rename(file.path, filePath);

            return await prisma.file.create({
                data: {
                    filename: uniqueFilename,
                    originalName: file.originalname,
                    extension: fileExtension.toLowerCase(),
                    mimeType: file.mimetype,
                    size: file.size,
                    userId: userId
                }
            });
        } catch (error) {
            try {
                await fs.unlink(file.path); //delete a temporary file with error
            } catch (unlinkError) {
                console.error('error deleting temp file: ', unlinkError);
            }
            throw error;
        }
    }

    static async getFiles(userId, page = 1, pageSize = 10) {
        const skip = (page - 1) * pageSize;
        const [files, totalCount] = await Promise.all([
            prisma.file.findMany({
                where: { userId },
                skip: skip,
                take: pageSize,
                orderBy: { uploadDate: 'desc' },
                select: {
                    id: true,
                    filename: true,
                    originalName: true,
                    extension: true,
                    mimeType: true,
                    size: true,
                    uploadDate: true
                },
            }),
            prisma.file.count({
                where: { userId }
            })
        ]);

        return {
            files,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
                hasNext: page * pageSize < totalCount,
                hasPrev: page > 1,
            }
        }
    }

    static async getFileById(fileId, userId) {
        return await prisma.file.findFirst({
           where: {
               id: parseInt(fileId),
               userId: userId
           }
        });
    }

    static async deleteFile(fileId, userId) {
        const file = await prisma.file.findFirst({
           where: {
               id: parseInt(fileId),
               userId: userId
           }
        });

        if (!file) {
            throw new Error('file not found');
        }

        const filePath = path.join(process.env.UPLOAD_PATH || './uploads', file.filename);

        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.warn('error with deleting file: ', error);
        }

        await prisma.file.delete({
            where: {
                id: parseInt(fileId),
            }
        })

        return file;
    }

    static async updateFile(fileId, newFile, userId) {
        const previousFile = await prisma.file.findFirst({
            where: {
                id: parseInt(fileId),
                userId: userId
            }
        });

        if (!previousFile) {
            throw new Error('previous file not found');
        }

        const { fileExtension, uniqueFilename, filePath: newFilePath } = this.generateFileParams(previousFile);

        await fs.rename(newFile.path, newFilePath);

        try {
            const oldFilePath = path.join(process.env.UPLOAD_PATH || './uploads', previousFile.filename);
            await fs.unlink(oldFilePath);
        } catch (error) {
            console.error('error deleting old file: ', error);
        }

        return prisma.file.update({
            where: { id: parseInt(fileId) },
            data: {
                filename: uniqueFilename,
                originalName: newFile.originalname,
                extension: fileExtension.toLowerCase(),
                mimeType: newFile.mimetype,
                size: newFile.size,
            }
        });
    }

    static getFilePath(filename) {
        return path.join(process.env.UPLOAD_PATH || './uploads', filename);
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 bytes';

        const k = 1024;
        const sizes = ['bytes', 'kb', 'mb', 'gb'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static generateFileParams(file) {
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename =
            `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
        const filePath = path.join(
            process.env.UPLOAD_PATH || './uploads', uniqueFilename
        );

        return {
            fileExtension,
            uniqueFilename,
            filePath
        }
    }
}

module.exports = FileService;