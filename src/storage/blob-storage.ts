import {
  BlobRequestConditions,
  BlobServiceClient,
  BlockBlobUploadOptions,
  ContainerClient
} from "@azure/storage-blob";

import { Env } from "../config/env";
import { ArtifactIngestionJob } from "../ingestion/types";
import { AppLogger } from "../shared/logger";
import { FetchedArtifact, StoredArtifact } from "../shared/types";
import { buildArtifactBlobNames, buildDeadLetterBlobName, buildRawNotificationBlobName } from "./layout";

export interface JsonBlob<T> {
  blobName: string;
  etag?: string;
  value: T;
}

export class AzureBlobStorage {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerClients = new Map<string, ContainerClient>();

  public constructor(connectionString: string) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  public getContainerClient(containerName: string): ContainerClient {
    const existing = this.containerClients.get(containerName);
    if (existing) {
      return existing;
    }

    const created = this.blobServiceClient.getContainerClient(containerName);
    this.containerClients.set(containerName, created);
    return created;
  }

  public async ensureContainers(containerNames: string[]): Promise<void> {
    for (const name of containerNames) {
      await this.getContainerClient(name).createIfNotExists();
    }
  }

  public async getJson<T>(containerName: string, blobName: string): Promise<JsonBlob<T> | null> {
    const blobClient = this.getContainerClient(containerName).getBlockBlobClient(blobName);

    if (!(await blobClient.exists())) {
      return null;
    }

    const content = await blobClient.downloadToBuffer();
    return {
      blobName,
      etag: (await blobClient.getProperties()).etag,
      value: JSON.parse(content.toString("utf8")) as T
    };
  }

  public async listJson<T>(containerName: string, prefix: string): Promise<Array<JsonBlob<T>>> {
    const container = this.getContainerClient(containerName);
    const items: Array<JsonBlob<T>> = [];

    for await (const blob of container.listBlobsFlat({ prefix })) {
      const item = await this.getJson<T>(containerName, blob.name);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  public async putJson<T>(
    containerName: string,
    blobName: string,
    value: T,
    conditions?: BlobRequestConditions
  ): Promise<{ etag?: string; url: string }> {
    const payload = Buffer.from(JSON.stringify(value, null, 2));
    return this.putBuffer(containerName, blobName, payload, "application/json", undefined, conditions);
  }

  public async putBuffer(
    containerName: string,
    blobName: string,
    content: Buffer,
    contentType: string,
    metadata?: Record<string, string>,
    conditions?: BlobRequestConditions
  ): Promise<{ etag?: string; url: string }> {
    const blobClient = this.getContainerClient(containerName).getBlockBlobClient(blobName);
    const options: BlockBlobUploadOptions = {
      blobHTTPHeaders: {
        blobContentType: contentType
      },
      conditions,
      metadata
    };

    const response = await blobClient.uploadData(content, options);
    return {
      etag: response.etag,
      url: blobClient.url
    };
  }

  public async deleteBlob(containerName: string, blobName: string): Promise<void> {
    try {
      await this.getContainerClient(containerName).deleteBlob(blobName, {
        deleteSnapshots: "include"
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "statusCode" in error && (error as { statusCode?: number }).statusCode === 404) {
        return;
      }

      throw error;
    }
  }
}

export class ArtifactBlobStore {
  public constructor(
    private readonly env: Env,
    private readonly blobStorage: AzureBlobStorage,
    private readonly logger: AppLogger
  ) {}

  public async storeArtifact(job: ArtifactIngestionJob, artifact: FetchedArtifact): Promise<StoredArtifact> {
    const occurredAt =
      (artifact.metadata.createdDateTime as string | undefined) ??
      (artifact.metadata.endDateTime as string | undefined) ??
      job.notificationReceivedAt;

    const names = buildArtifactBlobNames(job.tenantId, artifact.reference, occurredAt, artifact.contentType);

    const metadataUpload = await this.blobStorage.putJson(
      this.env.AZURE_BLOB_CONTAINER_ARTIFACTS,
      names.metadataBlobName,
      {
        fetchedAt: artifact.fetchedAt,
        graphMetadata: artifact.metadata,
        sourceResourcePath: artifact.sourceResourcePath
      }
    );

    const contentUpload = await this.blobStorage.putBuffer(
      this.env.AZURE_BLOB_CONTAINER_ARTIFACTS,
      names.contentBlobName,
      artifact.content,
      artifact.contentType,
      {
        artifactType: artifact.reference.artifactType,
        tenantId: job.tenantId
      }
    );

    const notificationUpload = await this.blobStorage.putJson(
      this.env.AZURE_BLOB_CONTAINER_ARTIFACTS,
      names.notificationBlobName,
      {
        decryptedResourceData: job.decryptedResourceData,
        notificationReceivedAt: job.notificationReceivedAt,
        resourceData: job.resourceData,
        sourceNotification: job.sourceNotification
      }
    );

    this.logger.info(
      {
        artifactId: artifact.reference.artifactId,
        artifactType: artifact.reference.artifactType,
        contentBlobName: names.contentBlobName
      },
      "Stored Teams artifact in Azure Blob Storage."
    );

    return {
      contentBlobName: names.contentBlobName,
      contentBlobUrl: contentUpload.url,
      metadataBlobName: names.metadataBlobName,
      metadataBlobUrl: metadataUpload.url,
      notificationBlobName: names.notificationBlobName,
      notificationBlobUrl: notificationUpload.url
    };
  }

  public async archiveRawNotification(kind: "resource" | "lifecycle", payload: unknown): Promise<void> {
    const blobName = buildRawNotificationBlobName(kind);
    await this.blobStorage.putJson(this.env.AZURE_BLOB_CONTAINER_DEADLETTER, blobName, payload);
  }

  public async archiveDeadLetter(scope: string, payload: unknown): Promise<void> {
    const blobName = buildDeadLetterBlobName(scope);
    await this.blobStorage.putJson(this.env.AZURE_BLOB_CONTAINER_DEADLETTER, blobName, payload);
    this.logger.error({ blobName, scope }, "Archived payload to dead-letter storage.");
  }
}
