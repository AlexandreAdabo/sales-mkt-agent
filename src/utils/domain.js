export function normalizeDomain(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const input = value.trim();
    const url = new URL(input.includes('://') ? input : `https://${input}`);
    return url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '') || null;
  } catch {
    return null;
  }
}
