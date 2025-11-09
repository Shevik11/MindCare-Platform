const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn(),
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() when valid token is provided', () => {
    const token = jwt.sign(
      { user: { id: 1, role: 'patient' } },
      process.env.JWT_SECRET
    );
    req.header.mockReturnValue(`Bearer ${token}`);

    auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 1, role: 'patient' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when no token is provided', () => {
    req.header.mockReturnValue(undefined);

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      msg: 'No token, authorization denied',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', () => {
    req.header.mockReturnValue('Bearer invalid-token');

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header is missing Bearer prefix', () => {
    req.header.mockReturnValue('invalid-format');

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Token is not valid' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle token with different user roles', () => {
    const token = jwt.sign(
      { user: { id: 2, role: 'psychologist', email: 'psych@test.com' } },
      process.env.JWT_SECRET
    );
    req.header.mockReturnValue(`Bearer ${token}`);

    auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 2,
      role: 'psychologist',
      email: 'psych@test.com',
    });
  });
});
