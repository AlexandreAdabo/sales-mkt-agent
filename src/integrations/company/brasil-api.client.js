export function createBrasilApiClient({ fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  async function getCompanyByCnpj(cnpj) {
    const normalized = cnpj?.replace(/\D/g, '');
    if (normalized?.length !== 14) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(`https://brasilapi.com.br/api/cnpj/v1/${normalized}`, { signal: controller.signal });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`BrasilAPI retornou HTTP ${response.status}`);
      return response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  return { getCompanyByCnpj };
}
