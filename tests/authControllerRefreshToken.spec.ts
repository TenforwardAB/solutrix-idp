import { Request, Response } from 'express';
import { refreshToken } from '../src/controllers/authController';
import { verifyToken, generateToken } from '../src/services/jwtService';
import models from '../src/config/db';

jest.mock('../src/services/jwtService', () => ({
  verifyToken: jest.fn(),
  generateToken: jest.fn(),
}));

jest.mock('../src/config/db', () => ({
  whitelisted_tokens: {
    findOne: jest.fn(),
    create: jest.fn(),  // Add this to mock token creation
  },
  user: {
    findOne: jest.fn(),  // Add this to mock user lookup
  },
}));


/**
 * Tests for the refreshToken function in the authController.
 *
 * This suite verifies:
 * - Handling of missing refresh tokens.
 * - Response to refresh tokens not in the whitelist.
 * - Response to invalid refresh tokens.
 * - Generation of a new access token on valid refresh tokens.
 */

describe('refreshToken function', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockRequest = {
      body: {},
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if refresh token is missing', async () => {
    await refreshToken(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ error: "Refresh token is required" });
  });

  it('should return 401 if refresh token is not in whitelist', async () => {
    mockRequest.body.refreshToken = 'non-whitelisted-token';
    (models.whitelisted_tokens.findOne as jest.Mock).mockResolvedValue(null);

    await refreshToken(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: "Refresh token is invalidated" });
  });

  it('should return 401 if refresh token is invalid', async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
    mockRequest.body.refreshToken = 'invalid-token';
    (models.whitelisted_tokens.findOne as jest.Mock).mockResolvedValue({ token: 'invalid-token' });
    (verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    await refreshToken(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: "Invalid refresh token" });
    consoleErrorMock.mockRestore();
  });

  it('should return a new access token if refresh token is valid', async () => {
    const mockDecoded = { id: '1', cid: 'cust123' };
    mockRequest.body.refreshToken = 'valid-token';
    
    // Mock whitelisted token lookup and verification
    (models.whitelisted_tokens.findOne as jest.Mock).mockResolvedValue({ token: 'valid-token' });
    (verifyToken as jest.Mock).mockResolvedValue(mockDecoded);
    
    // Mock user lookup
    (models.user.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      customer: { legacy_cid: 'cust123' },
    });
    
    // Mock token generation
    (generateToken as jest.Mock).mockReturnValue('new-access-token');
    
    // Mock whitelisted token creation
    (models.whitelisted_tokens.create as jest.Mock).mockResolvedValue({});
  
    await refreshToken(mockRequest as Request, mockResponse as Response);
  
    // Expect the correct response
    expect(mockJson).toHaveBeenCalledWith({
      accessToken: 'new-access-token',
    });
  });
  
  
});