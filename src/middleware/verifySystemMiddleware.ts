/**
 * This file is licensed under the European Union Public License (EUPL) v1.2.
 * You may only use this work in compliance with the License.
 * You may obtain a copy of the License at:
 *
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed "as is",
 * without any warranty or conditions of any kind.
 *
 * Copyright (c) 2024- Tenforward AB. All rights reserved.
 *
 * Created on 5/24/25 :: 7:43PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: verifyCodeSecretMiddleware.ts is part of the solutrix-api project.
 */
import { Request, Response, NextFunction } from 'express';

export function verifySystemMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.log(req);
    const provided = req.header('X-Verify-Code-Secret');
    const expected  = process.env.VERIFY_CODE_SECRET;

    if (!provided || provided !== expected) {
        return res
            .status(403)
            .json({ success: false, message: 'Forbidden' });
    }
    next();
}