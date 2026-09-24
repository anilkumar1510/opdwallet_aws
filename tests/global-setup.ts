import { FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  // This runs before all tests
  // In a real scenario, we'd add the session cookie here
  console.log('Global setup: Session cookie would be injected here');
}