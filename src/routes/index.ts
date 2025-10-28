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
 * Created on 12/20/24 :: 11:24AM BY joyider <andre(-at-)sess.se>
 *
 * This file :: index.ts is part of the solutrix-api project.
 */

import { Router } from "express";
import mailboxRoutes from "./mail/mailboxRoutes";
import messageRouter  from "./mail/messageRoutes"
import filterRouter from "./mail/filterRoutes";


const mailrouter = Router();

// Other routes...
mailrouter.use("/mailboxes", mailboxRoutes);
mailrouter.use("/messages", messageRouter);
mailrouter.use("/filters", filterRouter);

export default mailrouter;
