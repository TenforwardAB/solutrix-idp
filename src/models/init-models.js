var DataTypes = require("sequelize").DataTypes;
var _SequelizeMeta = require("./SequelizeMeta");
var _activity_log = require("./activity_log");
var _auth_providers = require("./auth_providers");
var _auth_types = require("./auth_types");
var _customer = require("./customer");
var _customer_auth_config = require("./customer_auth_config");
var _customer_external_auth_domains = require("./customer_external_auth_domains");
var _domains = require("./domains");
var _edgerunner = require("./edgerunner");
var _failed_logins = require("./failed_logins");
var _issues = require("./issues");
var _jwt_rsa256_keys = require("./jwt_rsa256_keys");
var _license_keys = require("./license_keys");
var _license_model = require("./license_model");
var _permissions = require("./permissions");
var _pricing_model = require("./pricing_model");
var _rescue_email_mappings = require("./rescue_email_mappings");
var _role = require("./role");
var _role_permissions = require("./role_permissions");
var _user_role_customer = require("./user_role_customer");
var _verify_codes = require("./verify_codes");
var _whitelisted_tokens = require("./whitelisted_tokens");

function initModels(sequelize) {
  var SequelizeMeta = _SequelizeMeta(sequelize, DataTypes);
  var activity_log = _activity_log(sequelize, DataTypes);
  var auth_providers = _auth_providers(sequelize, DataTypes);
  var auth_types = _auth_types(sequelize, DataTypes);
  var customer = _customer(sequelize, DataTypes);
  var customer_auth_config = _customer_auth_config(sequelize, DataTypes);
  var customer_external_auth_domains = _customer_external_auth_domains(sequelize, DataTypes);
  var domains = _domains(sequelize, DataTypes);
  var edgerunner = _edgerunner(sequelize, DataTypes);
  var failed_logins = _failed_logins(sequelize, DataTypes);
  var issues = _issues(sequelize, DataTypes);
  var jwt_rsa256_keys = _jwt_rsa256_keys(sequelize, DataTypes);
  var license_keys = _license_keys(sequelize, DataTypes);
  var license_model = _license_model(sequelize, DataTypes);
  var permissions = _permissions(sequelize, DataTypes);
  var pricing_model = _pricing_model(sequelize, DataTypes);
  var rescue_email_mappings = _rescue_email_mappings(sequelize, DataTypes);
  var role = _role(sequelize, DataTypes);
  var role_permissions = _role_permissions(sequelize, DataTypes);
  var user_role_customer = _user_role_customer(sequelize, DataTypes);
  var verify_codes = _verify_codes(sequelize, DataTypes);
  var whitelisted_tokens = _whitelisted_tokens(sequelize, DataTypes);

  customer_auth_config.belongsTo(auth_providers, { as: "auth_provider", foreignKey: "auth_provider_id"});
  auth_providers.hasMany(customer_auth_config, { as: "customer_auth_configs", foreignKey: "auth_provider_id"});
  auth_providers.belongsTo(auth_types, { as: "auth_type", foreignKey: "auth_type_id"});
  auth_types.hasMany(auth_providers, { as: "auth_providers", foreignKey: "auth_type_id"});
  activity_log.belongsTo(customer, { as: "customer", foreignKey: "customerid"});
  customer.hasMany(activity_log, { as: "activity_logs", foreignKey: "customerid"});
  customer_auth_config.belongsTo(customer, { as: "customer", foreignKey: "customer_id"});
  customer.hasMany(customer_auth_config, { as: "customer_auth_configs", foreignKey: "customer_id"});
  customer_external_auth_domains.belongsTo(customer, { as: "customer", foreignKey: "customer_id"});
  customer.hasMany(customer_external_auth_domains, { as: "customer_external_auth_domains", foreignKey: "customer_id"});
  domains.belongsTo(customer, { as: "customer", foreignKey: "customerid"});
  customer.hasMany(domains, { as: "domains", foreignKey: "customerid"});
  edgerunner.belongsTo(customer, { as: "customer", foreignKey: "customerid"});
  customer.hasMany(edgerunner, { as: "edgerunners", foreignKey: "customerid"});
  issues.belongsTo(customer, { as: "customer", foreignKey: "customerid"});
  customer.hasMany(issues, { as: "issues", foreignKey: "customerid"});
  jwt_rsa256_keys.belongsTo(customer, { as: "customer", foreignKey: "customerId"});
  customer.hasMany(jwt_rsa256_keys, { as: "jwt_rsa256_keys", foreignKey: "customerId"});
  license_keys.belongsTo(customer, { as: "customer", foreignKey: "customerid"});
  customer.hasMany(license_keys, { as: "license_keys", foreignKey: "customerid"});
  license_model.belongsTo(customer, { as: "customer", foreignKey: "customerid"});
  customer.hasMany(license_model, { as: "license_models", foreignKey: "customerid"});
  user_role_customer.belongsTo(customer, { as: "customer", foreignKey: "customerid"});
  customer.hasMany(user_role_customer, { as: "user_role_customers", foreignKey: "customerid"});
  edgerunner.belongsTo(license_keys, { as: "licensekey", foreignKey: "licensekeyid"});
  license_keys.hasMany(edgerunner, { as: "edgerunners", foreignKey: "licensekeyid"});
  license_keys.belongsTo(license_model, { as: "licensemodel", foreignKey: "licensemodelid"});
  license_model.hasMany(license_keys, { as: "license_keys", foreignKey: "licensemodelid"});
  customer.belongsTo(pricing_model, { as: "pricingmodel", foreignKey: "pricingmodelid"});
  pricing_model.hasMany(customer, { as: "customers", foreignKey: "pricingmodelid"});
  role_permissions.belongsTo(role, { as: "rolename_role", foreignKey: "rolename"});
  role.hasMany(role_permissions, { as: "role_permissions", foreignKey: "rolename"});
  user_role_customer.belongsTo(role, { as: "role", foreignKey: "roleid"});
  role.hasMany(user_role_customer, { as: "user_role_customers", foreignKey: "roleid"});

  return {
    SequelizeMeta,
    activity_log,
    auth_providers,
    auth_types,
    customer,
    customer_auth_config,
    customer_external_auth_domains,
    domains,
    edgerunner,
    failed_logins,
    issues,
    jwt_rsa256_keys,
    license_keys,
    license_model,
    permissions,
    pricing_model,
    rescue_email_mappings,
    role,
    role_permissions,
    user_role_customer,
    verify_codes,
    whitelisted_tokens,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
