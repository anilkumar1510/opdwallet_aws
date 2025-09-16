import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export class SecretsManager {
  private client: SecretsManagerClient;
  private secretCache: Record<string, any> = {};
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(region: string = 'eu-north-1') {
    this.client = new SecretsManagerClient({ region });
  }

  async getSecrets(secretName: string = 'opdwallet/production'): Promise<Record<string, string>> {
    // Check cache
    if (this.cacheExpiry > Date.now() && this.secretCache[secretName]) {
      return this.secretCache[secretName];
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);

      if (!response.SecretString) {
        throw new Error('Secret string is empty');
      }

      const secrets = JSON.parse(response.SecretString);

      // Update cache
      this.secretCache[secretName] = secrets;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return secrets;
    } catch (error) {
      console.error('Failed to retrieve secrets from AWS Secrets Manager:', error);

      // Fallback to environment variables
      return this.getFallbackSecrets();
    }
  }

  private getFallbackSecrets(): Record<string, string> {
    return {
      JWT_SECRET: process.env.JWT_SECRET || 'fallback-jwt-secret',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/opd_wallet',
      COOKIE_SECRET: process.env.COOKIE_SECRET || 'fallback-cookie-secret',
      SESSION_SECRET: process.env.SESSION_SECRET || 'fallback-session-secret',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'fallback-encryption-key',
    };
  }

  async loadSecretsToEnv(): Promise<void> {
    const secrets = await this.getSecrets();

    // Load secrets into process.env if not already set
    Object.entries(secrets).forEach(([key, value]) => {
      if (!process.env[key] && value) {
        process.env[key] = value;
      }
    });
  }
}

// Singleton instance
export const secretsManager = new SecretsManager();