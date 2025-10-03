const prisma = require('../services/prisma');
const JWTUtils = require('../utils/jwt');

class UserController {
    static async getInfo(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'user is not authorized'
                })
            }
            res.json({
                userId: req.user.id,
            })
        } catch (error) {
            console.error('get user error: ', error);
            res.status(500).json({
                error: 'error with getting user info'
            });
        }
    }

    static async logout(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'user is not authorized'
                });
            }

            const deviceId = JWTUtils.generateDeviceId(req);
            await prisma.token.updateMany({
                where: {
                   userId: req.user.id,
                   deviceId: deviceId,
                    isBlocked: false
                },
                data: {
                   isBlocked: true
                }
            });
            res.json({
                message: 'successfully logged out'
            });
        } catch (error) {
            console.error('logout error: ', error);
            res.status(500).json({
                error: 'logout error'
            })
        }
    }

    static async logoutAllDevices(req, res) {
        try {
            if(!req.user) {
                return res.status(401).json({
                    error: 'user is not authorized'
                })
            }

            const result = await prisma.token.updateMany({
                where: {
                    userId: req.user.id,
                },
                data: {
                    isBlocked: true
                }
            })

            res.json({
                message: 'successfully logged out all devices',
                blockedTokens: result.count
            });
        } catch (error) {
            console.error('logoutAllDevices error: ', error);
            res.status(500).json({
                error: 'error with logout on all devices'
            });
        }
    }
}

module.exports = UserController;