/**
 * Приводит введённый номер к цифрам в международном формате без «+».
 * checkAccount принимает только номера России (+7) и Беларуси (+375);
 * российские допускаются и в формате 8XXXXXXXXXX и 9XXXXXXXXX.
 * Возвращает null для всего остального.
 */
export function normalizePhone(input: string): string | null {
  const value = input.trim();
  if (!/^\+?[\d\s()-]+$/.test(value)) return null;

  let digits = value.replace(/\D/g, '');
  const hasPlus = value.startsWith('+');
  if (!hasPlus && digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (!hasPlus && digits.length === 10 && digits.startsWith('9')) digits = `7${digits}`;

  return /^(7\d{10}|375\d{9})$/.test(digits) ? digits : null;
}

/** 79991234567 → +7 999 123-45-67; прочие номера — просто с «+». */
export function formatPhone(phone: string): string {
  const match = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  if (!match) return `+${phone}`;
  const [, code, first, second, third] = match;
  return `+7 ${code} ${first}-${second}-${third}`;
}
