// Minimal `{key}` find-replace for pattern prompts. Deliberately not a templating
// engine — CLAUDE.md invariant: minimal dependencies. Placeholder syntax is
// `{snake_case_ascii}` so JSON braces in prompt bodies pass through untouched.

export function renderTemplate(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  const missing: string[] = [];
  const out = template.replace(/\{([a-z][a-z0-9_]*)\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key] ?? "";
    }
    missing.push(key);
    return match;
  });
  if (missing.length > 0) {
    throw new Error(`renderTemplate: missing keys: ${Array.from(new Set(missing)).join(", ")}`);
  }
  return out;
}
