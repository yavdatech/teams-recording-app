import { RetryableError } from "../shared/errors";
import { AppLogger } from "../shared/logger";
import { retry } from "../shared/retry";
import { GraphTokenProvider } from "../auth/token-provider";

export class GraphApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
    public readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = "GraphApiError";
  }
}

export interface GraphRequestOptions {
  initialDelayMs?: number;
  maxAttempts?: number;
  maxDelayMs?: number;
  name: string;
  retryableStatuses?: Set<number>;
}

export class GraphApiClient {
  public constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: GraphTokenProvider,
    private readonly logger: AppLogger
  ) {}

  public async getJson<T>(path: string, options: GraphRequestOptions): Promise<T> {
    const response = await this.request(path, { method: "GET" }, options);
    return (await response.json()) as T;
  }

  public async postJson<T>(path: string, body: unknown, options: GraphRequestOptions): Promise<T> {
    const response = await this.request(
      path,
      {
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      },
      options
    );

    return (await response.json()) as T;
  }

  public async patchJson<T>(path: string, body: unknown, options: GraphRequestOptions): Promise<T> {
    const response = await this.request(
      path,
      {
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json"
        },
        method: "PATCH"
      },
      options
    );

    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  }

  public async postNoContent(path: string, body: unknown, options: GraphRequestOptions): Promise<void> {
    await this.request(
      path,
      {
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      },
      options
    );
  }

  public async deleteNoContent(path: string, options: GraphRequestOptions): Promise<void> {
    await this.request(
      path,
      {
        method: "DELETE"
      },
      options
    );
  }

  public async downloadBuffer(
    path: string,
    options: GraphRequestOptions
  ): Promise<{ content: Buffer; contentType: string; etag?: string }> {
    const response = await this.request(path, { method: "GET" }, options);
    const arrayBuffer = await response.arrayBuffer();

    return {
      content: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
      etag: response.headers.get("etag") ?? undefined
    };
  }

  private async request(path: string, init: RequestInit, options: GraphRequestOptions): Promise<Response> {
    return retry(
      async () => {
        const token = await this.tokenProvider.getAccessToken();
        const url = path.startsWith("http") ? path : `${this.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

        const response = await fetch(url, {
          ...init,
          headers: {
            authorization: `Bearer ${token}`,
            ...init.headers
          }
        });

        if (response.ok) {
          return response;
        }

        const body = await safeReadResponseBody(response);
        const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
        const error = new GraphApiError(
          `Microsoft Graph request failed for ${options.name} with status ${response.status}.`,
          response.status,
          body,
          retryAfterMs
        );

        if (isRetryableStatus(response.status, options.retryableStatuses)) {
          throw new RetryableError(error.message, {
            cause: error,
            retryAfterMs
          });
        }

        throw error;
      },
      {
        initialDelayMs: options.initialDelayMs ?? 1_000,
        maxAttempts: options.maxAttempts ?? 5,
        maxDelayMs: options.maxDelayMs ?? 15_000,
        name: options.name,
        onRetry: async (error, nextAttempt, delayMs) => {
          this.logger.warn(
            {
              delayMs,
              error,
              nextAttempt,
              operation: options.name
            },
            "Retrying Microsoft Graph request."
          );
        }
      }
    );
  }
}

function isRetryableStatus(status: number, explicitStatuses?: Set<number>): boolean {
  if (explicitStatuses?.has(status)) {
    return true;
  }

  return status === 408 || status === 409 || status === 423 || status === 429 || status >= 500;
}

async function safeReadResponseBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function parseRetryAfterMs(retryAfterHeader: string | null): number | undefined {
  if (!retryAfterHeader) {
    return undefined;
  }

  const seconds = Number.parseInt(retryAfterHeader, 10);
  if (Number.isFinite(seconds)) {
    return seconds * 1_000;
  }

  const retryAt = Date.parse(retryAfterHeader);
  if (Number.isNaN(retryAt)) {
    return undefined;
  }

  return Math.max(retryAt - Date.now(), 0);
}
