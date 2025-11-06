#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import dotenv from "dotenv";

dotenv.config();

const require = createRequire(import.meta.url);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

let parsedUrl;

try {
    parsedUrl = new URL(databaseUrl);
} catch (error) {
    console.error("Failed to parse DATABASE_URL", error);
    process.exit(1);
}

const database = parsedUrl.pathname.replace(/^\/+/, "");

if (!database) {
    console.error("DATABASE_URL is missing the database name");
    process.exit(1);
}

const host = parsedUrl.hostname || "127.0.0.1";
const port = parsedUrl.port || "5432";
const username = decodeURIComponent(parsedUrl.username || "");
const password = decodeURIComponent(parsedUrl.password || "");
const schema = parsedUrl.searchParams.get("schema") || undefined;

const dialect = (() => {
    const proto = parsedUrl.protocol.replace(/:$/, "");
    if (proto.startsWith("postgres")) {
        return "postgres";
    }
    return proto || "postgres";
})();

const args = [
    "-d",
    database,
    "-h",
    host,
    "-u",
    username,
    "-x",
    password,
    "-p",
    port,
    "-e",
    dialect,
    "-o",
    "./src/models",
    "-l",
    "ts",
];

if (schema) {
    args.push("-s", schema);
}

const extras = process.argv.slice(2);

const runSequelizeAuto = (command, commandArgs) => {
    execFileSync(command, commandArgs, {
        stdio: "inherit",
    });
};

const adjustGeneratedFiles = (directory) => {
    let entries = [];
    try {
        entries = fs.readdirSync(directory);
    } catch {
        return;
    }

    for (const entry of entries) {
        const fullPath = path.join(directory, entry);
        const stats = fs.statSync(fullPath);
        if (!stats.isFile() || !entry.endsWith(".ts")) {
            continue;
        }
        let contents = fs.readFileSync(fullPath, "utf8");

        if (!contents.startsWith("// @ts-nocheck")) {
            contents = `// @ts-nocheck\n${contents}`;
        }

        contents = contents.replace(/from\s+(['"])(\.\/[^'"]+)\1/g, (match, quote, importPath) => {
            if (importPath.endsWith(".js") || importPath.endsWith(".ts") || importPath.startsWith("..")) {
                return match;
            }
            return `from ${quote}${importPath}.js${quote}`;
        });

        fs.writeFileSync(fullPath, contents, "utf8");
    }
};

try {
    const bin = require.resolve("sequelize-auto/bin/sequelize-auto");
    runSequelizeAuto(process.execPath, [bin, ...args, ...extras]);
    adjustGeneratedFiles(path.resolve("./src/models"));
} catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "MODULE_NOT_FOUND") {
        console.warn("sequelize-auto is not installed; skipping model generation. Install it with `npm install --save-dev sequelize-auto` to enable this step.");
        process.exit(0);
    }
    throw error;
}
