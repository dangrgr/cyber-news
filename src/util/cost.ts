// Per-model rate constants and cost computation. Single source of truth so
// orchestrator + run-log + future dashboards never drift.
//
// CLAUDE.md cost discipline: triage/extract/factcheck/vendor_doc_review use
// Haiku-class; investigation uses Sonnet. Rates are USD per million tokens.

export interface ModelRates {
  inputPerMillion: number;
  outputPerMillion: number;
}

export const DEFAULT_SONNET_RATES: ModelRates = {
  inputPerMillion: 3,
  outputPerMillion: 15,
};

export const DEFAULT_HAIKU_RATES: ModelRates = {
  inputPerMillion: 1,
  outputPerMillion: 5,
};

export function computeCost(
  inputTokens: number,
  outputTokens: number,
  rates: ModelRates,
): number {
  const ins = inputTokens / 1_000_000;
  const outs = outputTokens / 1_000_000;
  return ins * rates.inputPerMillion + outs * rates.outputPerMillion;
}

/**
 * Pick rates for a given model id. Substring match on "haiku" → Haiku rates,
 * else Sonnet (the project's only two model families today).
 */
export function ratesForModel(modelId: string): ModelRates {
  return modelId.toLowerCase().includes("haiku")
    ? DEFAULT_HAIKU_RATES
    : DEFAULT_SONNET_RATES;
}
