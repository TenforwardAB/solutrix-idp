import { Request, Response } from 'express';
import { login } from '../src/controllers/authController';
import models from '../src/config/db';
import bcrypt from 'bcryptjs';
import moment from 'moment';

jest.mock('../src/config/db', () => ({
  user: {
    findOne: jest.fn(),
  },
  whitelisted_tokens: {
    create: jest.fn(),
  },
  user_role_customer: {
    findAll: jest.fn(),
  },
  role: {
    findOne: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('../src/services/jwtService', () => ({
  generateToken: jest.fn().mockReturnValue('mocked-token'),
}));

/**
 * Tests for the login function in the authController.
 * 
 * This suite verifies:
 * - Proper handling of user credentials (valid/invalid).
 * - Response structure on successful login.
 * - Error handling for database failures.
 */

describe('login function', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockRequest = {
      body: { username: 'testuser', password: 'testpassword' },
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not found', async () => {
    (models.user.findOne as jest.Mock).mockResolvedValue(null);

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  it('should return 401 if password does not match', async () => {
    const mockUser = {
      passwordhash: 'hashedpassword',
    };
    (models.user.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  it('should return tokens if login is successful', async () => {
    const mockUser = {
      userid: 1,
      customerid: '123',
      email: 'test@example.com',
      passwordhash: 'hashedpassword',
      customer: {
        legacy_cid: null,
      },
    };
  
    const mockUserRoles = [
      {
        customerid: '123',
        role: { rolename: 'User' },
      },
    ];
  
    (models.user.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (models.whitelisted_tokens.create as jest.Mock).mockResolvedValue({});
    (models.user_role_customer.findAll as jest.Mock).mockResolvedValue(mockUserRoles);
  
    await login(mockRequest as Request, mockResponse as Response);
  
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      identifyer: { id: 1, cid: '123', isadmiral: false },
      access: expect.objectContaining({
        token: 'mocked-token',
        exp: expect.any(String),
      }),
      refresh: expect.objectContaining({
        token: 'mocked-token',
        exp: expect.any(String),
      }),
      user: expect.objectContaining({
        token: 'mocked-token',
        exp: expect.any(String),
      }),
    }));
  
    const response = mockJson.mock.calls[0][0];
    const isValidISOString = (str: string) => !isNaN(Date.parse(str));
  
    expect(isValidISOString(response.access.exp)).toBe(true);
    expect(isValidISOString(response.refresh.exp)).toBe(true);
    expect(isValidISOString(response.user.exp)).toBe(true);
  
    const accessExp = new Date(response.access.exp);
    const refreshExp = new Date(response.refresh.exp);
    const userExp = new Date(response.user.exp);
  
    expect(refreshExp > accessExp).toBe(true);
    expect(userExp > accessExp).toBe(true);
  
    expect(models.whitelisted_tokens.create).toHaveBeenCalledTimes(2);
  });
  

  it('should handle database errors', async () => {
    const errorMessage = 'Database error';
    (models.user.findOne as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: errorMessage });
  });
});