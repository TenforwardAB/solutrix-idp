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
 * Created on 12/9/24 :: 7:14PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: fileTrekkerService.ts is part of the solutrix-api project.
 */

import axios, { AxiosRequestConfig } from 'axios';
import { Request } from 'express';

import models from "../config/db";
import {generateToken} from "./jwtService";

//TODO: We need to re use all interfaces and store them separatly
export interface AuthenticatedRequest extends Request {
    user?: any;
    'X-API-UserID'?: string;
}

const FILETREKKER_API_BASE_URL = process.env.FILETREKKER_API_BASE_URL || 'https://filetrekker.example.com/api';
const FILETREKKER_STATIC_TOKEN = process.env.FILETREKKER_STATIC_TOKEN || '';

class FileTrekkerService {
    async forwardRequest(method: string, endpoint: string, req: AuthenticatedRequest) {
        const permissionsJWT = await this.generateUserPermissionsJWT(req['X-API-UserID'] as string);

        const config: AxiosRequestConfig = {
            method,
            url: `${FILETREKKER_API_BASE_URL}${endpoint}`,
            headers: {
                Authorization: req.headers.authorization,
                'X-API-AccessToken': FILETREKKER_STATIC_TOKEN,
                'X-API-UserID': req['X-API-UserID'],
                'Content-Type': req.headers['content-type'],
            },
            data: {
                ...req.body,
                permissions: permissionsJWT,
            },
        };

        if (req.file) {
            config.data = req.file;
            config.headers = {
                ...config.headers,
                'Content-Type': 'multipart/form-data',
            };
        }

        return axios(config);
    }

    async generateUserPermissionsJWT(userId: string): Promise<string> {
        try {
            const userRole = await models.user_role_customer.findOne({
                where: {
                    userid: userId,
                    roleid: '00F1', //TODO:: no good hardcoded ID....
                },
            });

            const payload = {
                isAdmiral: !!userRole,
                customerid: userRole.customerid
            };

            return generateToken(payload)
        } catch (error) {
            console.error('Error generating user permissions JWT:', error);
            throw new Error('Failed to generate permissions JWT');
        }
    }
}

export default new FileTrekkerService();
