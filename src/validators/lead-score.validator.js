export function validateLeadScore(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Resposta de scoring inválida.');
  }

  const score = Number(data.score);
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error(`Score inválido: ${data.score}`);
  }

  return { ...data, score };
}
