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
    static isValidEmailOrPhone(id) {
        const emailRegex = /^(?!\.)(?!.*\.\.)([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/; //strict
        const phoneRegex = /^\+[1-9]{1,4}[\s\-]?\(?[0-9]{1,5}\)?[\s\-]?[0-9]{1,10}[\s\-]?[0-9]{1,10}$/; //international
        return emailRegex.test(id) || phoneRegex.test(id);
    }
}

module.exports = AuthService;