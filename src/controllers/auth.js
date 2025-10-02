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
}

module.exports = AuthController;