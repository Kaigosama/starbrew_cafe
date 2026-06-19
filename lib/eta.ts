// Rough wait-time estimate for demo purposes — not meant to be precise.
const BASE_MINUTES: Record<string, number> = {
  received: 9,
  crafting: 5,
  ready: 2,
  completed: 0,
  picked_up: 0,
  cancelled: 0,
};

export function estimateWaitMinutes(status: string, itemCount: number = 1): number {
  const base = BASE_MINUTES[status] ?? 6;
  if (base === 0) return 0;
  return base + Math.max(0, itemCount - 1);
}
