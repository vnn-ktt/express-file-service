module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/app.js',
        '!src/**/*.test.js'
    ],
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js']
};