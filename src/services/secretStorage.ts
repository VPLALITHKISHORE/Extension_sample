// src/services/secretStorage.ts
import * as vscode from 'vscode';

const GEMINI_API_KEY = 'baselineGuard.geminiApiKey';

export class SecretStorageService {
  private static instance: SecretStorageService;
  private secretStorage: vscode.SecretStorage;

  private constructor(context: vscode.ExtensionContext) {
    this.secretStorage = context.secrets;
  }

  static initialize(context: vscode.ExtensionContext): SecretStorageService {
    if (!SecretStorageService.instance) {
      SecretStorageService.instance = new SecretStorageService(context);
    }
    return SecretStorageService.instance;
  }

  static getInstance(): SecretStorageService {
    if (!SecretStorageService.instance) {
      throw new Error('SecretStorageService not initialized');
    }
    return SecretStorageService.instance;
  }

  async storeGeminiApiKey(apiKey: string): Promise<void> {
    await this.secretStorage.store(GEMINI_API_KEY, apiKey);
  }

  async getGeminiApiKey(): Promise<string | undefined> {
    return await this.secretStorage.get(GEMINI_API_KEY);
  }

  async deleteGeminiApiKey(): Promise<void> {
    await this.secretStorage.delete(GEMINI_API_KEY);
  }

  async hasGeminiApiKey(): Promise<boolean> {
    const key = await this.getGeminiApiKey();
    return !!key;
  }
}
