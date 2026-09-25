import { Page, BrowserContext } from '@playwright/test';

export interface SessionConfig {
  sessionId?: string;
  baseUrl: string;
}

export class SessionManager {
  private context: BrowserContext;
  private config: SessionConfig;

  constructor(context: BrowserContext, config: SessionConfig) {
    this.context = context;
    this.config = config;
  }

  async setSessionCookie(sessionId: string): Promise<void> {
    await this.context.addCookies([{
      name: 'session_id',
      value: sessionId,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false
    }]);
  }

  async clearSession(): Promise<void> {
    await this.context.clearCookies();
  }

  async hasValidSession(): Promise<boolean> {
    const cookies = await this.context.cookies();
    return cookies.some(c => c.name === 'session_id');
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }
}

export async function createSessionManager(
  context: BrowserContext,
  baseUrl: string = 'http://localhost:4590'
): Promise<SessionManager> {
  const sessionId = process.env.SESSION_ID;
  const manager = new SessionManager(context, { baseUrl });
  
  if (sessionId) {
    await manager.setSessionCookie(sessionId);
  }
  
  return manager;
}

export async function injectSessionCookie(page: Page): Promise<void> {
  const sessionId = process.env.SESSION_ID;
  if (sessionId) {
    await page.context().addCookies([{
      name: 'session_id',
      value: sessionId,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false
    }]);
  }
}

export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<boolean> {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/member/**', { timeout: 10000 });
  return page.url().includes('/member');
}