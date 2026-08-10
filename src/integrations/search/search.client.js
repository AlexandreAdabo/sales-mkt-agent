export function assertSearchClient(client) {
  if (!client || typeof client.searchCompanies !== 'function' || typeof client.researchCompany !== 'function') {
    throw new TypeError('SearchClient deve implementar searchCompanies() e researchCompany()');
  }

  return client;
}
