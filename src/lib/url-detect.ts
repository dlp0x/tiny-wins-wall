/**
 * Deterministic link detection for little wins (GitHub issue #5).
 * Product rule: no URL is allowed, harmless or not.
 *
 * Supported patterns (case-insensitive):
 *  1. Any scheme followed by "://" (http://, https://, ftp://, hxxp://…).
 *  2. Dangerous/linking schemes without "//": javascript:, data:, mailto:.
 *  3. "www" followed by a dot-like separator (www.x, www . x, www[.]x).
 *  4. A bare domain: label + dot-like separator + a known TLD from the list
 *     below (example.com, EXAMPLE.CA, example[.]org, example (dot) com,
 *     example dot com, example point fr, full-width dots).
 *
 * Known limits: domains on TLDs outside the list, letter-spaced schemes
 * ("h t t p"), IP addresses without a scheme, and links described in prose
 * are not detected. A plain "." followed by a space is NOT treated as a
 * separator, so ordinary sentences ("…fini. Me voilà") are not blocked.
 */

export const BLOCKED_TLDS = [
  "com", "net", "org", "ca", "fr", "io", "co", "uk", "de", "be", "ch", "eu", "us",
  "info", "biz", "app", "dev", "me", "ly", "gg", "tv", "xyz", "site", "online",
  "shop", "store", "link", "page", "ai", "qc", "quebec", "art", "blog", "news",
  "live", "club", "top", "to", "sh", "so", "fm", "cc", "ru", "cn", "es", "it", "nl",
] as const;

const TLD = `(?:${BLOCKED_TLDS.join("|")})`;
// Separator that stands for a dot: tight ".", full-width dots, or bracketed/worded forms.
// Plain dots with spaces are handled separately to avoid blocking normal prose.
const SEP = String.raw`(?:[.。．]|\s*[\[(]\s*(?:\.|dot|point)\s*[\])]\s*|\s+(?:dot|point)\s+)`;
const END = String.raw`(?![\p{L}\p{N}])`;

const PATTERNS: RegExp[] = [
  /[a-z][a-z0-9+.-]*:\s*\/\//iu,
  /(?<![\p{L}\p{N}])(?:javascript|data|mailto)\s*:/iu,
  new RegExp(String.raw`(?<![\p{L}\p{N}])www\s*${SEP}\s*[\p{L}\p{N}]`, "iu"),
  new RegExp(String.raw`[\p{L}\p{N}-]+${SEP}${TLD}${END}`, "iu"),
  // Catch spaced-dot obfuscation only when the apparent domain ends like a URL.
  // This avoids false positives such as "I finished. Me, finally!".
  new RegExp(String.raw`(?<![\p{L}\p{N}])[\p{L}\p{N}-]+\s+\.\s+${TLD}(?=\s*$|[/?#.)!;:\]])`, "iu"),
  // Bare IPv4 addresses are also link-like, even without a scheme.
  /(?<![\p{L}\p{N}])(?:\d{1,3}\.){3}\d{1,3}(?![\p{L}\p{N}])/u,
];

export function containsUrl(text: string): boolean {
  return PATTERNS.some((re) => re.test(text));
}
