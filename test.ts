import { WildduckNodeSDK } from 'wildduck-nodesdk';

const sdk = new WildduckNodeSDK("Iys5nUZqh4cYU85JcH1b86PgX6TxmX2qJN1iNUvlu", "http://mailer.solutrix.io:8080");

(async () => {
  try {
    const user = await sdk.users.getUser("673e6f9af5c0a0006080f843");
    console.log("Users:", user);
  } catch (error) {
    console.error("Error fetching users:");
  }
})();
