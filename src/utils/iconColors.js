const ICON_COLOR_MAP = {
  'blue-600': 'text-blue-600',
  'indigo-600': 'text-indigo-600',
  'green-600': 'text-emerald-600',
  'emerald-600': 'text-emerald-600',
  'yellow-600': 'text-amber-600',
  'amber-600': 'text-amber-600',
  'orange-600': 'text-orange-600',
  'red-600': 'text-red-600',
  'rose-600': 'text-rose-600',
  'purple-600': 'text-purple-600',
  'violet-600': 'text-violet-600',
  'cyan-600': 'text-cyan-600',
  'teal-600': 'text-teal-600',
};

const ICON_BG_MAP = {
  'blue-600': 'bg-blue-50',
  'indigo-600': 'bg-indigo-50',
  'green-600': 'bg-emerald-50',
  'emerald-600': 'bg-emerald-50',
  'yellow-600': 'bg-amber-50',
  'amber-600': 'bg-amber-50',
  'orange-600': 'bg-orange-50',
  'red-600': 'bg-red-50',
  'rose-600': 'bg-rose-50',
  'purple-600': 'bg-purple-50',
  'violet-600': 'bg-violet-50',
  'cyan-600': 'bg-cyan-50',
  'teal-600': 'bg-teal-50',
};

const ICON_BG_DARK_MAP = {
  'blue-600': 'bg-blue-950/50',
  'indigo-600': 'bg-indigo-950/50',
  'green-600': 'bg-emerald-950/50',
  'emerald-600': 'bg-emerald-950/50',
  'yellow-600': 'bg-amber-950/50',
  'amber-600': 'bg-amber-950/50',
  'orange-600': 'bg-orange-950/50',
  'red-600': 'bg-red-950/50',
  'rose-600': 'bg-rose-950/50',
  'purple-600': 'bg-purple-950/50',
  'violet-600': 'bg-violet-950/50',
  'cyan-600': 'bg-cyan-950/50',
  'teal-600': 'bg-teal-950/50',
};

export function resolveIconColor(iconColor, fallback = 'text-emerald-600') {
  if (!iconColor) return fallback;
  if (iconColor.startsWith('text-')) return iconColor;
  return ICON_COLOR_MAP[iconColor] || fallback;
}

export function resolveIconBg(iconColor, darkMode, fallback = 'bg-emerald-50') {
  const key = iconColor?.replace('text-', '') || 'green-600';
  if (darkMode) {
    return ICON_BG_DARK_MAP[key] || 'bg-emerald-950/50';
  }
  return ICON_BG_MAP[key] || fallback;
}
