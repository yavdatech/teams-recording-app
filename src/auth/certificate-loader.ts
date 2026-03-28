import { createPrivateKey, KeyObject } from "node:crypto";
import { readFile } from "node:fs/promises";

export async function loadGraphEncryptionCertificateBase64(path: string): Promise<string> {
  const content = await readFile(path, "utf8");

  if (content.includes("BEGIN CERTIFICATE")) {
    return content.replace(/-----BEGIN CERTIFICATE-----/g, "").replace(/-----END CERTIFICATE-----/g, "").replace(/\s+/g, "");
  }

  return Buffer.from(content).toString("base64");
}

export async function loadGraphNotificationPrivateKey(
  path: string,
  passphrase?: string
): Promise<KeyObject> {
  const content = await readFile(path, "utf8");

  return createPrivateKey({
    key: content,
    format: "pem",
    passphrase
  });
}
