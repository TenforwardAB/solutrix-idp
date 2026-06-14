import crypto from "node:crypto";

const ENCRYPTED_PREFIX = "enc:v1:";
const KEY_ENV = "IDP_SECRET_ENCRYPTION_KEY";

const getEncryptionKey = (): Buffer => {
    const raw = process.env[KEY_ENV];
    if (!raw || raw.length < 32) {
        throw new Error(`${KEY_ENV} must be set to a 32+ character secret`);
    }
    return crypto.createHash("sha256").update(raw).digest();
};

export const isEncryptedSecret = (value: string): boolean => value.startsWith(ENCRYPTED_PREFIX);

export const encryptSecret = (plaintext: string): string => {
    if (isEncryptedSecret(plaintext)) {
        return plaintext;
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [
        ENCRYPTED_PREFIX.slice(0, -1),
        iv.toString("base64url"),
        tag.toString("base64url"),
        ciphertext.toString("base64url"),
    ].join(":");
};

export const decryptSecret = (value: string): string => {
    if (!isEncryptedSecret(value)) {
        return value;
    }

    const [, version, encodedIv, encodedTag, encodedCiphertext] = value.split(":");
    if (version !== "v1" || !encodedIv || !encodedTag || !encodedCiphertext) {
        throw new Error("Invalid encrypted secret format");
    }

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        getEncryptionKey(),
        Buffer.from(encodedIv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));

    return Buffer.concat([
        decipher.update(Buffer.from(encodedCiphertext, "base64url")),
        decipher.final(),
    ]).toString("utf8");
};
