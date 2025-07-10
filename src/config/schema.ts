import { z } from 'zod';
import type { ConfigSchema } from '../types/index.js';

const SeveritySchema = z.enum(['error', 'warning', 'notice']);

const RuleSchema = z.object({
  path: z.string(),
  cache: z.boolean().optional(),
});

const FilePatternSchema = z.object({
  include: z.array(z.string()),
  exclude: z.array(z.string()).optional(),
});

const RuleBindingSchema = z.object({
  name: z.string(),
  files: FilePatternSchema,
  rules: z.array(RuleSchema),
  fail_on: SeveritySchema.optional(),
  confidence_threshold: z.number().min(0).max(1).optional(),
});

export const JudgeConfigSchema: ConfigSchema = z.object({
  version: z.literal('1.0'),
  provider: z.enum(['claude', 'gemini']),
  timeout: z.number().positive().optional(),
  cache_dir: z.string().optional(),
  fail_on_issues: z.boolean().optional(),
  max_concurrent_checks: z.number().positive().optional(),
  rule_bindings: z.array(RuleBindingSchema),
});