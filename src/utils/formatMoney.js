export const formatMoney = (amount) => {
  const value = Number(amount);
  if (Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};
