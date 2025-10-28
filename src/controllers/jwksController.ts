import { Request, Response } from 'express';
import jose from 'node-jose';
import models from '../config/db';
import crypto from 'crypto';

export const getJWKS = async (req: Request, res: Response): Promise<void> => {
    try {
        const keyStore = jose.JWK.createKeyStore();
        const customerId = req.query.customerId || null;

        const whereClause = customerId ? { isInvalid: false, customerId } : { isInvalid: false };

        const keys = await models.jwt_rsa256_keys.findAll({ where: whereClause });

        for (const key of keys) {
            await keyStore.add(key.publicKey, 'pem', {
                kid: key.keyId,
                alg: 'RS256',
                use: 'sig',
            });
        }

        const jwks = keyStore.toJSON();
        res.json(jwks);
    } catch (error: any) {
        console.error('Error generating JWKS:', error);
        res.status(500).json({ error: 'Failed to generate JWKS' });
    }
};

export const generateKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const { size } = req.body; // size in bits of the key(not needed unlsss different than the default 2048)
        const keySize = size || 2048;

        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: keySize,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        await models.jwt_rsa256_keys.create({
            publicKey,
            privateKey,
            customerId: null,
            keyId: "", //keyid set in database baed on pblickey
            isInvalid: false,
        });

        res.status(201).json({ message: 'Key generated and saved successfully' });
    } catch (error: any) {
        console.error('Error generating key:', error);
        res.status(500).json({ error: 'Failed to generate key' });
    }
};

export const addKeyForCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const { customerId } = req.params;

        if (!customerId) {
            res.status(400).json({ error: 'Missing customerId' });
        }

        // Generate RSA key pair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,  // Key size in bits (2048 by default)
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        // Save the generated keys to the database with the provided customerId
        await models.jwt_rsa256_keys.create({
            publicKey,
            privateKey,
            customerId,
            keyId: "",  //keyid set in database baed on pblickey
            isInvalid: false,
        });

        res.status(201).json({ message: 'Key generated and saved successfully for customer' });
    } catch (error: any) {
        console.error('Error generating key for customer:', error);
        res.status(500).json({ error: 'Failed to generate key for customer' });
    }
};

export const deleteKeyByKeyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { keyId } = req.params;

        const deleted = await models.jwt_rsa256_keys.destroy({
            where: { keyId },
        });

        if (deleted) {
            res.status(200).json({ message: `Key with keyId: ${keyId} deleted successfully` });
        } else {
            res.status(404).json({ error: 'Key not found' });
        }
    } catch (error: any) {
        console.error('Error deleting key:', error);
        res.status(500).json({ error: 'Failed to delete key' });
    }
};

export const deleteKeysByCustomerId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { customerId } = req.params;

        const deleted = await models.jwt_rsa256_keys.destroy({
            where: { customerId },
        });

        if (deleted) {
            res.status(200).json({ message: `Keys for customerId: ${customerId} deleted successfully` });
        } else {
            res.status(404).json({ error: 'No keys found for this customer' });
        }
    } catch (error: any) {
        console.error('Error deleting keys:', error);
        res.status(500).json({ error: 'Failed to delete keys' });
    }
};
