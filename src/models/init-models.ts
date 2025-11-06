// @ts-nocheck
import type { Sequelize } from "sequelize";
import { SequelizeMeta as _SequelizeMeta } from "./SequelizeMeta.js";
import type { SequelizeMetaAttributes, SequelizeMetaCreationAttributes } from "./SequelizeMeta.js";
import { identity_policies as _identity_policies } from "./identity_policies.js";
import type { identity_policiesAttributes, identity_policiesCreationAttributes } from "./identity_policies.js";
import { jwt_rsa256_keys as _jwt_rsa256_keys } from "./jwt_rsa256_keys.js";
import type { jwt_rsa256_keysAttributes, jwt_rsa256_keysCreationAttributes } from "./jwt_rsa256_keys.js";
import { oidc_adapter_store as _oidc_adapter_store } from "./oidc_adapter_store.js";
import type { oidc_adapter_storeAttributes, oidc_adapter_storeCreationAttributes } from "./oidc_adapter_store.js";
import { oidc_clients as _oidc_clients } from "./oidc_clients.js";
import type { oidc_clientsAttributes, oidc_clientsCreationAttributes } from "./oidc_clients.js";
import { saml_service_providers as _saml_service_providers } from "./saml_service_providers.js";
import type { saml_service_providersAttributes, saml_service_providersCreationAttributes } from "./saml_service_providers.js";
import { token_exchange_events as _token_exchange_events } from "./token_exchange_events.js";
import type { token_exchange_eventsAttributes, token_exchange_eventsCreationAttributes } from "./token_exchange_events.js";
import { token_exchange_policies as _token_exchange_policies } from "./token_exchange_policies.js";
import type { token_exchange_policiesAttributes, token_exchange_policiesCreationAttributes } from "./token_exchange_policies.js";

export {
  _SequelizeMeta as SequelizeMeta,
  _identity_policies as identity_policies,
  _jwt_rsa256_keys as jwt_rsa256_keys,
  _oidc_adapter_store as oidc_adapter_store,
  _oidc_clients as oidc_clients,
  _saml_service_providers as saml_service_providers,
  _token_exchange_events as token_exchange_events,
  _token_exchange_policies as token_exchange_policies,
};

export type {
  SequelizeMetaAttributes,
  SequelizeMetaCreationAttributes,
  identity_policiesAttributes,
  identity_policiesCreationAttributes,
  jwt_rsa256_keysAttributes,
  jwt_rsa256_keysCreationAttributes,
  oidc_adapter_storeAttributes,
  oidc_adapter_storeCreationAttributes,
  oidc_clientsAttributes,
  oidc_clientsCreationAttributes,
  saml_service_providersAttributes,
  saml_service_providersCreationAttributes,
  token_exchange_eventsAttributes,
  token_exchange_eventsCreationAttributes,
  token_exchange_policiesAttributes,
  token_exchange_policiesCreationAttributes,
};

export function initModels(sequelize: Sequelize) {
  const SequelizeMeta = _SequelizeMeta.initModel(sequelize);
  const identity_policies = _identity_policies.initModel(sequelize);
  const jwt_rsa256_keys = _jwt_rsa256_keys.initModel(sequelize);
  const oidc_adapter_store = _oidc_adapter_store.initModel(sequelize);
  const oidc_clients = _oidc_clients.initModel(sequelize);
  const saml_service_providers = _saml_service_providers.initModel(sequelize);
  const token_exchange_events = _token_exchange_events.initModel(sequelize);
  const token_exchange_policies = _token_exchange_policies.initModel(sequelize);


  return {
    SequelizeMeta: SequelizeMeta,
    identity_policies: identity_policies,
    jwt_rsa256_keys: jwt_rsa256_keys,
    oidc_adapter_store: oidc_adapter_store,
    oidc_clients: oidc_clients,
    saml_service_providers: saml_service_providers,
    token_exchange_events: token_exchange_events,
    token_exchange_policies: token_exchange_policies,
  };
}
