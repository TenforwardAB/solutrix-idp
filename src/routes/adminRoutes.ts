import { Router } from "express";
import {
    createClient,
    deleteClient,
    getClient,
    listClients,
    updateClient,
    createServiceProvider,
    deleteServiceProvider,
    getServiceProvider,
    listServiceProviders,
    updateServiceProvider,
    rotateSigningKey,
    createPolicy,
    deletePolicy,
    getPolicy,
    listPolicies,
    updatePolicy,
} from "../controllers/adminController.js";

const router = Router();

// OIDC Clients
router.get("/clients", listClients);
router.get("/clients/:id", getClient);
router.post("/clients", createClient);
router.put("/clients/:id", updateClient);
router.delete("/clients/:id", deleteClient);

// SAML Service Providers
router.get("/sps", listServiceProviders);
router.get("/sps/:id", getServiceProvider);
router.post("/sps", createServiceProvider);
router.put("/sps/:id", updateServiceProvider);
router.delete("/sps/:id", deleteServiceProvider);

// Signing keys
router.post("/keys/rotate", rotateSigningKey);

// Policies
router.get("/policies", listPolicies);
router.get("/policies/:id", getPolicy);
router.post("/policies", createPolicy);
router.put("/policies/:id", updatePolicy);
router.delete("/policies/:id", deletePolicy);

export default router;
