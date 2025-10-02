const jwt = require("jsonwebtoken");
const {v4: uuidv4} = require("uuid");
const crypto = require("crypto");

class JWTUtils {
    static generateAccessToken(userId) {
        return jwt.sign(
        {userId, type: 'access'},
        process.env.JWT_SECRET,
        {expiresIn: '10m'}
        );
    }

    static generateRefreshToken() {
        const tokenId = uuidv4();
        return {
            token: jwt.sign(
            {tokenId, type: 'refresh'},
            process.env.JWT_REFRESH_SECRET,
            {expiresIn: '7d'}
            ),
            tokenId
        }
    }

    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            return null;
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
}

module.exports = JWTUtils;