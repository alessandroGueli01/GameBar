const jwt = require('jsonwebtoken');
const auth = require('../../backend/user-service/auth');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('Auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 401 when token is missing', () => {
    const req = {
      header: jest.fn().mockReturnValue(undefined)
    };
    const res = createRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Accesso negato. Token mancante.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is invalid', () => {
    const req = {
      header: jest.fn().mockReturnValue('Bearer invalid-token')
    };
    const res = createRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token non valido.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next and injects req.user when token is valid', () => {
    const decoded = { id: 'user-1', role: 'PLAYER' };
    const token = jwt.sign(decoded, 'fallback_secret');

    const req = {
      header: jest.fn().mockReturnValue(`Bearer ${token}`)
    };
    const res = createRes();
    const next = jest.fn();

    auth(req, res, next);

    expect(req.user).toMatchObject(decoded);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
