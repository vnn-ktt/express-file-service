const bcrypt = require("bcryptjs");
const prisma = require("./prisma");
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
            throw new Error('Пользователь с таким ID уже существует');
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10,15}$/;
        return emailRegex.test(id) || phoneRegex.test(id);
    }
}

module.exports = AuthService;