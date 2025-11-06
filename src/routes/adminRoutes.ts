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

/**
 * @openapi
 * /api/global/admin/clients:
 *   get:
 *     summary: List registered OIDC/OAuth clients.
 *     tags: [Admin Clients]
 *     responses:
 *       200:
 *         description: A list of clients.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdminClient'
 */
router.get("/clients", listClients);

/**
 * @openapi
 * /api/global/admin/clients/{id}:
 *   get:
 *     summary: Retrieve a specific client.
 *     tags: [Admin Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Database identifier of the client.
 *     responses:
 *       200:
 *         description: The client details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminClient'
 *       404:
 *         description: Client not found.
 */
router.get("/clients/:id", getClient);

/**
 * @openapi
 * /api/global/admin/clients:
 *   post:
 *     summary: Create a new client.
 *     tags: [Admin Clients]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAdminClientRequest'
 *     responses:
 *       201:
 *         description: Client created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminClientWithSecret'
 *       400:
 *         description: Invalid payload.
 */
router.post("/clients", createClient);

/**
 * @openapi
 * /api/global/admin/clients/{id}:
 *   put:
 *     summary: Update an existing client.
 *     tags: [Admin Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAdminClientRequest'
 *     responses:
 *       200:
 *         description: Updated client.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminClientOptionalSecret'
 *       400:
 *         description: Invalid payload.
 *       404:
 *         description: Client not found.
 */
router.put("/clients/:id", updateClient);

/**
 * @openapi
 * /api/global/admin/clients/{id}:
 *   delete:
 *     summary: Delete a client.
 *     tags: [Admin Clients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Client deleted.
 *       404:
 *         description: Client not found.
 */
router.delete("/clients/:id", deleteClient);

/**
 * @openapi
 * /api/global/admin/sps:
 *   get:
 *     summary: List SAML service providers.
 *     tags: [Admin SAML]
 *     responses:
 *       200:
 *         description: Array of SAML service providers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SamlServiceProvider'
 */
router.get("/sps", listServiceProviders);

/**
 * @openapi
 * /api/global/admin/sps/{id}:
 *   get:
 *     summary: Retrieve a SAML service provider.
 *     tags: [Admin SAML]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service provider record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SamlServiceProvider'
 *       404:
 *         description: Service provider not found.
 */
router.get("/sps/:id", getServiceProvider);

/**
 * @openapi
 * /api/global/admin/sps:
 *   post:
 *     summary: Create a SAML service provider.
 *     tags: [Admin SAML]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSamlServiceProviderRequest'
 *     responses:
 *       201:
 *         description: Service provider created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SamlServiceProvider'
 *       400:
 *         description: Invalid payload.
 */
router.post("/sps", createServiceProvider);

/**
 * @openapi
 * /api/global/admin/sps/{id}:
 *   put:
 *     summary: Update a SAML service provider.
 *     tags: [Admin SAML]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSamlServiceProviderRequest'
 *     responses:
 *       200:
 *         description: Updated service provider.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SamlServiceProvider'
 *       400:
 *         description: Invalid payload.
 *       404:
 *         description: Service provider not found.
 */
router.put("/sps/:id", updateServiceProvider);

/**
 * @openapi
 * /api/global/admin/sps/{id}:
 *   delete:
 *     summary: Delete a SAML service provider.
 *     tags: [Admin SAML]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Service provider deleted.
 *       404:
 *         description: Service provider not found.
 */
router.delete("/sps/:id", deleteServiceProvider);

/**
 * @openapi
 * /api/global/admin/keys/rotate:
 *   post:
 *     summary: Rotate RSA signing keys.
 *     tags: [Admin Keys]
 *     responses:
 *       201:
 *         description: New signing key generated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SigningKey'
 */
router.post("/keys/rotate", rotateSigningKey);

/**
 * @openapi
 * /api/global/admin/policies:
 *   get:
 *     summary: List identity policies.
 *     tags: [Admin Policies]
 *     responses:
 *       200:
 *         description: Array of policies.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IdentityPolicy'
 */
router.get("/policies", listPolicies);

/**
 * @openapi
 * /api/global/admin/policies/{id}:
 *   get:
 *     summary: Retrieve a policy by id.
 *     tags: [Admin Policies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Policy details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IdentityPolicy'
 *       404:
 *         description: Policy not found.
 */
router.get("/policies/:id", getPolicy);

/**
 * @openapi
 * /api/global/admin/policies:
 *   post:
 *     summary: Create a policy.
 *     tags: [Admin Policies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePolicyRequest'
 *     responses:
 *       201:
 *         description: Policy created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IdentityPolicy'
 *       400:
 *         description: Invalid payload.
 */
router.post("/policies", createPolicy);

/**
 * @openapi
 * /api/global/admin/policies/{id}:
 *   put:
 *     summary: Update a policy.
 *     tags: [Admin Policies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePolicyRequest'
 *     responses:
 *       200:
 *         description: Updated policy.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IdentityPolicy'
 *       400:
 *         description: Invalid payload.
 *       404:
 *         description: Policy not found.
 */
router.put("/policies/:id", updatePolicy);

/**
 * @openapi
 * /api/global/admin/policies/{id}:
 *   delete:
 *     summary: Delete a policy.
 *     tags: [Admin Policies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Policy deleted.
 *       404:
 *         description: Policy not found.
 */
router.delete("/policies/:id", deletePolicy);

export default router;
