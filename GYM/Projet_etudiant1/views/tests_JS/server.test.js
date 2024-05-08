

const request = require('supertest');
const server = require('../../server');

describe('Test server endpoints', () => {
    let app;

    beforeAll(() => {
        app = server.listen(3000);
    });

    afterAll(async () => {
        await app.close();
    });

    it('should respond with 200 status code', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });
});
