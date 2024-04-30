const connection = require('./connection');

// Mocking the MySQL connection and query function
jest.mock('mysql', () => ({
    createConnection: jest.fn(() => ({
        query: jest.fn(),
    })),
}));

describe('connection function', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                email: 'test@example.com',
                password: 'testpassword',
            },
            session: {}, // Initialize session object
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            redirect: jest.fn(),
        };
    });

    it('should authenticate user and redirect if password is correct', async () => {
        // Mocking the query result for a successful login
        const result = [{ E_PASSWORD: 'hashed_password' }];
        const con = require('mysql').createConnection();
        con.query.mockImplementationOnce((query, values, callback) => {
            callback(null, result);
        });

        await connection(req, res);

        expect(req.session.user).toEqual({
            E_COURRIEL: 'test@example.com',
            E_PASSWORD: 'hashed_password',
        });
        expect(res.redirect).toHaveBeenCalledWith('/event/detail');
    });

    it('should handle incorrect password', async () => {
        // Mocking the query result for an incorrect password
        const result = [{ E_PASSWORD: 'incorrect_password' }];
        const con = require('mysql').createConnection();
        con.query.mockImplementationOnce((query, values, callback) => {
            callback(null, result);
        });

        await connection(req, res);

        expect(res.send).toHaveBeenCalledWith('Incorrect password');
    });

    it('should handle user not found', async () => {
        // Mocking the query result for a user not found
        const result = [];
        const con = require('mysql').createConnection();
        con.query.mockImplementationOnce((query, values, callback) => {
            callback(null, result);
        });

        await connection(req, res);

        expect(res.send).toHaveBeenCalledWith('Email not found');
    });
});
