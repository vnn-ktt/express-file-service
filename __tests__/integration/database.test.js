const prisma = require('../../src/services/prisma');

describe('Database Connection Test', () => {
    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    test('should establish database connection', async () => {
        const isConnected = await prisma.$executeRaw`SELECT 1`;
        expect(isConnected).toBeDefined();
    });

    test('should handle user operations', async () => {
        const testUser = {
            id: 'testid123',
            password: 'testpassword123'
        };

        const user = await prisma.user.create({
            data: testUser
        });

        expect(user.id).toBe(testUser.id);
        expect(user.password).toBe(testUser.password);

        const foundUser = await prisma.user.findUnique({
            where: { id: testUser.id }
        });

        expect(foundUser).not.toBeNull();
        expect(foundUser.id).toBe(testUser.id);

        await prisma.user.delete({
            where: { id: testUser.id }
        });
    });
});