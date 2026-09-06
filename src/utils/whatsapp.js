export function buildWhatsappLink(phone, message) {
  let digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('55')) digits = `55${digits}`;

  const text = encodeURIComponent(message || '');
  return `https://wa.me/${digits}?text=${text}`;
}
