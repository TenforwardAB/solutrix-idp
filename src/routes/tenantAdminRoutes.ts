import { Router } from "express";
import {
    createTenantClient,
    deleteTenantClient,
    getTenantClient,
    listTenantClients,
    rotateTenantClientSecret,
    updateTenantClient,
} from "../controllers/tenantAdminController.js";
import { requireIdpClientPermission } from "../middleware/requireOidcAdmin.js";

const router = Router();

router.get("/clients", requireIdpClientPermission("read"), listTenantClients);
router.post("/clients", requireIdpClientPermission("create"), createTenantClient);
router.get("/clients/:id", requireIdpClientPermission("read"), getTenantClient);
router.put("/clients/:id", requireIdpClientPermission("update"), updateTenantClient);
router.post("/clients/:id/rotate-secret", requireIdpClientPermission("update"), rotateTenantClientSecret);
router.delete("/clients/:id", requireIdpClientPermission("delete"), deleteTenantClient);

export default router;
