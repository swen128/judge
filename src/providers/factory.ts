import type { Provider, ProviderConfig } from '../types/index.js';
import { ClaudeProvider } from './claude.js';
import { GeminiProvider } from './gemini.js';

export function createProvider(config: ProviderConfig): Provider {
  switch (config.type) {
    case 'claude':
      return new ClaudeProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      // TypeScript exhaustiveness check
      return new ClaudeProvider(); // This should never happen due to type checking
  }
}