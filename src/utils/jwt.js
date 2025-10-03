const jwt = require("jsonwebtoken");
const {v4: uuidv4} = require("uuid");
const crypto = require("crypto");

class JWTUtils {
    static generateAccessToken(userId) {
        return jwt.sign({
            userId,
            type: 'access',
            timestamp: Date.now()
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
        );
    }

    static generateRefreshToken() {
        const tokenId = uuidv4();
        return {
            token: jwt.sign(
            {
                tokenId,
                type: 'refresh',
                timestamp: Date.now()
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d'}
            ),
            tokenId
        }
    }

    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('ACCESS_TOKEN_EXPIRED');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('INVALID_ACCESS_TOKEN');
            } else {
                throw new Error('TOKEN_VERIFICATION_FAILED');
            }
        }
    }

    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('REFRESH_TOKEN_EXPIRED');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('INVALID_REFRESH_TOKEN');
            } else {
                throw new Error('REFRESH_TOKEN_VERIFICATION_FAILED');
            }
        }
    }

    static generateDeviceId(req) {
        const userAgent = req.get('User-Agent') || '';
        const ip = req.ip || req.connection.remoteAddress;
        return crypto
            .createHash('md5')
            .update(userAgent + ip)
            .digest('hex');
    }

    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.split(' ')[1];
    }
}

module.exports = JWTUtils;