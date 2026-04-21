export function countryCodeToEmoji(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    upper.charCodeAt(0) + 127397,
    upper.charCodeAt(1) + 127397,
  );
}