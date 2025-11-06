import { Sequelize } from "sequelize";
import defineJwtKeys from "./jwt_rsa256_keys.js";
import defineOidcAdapterStore from "./oidc_adapter_store.js";
import defineOidcClient from "./oidc_client.js";
import defineSamlServiceProvider from "./saml_service_provider.js";
import defineIdentityPolicy from "./identity_policy.js";
import defineTokenExchangePolicy from "./token_exchange_policy.js";
import defineTokenExchangeEvent from "./token_exchange_event.js";

export interface Models {
    jwt_rsa256_keys: ReturnType<typeof defineJwtKeys>;
    oidc_adapter_store: ReturnType<typeof defineOidcAdapterStore>;
    oidc_clients: ReturnType<typeof defineOidcClient>;
    saml_service_providers: ReturnType<typeof defineSamlServiceProvider>;
    identity_policies: ReturnType<typeof defineIdentityPolicy>;
    token_exchange_policies: ReturnType<typeof defineTokenExchangePolicy>;
    token_exchange_events: ReturnType<typeof defineTokenExchangeEvent>;
}

const initModels = (sequelize: Sequelize): Models => {
    const jwt_rsa256_keys = defineJwtKeys(sequelize);
    const oidc_adapter_store = defineOidcAdapterStore(sequelize);
    const oidc_clients = defineOidcClient(sequelize);
    const saml_service_providers = defineSamlServiceProvider(sequelize);
    const identity_policies = defineIdentityPolicy(sequelize);
    const token_exchange_policies = defineTokenExchangePolicy(sequelize);
    const token_exchange_events = defineTokenExchangeEvent(sequelize);

    return {
        jwt_rsa256_keys,
        oidc_adapter_store,
        oidc_clients,
        saml_service_providers,
        identity_policies,
        token_exchange_policies,
        token_exchange_events,
    };
};

export default initModels;
