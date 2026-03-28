import type { TokenCredential } from "@azure/identity";

export class GraphTokenProvider {
  private cachedToken?: { expiresOnTimestamp: number; token: string };

  public constructor(
    private readonly credential: TokenCredential,
    private readonly scope: string
  ) {}

  public async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresOnTimestamp - Date.now() > 120_000) {
      return this.cachedToken.token;
    }

    const token = await this.credential.getToken(this.scope);

    if (!token?.token) {
      throw new Error("Failed to acquire Microsoft Graph access token.");
    }

    this.cachedToken = token;
    return token.token;
  }
}
