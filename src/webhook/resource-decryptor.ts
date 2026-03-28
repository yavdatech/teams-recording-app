import {
  constants,
  createDecipheriv,
  createHmac,
  KeyObject,
  privateDecrypt,
  timingSafeEqual
} from "node:crypto";

import { NonRetriableError } from "../shared/errors";
import { GraphEncryptedContent } from "./notification-types";

export class ResourceDataDecryptor {
  public constructor(private readonly privateKey: KeyObject) {}

  public decrypt<T extends Record<string, unknown>>(encryptedContent: GraphEncryptedContent): T {
    const symmetricKey = privateDecrypt(
      {
        key: this.privateKey,
        oaepHash: "sha1",
        padding: constants.RSA_PKCS1_OAEP_PADDING
      },
      Buffer.from(encryptedContent.dataKey, "base64")
    );

    const expectedSignature = Buffer.from(encryptedContent.dataSignature, "base64");
    const actualSignature = createHmac("sha256", symmetricKey).update(encryptedContent.data, "base64").digest();

    if (
      expectedSignature.length !== actualSignature.length ||
      !timingSafeEqual(expectedSignature, actualSignature)
    ) {
      throw new NonRetriableError("Microsoft Graph notification signature validation failed.");
    }

    const iv = symmetricKey.subarray(0, 16);
    const decipher = createDecipheriv("aes-256-cbc", symmetricKey, iv);
    let decrypted = decipher.update(encryptedContent.data, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted) as T;
  }
}
