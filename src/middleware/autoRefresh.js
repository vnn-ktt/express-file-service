const JWTUtils = require('../utils/jwt');
const AuthService = require('../services/auth');

class AutoRefreshMiddleware {
    static async autoRefresh(req, res, next) {
        if (req.path === '/signin' || req.path === '/signup' || req.path === '/signin/new_token') {
            return next();
        }
        const authHeader = req.headers['authorization'];
        const accessToken = JWTUtils.extractTokenFromHeader(authHeader);
        if (!accessToken) {
            return next();
        }

        try {
            const expiration = JWTUtils.getTokenExpiration(accessToken);
            const now = new Date().getTime();
            const fiveMinutes = 5 * 60 * 1000;
            if(expiration && (expiration - now) < fiveMinutes) {
                res.set('JWT-Token-Expiring-Soon', 'true');
            }
        } catch (error) {
            console.warn('auto refresh error: ', error);
        }
        next();
    }
}

module.exports = AutoRefreshMiddleware;