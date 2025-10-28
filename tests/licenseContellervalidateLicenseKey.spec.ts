/**
 * Copyright (C) 2024 [TSEI]
 *
 * Created on 2024-11-15 :: 08:59 BY andrek
 */
import { validateLicenseKey } from '../src/controllers/licenseController';
import models from '../src/config/db';
import * as jwtService from '../src/services/jwtService';

jest.mock('../src/config/db', () => ({
  license_keys: {
    findOne: jest.fn(),
  },
  license_model: {
    findOne: jest.fn(),
  },
  edgerunner: {
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  issues: {
    create: jest.fn(),
  },
}));

jest.mock('../src/services/jwtService', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn((filePath: string) => {
    if (filePath.includes('private_key.pem')) {
      return `-----BEGIN PRIVATE KEY-----
YOUR_DUMMY_PRIVATE_KEY
-----END PRIVATE KEY-----`;
    }
    if (filePath.includes('public_key.pem')) {
      return `-----BEGIN PUBLIC KEY-----
YOUR_DUMMY_PUBLIC_KEY
-----END PUBLIC KEY-----`;
    }
    return null;
  }),
}));

describe('validateLicenseKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate a license key successfully', async () => {
    const req = { body: { token: 'dummy.jwt.token', hwkey: 'hwkey123' } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    (jwtService.verifyToken as jest.Mock).mockResolvedValue({
      cid: 'customer123',
      licensekeyid: 'license123',
    });

    models.license_keys.findOne.mockResolvedValue({
      licensekeyid: 'license123',
    });

    models.license_model.findOne.mockResolvedValue({
      valid_to: new Date(),
      max_reviews: 100,
      max_edgerunners: 5,
      license_limit_type: 'trial',
    });

    models.edgerunner.count.mockResolvedValue(0);
    models.edgerunner.findOne.mockResolvedValue(null);
    models.edgerunner.create.mockResolvedValue(null);

    await validateLicenseKey(req, res);

    expect(jwtService.verifyToken).toHaveBeenCalledWith('dummy.jwt.token');
    expect(models.license_keys.findOne).toHaveBeenCalledWith({ where: { licensekeyid: 'license123' } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Edgerunner registered and license validated', customerid: 'customer123' });
  });

  it('should return 400 if token or hwkey is missing', async () => {
    const req = { body: {} } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await validateLicenseKey(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });
});
