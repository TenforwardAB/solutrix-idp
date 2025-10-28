import {NextFunction, Request, Response} from 'express';
import {verifyToken, JwtPayload} from '../services/jwtService';
import models from "../config/db";

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
    ['X-API-UserID']?: string;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        let token: string | undefined;

        // ✅ Extract `access_token` from `req.headers['cookie']`
        const cookieHeader = req.headers['cookie'];
        if (cookieHeader) {
            token = cookieHeader
                .split('; ')
                .find(cookie => cookie.startsWith('sid1_'))
                ?.split('=')[1];
        }

        // ✅ If no cookie token, check `Authorization` header (for API/M2M authentication)
        if (!token) {
            const authHeader = req.header('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        // ❌ No token found, deny access
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // ✅ Verify token
        req.user = await verifyToken(token);

        // ✅ Check if token exists in the whitelist
        const tokenExists = await models.whitelisted_tokens.findOne({
            where: { token },
        });

        if (!tokenExists) {
            return res.status(401).json({ message: 'Token is invalidated' });
        }

        // ✅ Attach user ID to request for easier API usage
        if (req.user && req.user.id) {
            req['X-API-UserID'] = String(req.user.id);
        }

        next(); // Continue to the next middleware

    } catch (err) {
        console.error("Authentication error:", err);
        return res.status(401).json({ message: 'Token is not valid' });
    }
};



