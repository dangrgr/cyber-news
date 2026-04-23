// Title-similarity ratio used by dedup. PRD §8.2 specifies rapidfuzz `ratio > 85`.
// Implemented inline to keep the dependency surface minimal.
//
// Matches rapidfuzz.fuzz.ratio semantics: Indel similarity (insertions and
// deletions only, no substitutions) normalized over the *sum* of lengths:
//
//   indel_distance = len(a) + len(b) - 2 * LCS(a, b)
//   ratio          = (1 - indel_distance / (len(a) + len(b))) * 100
//
// Over normalized strings (lowercase, collapsed whitespace, punctuation stripped).

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lcsLength(a: string, b: string): number {
  if (a === b) return a.length;
  if (a.length === 0 || b.length === 0) return 0;

  // Two-row DP for the longest common subsequence.
  let prev = new Array<number>(b.length + 1).fill(0);
  let curr = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      curr[j] = ai === b.charCodeAt(j - 1)
        ? prev[j - 1]! + 1
        : Math.max(prev[j]!, curr[j - 1]!);
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }
  return prev[b.length]!;
}

export function titleRatio(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  const totalLen = na.length + nb.length;
  if (totalLen === 0) return 100;
  const lcs = lcsLength(na, nb);
  const indelDistance = totalLen - 2 * lcs;
  return (1 - indelDistance / totalLen) * 100;
}
