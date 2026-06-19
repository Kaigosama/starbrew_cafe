// Rough wait-time estimate for demo purposes — not meant to be precise.
const BASE_MINUTES: Record<string, number> = {
  'Order Received': 9,
  'Crafting': 5,
  'Ready for Pickup': 2,
  'Picked Up': 0,
  'Cancelled Remake In Progress': 0,
};

export function estimateWaitMinutes(status: string, itemCount: number = 1): number {
  const base = BASE_MINUTES[status] ?? 6;
  if (base === 0) return 0;
  return base + Math.max(0, itemCount - 1);
}
