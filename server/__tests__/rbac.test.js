const { requireRole } = require('../middleware/auth');

describe('RBAC Middleware (Role-Based Access Control)', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  test('should allow access if user has the correct role', () => {
    mockReq.user = { role: 'admin' };
    const middleware = requireRole(['admin']);
    
    middleware(mockReq, mockRes, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test('should deny access (403) if user has an incorrect role', () => {
    mockReq.user = { role: 'pastor' };
    const middleware = requireRole(['admin']);
    
    middleware(mockReq, mockRes, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Requires one of roles')
    }));
  });

  test('should allow access if user role is in the allowed list', () => {
    mockReq.user = { role: 'analyst' };
    const middleware = requireRole(['admin', 'analyst']);
    
    middleware(mockReq, mockRes, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  test('should deny access (401) if no user is authenticated', () => {
    mockReq.user = null;
    const middleware = requireRole(['admin']);
    
    middleware(mockReq, mockRes, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});
