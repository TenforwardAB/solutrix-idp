import * as jose from 'node-jose';
import { promises as fs } from 'fs';
import { 
  generateToken, 
  verifyToken, 
  verifyRefreshToken,
  getSigningKeysByKid,
  JwtPayload
} from '../src/services/jwtService';
import models from '../src/config/db';

// Mock the models module
jest.mock('../src/config/db', () => ({
  jwt_rsa256_keys: {
    findAll: jest.fn(),
    findOne: jest.fn()
  }
}));

// Define an interface for the key pair
interface KeyPair {
  privateKey: string;
  publicKey: string;
  keyId: string;
}

describe('JWT Token Management', () => {
  // Mock data
  const mockPayload = {
    id: 1,
    cid: 'customer123',
    customerid: 'cust_123',
  };

  // Use the defined interface for mockKeyPair
  let mockKeyPair: KeyPair;

  beforeAll(async () => {
    // Load keys from files
    const privateKey = await fs.readFile('tests/test-certs/private_key.pem', 'utf8');
    const publicKey = await fs.readFile('tests/test-certs/public_key.pem', 'utf8');
    
    // Populate mockKeyPair with loaded keys
    mockKeyPair = {
      privateKey,
      publicKey,
      keyId: 'test-key-123' // You can change this if needed
    };
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (models.jwt_rsa256_keys.findAll as jest.Mock).mockResolvedValue([{
      privateKey: mockKeyPair.privateKey,
      publicKey: mockKeyPair.publicKey,
      keyId: mockKeyPair.keyId,
      isInvalid: false,
      createdAt: new Date()
    }]);

    (models.jwt_rsa256_keys.findOne as jest.Mock).mockResolvedValue({
      privateKey: mockKeyPair.privateKey,
      publicKey: mockKeyPair.publicKey,
      keyId: mockKeyPair.keyId,
      isInvalid: false
    });
  });

  describe('generateToken', () => {
    it('should generate a valid access token', async () => {
      const token = await generateToken(mockPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate a valid refresh token', async () => {
      const token = await generateToken(mockPayload, true);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload fields', async () => {
      const token = await generateToken(mockPayload);
      const [, payload] = token.split('.');
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
      
      expect(decodedPayload).toHaveProperty('id', mockPayload.id);
      expect(decodedPayload).toHaveProperty('cid', mockPayload.cid);
      expect(decodedPayload).toHaveProperty('iat');
      expect(decodedPayload).toHaveProperty('exp');
    });
  });

  describe('verifyToken', () => {
    let validToken: string;

    beforeEach(async () => {
      validToken = await generateToken(mockPayload);
    });

    it('should verify a valid token', async () => {
      const verified = await verifyToken(validToken);
      expect(verified).toHaveProperty('id', mockPayload.id);
      expect(verified).toHaveProperty('cid', mockPayload.cid);
    });

    it('should reject an invalid token', async () => {
      const invalidToken = validToken + 'corrupted';
      await expect(verifyToken(invalidToken)).rejects.toThrow('Invalid token');
    });

    it('should reject a token without kid', async () => {
      const [header, payload, signature] = validToken.split('.');
      const decodedHeader = JSON.parse(Buffer.from(header, 'base64url').toString());
      delete decodedHeader.kid;
      const newHeader = Buffer.from(JSON.stringify(decodedHeader)).toString('base64url');
      const invalidToken = `${newHeader}.${payload}.${signature}`;
      
      await expect(verifyToken(invalidToken)).rejects.toThrow('Invalid token: Key ID (kid) not found in token header');
    });
  });

  describe('verifyRefreshToken', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      validRefreshToken = await generateToken(mockPayload, true);
    });

    it('should verify a valid refresh token', async () => {
      const verified = await verifyRefreshToken(validRefreshToken);
      expect(verified).toHaveProperty('id', mockPayload.id);
      expect(verified).toHaveProperty('cid', mockPayload.cid);
    });

    it('should reject an invalid refresh token', async () => {
      const invalidToken = validRefreshToken + 'corrupted';
      await expect(verifyRefreshToken(invalidToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('getSigningKeysByKid', () => {
    it('should return public key for valid kid', async () => {
      const result = await getSigningKeysByKid('test-key-123');
      expect(result).toHaveProperty('publicKey');
      expect(result.publicKey).toBe(mockKeyPair.publicKey);
    });

    it('should throw error for invalid kid', async () => {
      (models.jwt_rsa256_keys.findOne as jest.Mock).mockResolvedValue(null);
      
      await expect(getSigningKeysByKid('invalid-kid'))
        .rejects
        .toThrow('No valid signing key found for the provided Key ID');
    });
  });
});
