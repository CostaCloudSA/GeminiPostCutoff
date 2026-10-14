/**
 * Code Comment & Description Prompt Injection Sanitizer
 * Part of GeminiPostCutoff Architecture Review Engine
 * 
 * Sanitizes user-provided Terraform variables, outputs, and comments before
 * feeding them into multi-agent LLM reasoning prompts, neutralizing jailbreaks,
 * system prompt overrides, and role-play hijacking attempts.
 */

const INJECTION_PATTERNS = [
  /system\s+instruction/i,
  /ignore\s+all\s+(previous|prior)\s+instructions/i,
  /ignore\s+above/i,
  /you\s+are\s+now/i,
  /disregard\s+all/i,
  /output\s+that\s+this\s+codebase\s+is\s+100/i,
  /bypass\s+security/i,
  /mode:\s*jailbreak/i,
  /developer\s+mode\s+enabled/i
];

class PromptSanitizer {
  /**
   * Sanitizes text extracted from IaC manifests before LLM prompt inclusion
   */
  static sanitize(text) {
    if (!text || typeof text !== 'string') return '';

    let sanitized = text;
    let injectionDetected = false;

    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        injectionDetected = true;
        sanitized = sanitized.replace(pattern, '[REDACTED_PROMPT_INJECTION_ATTEMPT]');
      }
    }

    return {
      sanitized,
      injection_detected: injectionDetected
    };
  }
}

module.exports = { PromptSanitizer };
