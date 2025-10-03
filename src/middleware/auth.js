const JWTUtils = require("../utils/jwt.js");
const prisma = require('../services/prisma');

class AuthMiddleware {
    static async verifyToken(req, res, next) {
        try {
            const authHeader = req.headers["authorization"];
            const token = JWTUtils.extractTokenFromHeader(authHeader);

            if (!token) {
                return res.status(401).json({
                    error: 'access token is missing'
                })
            }

            const decoded = JWTUtils.verifyAccessToken(token);
            if(!decoded) {
                return res.status(401).json({
                    error: 'access token is different or expired'
                })
            }

            const user = await prisma.user.findUnique(
                {
                    where: { id: decoded.userId }
                }
            )

            if (!user) {
                return res.status(401).json({
                    error: 'user not found'
                });
            }

            const deviceId = JWTUtils.generateDeviceId(req);
            const activeToken = await prisma.token.findFirst({
                    where: {
                        userId: decoded.userId,
                        deviceId: deviceId,
                        isBlocked: false
                    }
                }
            );
            if (!activeToken) {
                return res.status(401).json({
                    error: 'session expired',
                    details: 'sign in again'
                });
            }

            req.user = {
                id: user.id,
                userId: user.id
            };

            next();
        } catch (error) {
            console.warn('auth middleware error:', error);
            return res.status(500).json({
                error: "authenticating error"
            });
        }
    }
    static async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers["authorization"];
            const token = JWTUtils.extractTokenFromHeader(authHeader);

            if (token) {
                const decoded = JWTUtils.verifyAccessToken(token);

                if (decoded) {
                    const user = await prisma.user.findUnique({
                        where: { id: decoded.userId }
                    });

                    if (user) {
                        req.user = {
                            id: user.id,
                            userId: user.id
                        }
                    }
                }
            }

            next();
        } catch (error) {
            next();
        }
    }
}

module.exports = AuthMiddleware;