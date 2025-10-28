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
 * Created on 12/9/24 :: 7:13PM BY joyider <andre(-at-)sess.se>
 *
 * This file :: fileTrekkerRoutes.ts is part of the solutrix-api project.
 */

import express from 'express';
import fileTrekkerController from '../controllers/fileTrekkerController';
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post('/folders', authMiddleware, fileTrekkerController.createFolder);
router.get('/folders/:ownerId', authMiddleware, fileTrekkerController.listFolders);
router.put('/folders/:folderId', authMiddleware, fileTrekkerController.updateFolder);
router.delete('/folders/:folderId', authMiddleware, fileTrekkerController.deleteFolder);

router.post('/files', authMiddleware, fileTrekkerController.uploadFile);
router.get('/files/:ownerId', authMiddleware, fileTrekkerController.listFiles);
router.put('/files/:fileId', authMiddleware, fileTrekkerController.updateFile);
router.delete('/files/:fileId', authMiddleware, fileTrekkerController.deleteFile);

export default router;
