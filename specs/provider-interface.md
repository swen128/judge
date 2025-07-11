# Provider Interface Specification

All provider implementations must conform to the Provider interface:

1. **Required methods**:
   - `validate(): Promise<void>` - Validates the provider is available
   - `check(request: CheckRequest): Promise<CheckResponse>` - Performs semantic checking

2. **Consistent behavior**:
   - Providers must parse AI output to extract structured issues
   - Must handle malformed responses gracefully (return empty issues array)
   - Must respect timeout settings from CheckRequest

3. **Response format**:
   - Issues must include: severity, message, file, line, confidence
   - Metadata must include: model name and duration
   - All fields must be properly typed (no any types)

4. **Error handling**:
   - Network/execution errors should be caught and handled gracefully
   - API/CLI tool failures should provide meaningful error messages

5. **Implementation requirements**:
   - Claude provider uses @anthropic-ai/sdk (Anthropic SDK)
   - Gemini provider uses stdin for prompts via CLI
   - Claude requires ANTHROPIC_API_KEY environment variable
   - Gemini must properly escape/format prompts for shell execution

This ensures all providers work consistently and reliably.