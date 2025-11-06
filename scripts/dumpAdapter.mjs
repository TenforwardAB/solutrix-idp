import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

await client.connect();
const result = await client.query("select name, id, expiresat from oidc_adapter_store order by createdat desc limit 20");
console.log(result.rows);
await client.end();
