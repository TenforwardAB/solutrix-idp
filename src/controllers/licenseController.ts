/**
 * Copyright (C) 2024 [TSEI]
 *
 * Created on 2024-10-22 :: 22:01 BY andrek
 *
 */
import * as jose from 'node-jose';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateToken,verifyToken, JwtPayload } from '../services/jwtService';
import models from '../config/db';

interface LicenseInfo {
    cid: string;
    valid_to: Date | null;
    max_reviews: number | null;
    max_edgerunners: number | null;
    license_limit_type: string;
    licensekeyid: string;
}

async function generateSymmetricKey(): Promise<string> {
    const buffer = jose.util.randomBytes(32); // 256-bit key
    console.log("symmetricKey is: ", buffer.toString('base64'))
    return buffer.toString('base64');
}

function obfuscateKey(symmetricKey: string, jwe: string, separator: string = ':::'): string {

    const halfLength = Math.ceil(symmetricKey.length / 2);
    const prefix = symmetricKey.slice(0, halfLength);
    const suffix = symmetricKey.slice(halfLength);

    return `${suffix}${separator}${jwe}${separator}${prefix}`;
}


async function createJWKKey(symmetricKey: string) {
    const keyData = {
        kty: "oct",
        alg: "A256GCM",
        k: symmetricKey
    };
    return jose.JWK.asKey(keyData);
}

async function generateLicenseKey(customerid: string): Promise<string> {
    const licenseModel = await models.license_model.findOne({
        where: {
            customerid,
            active: true,
        },
    });

    if (!licenseModel) {
        throw new Error('No active license model found for this customer');
    }

    const { valid_to, max_reviews, license_limit_type, max_edgerunners } = licenseModel;

    const licensekeyid = uuidv4();

    const licenseInfo: LicenseInfo = {
        cid: customerid,
        valid_to,
        max_reviews,
        max_edgerunners,
        license_limit_type,
        licensekeyid,
    };

    const jwt = await generateToken(licenseInfo, false, true);

    const symmetricKey = await generateSymmetricKey();
    const key = await createJWKKey(symmetricKey);


    const jwe = await jose.JWE.createEncrypt({ format: 'compact', fields: { alg: 'dir', enc: 'A256GCM' } }, key)
        .update(jwt)
        .final();

    console.log("JWE IS: ", jwe);

    const obfuscatedKey = obfuscateKey(symmetricKey, jwe);

    await models.license_keys.create({
        licensekey: obfuscatedKey,
        licensekeyid,
        licensemodelid: licenseModel.licensemodelid,
        customerid,
    });

    return obfuscatedKey;
}



/**
 * Express route handler to generate and respond with a license key.
 * 
 * @async
 * @function createLicenseKey
 * @param {Request} req - The Express request object, containing the customer ID in req.body.
 * @param {Response} res - The Express response object, used to send back the generated license key.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 * 
 * @throws {400 Error} - If the customer ID is missing from the request.
 * @throws {500 Error} - If an internal error occurs during license key generation.
 */
export const createLicenseKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const { customerid } = req.body;

        // Validate required fields
        if (!customerid) {
            res.status(400).json({ error: 'Missing required field: customerid' });
            return;
        }

        // Generate and return the license key
        const licenseKey = await generateLicenseKey(customerid);
        res.status(200).json({ licenseKey });
    } catch (error) {
        console.error('Error generating license key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

async function logIssue(res: Response, statusCode: number, message: string, licenseInfo: LicenseInfo) {
    const issueData = {
        timestamp: new Date().toISOString(),
        message,
        licenseInfo: {
            customerid: licenseInfo.cid,
            valid_to: licenseInfo.valid_to,
            max_reviews: licenseInfo.max_reviews,
            max_edgerunners: licenseInfo.max_edgerunners,
            license_limit_type: licenseInfo.license_limit_type,
            licensekeyid: licenseInfo.licensekeyid,
        },
    };

    try {
        const issueRecord = await models.issues.create({
            customerid: licenseInfo.cid,
            issue: issueData,
        });

        return res.status(statusCode).json({ customerid: licenseInfo.cid, issueid: issueRecord.issueid });
    } catch (error) {
        console.error("Failed to log issue:", error);
        return res.status(500).json({ message: "An error occurred while processing the request" });
    }
}

/**
 * Express route handler to validate a license key based on a token and hardware key (hwkey).
 * 
 * @async
 * @function validateLicenseKey
 * @param {Request} req - The Express request object, containing token and hwkey in req.body.
 * @param {Response} res - The Express response object, used to send validation results or error messages.
 * @returns {Promise<void>} - A promise that resolves when the validation response is sent.
 * 
 * @throws {400 Error} - If the token or hwkey is missing from the request body.
 * @throws {400 Error} - If customer ID or license key ID is not found in the decoded token.
 * @throws {404 Error} - If the license key or active license model for the customer is not found.
 * @throws {403 Error} - If the maximum allowed edgerunners for the license is reached.
 * @throws {401 Error} - If the token is invalid or an internal error occurs during validation.
 */
export const validateLicenseKey = async (req: Request, res: Response) => {
    const { token, hwkey } = req.body;
    const defaultLicenseInfo: LicenseInfo = {
        cid: "",
        valid_to: null,
        max_reviews: null,
        max_edgerunners: null,
        license_limit_type: "",
        licensekeyid: ""
    };

    if (!token || !hwkey) {
        return await logIssue(res, 400, "Token or hardware key is missing from the request body", defaultLicenseInfo);
    }

    try {
        const decodedToken = await verifyToken(token) as JwtPayload;
        const customerid = decodedToken.cid;
        const licensekeyid = decodedToken.licensekeyid;

        if (!customerid || !licensekeyid) {
            return await logIssue(res, 400, "Customer ID or License Key ID not found in token", defaultLicenseInfo);
        }

        // Fetch license key details and populate licenseInfo
        const licenseKey = await models.license_keys.findOne({ where: { licensekeyid } });
        if (!licenseKey) {
            return await logIssue(res, 404, "License key not found", defaultLicenseInfo);
        }

        const licenseModel = await models.license_model.findOne({
            where: { customerid, active: true },
        });

        if (!licenseModel) {
            return await logIssue(res, 404, "Active license model not found for customer", {
                cid: customerid,
                valid_to: null,
                max_reviews: null,
                max_edgerunners: null,
                license_limit_type: "",
                licensekeyid
            });
        }

        const maxEdgerunners = licenseModel.max_edgerunners || 1;
        const edgerunnerCount = await models.edgerunner.count({
            where: { customerid, licensekeyid },
        });

        const licenseInfo: LicenseInfo = {
            cid: customerid,
            valid_to: licenseModel.valid_to,
            max_reviews: licenseModel.max_reviews,
            max_edgerunners: licenseModel.max_edgerunners,
            license_limit_type: licenseModel.license_limit_type,
            licensekeyid
        };

        if (edgerunnerCount > maxEdgerunners) {
            return await logIssue(res, 403, "Maximum allowed edgerunners reached for this license", licenseInfo);
        }

        const edgerunner = await models.edgerunner.findOne({
            where: { customerid, hwkey, licensekeyid },
        });

        if (edgerunner) {
            return res.status(200).json({ message: "License validation successful", customerid });
        } else {
            await models.edgerunner.create({
                customerid,
                licensekeyid,
                hwkey,
            });
            return res.status(201).json({ message: "Edgerunner registered and license validated", customerid });
        }
    } catch (error) {
        console.log(error);
        return await logIssue(res, 401, "Invalid token", defaultLicenseInfo);
    }
};



export const deactivateLicenseKey = async (req: Request, res: Response) => {

    res.status(200).json({ message: "License key has been deactivated" });
};


/**
 * Express route handler to log a user activity.
 * 
 * @async
 * @function logActivity
 * @param {Request} req - The Express request object, containing type, userid, useremail, customerid, and activity_info in req.body.
 * @param {Response} res - The Express response object, used to confirm successful logging or return an error.
 * @returns {Promise<void>} - A promise that resolves when the log response is sent.
 * 
 * @throws {400 Error} - If type, useremail, or customerid fields are missing from the request body.
 * @throws {500 Error} - If an internal error occurs during activity logging.
 */
export async function logActivity(req: Request, res: Response) {
  const { type, userid, useremail, customerid, activity_info } = req.body;

  // Check for missing required fields
  if (!type || !useremail || !customerid) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Create a new entry in the activity log
    await models.activity_log.create({
      type,
      userid,
      useremail,
      customerid,
      activity_info,
    });

    // Respond with success message
    res.status(200).json({ message: "Activity logged successfully" });
  } catch (error) {
    console.error("Error logging activity:", error);
    res.status(500).json({ message: "Error logging activity" });
  }
}