const fs = require('fs').promises;
const path = require('path');
const prisma = require('prisma');

class FileService {
    static async uploadFile(file, userId) {
        try {
            //1. generate file and save on the disk
            const fileExtension = path.extname(file.originalname);
            const uniqueFilename =
                `${Date.now()}--${Math.random().toString(36)}${fileExtension}`;
            const filePath = path.join(
                process.env.UPLOAD_PATH || './uploads', uniqueFilename
            );
            await fs.rename(filePath, uniqueFilename);

            //2. create database query
            return await prisma.file.create({
                data: {
                    filename: uniqueFilename,
                    originalName: file.originalname,
                    extension: fileExtension,
                    mimeType: file.mimeType,
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

    static async async getFiles(userId, page = 1, pageSize = 10) {

    }
}