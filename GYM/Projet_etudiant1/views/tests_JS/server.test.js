import request from 'supertest';
import server from '../../server'; 

describe('Test server endpoints', () => {
    let app;

    beforeAll(() => {
        app = server; 
    });

    afterAll(done => {
 
        server.close(done);
    });

    it('should return status 200 for GET /', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
    });

 
});

