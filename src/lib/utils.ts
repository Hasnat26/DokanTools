export const money = (value: number | string | null | undefined) =>
  `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

export function normalizeBdPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  return `88${digits}`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
