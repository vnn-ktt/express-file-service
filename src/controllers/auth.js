const AuthService = require("../services/auth");

class AuthController {
    static async signUp(req, res) {
        try {
            const { id, password } = req.body || {};

            if (!id || !password) return res.status(400).json({
                error: 'ID and password are required',
            })

            const user = await AuthService.signUp(id, password);
            const tokens = await AuthService.signIn(id, password, req);

            res.status(201).json({
                message: 'User was singed up',
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: { id: user.id }
            });
        } catch (error) {
            console.warn("signup error: ", error);
            res.status(400).json({
                error: error.message
            })
        }
    }

    static async signIn(req, res) {
        try {
            const { id, password } = req.body;

            if (!id || !password) {
                return res.status(400).json({
                    error: 'ID and password are required',
                });
            }

            const tokens = await AuthService.signIn(id, password, req);

            res.json({
                message: 'User was signed in',
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: tokens.user
            });

        } catch (error) {
            console.warn('signIn error:', error);
            res.status(401).json({
                error: error.message
            });
        }
    }

    static async refreshToken(req, res) {
        try {
            const {refresh_token} = req.body;
            if (!refresh_token) return res.status(400).json({
                error: 'refresh token is required',
                details: 'provide refresh token in the body of req',
            })

            const tokens = await AuthService.refreshToken(refresh_token, req);
            res.json({
                message: 'tokens refreshed successfully',
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: tokens.user
            });
        } catch (error) {
            console.warn('refresh tokens error:', error.message);

            let statusCode = 401;
            let errorMessage = error.message;

            if (error.message.includes('Invalid') || error.message.includes('expired')) {
                statusCode = 401;
                errorMessage = 'invalid or expired refresh token';
            } else if (error.message.includes('not found')) {
                statusCode = 404;
                errorMessage = 'refresh token not found';
            } else if (error.message.includes('Device mismatch')) {
                statusCode = 403;
                errorMessage = 'device mismatch - please sign in again';
            }

            res.status(statusCode).json({
                error: errorMessage,
                details: 'please sign in again to get new tokens'
            });
        }
    }
}

module.exports = AuthController;