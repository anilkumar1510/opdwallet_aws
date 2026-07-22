import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Secure Storage Module
 *
 * Provides encrypted storage for sensitive data on web platform.
 * Uses SecureStore on native platforms (iOS/Android).
 * Uses AES-256-GCM encryption with Web Crypto API on web.
 *
 * HIPAA Compliance: Ensures PHI is encrypted at rest.
 */

// Storage keys
const ENCRYPTION_KEY_NAME = '_secure_storage_key';
const STORAGE_PREFIX = '_enc_';

/**
 * Generates a cryptographic key for AES-256-GCM encryption
 */
async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable - needed for storage
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports a CryptoKey to a base64 string for storage
 */
async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Imports a base64 string back to a CryptoKey
 */
async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * In-memory key cache for the current session
 * Key is cleared on logout/page refresh
 */
let encryptionKeyCache: CryptoKey | null = null;

/**
 * Gets or creates the encryption key
 * Key is stored in sessionStorage (cleared on tab close)
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Return cached key if available
  if (encryptionKeyCache) {
    return encryptionKeyCache;
  }

  // Try to load from sessionStorage
  const storedKey = sessionStorage.getItem(ENCRYPTION_KEY_NAME);
  if (storedKey) {
    encryptionKeyCache = await importKey(storedKey);
    return encryptionKeyCache;
  }

  // Generate new key
  const newKey = await generateEncryptionKey();
  const exportedKey = await exportKey(newKey);
  sessionStorage.setItem(ENCRYPTION_KEY_NAME, exportedKey);
  encryptionKeyCache = newKey;
  return newKey;
}

/**
 * Encrypts a string value using AES-256-GCM
 */
async function encrypt(value: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedValue = new TextEncoder().encode(value);

  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedValue
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a string value using AES-256-GCM
 */
async function decrypt(encryptedValue: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0));

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decryptedData);
}

/**
 * Web-specific secure storage implementation
 */
const webSecureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    try {
      const encryptedValue = localStorage.getItem(STORAGE_PREFIX + key);
      if (!encryptedValue) return null;
      return await decrypt(encryptedValue);
    } catch {
      // If decryption fails (e.g., key changed), remove the corrupted data
      localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;

    try {
      const encryptedValue = await encrypt(value);
      localStorage.setItem(STORAGE_PREFIX + key, encryptedValue);
    } catch (error) {
      // Fallback: store without encryption in development only
      if (__DEV__) {
        console.warn('[SecureStorage] Encryption failed, storing unencrypted in dev mode');
        localStorage.setItem(key, value);
      } else {
        throw error;
      }
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_PREFIX + key);
    // Also remove unencrypted key if it exists (migration)
    localStorage.removeItem(key);
  },

  /**
   * Clears the encryption key from memory and session storage
   * Should be called on logout
   */
  clearEncryptionKey: (): void => {
    encryptionKeyCache = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ENCRYPTION_KEY_NAME);
    }
  },
};

/**
 * Native-specific secure storage implementation
 * Uses expo-secure-store which provides hardware-backed encryption
 */
const nativeSecureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(key);
  },

  setItem: async (key: string, value: string): Promise<void> => {
    return SecureStore.setItemAsync(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    return SecureStore.deleteItemAsync(key);
  },

  clearEncryptionKey: (): void => {
    // No-op for native - SecureStore handles key management
  },
};

/**
 * Cross-platform secure storage
 * Automatically selects the appropriate implementation based on platform
 */
export const secureStorage = Platform.OS === 'web' ? webSecureStorage : nativeSecureStorage;

/**
 * Clears all secure storage data
 * Should be called on logout
 */
export async function clearSecureStorage(): Promise<void> {
  if (Platform.OS === 'web') {
    // Clear all encrypted items from localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      webSecureStorage.clearEncryptionKey();
    }
  }
  // Native storage is cleared per-key in logout flow
}

export default secureStorage;
