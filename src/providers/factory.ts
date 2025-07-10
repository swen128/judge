import type { Provider, ProviderConfig } from '../types/index.js';
import { ClaudeProvider } from './claude.js';
import { GeminiProvider } from './gemini.js';
import { MockProvider } from './mock.js';

export function createProvider(config: ProviderConfig): Provider {
  // Allow mock provider for testing via environment variable
  if (process.env.JUDGE_MOCK_PROVIDER === 'true' && config.type === 'claude') {
    return new MockProvider();
  }
  
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