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
 * This file :: fileTrekkerController.ts is part of the solutrix-api project.
 */

import { Request, Response } from 'express';
import fileTrekkerService from '../services/fileTrekkerService';
import { fileTrekkerError } from "../errors/fileTrekkerError";

class FileTrekkerController {
    async createFolder(req: Request, res: Response): Promise<void> {
        try {
            const response = await fileTrekkerService.forwardRequest('POST', '/folders', req);
            res.status(response.status).json(response.data);
        } catch (err) {
            const customError = fileTrekkerError(err);
            res.status(customError.status).json({ error: customError.message, details: customError.details });
        }
    }

    async listFolders(req: Request, res: Response): Promise<void> {
        try {
            const response = await fileTrekkerService.forwardRequest('GET', `/folders/${req.params.ownerId}`, req);
            res.status(response.status).json(response.data);
        } catch (err) {
            const customError = fileTrekkerError(err);
            res.status(customError.status).json({ error: customError.message, details: customError.details });
        }
    }

    async updateFolder(req: Request, res: Response): Promise<void> {
        try {
            const response = await fileTrekkerService.forwardRequest('PUT', `/folders/${req.params.folderId}`, req);
            res.status(response.status).json(response.data);
        } catch (err) {
            const customError = fileTrekkerError(err);
            res.status(customError.status).json({ error: customError.message, details: customError.details });
        }
    }

    async deleteFolder(req: Request, res: Response): Promise<void> {
        try {
            const response = await fileTrekkerService.forwardRequest('DELETE', `/folders/${req.params.folderId}`, req);
            res.status(response.status).json(response.data);
        } catch (err) {
            const customError = fileTrekkerError(err);
            res.status(customError.status).json({ error: customError.message, details: customError.details });
        }
    }

    async uploadFile(req: Request, res: Response): Promise<void> {
        try {
            const response = await fileTrekkerService.forwardRequest('POST', '/files', req);
            res.status(response.status).json(response.data);
        } catch (err) {
            const customError = fileTrekkerError(err);
            res.status(customError.status).json({ error: customError.message, details: customError.details });
        }
    }

    async listFiles(req: Request, res: Response): Promise<void> {
        try {
            const response = await fileTrekkerService.forwardRequest('GET', `/files/${req.params.ownerId}`, req);
            res.status(response.status).json(response.data);
        } catch (err) {
            const customError = fileTrekkerError(err);
            res.status(customError.status).json({ error: customError.message, details: customError.details });
        }
    }

    async updateFile(req: Request, res: Response): Promise<void> {
        try {
            const response = await fileTrekkerService.forwardRequest('PUT', `/files/${req.params.fileId}`, req);
            res.status(response.status).json(response.data);
        } catch (err) {
            const customError = fileTrekkerError(err);
            res.status(customError.status).json({ error: customError.message, details: customError.details });
        }
    }

    async deleteFile(req: Request, res: Response): Promise<void> {
        try {
            const response = await fileTrekkerService.forwardRequest('DELETE', `/files/${req.params.fileId}`, req);
            res.status(response.status).json(response.data);
        } catch (err) {
            const customError = fileTrekkerError(err);
            res.status(customError.status).json({ error: customError.message, details: customError.details });
        }
    }
}

export default new FileTrekkerController();