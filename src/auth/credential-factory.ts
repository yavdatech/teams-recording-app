import {
  ClientCertificateCredential,
  ClientSecretCredential,
  ManagedIdentityCredential,
  TokenCredential
} from "@azure/identity";

import { Env } from "../config/env";

export function createGraphCredential(env: Env): TokenCredential {
  if (env.AZURE_USE_MANAGED_IDENTITY) {
    return new ManagedIdentityCredential(env.AZURE_MANAGED_IDENTITY_CLIENT_ID);
  }

  if (env.AZURE_CLIENT_CERTIFICATE_PATH) {
    return new ClientCertificateCredential(
      env.AZURE_TENANT_ID,
      env.AZURE_CLIENT_ID,
      env.AZURE_CLIENT_CERTIFICATE_PATH,
      {
        certificatePassword: env.AZURE_CLIENT_CERTIFICATE_PASSWORD
      }
    );
  }

  if (!env.AZURE_CLIENT_SECRET) {
    throw new Error("AZURE_CLIENT_SECRET is required when managed identity and certificate auth are not configured.");
  }

  return new ClientSecretCredential(env.AZURE_TENANT_ID, env.AZURE_CLIENT_ID, env.AZURE_CLIENT_SECRET);
}
