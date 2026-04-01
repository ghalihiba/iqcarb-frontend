export const formatCO2e = (value: number, decimals = 4): string =>
  `${value.toFixed(decimals)} tCO2e`;

export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('fr-FR').format(value);

export const getScopeColor = (scope: string): string => {
  const colors: Record<string, string> = {
    SCOPE_1: '#ef4444',
    SCOPE_2: '#3b82f6',
    SCOPE_3: '#f59e0b',
  };
  return colors[scope] ?? '#6b7280';
};

export const getScopeBadgeClass = (scope: string): string => {
  const classes: Record<string, string> = {
    SCOPE_1: 'bg-red-100 text-red-700',
    SCOPE_2: 'bg-blue-100 text-blue-700',
    SCOPE_3: 'bg-yellow-100 text-yellow-700',
  };
  return classes[scope] ?? 'bg-gray-100 text-gray-700';
};