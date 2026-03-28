import { BlobRequestConditions } from "@azure/storage-blob";

import { AppLogger } from "../shared/logger";
import { AzureBlobStorage } from "./blob-storage";

export interface StateDocument<T> {
  etag?: string;
  key: string;
  value: T;
}

export class BlobStateStore {
  public constructor(
    private readonly containerName: string,
    private readonly blobStorage: AzureBlobStorage,
    private readonly logger: AppLogger
  ) {}

  public async get<T>(key: string): Promise<StateDocument<T> | null> {
    const document = await this.blobStorage.getJson<T>(this.containerName, key);

    if (!document) {
      return null;
    }

    return {
      etag: document.etag,
      key,
      value: document.value
    };
  }

  public async list<T>(prefix: string): Promise<T[]> {
    const items = await this.blobStorage.listJson<T>(this.containerName, prefix);
    return items.map((item) => item.value);
  }

  public async put<T>(key: string, value: T, conditions?: BlobRequestConditions): Promise<StateDocument<T>> {
    const result = await this.blobStorage.putJson(this.containerName, key, value, conditions);
    this.logger.debug({ key }, "Persisted JSON state to Blob Storage.");

    return {
      etag: result.etag,
      key,
      value
    };
  }

  public async delete(key: string): Promise<void> {
    await this.blobStorage.deleteBlob(this.containerName, key);
  }
}
