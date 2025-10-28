import { Request, Response } from 'express';
import { getJWKS } from '../src/controllers/jwksController';
import models from '../src/config/db';
import * as jose from 'node-jose';

jest.mock('../src/config/db', () => ({
  jwt_rsa256_keys: {
    findAll: jest.fn(),
  },
}));

jest.mock('node-jose', () => ({
  JWK: {
    createKeyStore: jest.fn().mockReturnValue({
      add: jest.fn(),
      toJSON: jest.fn(),
    }),
  },
}));

describe('getJWKS function', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
    mockReq = {
      query: {},
    };
  });

  it('should return JWKS when no customerId is provided', async () => {
    const mockKeys = [
      { keyId: 'key1', publicKey: 'publicKey1' },
      { keyId: 'key2', publicKey: 'publicKey2' },
    ];

    (models.jwt_rsa256_keys.findAll as jest.Mock).mockResolvedValue(mockKeys);
    (jose.JWK.createKeyStore().toJSON as jest.Mock).mockReturnValue({ keys: [] });

    await getJWKS(mockReq as Request, mockRes as Response);

    expect(models.jwt_rsa256_keys.findAll).toHaveBeenCalledWith({
      where: { isInvalid: false },
    });
    expect(mockJson).toHaveBeenCalledWith({ keys: [] });
  });

  it('should return JWKS when customerId is provided', async () => {
    mockReq.query = { customerId: '123' };

    const mockKeys = [
      { keyId: 'key1', publicKey: 'publicKey1' },
      { keyId: 'key2', publicKey: 'publicKey2' },
    ];

    (models.jwt_rsa256_keys.findAll as jest.Mock).mockResolvedValue(mockKeys);
    (jose.JWK.createKeyStore().toJSON as jest.Mock).mockReturnValue({ keys: [] });

    await getJWKS(mockReq as Request, mockRes as Response);

    expect(models.jwt_rsa256_keys.findAll).toHaveBeenCalledWith({
      where: { isInvalid: false, customerId: '123' },
    });
    expect(mockJson).toHaveBeenCalledWith({ keys: [] });
  });

  it('should handle errors and return 500 status', async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
    (models.jwt_rsa256_keys.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

    await getJWKS(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ error: 'Failed to generate JWKS' });
    consoleErrorMock.mockRestore();
  });
});

