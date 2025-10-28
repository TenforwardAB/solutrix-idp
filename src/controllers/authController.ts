import bcrypt from "bcryptjs";
import {Request, Response} from "express";
import { Op } from 'sequelize';
import {generateToken, verifyToken} from "../services/jwtService";
import {fetchUserPermissions} from '../services/authService';
import { MessageService } from '../services/mail/messageService'
import moment from "moment";
import models from "../config/db";
import {wds} from "../config/db";
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';

const messageService = new MessageService();

dotenv.config();

const WD_API_URL = process.env.WD_API_URL as string;
const WD_API_KEY = process.env.WD_API_KEY as string;

interface RegisterRequestBody {
    username: string;
    password: string;
    email: string;
    customerid: string;
}

interface LoginRequestBody {
    username: string;
    password: string;
}

const expiryMinutes = parseInt(process.env.ACCESS_TOKEN_EXPIRY_MINUTES || '10', 10);

const generateTokens = async (user: any, cid: string) => {
    const accessExp = moment().add(expiryMinutes, 'minutes').unix();
    const refreshExp = moment().add(1, 'year').unix();

    const accessToken = await generateToken({
        id: user.userid,
        customerid: user.customerid,
        cid,
    });

    const refreshToken = await generateToken({
        id: user.userid,
        cid,
    }, true);

    await models.whitelisted_tokens.create({
        token: accessToken,
        token_type: 'ACCESS',
        expires_at: moment.unix(accessExp).toDate(),
    });

    await models.whitelisted_tokens.create({
        token: refreshToken,
        token_type: 'REFRESH',
        expires_at: moment.unix(refreshExp).toDate(),
    });

    return {accessToken, refreshToken, accessExp, refreshExp};
};

const getUserRolesAndToken = async (user: any, cid: string) => {


    const role= user.role
    let isAdmiral = role === 'Admiral';



    const userToken = await generateToken({
        id: user.userid,
        customerid: user.customerid,
        email: user.email,
        legacy_cid: user.customer?.legacy_cid,
        isAdmiral,
        role: role,
    }, true);

    return {userToken, isAdmiral};
};

async function logActivity(
    type: string,
    userid: string,
    useremail: string,
    customerid: string,
    activityInfo: object
): Promise<void> {
    await models.activity_log.create({
        type,
        userid,
        useremail,
        customerid,
        activity_info: activityInfo,
    });
}


export const wd_login = async (req: Request, res: Response): Promise<Response | void> => {
    const {username, password}: LoginRequestBody = req.body;
    console.log(username, password);

    try {
        const wildDuckAuthResponse = await wds.authentication.authenticate(username, password);

        if (!wildDuckAuthResponse.success || !wildDuckAuthResponse.id) {
            return res.status(401).json({error: 'Invalid credentials (WildDuck)'});
        }

        // Fetch user data from WildDuck API
        const wildDuckUser = await wds.users.getUser(wildDuckAuthResponse.id);

        if (!wildDuckUser || !wildDuckUser.success) {
            return res.status(401).json({error: 'User not found in WildDuck'});
        }

        const {
            id: userid,
            address: email,
            internalData,
            activated,
            suspended,
            disabled
        } = wildDuckUser;

        if (!activated || suspended || disabled) {
            return res.status(403).json({error: 'User account is not active'});
        }

        const {role, cid: customerid} = internalData;

        // Handle failed login attempts
        const failRecord = await models.failed_logins.findOne({
            where: {userid},
        });

        if (failRecord && failRecord.fail_count >= 5) {
            const nextAllowedLogin = new Date(failRecord.last_failed_at || new Date());

            if (failRecord.fail_count >= 11) {
                nextAllowedLogin.setHours(nextAllowedLogin.getHours() + 1);
            } else {
                const additionalMinutes = 15 + (failRecord.fail_count - 5) * 5;
                nextAllowedLogin.setMinutes(nextAllowedLogin.getMinutes() + additionalMinutes);
            }

            if (new Date() < nextAllowedLogin) {
                await models.failed_logins.update(
                    {fail_count: failRecord.fail_count + 1, last_failed_at: new Date()},
                    {where: {userid}}
                );
                await logActivity(
                    "login",
                    userid,
                    email || "",
                    customerid,
                    {
                        login_type: "local",
                        status: "fail",
                        reason: "Too many login attempts",
                        activity_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    }
                );
                return res.status(429).json({
                    error: `Too many failed attempts. Try again after ${nextAllowedLogin.toISOString()}`,
                });
            }
        }

        // Reset failed login streak on success
        if (failRecord) {
            await models.failed_logins.update(
                {fail_count: 0, last_failed_at: null},
                {where: {userid}}
            );
        }

        // Generate tokens and log the successful login
        const {accessToken, refreshToken, accessExp, refreshExp} = await generateTokens(
            {userid, email, customerid},
            customerid
        );

        const {userToken, isAdmiral} = await getUserRolesAndToken(
            {userid, email, customerid, role},
            customerid
        );

        console.log("IA: ", isAdmiral);
        console.log("AE: ", accessExp);
        console.log("RE: ", refreshExp);

        await logActivity(
            "login",
            userid,
            email || "",
            customerid,
            {
                login_type: "local",
                status: "ok",
                activity_ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            }
        );

        const up = await fetchUserPermissions(userid)

            return res.json({
                identifyer: {
                    id: userid,
                    cid: customerid,
                    email: email,
                    isadmiral: isAdmiral,
                    permissions: up?.permissions
                },
                access: {token: accessToken, exp: accessExp},
                refresh: {token: refreshToken, exp: refreshExp},
                user: {token: userToken, exp: refreshExp},
            });

    } catch (error: any) {
        if (error?.response) {
            return res.status(error.response.status).json({error: error.response.data});
        }
        return res.status(401).json({error: error.message});
    }
};

export const preAuth = async (req: Request, res: Response): Promise<Response> => {
    const { username, scope } = req.body;
    console.log(username);

    if (typeof username !== "string" || username.trim() === "") {
        return res.status(400).json({ exists: false, message: "username is required" });
    }

    try {

        const result = await wds.authentication.preAuth(username, scope || 'master');

        return res.json({ exists: result.success });
    } catch (rawErr) {
        console.log(typeof rawErr);

        const errMsg =
            rawErr instanceof Error
                ? rawErr.message
                : typeof rawErr === "string"
                    ? rawErr
                    : JSON.stringify(rawErr);

        if (errMsg.includes("HTTP 403")) {
            return res.json({ exists: false });
        }

        return res
            .status(502)
            .json({ exists: false, message: "upstream error" });
    }
};

export const resolveAddressInfo = async (req: Request, res: Response): Promise<Response> => {
    const { username, scope } = req.body;
    console.log(username);

    if (typeof username !== "string" || username.trim() === "") {
        return res.status(400).json({ exists: false, message: "username is required" });
    }

    try {

        const result = await wds.addresses.resolveAddressInfo(username);

        return res.json({ exists: result.success });
    } catch (rawErr) {

        const errMsg =
            rawErr instanceof Error
                ? rawErr.message
                : typeof rawErr === "string"
                    ? rawErr
                    : JSON.stringify(rawErr);

        if (errMsg.includes("HTTP 404")) {
            return res.json({ exists: false });
        }

        return res
            .status(502)
            .json({ exists: false, message: "upstream error" });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<Response | void> => {
    let refreshToken;
    try {
        const cookieHeader = req.headers['cookie'];
        if (cookieHeader) {
            refreshToken = cookieHeader
                .split('; ')
                .find(cookie => cookie.startsWith('sid2_'))
                ?.split('=')[1];
        }
        if (!refreshToken) {
            refreshToken = req.body.refreshToken;
        }
    }
    catch {
        refreshToken = req.body.refreshToken; // Machine
    }
    if (!refreshToken) {

    }
    console.log(refreshToken);


    try {
        const tokenExists = await models.whitelisted_tokens.findOne({
            where: {token: refreshToken},
        });

        if (!tokenExists) {
            return res.status(401).json({error: 'Refresh token is invalidated'});
        }
        const decoded = await verifyToken(refreshToken)

        const {internalData: {customerid}} = await wds.users.getUser(decoded.id);

        const newAccessToken = await generateToken({
            id: decoded.id,
            customerid: customerid,
            cid: decoded.cid,
        });

        const accessExp = moment().add(expiryMinutes, 'minutes').unix();
        await models.whitelisted_tokens.create({
            token: newAccessToken,
            token_type: 'ACCESS',
            expires_at: moment.unix(accessExp).toDate(),
        });

        return res.json({
            access: {
                token: newAccessToken,
                exp: accessExp
            }
        });

    } catch (error) {
        console.error('Error verifying refresh token:', error);
        return res.status(401).json({error: 'Invalid refresh token'});
    }
};

export const getUserPermissions = async (req: Request, res: Response): Promise<Response> => {
    try {
        // @ts-ignore
        const userId = req['X-API-UserID'];
        if (!userId) {
            return res.status(400).json({message: 'User ID is missing in the request'});
        }

        const result = await fetchUserPermissions(userId);

        if (!result) {
            return res.status(404).json({message: 'Permissions not found for the user'});
        }

        return res.json(result);
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        return res.status(500).json({message: 'Internal server error'});
    }
};


export const logout = async (req: Request, res: Response): Promise<void> => {
    const {accessToken, refreshToken} = req.body;

    if (!accessToken || !refreshToken) {
        res.status(400).json({message: 'Access token and refresh token are required'});
        return;
    }

    try {

        await models.whitelisted_tokens.destroy({
            where: {
                token: [accessToken, refreshToken],
            },
        });

        res.status(200).json({message: 'Logged out successfully'});
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({message: 'An error occurred during logout'});
    }
};

// Generate a 6-digit numeric code
function generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /verify-code/send
 * { type: 'mail', target: 'user@example.com' }
 */
export async function sendVerificationCode(
    req: Request,
    res: Response
): Promise<Response> {
    const { type, target } = req.body;
    if (type !== 'mail') {
        return res
            .status(400)
            .json({ success: false, message: 'Only mail verification supported' });
    }
    if (typeof target !== 'string' || !target.includes('@')) {
        return res
            .status(400)
            .json({ success: false, message: 'Valid email (target) is required' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    try {
        // create a new code record
        await models.verify_codes.create({
            id: uuidv4(),
            type: 'mail',
            target,
            code,
            expiresAt,
            used: false,
        });

        const payload: {
            mailbox: string;
            from: { name: string; address: string };
            replyTo?: { name: string; address: string };
            to: { name: string; address: string }[];
            cc?: { name: string; address: string }[];
            subject: string;
            text: string;
            // …plus any other optional fields you might add, e.g. html, attachments, envelope, etc.
        } = {
            mailbox: '6831d6b1ac19dd89efe88703',
            from: {
                name: 'Solutrix - No Reply',
                address: 'no-reply@solutrix.io',
            },
            to: [
                {
                    name: '',           // you can supply a display name if you have one
                    address: target,    // your original `target` variable
                }
            ],
            subject: 'Your verification code',
            text:    `Your verification code is: ${code} (valid for 15 minutes)`,
        };

        await messageService.sendMessage("6831d6b1ac19dd89efe88700", payload);

        return res.json({ success: true, message: 'Verification code sent' });
    } catch (err: any) {
        console.error('sendVerificationCode error:', err);
        return res
            .status(500)
            .json({ success: false, message: 'Failed to send verification code' });
    }
}

/**
 * POST /verify-code/check
 * { type: 'mail', target: 'user@example.com', code: '123456' }
 */
export async function verifyCode(
    req: Request,
    res: Response
): Promise<Response> {
    const { type, target, code } = req.body;
    if (type !== 'mail') {
        return res
            .status(400)
            .json({ success: false, message: 'Only mail verification supported' });
    }
    if (!target || !code) {
        return res
            .status(400)
            .json({ success: false, message: 'target and code are required' });
    }

    try {
        const record = await models.verify_codes.findOne({
            where: {
                type: 'mail',
                target,
                code,
                used:    false,
                expiresAt: { [Op.gt]: new Date() },
            },
        });

        if (!record) {
            return res
                .status(400)
                .json({ success: false, message: 'Invalid or expired code' });
        }

        // consume it
        record.used = true;
        await record.save();

        return res.json({ success: true, message: 'Verified' });
    } catch (err: any) {
        console.error('verifyCode error:', err);
        return res
            .status(500)
            .json({ success: false, message: 'Verification failed' });
    }
}

