/**
 * Copyright (C) 2024 [TSEI]
 *
 * Created on 2024-11-15 :: 08:45 BY andrek
 */
import { createLicenseKey } from '../src/controllers/licenseController';
import models from '../src/config/db';
import * as jwtService from '../src/services/jwtService';
import * as fs from 'fs';

jest.mock('../src/config/db', () => ({
  license_model: {
    findOne: jest.fn(),
  },
  license_keys: {
    create: jest.fn(),
  },
}));

jest.mock('../src/services/jwtService', () => ({
  generateToken: jest.fn(),
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

describe('createLicenseKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a license key successfully', async () => {
    const req = { body: { customerid: 'customer123' } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    models.license_model.findOne.mockResolvedValue({
      valid_to: new Date(),
      max_reviews: 100,
      max_edgerunners: 5,
      license_limit_type: 'trial',
      licensemodelid: 1,
    });

    models.license_keys.create.mockResolvedValue(null);

    (jwtService.generateToken as jest.Mock).mockResolvedValue('dummy.jwt.token');

    await createLicenseKey(req, res);

    expect(models.license_model.findOne).toHaveBeenCalledWith({
      where: { customerid: 'customer123', active: true },
    });
    expect(jwtService.generateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        cid: 'customer123',
        valid_to: expect.any(Date),
        max_reviews: 100,
        license_limit_type: 'trial',
      }),
      false,
      true
    );
    expect(models.license_keys.create).toHaveBeenCalledWith(
      expect.objectContaining({
        licensekey: expect.any(String),
        licensekeyid: expect.any(String),
        licensemodelid: 1,
        customerid: 'customer123',
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ licenseKey: expect.any(String) }));
  });

  it('should return 400 if customerid is missing', async () => {
    const req = { body: {} } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await createLicenseKey(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required field: customerid' });
  });
});
