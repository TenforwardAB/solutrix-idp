import * as jose from 'node-jose';
import dotenv from 'dotenv';
import models from '../config/db';

dotenv.config();

export interface JwtPayload {
    id: string;
    cid: string;
    customerid: string;
    iat: number;
    exp: number;
    [key: string]: any;
}

const expiryMinutes = parseInt(process.env.ACCESS_TOKEN_EXPIRY_MINUTES || '10', 10);

const getSigningKeys = async (customerId: string | null): Promise<{
    privateKey: jose.JWK.Key;
    publicKey: jose.JWK.Key;
    keyId: string;
}> => {
    let keyEntries;

    if (customerId) {
        keyEntries = await models.jwt_rsa256_keys.findAll({
            where: { customerId, isInvalid: false },
            order: [['createdAt', 'DESC']],
        });
    }

    if (!keyEntries || keyEntries.length === 0) {
        keyEntries = await models.jwt_rsa256_keys.findAll({
            where: { customerId: null, isInvalid: false },
            order: [['createdAt', 'DESC']],
        });
    }

    if (!keyEntries || keyEntries.length === 0) {
        throw new Error('No valid signing keys found');
    }

    const randomKey = keyEntries[Math.floor(Math.random() * keyEntries.length)];

    const privateKey = await jose.JWK.asKey(randomKey.privateKey, 'pem');
    const publicKey = await jose.JWK.asKey(randomKey.publicKey, 'pem');

    return {
        privateKey,
        publicKey,
        keyId: randomKey.keyId,
    };
};


export const getSigningKeysByKid = async (kid: string): Promise<{ publicKey: string }> => {
    const keyEntry = await models.jwt_rsa256_keys.findOne({
        where: { keyId: kid, isInvalid: false },
    });

    if (!keyEntry) {
        throw new Error('No valid signing key found for the provided Key ID');
    }

    return { publicKey: keyEntry.publicKey };
};


export const generateToken = async (payload: Record<string, any>, isRefresh: boolean = false, isLic: boolean = false): Promise<string> => {
    const {privateKey, keyId} = await getSigningKeys(payload.customerid || null);

    const iat = Math.floor(Date.now() / 1000);
    let exp;

    if (isLic) {
        exp = iat + 10 * 365 * 24 * 60 * 60;
    } else if (isRefresh) {
        exp = iat + 365 * 24 * 60 * 60;
    } else {
        exp = iat + expiryMinutes * 60;
    }

    const updatedPayload = {
        ...payload,
        iat,
        exp,
    };

    const token = await jose.JWS.createSign(
        {format: 'compact', fields: {kid: keyId, alg: 'RS256'}},
        privateKey
    )
        .update(JSON.stringify(updatedPayload))
        .final();
    return token as unknown as string;
};

export const verifyToken = async (token: string): Promise<JwtPayload> => {
    const header = JSON.parse(jose.util.base64url.decode(token.split('.')[0]).toString());
    const kid = header.kid;

    if (!kid) {
        throw new Error('Invalid token: Key ID (kid) not found in token header');
    }

    const decoded = jose.util.base64url.decode(token.split('.')[1]);
    const payload: JwtPayload = JSON.parse(decoded.toString());

    if (!payload || !payload.cid) {
        throw new Error('Invalid token: Customer ID (cid) not found');
    }

    const { exp } = payload;
    const now = Math.floor(Date.now() / 1000);

    if (!exp || exp <= now) {
        throw new Error('Token has expired');
    }

    const { publicKey } = await getSigningKeysByKid(kid);

    try {
        const publicKeyJWK = await jose.JWK.asKey(publicKey, 'pem');
        const verified = await jose.JWS.createVerify(publicKeyJWK).verify(token);
        return JSON.parse(verified.payload.toString()) as JwtPayload;
    } catch (err) {
        throw new Error('Invalid token');
    }
};

export const verifyRefreshToken = async (token: string): Promise<JwtPayload> => {
    const header = JSON.parse(jose.util.base64url.decode(token.split('.')[0]).toString());
    const kid = header.kid;

    if (!kid) {
        throw new Error('Invalid token: Key ID (kid) not found in token header');
    }

    const decoded = jose.util.base64url.decode(token.split('.')[1]);
    const payload: JwtPayload = JSON.parse(decoded.toString());

    if (!payload || !payload.cid) {
        throw new Error('Invalid token: Customer ID (cid) not found');
    }

    const { exp } = payload;
    const now = Math.floor(Date.now() / 1000);

    if (!exp || exp <= now) {
        throw new Error('Token has expired');
    }

    const { publicKey } = await getSigningKeysByKid(kid);

    try {
        const publicKeyJWK = await jose.JWK.asKey(publicKey, 'pem');
        const verified = await jose.JWS.createVerify(publicKeyJWK).verify(token);
        return JSON.parse(verified.payload.toString()) as JwtPayload;
    } catch (err) {
        throw new Error('Invalid refresh token');
    }
};

