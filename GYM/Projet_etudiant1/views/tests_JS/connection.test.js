const connection = require('./connection');

describe('POST /event/connect', () => {
    const req = {
        body: { email: 'test@example.com', password: 'testPassword' },
        session: {}
    };

    test('should authenticate user with correct email and password', () => {
        const res = {
            redirect: jest.fn()
        };

        // Mock bcrypt.compare to simulate successful authentication
        jest.mock('bcrypt', () => ({
            compare: jest.fn((password, hashedPassword, callback) => {
                callback(null, true); // Simulate passwords match
            })
        }));

        connection(req, res);

        // Check if session is set and user is redirected
        expect(req.session.user).toEqual({
            E_COURRIEL: 'test@example.com',
            E_PASSWORD: 'testPassword'
        });
        expect(res.redirect).toHaveBeenCalledWith('/event/detail');
    });
});
