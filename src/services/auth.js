const bcrypt = require("bcryptjs");
const prisma = require("../services/prisma");
const JWTUtils = require("../utils/jwt");

class AuthService {
    static async signUp(id, password) {
        if (!this.isValidEmailOrPhone(id)) {
            throw new Error('ID must be a email or phone number');
        }

        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (existingUser) {
            throw new Error('User with ID already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        return prisma.user.create({
            data: {
                id,
                password: hashedPassword
            }
        });
    }
    static async signIn(id, password, req) {

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            throw new Error('bad ID or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('bad ID or password');
        }

        const deviceId = JWTUtils.generateDeviceId(req);
        const accessToken = JWTUtils.generateAccessToken(user.id);
        const { token: refreshToken, tokenId } = JWTUtils.generateRefreshToken();

        await prisma.token.create({
            data: {
                userId: user.id,
                refreshToken: tokenId,
                deviceId,
                isBlocked: false
            }
        });

        return {
            accessToken,
            refreshToken,
            user: { id: user.id }
        };
    }
    static async refreshToken(refreshToken, req) {
        try {
            const decoded = JWTUtils.verifyRefreshToken(refreshToken);

            if (!decoded) {
                console.warn('failed to verify refresh token');
                return;
            }

            const tokenRecord = await prisma.token.findFirst({
                where: {
                    refreshToken: decoded.tokenId,
                    isBlocked: false
                },
                include: {
                    user: true
                }
            });

            if (!tokenRecord) {
                console.warn('refresh token not found or blocked');
                return''
            }

            const currentDeviceId = JWTUtils.generateDeviceId(req);
            if (tokenRecord.deviceId !== currentDeviceId) {
                console.warn(`device ID mismatch for user ${tokenRecord.userId}`);
                return;
            }

            const userId = tokenRecord.userId;

            const newAccessToken = JWTUtils.generateAccessToken(userId);
            const { token: newRefreshToken, tokenId: newTokenId } = JWTUtils.generateRefreshToken();

            await prisma.token.update({
                where: {
                    id: tokenRecord.id
                },
                data: {
                    refreshToken: newRefreshToken,
                    createdAt: new Date()
                }
            });

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                user: { id: userId }
            };
        } catch (error) {
            console.warn('refresh tokens error:', error);
            // if a verification error, note this token as blocked
            if (error.message.includes('Invalid') || error.message.includes('expired')) {
                try {
                    const decoded = JWTUtils.verifyRefreshToken(refreshToken);
                    if (decoded && decoded.tokenId) {
                        await prisma.token.updateMany({
                            where: { refreshToken: decoded.tokenId },
                            data: { isBlocked: true }
                        });
                    }
                } catch (error) {
                    console.error('error blocking invalid token:', error);
                }
            }
            throw error;
        }
    }
    static async cleanExpiredTokens() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const result = await prisma.token.deleteMany({
                where: {
                    createdAt: {
                        lt: thirtyDaysAgo
                    }
                }
            });
            return result.count;
        } catch (error) {
            console.error('token cleanup error:', error);
            return 0;
        }
    }
    static isValidEmailOrPhone(id) {
        const emailRegex = /^(?!\.)(?!.*\.\.)([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/; //strict
        const phoneRegex = /^\+[1-9]{1,4}[\s\-]?\(?[0-9]{1,5}\)?[\s\-]?[0-9]{1,10}[\s\-]?[0-9]{1,10}$/; //international
        return emailRegex.test(id) || phoneRegex.test(id);
    }
}

module.exports = AuthService;