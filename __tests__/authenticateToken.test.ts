import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../src/middlewares/authenticateToken';

describe('authenticateToken middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no token is provided', () => {
    authenticateToken(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token is invalid', (done) => {
    req.headers = { authorization: 'Bearer invalidtoken' };
    authenticateToken(req as Request, res as Response, next);
    setImmediate(() => {
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
      done();
    });
  });

  it('should attach decoded token to req.user and call next if token is valid', (done) => {
    const payload = { userId: 123, role: 'user' };
    const token = jwt.sign(payload, process.env.JWT_SECRET!);
    req.headers = { authorization: `Bearer ${token}` };

    authenticateToken(req as Request, res as Response, next);
    // Ждем асинхронного вызова jwt.verify
    setImmediate(() => {
      expect((req as any).user).toEqual(expect.objectContaining(payload));
      expect(next).toHaveBeenCalled();
      done();
    });
  });
});