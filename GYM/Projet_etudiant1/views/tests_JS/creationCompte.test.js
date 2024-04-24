const createAccount = require('./creationCompte');


const con = {
    query: jest.fn((sql, values, callback) => {
        // Mocking successful query execution
        if (sql.includes('SELECT')) {
            callback(null, []);
        } else if (sql.includes('INSERT INTO e_compte')) {
            callback(null, { insertId: 1 });
        }
    }),
};


const req = {
    body: {
        nom: 'Test',
        prénom: 'User',
        email: 'test@example.com',
        num: '123456789',
        password: 'password123',
    },
};

const res = {
    status: jest.fn(() => res),
    send: jest.fn(),
    json: jest.fn(),
    redirect: jest.fn(),
};

describe('Test createAccount function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create an account when the email is not already registered', () => {
        createAccount(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/event/connect');
    });

    it('should return a 400 status and error message when the email is already registered', () => {

        con.query.mockImplementationOnce((sql, values, callback) => {
            callback(null, [{req}]);
        });
        createAccount(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "L'adresse courriel est déjà inscrite." });
    });
});
