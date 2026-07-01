import { resolveApiAssetUrl } from '../utils/resolveApiAssetUrl';

/** Fallback hero slides when the API is unavailable (images in public/images/slides). */
export const LANDING_SLIDES = [
  {
    id: 1,
    image: resolveApiAssetUrl('/images/slides/slide-1-procurement.jpg'),
    title: 'Inventory & Procurement, Unified',
    description: 'Manage purchase requisitions, LPOs, and goods receipt from one modern ERP platform',
    gradient: 'from-stone-950/70 via-stone-900/55 to-stone-800/35',
  },
  {
    id: 2,
    image: resolveApiAssetUrl('/images/slides/slide-2-fnb.jpg'),
    title: 'Food & Beverage Operations',
    description: 'Track kitchen recipes, bar sales, store issues, and consumption with full traceability',
    gradient: 'from-stone-950/70 via-stone-900/55 to-stone-800/35',
  },
  {
    id: 3,
    image: resolveApiAssetUrl('/images/slides/slide-3-analytics.jpg'),
    title: 'Real-Time Stock Intelligence',
    description: 'Stock counts, adjustments, FIFO costing, and dashboards that keep teams aligned',
    gradient: 'from-stone-950/70 via-stone-900/55 to-stone-800/35',
  },
];

export function mapApiSlideToHeroSlide(row) {
  return {
    id: row.id,
    image: row.image_url ? resolveApiAssetUrl(row.image_url) : '',
    title: row.title,
    description: row.description || '',
    gradient: row.gradient || 'from-stone-950/70 via-stone-900/55 to-stone-800/35',
  };
}
