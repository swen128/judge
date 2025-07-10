import type { Reporter } from '../types/index.js';
import { StdoutReporter } from './stdout.js';
import { JsonReporter } from './json.js';

export function createReporter(type: 'stdout' | 'json'): Reporter {
  switch (type) {
    case 'stdout':
      return new StdoutReporter();
    case 'json':
      return new JsonReporter();
    default: {
      // This should never happen due to type checking
      return new StdoutReporter();
    }
  }
}